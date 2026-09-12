import pg from "pg";

const { Client } = pg;

const ALLOWED_ORIGINS = new Set([
  "https://spasipushka.ru",
  "https://www.spasipushka.ru",
]);

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
        version: "hyperdrive-v1",
      });
    }

    if (url.pathname !== "/game-run" || request.method !== "POST") {
      return json(request, { ok: false, error: "Not found" }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(request, { ok: false, error: "Invalid JSON" }, 400);
    }

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

    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });

    try {
      await client.connect();
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

      return json(request, { ok: true, row: result.rows[0] }, 201);
    } catch (error) {
      console.error("Hyperdrive/Postgres error", error);
      return json(request, { ok: false, error: String(error?.message || error) }, 500);
    } finally {
      try { await client.end(); } catch {}
    }
  },
};
