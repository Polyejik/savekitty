const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.QA_MODULES+'/jsdom');
const root=path.resolve(__dirname,'../public/dashboard');
const html=fs.readFileSync(root+'/index.html','utf8').replace(/<script src="[^"]+"><\/script>/,()=>'<script>'+fs.readFileSync(root+'/app.js','utf8')+'</script>');
const response={ok:true,summary:{confirmed_rescues:9,total_runs:12,today_total:5,limited_runs:2,fast_runs:1,retry_duplicates:55,donation_rub:90,budget_rub:500000,unique_players:5,today_runs:3,avg_seconds:197,repeat_rate:20,raw_runs:67,duplicates:57,too_fast:1,rate_rub:10,days_left:29},daily:Array.from({length:14},(_,i)=>({day:`2026-09-${String(i+1).padStart(2,'0')}`,value:i===13?9:0})),runs:[{completed_at:'2026-09-14T10:00:00Z',participant:'<img src=x onerror=alert(1)>',duration_seconds:197,game_version:'2026.09.13.2',status:'confirmed'}]};
let fail=false,calls=0;const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://spasipushka.ru/dashboard/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.fetch=async url=>{calls++;assert(url.includes('/dashboard?campaign=save-pushok-pilot'));if(fail)throw new Error('offline');return {ok:true,json:async()=>response}}}});
const d=dom.window.document,q=id=>d.getElementById(id),wait=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 await wait();assert.equal(q('state').textContent,'LIVE');assert.equal(q('confirmed').textContent,'12');assert.equal(q('avg').textContent,'3:17');
 assert.equal(q('dailyChart').children.length,14);assert.equal(q('runs').querySelectorAll('img').length,0,'names stay text');
 assert(q('runs').textContent.includes('<img'));assert(Math.abs(Number(q('budgetProgress').getAttribute('aria-valuenow'))-.018)<1e-8);
 assert.equal(q('refresh').disabled,false);assert.equal(d.querySelector('.hero-art img').getAttribute('src'),'../family-end.png');
 fail=true;q('refresh').click();await wait();assert.equal(q('state').textContent,'НЕТ СВЯЗИ');assert.equal(q('confirmed').textContent,'—');assert.equal(q('err').hidden,false);assert.equal(q('dailyChart').children.length,0);
 fail=false;q('refresh').click();await wait();assert.equal(q('state').textContent,'LIVE');assert.equal(q('err').hidden,true);assert.equal(calls,3);
 response.runs=[];response.daily.forEach(x=>x.value=0);response.summary.confirmed_rescues=0;response.summary.total_runs=0;response.summary.donation_rub=0;
 q('refresh').click();await wait();assert.equal(q('confirmed').textContent,'0');assert.match(q('runs').textContent,/первое сохранённое/);assert.equal(q('budgetFill').style.width,'0%');
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: dashboard values, 14-day chart, empty state, offline state, manual retry, safe text, and PNG asset.');dom.window.close();process.exit(0);
})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
