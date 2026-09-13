(()=>{
  const q=s=>document.querySelector(s);
  const KEY='savekitty_analytics_v1';
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
  function rows(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a)&&a.length)return a;const old=JSON.parse(localStorage.getItem('savekitty_honor_v1')||'[]');return Array.isArray(old)?old.map(r=>({event:'completed',name:r.name,duration_seconds:r.ms/1000})):[]}catch{return[]}}
  function sec(r){return Math.max(0,Math.round(Number(r?.duration_seconds??r?.duration_sec??r?.elapsed_sec)||0))}
  function name(r){return String(r?.player_name??r?.name??'Игрок').trim().slice(0,24)||'Игрок'}
  function fmt(n){return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
  function data(){return rows().filter(r=>r&&(r.event==='completed'||r.completed===true)&&sec(r)>0).map(r=>({name:name(r),sec:sec(r)})).sort((a,b)=>a.sec-b.sec).slice(0,10)}
  function fallback(){let m=q('#sk-honor-fallback');if(m)return m;m=document.createElement('div');m.id='sk-honor-fallback';m.innerHTML='<div class="sk-card"><div class="sk-head"><h3>🏆 Доска почёта</h3><button class="sk-x" type="button">×</button></div><div class="sk-list"></div></div>';document.body.appendChild(m);m.querySelector('.sk-x').onclick=()=>m.classList.remove('show');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')});return m}
  function openFallback(){const m=fallback(),a=data(),list=m.querySelector('.sk-list');list.innerHTML=a.length?a.map((x,i)=>`<div class="sk-hrow"><div class="sk-rank">${i+1}</div><div class="sk-name"></div><div class="sk-time">${fmt(x.sec)}</div></div>`).join(''):'<div class="sk-empty">Заверши игру — результат появится здесь.</div>';[...list.querySelectorAll('.sk-name')].forEach((el,i)=>el.textContent=a[i].name);m.classList.add('show')}
  function ensure(){addStyle();const locks=q('#locks');if(!locks)return;let shell=locks.closest('.locksMeta');if(!shell){shell=document.createElement('div');shell.className='locksMeta';locks.parentNode.insertBefore(shell,locks);shell.appendChild(locks)}let btn=q('#honorBtn');if(!btn){btn=document.createElement('button');btn.id='honorBtn';btn.type='button';btn.className='honorBtn';btn.textContent='🏆';btn.title='Доска почёта / Hall of Fame';btn.setAttribute('aria-label','Доска почёта');btn.onclick=openFallback}btn.classList.add('sk-restored');btn.textContent='🏆';if(btn.parentNode!==shell)shell.appendChild(btn)}
  const start=ensure;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
