const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {webcrypto:crypto}=require('node:crypto');
const {PGlite}=require(process.env.QA_MODULES+'/@electric-sql/pglite');
(async()=>{
 const root=path.resolve(__dirname,'..'),db=new PGlite();
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; GRANT USAGE ON SCHEMA public TO anon, authenticated; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;');
 await db.exec(fs.readFileSync(root+'/supabase/schema.sql','utf8').replace('create extension if not exists pgcrypto;','').split('alter table public.campaigns enable')[0]);
 const ctx={crypto,TextEncoder,URL,console};vm.runInNewContext(fs.readFileSync(root+'/worker/src/partners.js','utf8').replaceAll('export ',''),ctx);
 const call=async(route,key,body)=>{
  const r=await ctx.handlePartnerRequest(new Request('https://test.invalid/partner-rooms'+route,{method:body===undefined?'GET':'POST',headers:{...(key?{Authorization:'Bearer '+key}:{}),'CF-Connecting-IP':'192.0.2.1'},...(body===undefined?{}:{body:JSON.stringify(body)})}),{}, {withDb:async(env,fn)=>fn(db),json:(req,data,status=200)=>Response.json(data,{status})});
  return {status:r.status,...await r.json()};
 };
 const room=await call('',null,{title:'Фонд — спонсор'});assert.equal(room.status,201);const id='/'+room.room.id,keys=room.access;
 assert.equal((await call(id)).status,401);assert.equal((await call(id,'a'.repeat(64))).status,403);
 for(const role of ['admin','fund','sponsor']){const r=await call(id,keys[role]);assert.equal(r.room.role,role);assert.equal(r.events.length,0);assert(!JSON.stringify(r).includes('_hash'))}
 const row=(await db.query('SELECT * FROM partner_rooms')).rows[0];assert.equal(Object.values(row).some(x=>Object.values(keys).includes(x)),false,'No raw tokens in database');
 const event=(kind,extra={})=>({id:crypto.randomUUID(),kind,subject:'Тест '+kind,body:'Подробности',...extra});
 const post=(role,e)=>call(id+'/events',keys[role],e);
 assert.equal((await post('sponsor',event('need',{amount:1000}))).status,403);
 assert.equal((await post('fund',event('transfer',{amount:10}))).status,403);
 for(const due_date of ['2026-99-99','2026-02-30'])assert.equal((await post('fund',event('need',{amount:1000,due_date}))).status,400);
 assert.equal((await post('fund',event('need',{amount:0.001}))).status,400);
 assert.equal((await post('fund',event('report',{document_url:'javascript:alert(1)'}))).status,400);
 const need=event('need',{amount:1000,due_date:'2026-10-01',document_url:'https://example.org/report'});
 assert.equal((await post('fund',need)).status,201);assert.equal((await post('fund',need)).status,200);
 assert.equal((await post('fund',{...need,amount:2000})).status,409,'Different payload must not masquerade as successful retry');
 assert.equal((await post('sponsor',event('pledge',{amount:1001,related_id:need.id}))).status,400);
 const pledge=event('pledge',{amount:600,related_id:need.id});assert.equal((await post('sponsor',pledge)).status,201);
 assert.equal((await post('sponsor',event('pledge',{amount:401,related_id:need.id}))).status,400);
 const transfer=event('transfer',{amount:400,related_id:pledge.id});assert.equal((await post('sponsor',transfer)).status,201);
 assert.equal((await post('sponsor',event('transfer',{amount:201,related_id:pledge.id}))).status,400);
 const receipt=event('receipt',{amount:400,related_id:transfer.id});assert.equal((await post('fund',receipt)).status,201);
 assert.equal((await post('fund',event('receipt',{amount:1,related_id:transfer.id}))).status,400);
 assert.equal((await post('fund',event('receipt',{amount:1,related_id:need.id}))).status,400);
 assert.equal((await post('fund',event('report',{subject:'Отчёт фонда'}))).status,201);
 assert.equal((await post('sponsor',event('message',{subject:'Спасибо',body:'<script>alert(1)</script>'}))).status,201);
 const other=await call('',null,{title:'Другая комната'});
 assert.equal((await call('/'+other.room.id,keys.fund)).status,403);
 assert.equal((await call('/'+other.room.id+'/events',other.access.sponsor,event('pledge',{amount:1,related_id:need.id}))).status,400);
 assert.equal((await call(id+'/invites',keys.sponsor,{role:'fund'})).status,403);
 const rotated=await call(id+'/invites',keys.admin,{role:'fund'});assert.equal(rotated.status,200);
 assert.equal((await call(id,keys.fund)).status,403);assert.equal((await call(id,rotated.token)).room.role,'fund');
 const saved=await call(id,keys.sponsor);assert.equal(saved.events.length,6);assert.equal(saved.events.filter(x=>x.kind==='receipt').reduce((s,e)=>s+Number(e.amount),0),400);
 for(const role of ['anon','authenticated']){await db.exec('SET ROLE '+role);for(const table of ['partner_rooms','partner_events'])await assert.rejects(db.query('SELECT * FROM '+table),e=>e.code==='42501');await db.exec('RESET ROLE')}
 for(let i=0;i<3;i++)assert.equal((await call('',null,{title:'Ещё комната'})).status,201);
 assert.equal((await call('',null,{title:'Слишком много'})).status,429);
 await db.close();console.log('PASS: real PostgreSQL partnership lifecycle, amount limits, retry idempotency, cross-room/role isolation, invite revocation, RLS and room creation limit.');
})().catch(e=>{console.error(e);process.exit(1)});
