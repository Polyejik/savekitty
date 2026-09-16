(()=>{
  const q=s=>document.querySelector(s);
  const API='https://spasipushka-api.kutuzovap.workers.dev/leaderboard';
  const en=()=>document.documentElement.lang==='en';
  const css=`
    .locksMeta{display:grid!important;grid-template-columns:minmax(0,1fr) 46px!important;gap:7px!important;align-items:stretch!important;margin-top:8px!important}
    .locksMeta .locks{min-width:0!important;margin-top:0!important}
    #honorBtn.sk-restored::before,#honorBtn.sk-restored::after{content:none!important}
    #honorBtn.sk-restored{display:flex!important;visibility:visible!important;opacity:1!important;width:46px!important;min-width:46px!important;height:auto!important;min-height:42px!important;margin:0!important;padding:0!important;align-items:center!important;justify-content:center!important;border:1px solid #76543a!important;border-radius:12px!important;background:linear-gradient(#463328,#2b201a)!important;color:#ffe4a3!important;font:900 19px/1 system-ui!important;box-shadow:0 2px 6px #0004!important;cursor:pointer!important;position:relative!important;z-index:2!important}
    #sk-honor-fallback{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;padding:14px;background:#1b120fb8;backdrop-filter:blur(5px)}
    #sk-honor-fallback.show{display:flex}
    #sk-honor-fallback .sk-card{width:min(460px,100%);max-height:82dvh;overflow:auto;border:1px solid #d7b475;border-radius:20px;background:linear-gradient(180deg,#fff8e7,#f3dfb9);color:#4a3424;box-shadow:0 20px 60px #0007;padding:15px}
    #sk-honor-fallback .sk-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
    #sk-honor-fallback h3{margin:0;font:950 18px/1.2 system-ui}.sk-x{width:34px;height:34px;border:0;border-radius:50%;background:#e9cf9b;color:#4a3424;font:900 23px/1 system-ui}
    .sk-hrow{display:grid;grid-template-columns:28px 1fr auto;gap:9px;align-items:center;padding:9px 6px;border-bottom:1px solid #dfc89b}.sk-hrow:last-child{border-bottom:0}.sk-rank{font:950 14px system-ui;color:#a46d20}.sk-name{font:850 13px system-ui}.sk-time{font:950 14px system-ui}.sk-empty{text-align:center;padding:18px 6px;color:#80664c;font:700 12px system-ui}
  `;
  function addStyle(){if(q('#sk-honor-style'))return;const s=document.createElement('style');s.id='sk-honor-style';s.textContent=css;document.head.appendChild(s)}
  function fmt(n){return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
  function close(){q('#sk-honor-fallback')?.classList.remove('show');q('#honorBtn')?.focus()}
  function fallback(){
    let m=q('#sk-honor-fallback');if(m)return m;
    m=document.createElement('div');m.id='sk-honor-fallback';
    m.innerHTML='<div class="sk-card" role="dialog" aria-modal="true" aria-labelledby="sk-honor-title"><div class="sk-head"><h3 id="sk-honor-title"></h3><button class="sk-x" type="button">×</button></div><p class="sk-honor-note" style="font:12px/1.6 system-ui;color:#80664c"></p><div class="sk-list" aria-live="polite"></div><button class="sk-honor-retry" type="button" style="border:1px solid #c8ab73;border-radius:10px;background:#fff7e6;color:#4a3424;padding:9px 14px;font:700 12px system-ui;margin-top:12px"></button></div>';
    document.body.appendChild(m);m.querySelector('.sk-x').onclick=close;
    m.addEventListener('click',e=>{if(e.target===m)close()});
    m.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const first=m.querySelector('.sk-x'),last=m.querySelector('.sk-honor-retry');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
    m.querySelector('.sk-honor-retry').onclick=load;return m;
  }
  let loading=false;
  async function load(){
    if(loading)return;loading=true;
    const m=fallback(),list=m.querySelector('.sk-list'),retry=m.querySelector('.sk-honor-retry');retry.disabled=true;list.replaceChildren();
    const message=text=>{const p=document.createElement('p');p.className='sk-empty';p.textContent=text;list.replaceChildren(p)};
    message(en()?'Loading global results…':'Загружаем общий рейтинг…');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(API,{cache:'no-store',signal:controller.signal});const result=await r.json();
      if(!r.ok||!result.ok||!Array.isArray(result.rows))throw new Error('Leaderboard unavailable');
      list.replaceChildren();
      for(const [i,x] of result.rows.slice(0,10).entries()){
        const row=document.createElement('div');row.className='sk-hrow';
        for(const [cls,value] of [['sk-rank',i+1],['sk-name',x.name],['sk-time',fmt(Number(x.duration_seconds)||0)]]){const cell=document.createElement('div');cell.className=cls;cell.textContent=value;row.append(cell)}list.append(row);
      }
      if(!result.rows.length)message(en()?'Be the first to finish!':'Заверши игру и открой общий рейтинг!');
    }catch{message(en()?'No connection to the leaderboard. Try refreshing.':'Нет связи с общим рейтингом. Нажми «Обновить».')}
    finally{clearTimeout(timer);retry.disabled=false;loading=false}
  }
  function openFallback(){
    const m=fallback();m.querySelector('h3').textContent=en()?'🏆 Global top 10':'🏆 Общий топ-10';
    m.querySelector('.sk-x').setAttribute('aria-label',en()?'Close':'Закрыть');
    m.querySelector('.sk-honor-note').textContent=en()?'Best time per player, across all devices. Tests under 45 seconds are excluded.':'Лучшее время каждого игрока со всех устройств. Тесты короче 45 секунд не участвуют.';
    m.querySelector('.sk-honor-retry').textContent=en()?'Refresh':'Обновить';m.classList.add('show');m.querySelector('.sk-x').focus();load();
  }
  document.addEventListener('savekitty:synced',()=>{if(q('#sk-honor-fallback.show'))load()});
  function ensure(){
    addStyle();
    const locks=q('#locks');if(!locks)return false;
    let shell=locks.closest('.locksMeta');
    if(!shell){shell=document.createElement('div');shell.className='locksMeta';locks.parentNode.insertBefore(shell,locks);shell.appendChild(locks)}
    let btn=q('#honorBtn');
    if(!btn){btn=document.createElement('button');btn.id='honorBtn';btn.type='button';btn.className='honorBtn';btn.textContent='🏆';btn.title='Доска почёта / Hall of Fame';btn.setAttribute('aria-label','Доска почёта');btn.onclick=openFallback}
    else if(!btn.onclick && !btn.dataset.nativeHonorBound){btn.onclick=openFallback}
    btn.classList.add('sk-restored');if(btn.textContent!=='🏆')btn.textContent='🏆';
    if(btn.parentNode!==shell)shell.appendChild(btn);
    return true;
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure()})}
  function start(){ensure();const root=document.body;if(root){new MutationObserver(schedule).observe(root,{childList:true,subtree:true})}setInterval(ensure,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
