const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.QA_MODULES+'/jsdom');
const root=path.resolve(__dirname,'../public/dashboard'),html=fs.readFileSync(root+'/partners.html','utf8'),code=fs.readFileSync(root+'/partners.js','utf8');
const roomId='08fae845-8817-479f-8b49-1987b9035d7f',key='a'.repeat(64),needId='18fae845-8817-479f-8b49-1987b9035d7f';
const tick=()=>new Promise(r=>setTimeout(r,25));
(async()=>{
 for(const role of ['fund','sponsor','admin']){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://spasipushka.ru/dashboard/partners.html#room='+roomId+'&key='+key,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,q=id=>w.document.getElementById(id);let offline=false,revoked=false,posts=[];
  const events=[{id:needId,role:'fund',kind:'need',subject:'<img src=x onerror=alert(1)>',body:'Учебные наборы',amount:'1000.00',created_at:'2026-09-16T10:00:00Z'}];
  w.fetch=async(url,o)=>{
   assert.equal(o.headers.Authorization,'Bearer '+key);assert(!url.includes(key),'Secret is never sent in URL');
   if(revoked)return {ok:false,status:403,json:async()=>({ok:false,error:'Приглашение отозвано'})};
   if(o.method==='POST'){const b=JSON.parse(o.body);posts.push(b);if(offline)throw new Error('Нет связи');events.push({...b,role,created_at:'2026-09-16T10:01:00Z'});return {ok:true,json:async()=>({ok:true,event:events.at(-1)})}}
   return {ok:true,json:async()=>({ok:true,room:{id:roomId,title:'Фонд — компания',role},events:events.map(e=>({...e}))})};
  };
  w.eval(code);await tick();assert.equal(w.location.hash,'');assert.equal(q('roomWorkspace').hidden,false);assert.equal(q('roomStart').hidden,true);assert.match(q('needTotal').textContent,/1.?000/);
  assert.equal(q('roomEvents').querySelectorAll('img').length,0);assert.match(q('roomEvents').textContent,/<img/);
  const options=[...q('eventKind').options].map(o=>o.value);
  if(role==='fund'){assert(!options.includes('pledge'));assert(options.includes('receipt'))}
  if(role==='sponsor'){
   assert.deepEqual(options,['pledge','transfer','message']);q('eventRelated').value=needId;q('eventSubject').value='Поможем с наборами';q('eventAmount').value='600';
   offline=true;q('eventForm').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(q('eventSubject').value,'Поможем с наборами');assert.equal(q('eventFields').disabled,false);assert.equal(q('roomError').hidden,false);
   offline=false;q('eventForm').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(posts[0].id,posts[1].id,'Retry keeps event identifier');assert.equal(q('eventSubject').value,'');assert.equal(q('pledgeTotal').textContent,'600 ₽');assert.equal(q('roomEvents').children.length,2);
   q('eventFilter').value='message';q('eventFilter').dispatchEvent(new w.Event('change'));assert.match(q('roomEvents').textContent,/нет записей/);
  }
  revoked=true;q('roomRefresh').click();await tick();assert.equal(q('roomWorkspace').hidden,true);assert.equal(q('roomEvents').children.length,0);assert.match(q('roomError').textContent,/отозвано/);assert.equal(errors.length,0,errors.join('\n'));w.close();
 }
 const d=new JSDOM(html,{url:'https://spasipushka.ru/dashboard/partners.html',runScripts:'outside-only'}),w=d.window,q=id=>w.document.getElementById(id);
 w.fetch=async(url,o)=>o.method==='POST'?{ok:true,json:async()=>({ok:true,room:{id:roomId},access:{admin:key,fund:'b'.repeat(64),sponsor:'c'.repeat(64)}})}:{ok:true,json:async()=>({ok:true,room:{id:roomId,title:'Новая комната',role:'admin'},events:[]})};
 w.eval(code);assert.equal(q('roomStart').hidden,false);q('roomTitle').value='Новая комната';q('createRoom').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(q('roomWorkspace').hidden,false);assert.equal(q('accessLinks').children.length,3);assert.equal(q('rotateLinks').hidden,false);assert.match(q('roomNotice').textContent,/Сохраните ссылку/);w.close();
 console.log('PASS: room creation UI, invitation entry, role-specific actions, safe history rendering, failed-draft preservation, stable retry, totals, filters and revoked-access state.');
})().catch(e=>{console.error(e);process.exit(1)});
