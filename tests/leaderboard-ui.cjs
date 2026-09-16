const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.QA_MODULES+'/jsdom');
const code=fs.readFileSync(path.resolve(__dirname,'../leaderboard-restore-v2.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
 const dom=new JSDOM('<html lang="ru"><body><div id="locks"></div></body></html>',{url:'https://spasipushka.ru',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
 const w=dom.window,q=s=>w.document.querySelector(s);let offline=false,calls=0;
 w.localStorage.setItem('savekitty_analytics_v1',JSON.stringify([{event:'completed',name:'LOCAL ONLY',duration_seconds:1}]));
 w.fetch=async url=>{calls++;assert(url.endsWith('/leaderboard'));if(offline)throw new Error('offline');return {ok:true,json:async()=>({ok:true,rows:Array.from({length:10},(_,i)=>({name:i?'Игрок '+i:'<img src=x>',duration_seconds:50+i}))})}};
 w.eval(code);await tick();q('#honorBtn').click();await tick();assert.equal(w.document.querySelectorAll('.sk-hrow').length,10);assert(!q('.sk-list').textContent.includes('LOCAL ONLY'));assert.equal(q('.sk-list').querySelectorAll('img').length,0);assert.equal(q('.sk-time').textContent,'0:50');
 offline=true;q('.sk-honor-retry').click();await tick();assert.match(q('.sk-list').textContent,/Нет связи/);assert.equal(w.document.querySelectorAll('.sk-hrow').length,0);assert.equal(q('.sk-honor-retry').disabled,false);
 offline=false;q('.sk-honor-retry').click();await tick();assert.equal(w.document.querySelectorAll('.sk-hrow').length,10);q('.sk-x').click();assert(!q('#sk-honor-fallback').classList.contains('show'));assert.equal(calls,3);w.close();
 console.log('PASS: global top 10 uses server results, never local fallback, safe names, offline/refresh recovery and modal close.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
