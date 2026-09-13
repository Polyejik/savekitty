const assert=require('node:assert/strict');
const {PGlite}=require(process.env.QA_MODULES+'/@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const db=new PGlite();const root=path.resolve(__dirname,'..');const src=fs.readFileSync(root+'/worker/src/index.js','utf8');
 await db.exec(fs.readFileSync(root+'/supabase/schema.sql','utf8').replace('create extension if not exists pgcrypto;','').split('alter table public.campaigns enable')[0]);
 for(const m of src.matchAll(/await c.query\(\s*`([\s\S]*?)`/g))if(m[1].includes('CREATE TABLE IF NOT EXISTS public.game_challenges')||m[1].includes('CREATE INDEX IF NOT EXISTS game_challenges'))await db.query(m[1]);
 const cid='08fae845-8817-479f-8b49-1987b9035d7f';
 const insert=src.match(/`(INSERT INTO public.game_runs[\s\S]*?)`/)[1];
 const payload=[cid,'save-pushok-pilot','5416352f-7852-4fe6-a80f-335857c5470c','QA','ru',new Date(Date.now()-100000).toISOString(),new Date().toISOString(),100,'test'];
 await db.query(insert,payload);await db.query(insert,payload);
 assert.equal((await db.query('SELECT count(*)::int n FROM game_runs')).rows[0].n,1,'retry must not duplicate completion');
 await db.query(insert,['87e9a09e-abbe-4cbb-a566-241a233721c9',...payload.slice(1)]);
 const cte=src.match(/const confirmedCte = `([\s\S]*?)`/)[1];
 const dash=src.slice(src.indexOf('if (url.pathname === "/dashboard"'));
 let count=0;for(const m of dash.matchAll(/await c.query\(\s*`([\s\S]*?)`/g)){
  const query=m[1].replace('${confirmedCte}',cte);const r=await db.query(query,query.includes('$1')?['save-pushok-pilot']:[]);count++;
  if(m[1].includes('raw_runs')){assert.equal(r.rows[0].raw_runs,2);assert.equal(r.rows[0].confirmed_rescues,1);assert.equal(r.rows[0].duplicates,1)}
  if(m[1].includes('generate_series'))assert.equal(r.rows.length,14);
 }
 assert.equal(count,7);await db.close();console.log('PASS: all 7 dashboard queries execute on PostgreSQL; retry is idempotent; old exact duplicates count once in sponsor totals.');
})().catch(e=>{console.error(e);process.exit(1)});
