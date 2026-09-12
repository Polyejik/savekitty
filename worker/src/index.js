import pg from "pg";

const { Client } = pg;

const ALLOWED_ORIGINS = new Set([
  "https://spasipushka.ru",
  "https://www.spasipushka.ru",
]);

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://spasipushka.ru",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function cleanUuid(value) {
  const s = String(value || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    ? s
    : null;
}

function cleanChallengeId(value) {
  const s = String(value || "").toUpperCase().trim();
  return /^[A-HJ-NP-Z2-9]{6}$/.test(s) ? s : null;
}

function newChallengeId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CHARS[b % CHARS.length];
  return out;
}

async function withDb(env, fn) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    try { await client.end(); } catch {}
  }
}

async function ensureChallengeSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.game_challenges (
      id varchar(6) PRIMARY KEY,
      inviter_player_id uuid NOT NULL,
      inviter_name text NOT NULL,
      inviter_duration_seconds integer NOT NULL CHECK (inviter_duration_seconds > 0),
      language text NOT NULL DEFAULT 'ru' CHECK (language IN ('ru','en')),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS game_challenges_expires_idx ON public.game_challenges(expires_at)`);
}

async function parseJson(request) {
  try { return await request.json(); } catch { return null; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json(request, {
        ok: true,
        service: "spasipushka-api",
        hyperdrive: Boolean(env.HYPERDRIVE?.connectionString),
        version: "challenge-v1",
      });
    }

    if (url.pathname === "/game-run" && request.method === "POST") {
      const body = await parseJson(request);
      if (!body) return json(request, { ok: false, error: "Invalid JSON" }, 400);

      const campaignId = String(body.campaign_id || "").trim();
      const playerId = cleanUuid(body.player_id);
      const completionId = cleanUuid(body.completion_id) || crypto.randomUUID();
      const completedAt = body.completed_at ? new Date(body.completed_at) : null;
      const startedAt = body.started_at ? new Date(body.started_at) : null;
      const duration = Math.max(0, Math.round(Number(body.duration_seconds) || 0));
      const locks = Number(body.locks_opened);
      const solved = Number(body.examples_solved);

      if (!campaignId || !playerId || !completedAt || Number.isNaN(completedAt.getTime()) || locks !== 9 || solved !== 9) {
        return json(request, { ok: false, error: "Invalid game run payload" }, 400);
      }

      try {
        const row = await withDb(env, async (client) => {
          const result = await client.query(
            `INSERT INTO public.game_runs (
              completion_id, campaign_id, player_id, player_name, language,
              started_at, completed_at, duration_seconds, locks_opened,
              examples_solved, game_version
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,9,9,$9)
            ON CONFLICT (completion_id) DO UPDATE SET completion_id = EXCLUDED.completion_id
            RETURNING id, completion_id, status, reason, created_at`,
            [
              completionId,
              campaignId,
              playerId,
              String(body.player_name || "Игрок").slice(0, 60),
              body.language === "en" ? "en" : "ru",
              startedAt && !Number.isNaN(startedAt.getTime()) ? startedAt.toISOString() : null,
              completedAt.toISOString(),
              duration,
              String(body.game_version || "1.0").slice(0, 30),
            ]
          );
          return result.rows[0];
        });
        return json(request, { ok: true, row }, 201);
      } catch (error) {
        console.error("Hyperdrive/Postgres error", error);
        return json(request, { ok: false, error: String(error?.message || error) }, 500);
      }
    }

    if (url.pathname === "/challenge" && request.method === "POST") {
      const body = await parseJson(request);
      const playerId = cleanUuid(body?.player_id);
      if (!body || !playerId) return json(request, { ok: false, error: "Invalid challenge payload" }, 400);

      try {
        const result = await withDb(env, async (client) => {
          await ensureChallengeSchema(client);
          const run = await client.query(
            `SELECT player_name, language, duration_seconds, completed_at
             FROM public.game_runs
             WHERE player_id = $1
               AND locks_opened = 9
               AND examples_solved = 9
               AND completed_at >= now() - interval '24 hours'
             ORDER BY completed_at DESC
             LIMIT 1`,
            [playerId]
          );
          if (!run.rows[0]) return { pending: true };

          const source = run.rows[0];
          for (let i = 0; i < 8; i++) {
            const id = newChallengeId();
            try {
              const ins = await client.query(
                `INSERT INTO public.game_challenges
                  (id, inviter_player_id, inviter_name, inviter_duration_seconds, language)
                 VALUES ($1,$2,$3,$4,$5)
                 RETURNING id, inviter_name, language, created_at, expires_at`,
                [
                  id,
                  playerId,
                  String(body.player_name || source.player_name || "Друг").slice(0, 60),
                  Number(source.duration_seconds),
                  body.language === "en" ? "en" : (source.language === "en" ? "en" : "ru"),
                ]
              );
              return { row: ins.rows[0] };
            } catch (e) {
              if (e?.code !== "23505") throw e;
            }
          }
          throw new Error("Could not allocate challenge id");
        });
        if (result.pending) return json(request, { ok: false, error: "Game result is still syncing" }, 409);
        return json(request, { ok: true, challenge: result.row }, 201);
      } catch (error) {
        console.error("Challenge create error", error);
        return json(request, { ok: false, error: String(error?.message || error) }, 500);
      }
    }

    const infoMatch = url.pathname.match(/^\/challenge\/([A-HJ-NP-Z2-9]{6})$/i);
    if (infoMatch && request.method === "GET") {
      const id = cleanChallengeId(infoMatch[1]);
      try {
        const row = await withDb(env, async (client) => {
          await ensureChallengeSchema(client);
          const r = await client.query(
            `SELECT id, inviter_name, language, created_at
             FROM public.game_challenges
             WHERE id = $1 AND expires_at > now()`,
            [id]
          );
          return r.rows[0] || null;
        });
        if (!row) return json(request, { ok: false, error: "Challenge not found" }, 404);
        return json(request, { ok: true, challenge: row });
      } catch (error) {
        console.error("Challenge info error", error);
        return json(request, { ok: false, error: String(error?.message || error) }, 500);
      }
    }

    const revealMatch = url.pathname.match(/^\/challenge\/([A-HJ-NP-Z2-9]{6})\/reveal$/i);
    if (revealMatch && request.method === "POST") {
      const id = cleanChallengeId(revealMatch[1]);
      const body = await parseJson(request);
      const playerId = cleanUuid(body?.player_id);
      if (!body || !playerId) return json(request, { ok: false, error: "Invalid reveal payload" }, 400);

      try {
        const result = await withDb(env, async (client) => {
          await ensureChallengeSchema(client);
          const c = await client.query(
            `SELECT id, inviter_player_id, inviter_name, inviter_duration_seconds, language, created_at
             FROM public.game_challenges
             WHERE id = $1 AND expires_at > now()`,
            [id]
          );
          const challenge = c.rows[0];
          if (!challenge) return { missing: true };

          const rr = await client.query(
            `SELECT duration_seconds, completed_at
             FROM public.game_runs
             WHERE player_id = $1
               AND locks_opened = 9
               AND examples_solved = 9
               AND completed_at >= $2
             ORDER BY completed_at DESC
             LIMIT 1`,
            [playerId, challenge.created_at]
          );
          if (!rr.rows[0]) return { pending: true };

          return {
            challenge,
            recipient_duration_seconds: Number(rr.rows[0].duration_seconds),
          };
        });

        if (result.missing) return json(request, { ok: false, error: "Challenge not found" }, 404);
        if (result.pending) return json(request, { ok: false, error: "Finish the game first" }, 409);

        return json(request, {
          ok: true,
          result: {
            inviter_name: result.challenge.inviter_name,
            inviter_duration_seconds: Number(result.challenge.inviter_duration_seconds),
            recipient_duration_seconds: result.recipient_duration_seconds,
            language: result.challenge.language,
          },
        });
      } catch (error) {
        console.error("Challenge reveal error", error);
        return json(request, { ok: false, error: String(error?.message || error) }, 500);
      }
    }

    return json(request, { ok: false, error: "Not found" }, 404);
  },
};
