const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.QA_MODULES+'/jsdom');
const root=path.resolve(__dirname,'../public');
const requests=[],errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(root+'/index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,src)=>'<script>'+fs.readFileSync(path.join(root,src.split('?')[0]),'utf8').replace(/<\/script>/g,'<\\/script>')+'</script>');
const dom=new JSDOM(html,{url:'https://spasipushka.ru/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};w.fetch=async(url,opts)=>{requests.push({url,payload:opts?.body?JSON.parse(opts.body):null});return {ok:true,json:async()=>({ok:true,challenge:{id:'ABCDEF'}})}};}});
const w=dom.window,d=w.document,wait=()=>new Promise(r=>setTimeout(r,45));
const click=id=>{assert(d.getElementById(id),'missing '+id);d.getElementById(id).click()};
async function enter(n){for(const digit of String(n)){d.querySelector(`#pushok-keypad [data-key="${digit}"]`).click()}click('ok');await wait()}
async function start(){const input=d.getElementById('playerName');input.value='QA';input.dispatchEvent(new w.Event('input',{bubbles:true}));click('nameStart');await wait();if(d.getElementById('pk2')?.classList.contains('show')){click('pk2-skip');await wait()}}
async function playProblem(){const [dividend,divisor]=d.getElementById('problem').textContent.match(/\d+/g).map(Number);let current=0;
 for(const [i,ch] of [...String(dividend)].entries()){
  current=current*10+Number(ch);if(current<divisor)continue;
  const q=Math.floor(current/divisor),rem=current%divisor;await enter(q);
  if(i<String(dividend).length-1){assert.equal(d.querySelectorAll('#timesTable .hit').length,0,'no suggested multiplication answer during subtraction');await enter(rem*10+Number(String(dividend)[i+1]));}current=rem;
 }
 assert(d.getElementById('answer').disabled);click('ok');await wait();
}
(async()=>{await new Promise(r=>w.addEventListener('load',r));await wait();await start();
 assert.equal(d.querySelectorAll('#honorBtn').length,1);assert.equal(d.getElementById('honorBtn').textContent,'🏆');
 click('hint');await wait();assert(!d.getElementById('hintPanel').hidden);assert.equal(d.querySelectorAll('#timesTable .timesFact').length,10);assert.equal(d.querySelectorAll('#timesTable .hit').length,1);
 click('hintCloseX');await wait();assert(d.getElementById('hintPanel').hidden);click('hint');await wait();assert(!d.getElementById('hintPanel').hidden,'opens in one click after X');
 for(let n=0;n<9;n++){await playProblem();if(n>=2)assert.equal(d.querySelectorAll('#timesTable .hit').length,0,'no highlight after first three locks')}
 await new Promise(r=>setTimeout(r,800));
 assert(d.getElementById('finish').classList.contains('show'));
 const runs=JSON.parse(w.localStorage.getItem('savekitty_analytics_v1'));assert.equal(runs.length,1);assert.equal(runs[0].locks_opened,9);assert(runs[0].completion_id);assert(runs[0].duration_seconds>0);
 assert.equal(requests.filter(x=>x.url.endsWith('/game-run')).length,1);assert.equal(requests.find(x=>x.url.endsWith('/game-run')).payload.completion_id,runs[0].completion_id);
 click('ok');await wait();assert.equal(JSON.parse(w.localStorage.getItem('savekitty_analytics_v1')).length,1,'double finish does not save twice');
 assert.equal(d.querySelector('#winVideo source').getAttribute('src'),'Kotik.mp4');
 assert.equal(d.querySelectorAll('#sk-end-wrap #again').length,1,'real restart button; no clone');
 d.querySelector('#sk-end-wrap .secondary').click();assert(d.getElementById('sk-thanks').classList.contains('show'));
 assert.equal(d.querySelector('#sk-thanks img').getAttribute('src'),'family-end.jpg?v=5');d.querySelector('#sk-thanks .back').click();
 click('honorBtn');assert.match(d.getElementById('sk-honor-fallback').textContent,/QA/);d.querySelector('.sk-x').click();
 click('again');await new Promise(r=>setTimeout(r,900));assert(!d.getElementById('nameGate').classList.contains('show'),'restart remembers name without another prompt');assert(!d.getElementById('pk2').classList.contains('show'),'tutorial does not repeat');
 d.querySelector('.langBtn[data-lang="en"]').click();await wait();
 for(let n=0;n<9;n++)await playProblem();await new Promise(r=>setTimeout(r,800));
 assert.equal(JSON.parse(w.localStorage.getItem('savekitty_analytics_v1')).length,2);
 assert.equal(d.querySelector('#sk-end-wrap .secondary').textContent,'End');assert.equal(d.getElementById('again').textContent,'New game');assert.equal(d.querySelector('#pk6 h3').textContent,'Challenge a friend');
 assert.equal(requests.filter(x=>x.url.endsWith('/challenge')).length,2,'sharing re-prepared for second run');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: 18 problems / 2 complete games; hint close/reopen, subtraction, level gating, result sync, idempotent finish, leaderboard, family screen, remembered restart, EN, refreshed sharing.');dom.window.close();process.exit(0);
})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
