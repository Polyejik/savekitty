import pg from "pg";
const { Client } = pg;

const ALLOWED_ORIGINS = new Set([
  "https://spasipushka.ru",
  "https://www.spasipushka.ru",
  "https://polyejik.github.io",
]);
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://spasipushka.ru",
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
function cleanUuid(v) {
  const s = String(v || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s) ? s : null;
}
function cleanChallengeId(v) {
  const s = String(v || "").toUpperCase().trim();
  return /^[A-HJ-NP-Z2-9]{6}$/.test(s) ? s : null;
}
function newChallengeId() {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += CHARS[x % CHARS.length];
  return s;
}
async function withDb(env, fn) {
  const c = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  try {
    await c.connect();
    return await fn(c);
  } finally {
    try { await c.end(); } catch {}
  }
}
async function ensureChallengeSchema(c) {
  // One atomic statement: a new table must never commit with public access.
  // The catalog checks avoid taking an ALTER TABLE lock on every dashboard refresh.
  await c.query(`
    DO $security$
    DECLARE columns_sql text;
    BEGIN
    CREATE TABLE IF NOT EXISTS public.game_challenges(
      id varchar(6) PRIMARY KEY,
      inviter_player_id uuid NOT NULL,
      inviter_name text NOT NULL,
      inviter_duration_seconds integer NOT NULL CHECK(inviter_duration_seconds>0),
      language text NOT NULL DEFAULT 'ru' CHECK(language IN('ru','en')),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT(now()+interval '30 days')
    );
    CREATE INDEX IF NOT EXISTS game_challenges_expires_idx ON public.game_challenges(expires_at);
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.game_challenges'::regclass) THEN
      ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;
    END IF;
    IF has_table_privilege('anon', 'public.game_challenges', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_table_privilege('authenticated', 'public.game_challenges', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       OR has_any_column_privilege('anon', 'public.game_challenges', 'SELECT,INSERT,UPDATE,REFERENCES')
       OR has_any_column_privilege('authenticated', 'public.game_challenges', 'SELECT,INSERT,UPDATE,REFERENCES') THEN
      REVOKE ALL PRIVILEGES ON TABLE public.game_challenges FROM PUBLIC, anon, authenticated;
      SELECT string_agg(quote_ident(attname), ', ') INTO columns_sql
        FROM pg_attribute WHERE attrelid='public.game_challenges'::regclass AND attnum>0 AND NOT attisdropped;
      EXECUTE 'REVOKE SELECT (' || columns_sql || '), INSERT (' || columns_sql || '), UPDATE (' || columns_sql || '), REFERENCES (' || columns_sql || ') ON public.game_challenges FROM PUBLIC, anon, authenticated';
    END IF;
    END $security$;
  `);
}
async function parseJson(r) {
  try { return await r.json(); } catch { return null; }
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
        version: "challenge-v4-rls-audit",
      });
    }

    // Read-only metadata, never credentials or player records. Used by deployment checks.
    if (url.pathname === "/database-security" && request.method === "GET") {
      try {
        const checks = await withDb(env, async c => (
          await c.query(`
            SELECT cl.relname AS table_name, cl.relrowsecurity AS rls_enabled,
              has_table_privilege('anon', cl.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_table_access,
              has_table_privilege('authenticated', cl.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_table_access,
              has_any_column_privilege('anon', cl.oid, 'SELECT,INSERT,UPDATE,REFERENCES') AS anon_column_access,
              has_any_column_privilege('authenticated', cl.oid, 'SELECT,INSERT,UPDATE,REFERENCES') AS authenticated_column_access,
              (SELECT count(*)::int FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
               WHERE n.nspname='public' AND t.relkind IN ('r','p') AND NOT t.relrowsecurity) AS public_tables_without_rls
            FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
            WHERE ns.nspname='public' AND cl.relname IN ('game_challenges','game_runs','campaigns')
              AND cl.relkind IN ('r','p') ORDER BY cl.relname
          `)
        ).rows);
        const challenge = checks.find(row => row.table_name === 'game_challenges');
        const ok = checks.length === 3 && checks.every(row => row.rls_enabled && row.public_tables_without_rls === 0)
          && challenge && !challenge.anon_table_access && !challenge.authenticated_table_access
          && !challenge.anon_column_access && !challenge.authenticated_column_access;
        return json(request, {ok:Boolean(ok), checks}, ok ? 200 : 503);
      } catch (e) {
        console.error(e);
        return json(request, {ok:false, error:'Database security verification failed'}, 503);
      }
    }

    if (url.pathname === "/game-run" && request.method === "POST") {
      const b = await parseJson(request);
      if (!b) return json(request, { ok: false, error: "Invalid JSON" }, 400);

      const campaign = String(b.campaign_id || "").trim();
      const pid = cleanUuid(b.player_id);
      const cid = cleanUuid(b.completion_id) || crypto.randomUUID();
      const completed = b.completed_at ? new Date(b.completed_at) : null;
      const started = b.started_at ? new Date(b.started_at) : null;
      const dur = Math.max(0, Math.round(Number(b.duration_seconds) || 0));

      if (!campaign || !pid || !completed || Number.isNaN(completed.getTime()) ||
          Number(b.locks_opened) !== 9 || Number(b.examples_solved) !== 9) {
        return json(request, { ok: false, error: "Invalid game run payload" }, 400);
      }

      try {
        const row = await withDb(env, async c => (
          await c.query(
            `INSERT INTO public.game_runs(
              completion_id,campaign_id,player_id,player_name,language,
              started_at,completed_at,duration_seconds,locks_opened,examples_solved,game_version
            ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,9,9,$9)
            ON CONFLICT(completion_id) DO UPDATE SET completion_id=EXCLUDED.completion_id
            RETURNING id,completion_id,status,reason,created_at`,
            [
              cid, campaign, pid,
              String(b.player_name || "Игрок").slice(0,60),
              b.language === "en" ? "en" : "ru",
              started && !Number.isNaN(started.getTime()) ? started.toISOString() : null,
              completed.toISOString(), dur,
              String(b.game_version || "1.0").slice(0,30),
            ]
          )
        ).rows[0]);
        return json(request, { ok: true, row }, 201);
      } catch (e) {
        console.error(e);
        return json(request, { ok: false, error: String(e?.message || e) }, 500);
      }
    }

    if (url.pathname === "/challenge" && request.method === "POST") {
      const b = await parseJson(request);
      const pid = cleanUuid(b?.player_id);
      if (!b || !pid) return json(request, { ok: false, error: "Invalid challenge payload" }, 400);

      try {
        const result = await withDb(env, async c => {
          await ensureChallengeSchema(c);
          const run = (
            await c.query(
              `SELECT player_name,language,duration_seconds,completed_at
               FROM public.game_runs
               WHERE player_id=$1 AND locks_opened=9 AND examples_solved=9
                 AND completed_at>=now()-interval '24 hours'
               ORDER BY completed_at DESC LIMIT 1`,
              [pid]
            )
          ).rows[0];
          if (!run) return { pending: true };

          for (let i = 0; i < 8; i++) {
            const id = newChallengeId();
            try {
              return { row: (
                await c.query(
                  `INSERT INTO public.game_challenges(
                     id,inviter_player_id,inviter_name,inviter_duration_seconds,language
                   ) VALUES($1,$2,$3,$4,$5)
                   RETURNING id,inviter_name,language,created_at,expires_at`,
                  [
                    id, pid,
                    String(b.player_name || run.player_name || "Друг").slice(0,60),
                    Number(run.duration_seconds),
                    b.language === "en" ? "en" : (run.language === "en" ? "en" : "ru"),
                  ]
                )
              ).rows[0] };
            } catch (e) {
              if (e?.code !== "23505") throw e;
            }
          }
          throw new Error("Could not allocate challenge id");
        });

        if (result.pending) return json(request, { ok: false, error: "Game result is still syncing" }, 409);
        return json(request, { ok: true, challenge: result.row }, 201);
      } catch (e) {
        return json(request, { ok: false, error: String(e?.message || e) }, 500);
      }
    }

    const info = url.pathname.match(/^\/challenge\/([A-HJ-NP-Z2-9]{6})$/i);
    if (info && request.method === "GET") {
      try {
        const row = await withDb(env, async c => {
          await ensureChallengeSchema(c);
          return (
            await c.query(
              `SELECT id,inviter_name,language,created_at
               FROM public.game_challenges
               WHERE id=$1 AND expires_at>now()`,
              [cleanChallengeId(info[1])]
            )
          ).rows[0] || null;
        });
        return row ? json(request, { ok: true, challenge: row }) : json(request, { ok: false, error: "Challenge not found" }, 404);
      } catch (e) {
        return json(request, { ok: false, error: String(e?.message || e) }, 500);
      }
    }

    const reveal = url.pathname.match(/^\/challenge\/([A-HJ-NP-Z2-9]{6})\/reveal$/i);
    if (reveal && request.method === "POST") {
      const b = await parseJson(request);
      const pid = cleanUuid(b?.player_id);
      if (!b || !pid) return json(request, { ok: false, error: "Invalid reveal payload" }, 400);

      try {
        const result = await withDb(env, async c => {
          await ensureChallengeSchema(c);
          const ch = (
            await c.query(
              `SELECT id,inviter_player_id,inviter_name,inviter_duration_seconds,language,created_at
               FROM public.game_challenges WHERE id=$1 AND expires_at>now()`,
              [cleanChallengeId(reveal[1])]
            )
          ).rows[0];
          if (!ch) return { missing: true };

          const rr = (
            await c.query(
              `SELECT duration_seconds,completed_at FROM public.game_runs
               WHERE player_id=$1 AND locks_opened=9 AND examples_solved=9
                 AND completed_at>=$2 ORDER BY completed_at DESC LIMIT 1`,
              [pid, ch.created_at]
            )
          ).rows[0];
          if (rr) return { challenge: ch, duration: Number(rr.duration_seconds), verified: true };

          const localDur = Math.max(0, Math.round(Number(b.recipient_duration_seconds) || 0));
          const done = b.completed_at ? new Date(b.completed_at) : null;
          if (localDur > 0 && done && !Number.isNaN(done.getTime()) && done >= new Date(ch.created_at)) {
            return { challenge: ch, duration: localDur, verified: false };
          }
          return { pending: true };
        });

        if (result.missing) return json(request, { ok: false, error: "Challenge not found" }, 404);
        if (result.pending) return json(request, { ok: false, error: "Finish the game first" }, 409);
        return json(request, { ok: true, result: {
          inviter_name: result.challenge.inviter_name,
          inviter_duration_seconds: Number(result.challenge.inviter_duration_seconds),
          recipient_duration_seconds: result.duration,
          language: result.challenge.language,
          verified_run: result.verified,
        }});
      } catch (e) {
        return json(request, { ok: false, error: String(e?.message || e) }, 500);
      }
    }

    if (url.pathname === "/dashboard" && request.method === "GET") {
      const campaign = String(url.searchParams.get("campaign") || "save-pushok-pilot").slice(0,80);
      try {
        const data = await withDb(env, async c => {
          await ensureChallengeSchema(c);
          const camp = (
            await c.query(
              `SELECT id,sponsor_name,title,rate_rub,budget_rub,starts_at,ends_at,is_active
               FROM public.campaigns WHERE id=$1`, [campaign]
            )
          ).rows[0];
          if (!camp) return null;

          // Older clients retried without completion_id. Count an exact event once,
          // while retaining every stored request in the raw/duplicate audit totals.
          const confirmedCte = `WITH ranked_confirmed AS (
            SELECT *, row_number() OVER (
              PARTITION BY player_id,started_at,completed_at,duration_seconds
              ORDER BY created_at,id
            ) AS event_rank
            FROM public.game_runs WHERE campaign_id=$1 AND status='confirmed'
          ), confirmed_runs AS (SELECT * FROM ranked_confirmed WHERE event_rank=1)`;

          const s = (
            await c.query(
              `${confirmedCte} SELECT
                 (SELECT count(*)::int FROM public.game_runs WHERE campaign_id=$1) AS raw_runs,
                 count(*)::int confirmed_rescues,
                 count(DISTINCT player_id)::int unique_players,
                 count(*) FILTER(WHERE completed_at>=date_trunc('day',now()))::int today_runs,
                 coalesce(round(avg(duration_seconds)),0)::int avg_seconds,
                 coalesce(sum(duration_seconds),0)::bigint confirmed_seconds,
                 ((SELECT count(*) FROM public.game_runs WHERE campaign_id=$1 AND status='duplicate')
                   + (SELECT count(*) FROM ranked_confirmed WHERE event_rank>1))::int duplicates,
                 (SELECT count(*)::int FROM public.game_runs WHERE campaign_id=$1 AND status='too_fast') AS too_fast
               FROM confirmed_runs`, [campaign]
            )
          ).rows[0];

          const repeat = (
            await c.query(
              `${confirmedCte} SELECT coalesce(round(100.0*count(*) FILTER(WHERE n>1)/nullif(count(*),0)),0)::int repeat_rate
               FROM (SELECT player_id,count(*) n FROM confirmed_runs
                     WHERE campaign_id=$1 AND status='confirmed' GROUP BY player_id)x`, [campaign]
            )
          ).rows[0];

          const daily = (
            await c.query(
              `${confirmedCte}, d AS(SELECT generate_series(current_date-13,current_date,interval '1 day')::date AS report_day)
               SELECT d.report_day AS day,count(g.id)::int value FROM d
               LEFT JOIN confirmed_runs g ON g.campaign_id=$1 AND g.status='confirmed'
                 AND g.completed_at>=d.report_day AND g.completed_at<d.report_day+interval '1 day'
               GROUP BY d.report_day ORDER BY d.report_day`, [campaign]
            )
          ).rows;

          const pace = (
            await c.query(
              `${confirmedCte} SELECT coalesce(round(count(*)::numeric/7,1),0) pace_7d FROM confirmed_runs
               WHERE campaign_id=$1 AND status='confirmed' AND completed_at>=now()-interval '7 days'`, [campaign]
            )
          ).rows[0];

          const challengeStats = (
            await c.query(
              `SELECT count(*)::int challenges_total,
                      count(*) FILTER(WHERE created_at>=now()-interval '7 days')::int challenges_7d
               FROM public.game_challenges`
            )
          ).rows[0];

          const runs = (
            await c.query(
              `${confirmedCte} SELECT completed_at,
                      'Участник '||upper(substr(md5(player_id::text),1,5)) AS participant,
                      duration_seconds,game_version,campaign_id,status
               FROM confirmed_runs ORDER BY completed_at DESC LIMIT 20`, [campaign]
            )
          ).rows;

          const rate = Number(camp.rate_rub), budget = Number(camp.budget_rub), confirmed = Number(s.confirmed_rescues);
          const donation = confirmed * rate;
          const daysLeft = Math.max(0, Math.ceil((new Date(camp.ends_at)-Date.now())/86400000));
          const targetRescues = rate > 0 ? Math.floor(budget/rate) : 0;
          const pace7d = Number(pace.pace_7d) || 0;
          const projectedRescues = confirmed + Math.round(pace7d * daysLeft);
          const projectedDonation = Math.min(budget, projectedRescues * rate);
          const validRate = Number(s.raw_runs) ? 100*confirmed/Number(s.raw_runs) : 0;

          return {campaign:camp,summary:{...s,repeat_rate:repeat.repeat_rate,rate_rub:rate,budget_rub:budget,
            donation_rub:donation,days_left:daysLeft,target_rescues:targetRescues,pace_7d:pace7d,
            projected_rescues:projectedRescues,projected_donation_rub:projectedDonation,valid_rate:validRate,
            confirmed_hours:Number(s.confirmed_seconds||0)/3600,challenges_total:Number(challengeStats.challenges_total||0),
            challenges_7d:Number(challengeStats.challenges_7d||0)},daily,runs,server_time:new Date().toISOString()};
        });
        return data ? json(request,{ok:true,...data}) : json(request,{ok:false,error:"Campaign not found"},404);
      } catch (e) {
        console.error(e);
        return json(request,{ok:false,error:String(e?.message||e)},500);
      }
    }

    return json(request, { ok: false, error: "Not found" }, 404);
  },
};
