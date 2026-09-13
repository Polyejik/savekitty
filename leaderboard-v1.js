(()=>{
  const KEY='savekitty_analytics_v1';
  const q=s=>document.querySelector(s);
  const css=`
    #sk-leader-btn{min-width:46px;height:42px;border:1px solid #76543a;border-radius:12px;background:linear-gradient(#463328,#2b201a);color:#ffe4a3;font:900 18px system-ui;cursor:pointer;box-shadow:0 2px 6px #0004}
    #sk-leader{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;padding:14px;background:#0a0f16d9;backdrop-filter:blur(7px)}
    #sk-leader.show{display:flex}
    #sk-leader .box{width:min(520px,100%);max-height:86dvh;overflow:auto;border:1px solid #5c4631;border-radius:22px;background:linear-gradient(180deg,#241b16,#17120f);color:#fff5df;box-shadow:0 26px 80px #0009;padding:18px}
    #sk-leader .head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    #sk-leader h3{margin:0;font:950 20px system-ui}.sk-lclose{width:38px;height:38px;border:0;border-radius:50%;background:#342820;color:#fff;font:900 24px/1 system-ui}
    .sk-lrow{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:11px 8px;border-bottom:1px solid #3a2d25}.sk-lrow:last-child{border-bottom:0}.sk-lrank{font:950 16px system-ui;color:#f2bd57}.sk-lname{font:850 14px system-ui}.sk-ltime{font:950 15px system-ui}.sk-lempty{padding:24px 8px;text-align:center;color:#bda98e;font:700 13px system-ui}
  `;
  function rows(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')||[]}catch(e){return[]}}
  function secs(r){return Math.max(0,Math.round(Number(r?.duration_seconds??r?.duration_sec??r?.elapsed_sec)||0))}
  function name(r){return String(r?.player_name??r?.name??localStorage.getItem('savekitty_player_name_v1')??'Игрок').trim().slice(0,24)||'Игрок'}
  function fmt(n){return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
  function completed(){return rows().filter(r=>r&&(r.event==='completed'||r.completed===true)&&secs(r)>0).map(r=>({name:name(r),sec:secs(r),at:r.completed_at||''})).sort((a,b)=>a.sec-b.sec).slice(0,10)}
  function ensureModal(){if(q('#sk-leader'))return q('#sk-leader');const m=document.createElement('div');m.id='sk-leader';m.innerHTML=`<div class="box"><div class="head"><h3>🏆 Доска почёта</h3><button class="sk-lclose" type="button">×</button></div><div class="list"></div></div>`;document.body.appendChild(m);m.querySelector('.sk-lclose').onclick=()=>m.classList.remove('show');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')});return m}
  function render(){const m=ensureModal(),list=m.querySelector('.list'),a=completed();if(!a.length){list.innerHTML='<div class="sk-lempty">Заверши игру — твой результат появится здесь.</div>';return}list.innerHTML=a.map((x,i)=>`<div class="sk-lrow"><div class="sk-lrank">${i+1}</div><div class="sk-lname"></div><div class="sk-ltime">${fmt(x.sec)}</div></div>`).join('');[...list.querySelectorAll('.sk-lname')].forEach((el,i)=>el.textContent=a[i].name)}
  function mount(){const locks=q('#locks');if(!locks)return;let b=q('#sk-leader-btn');if(!b){b=document.createElement('button');b.id='sk-leader-btn';b.type='button';b.title='Доска почёта';b.textContent='🏆';b.onclick=()=>{render();ensureModal().classList.add('show')};const shell=locks.closest('.locksMeta')||locks.parentElement;shell.appendChild(b)}}
  const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);addEventListener('DOMContentLoaded',()=>{ensureModal();mount();setInterval(mount,700)});
})();