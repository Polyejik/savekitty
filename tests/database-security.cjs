const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const {PGlite} = require(process.env.QA_MODULES + '/@electric-sql/pglite');

(async () => {
  const root = path.resolve(__dirname, '..');
  const src = fs.readFileSync(root + '/worker/src/index.js', 'utf8');
  const sql = src.match(/async function ensureChallengeSchema\(c\) \{[\s\S]*?await c.query\(`([\s\S]*?)`\);/)[1];
  const migration = fs.readFileSync(root + '/supabase/migrations/20260915_protect_game_challenges.sql', 'utf8');
  assert.equal(migration.split('\n').slice(1).join('\n').trim(), sql.trim());
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`);
  // Reproduce the old bootstrap and a readable invitation before applying the fix.
  const create = sql.match(/CREATE TABLE IF NOT EXISTS public.game_challenges\([\s\S]*?\n    \);/)[0];
  await db.query(create);
  await db.query(`INSERT INTO public.game_challenges(id,inviter_player_id,inviter_name,inviter_duration_seconds)
    VALUES ('ABCDEF','5416352f-7852-4fe6-a80f-335857c5470c','Private name',100)`);
  await db.exec(`GRANT SELECT (inviter_name), UPDATE (inviter_name) ON public.game_challenges TO PUBLIC;
    CREATE POLICY old_open_policy ON public.game_challenges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    SET ROLE anon;`);
  assert.equal((await db.query('SELECT * FROM public.game_challenges')).rows.length, 1, 'fixture reproduces exposure');
  await db.exec('RESET ROLE');
  await db.query(sql);
  await db.query(sql); // Repeated requests must be safe and idempotent.
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.game_challenges'::regclass")).rows[0].relrowsecurity, true);
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`SET ROLE ${role}`);
    for (const query of [
      'SELECT * FROM public.game_challenges',
      'SELECT inviter_name FROM public.game_challenges',
      "INSERT INTO public.game_challenges(id,inviter_player_id,inviter_name,inviter_duration_seconds) VALUES ('GHIJKL','5416352f-7852-4fe6-a80f-335857c5470c','Forgery',100)",
      "UPDATE public.game_challenges SET inviter_name='Changed' WHERE id='ABCDEF'",
      "DELETE FROM public.game_challenges WHERE id='ABCDEF'",
      'TRUNCATE public.game_challenges',
    ]) await assert.rejects(db.query(query), e => e.code === '42501', `${role}: ${query}`);
    await db.exec('RESET ROLE');
  }
  assert.equal((await db.query('SELECT inviter_name FROM public.game_challenges')).rows[0].inviter_name, 'Private name');
  await db.exec('SET ROLE service_role');
  assert.equal((await db.query('SELECT * FROM public.game_challenges')).rows.length, 1, 'server role keeps access');
  await db.exec('RESET ROLE');

  // Exercise the actual Worker handlers with a real PostgreSQL engine. No network writes.
  await db.exec(fs.readFileSync(root + '/supabase/schema.sql', 'utf8')
    .replace('create extension if not exists pgcrypto;', '').split('alter table public.campaigns enable')[0]);
  await db.exec('ALTER TABLE public.game_runs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;');
  const ctx = {module:{exports:{}}, pg:{Client:class {
    async connect() {} query(q,p) { return db.query(q,p); } async end() {}
  }}, crypto:webcrypto, URL, Response, console};
  vm.runInNewContext(src.replace('import pg from "pg";', '').replace('export default {','module.exports = {'), ctx);
  const call = async (route, body) => {
    const r = await ctx.module.exports.fetch(new Request('https://test.invalid' + route, body ? {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
    } : {}), {HYPERDRIVE:{connectionString:'local-test'}});
    const data = await r.json();
    assert.ok(r.status < 400, JSON.stringify(data)); return data;
  };
  const player = '5416352f-7852-4fe6-a80f-335857c5470c';
  const run = {completion_id:'08fae845-8817-479f-8b49-1987b9035d7f', player_id:player,
    campaign_id:'save-pushok-pilot', player_name:'QA', language:'ru', duration_seconds:100,
    started_at:new Date(Date.now()-100000).toISOString(), completed_at:new Date().toISOString(),
    locks_opened:9, examples_solved:9, game_version:'test'};
  await call('/game-run', run); await call('/game-run', run);
  const challenge = (await call('/challenge', {player_id:player})).challenge;
  assert.equal((await call('/challenge/' + challenge.id)).challenge.inviter_name, 'QA');
  const second = {...run, player_id:'6416352f-7852-4fe6-a80f-335857c5470c',
    completion_id:'18fae845-8817-479f-8b49-1987b9035d7f', completed_at:new Date(Date.now()+1000).toISOString()};
  await call('/game-run', second);
  assert.equal((await call('/challenge/' + challenge.id + '/reveal', {player_id:second.player_id})).result.verified_run, true);
  assert.equal((await call('/dashboard?campaign=save-pushok-pilot')).summary.raw_runs, 2);
  assert.equal((await call('/database-security')).checks.length, 3);
  await db.exec('ALTER TABLE public.game_runs DISABLE ROW LEVEL SECURITY');
  const failed = await ctx.module.exports.fetch(new Request('https://test.invalid/database-security'), {HYPERDRIVE:{connectionString:'local-test'}});
  assert.equal(failed.status, 503, 'The audit must fail if any application table loses RLS');
  await db.close();

  const fresh = new PGlite();
  await fresh.exec('CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;');
  await fresh.query(sql);
  assert.equal((await fresh.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.game_challenges'::regclass")).rows[0].relrowsecurity, true);
  assert.equal((await fresh.query("SELECT has_table_privilege('anon','public.game_challenges','SELECT') allowed")).rows[0].allowed, false);
  await fresh.close();
  console.log('PASS: existing and new tables protected; anon/authenticated denied SELECT/INSERT/UPDATE/DELETE/TRUNCATE including column grants; records preserved; server access, game sync, invitations, reveal and dashboard work.');
})().catch(e => { console.error(e); process.exit(1); });
