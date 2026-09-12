(()=>{
 const A='savekitty_analytics_v1',SITE='https://spasipushka.ru/';
 const css=`.pk-share2{width:min(520px,calc(100% - 8px));box-sizing:border-box;margin:14px auto;padding:13px;border:1px solid #d9b66f;border-radius:17px;background:#fff3d3;color:#4a3424;box-shadow:0 8px 24px #3a241522}.pk-share2 h3{margin:0 0 4px;text-align:center;font:950 18px/1.15 system-ui}.pk-share2 p{margin:0 0 10px;text-align:center;font:750 12px/1.3 system-ui;color:#765c43}.pk-share2-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pk-share2 button{border:0;border-radius:12px;min-height:46px;color:#fff;font:900 14px/1 system-ui;touch-action:manipulation}.pk-share2 .tg{background:#229ed9}.pk-share2 .mx{background:#111}@media(max-width:430px){.pk-share2{margin:10px auto;padding:11px}.pk-share2 h3{font-size:16px}}`;
 function rows(){try{return JSON.parse(localStorage.getItem(A)||'[]')||[]}catch(e){return[]}}
 function run(){let a=rows();for(let i=a.length-1;i>=0;i--)if(a[i]?.completed)return a[i];return null}
 function en(r){return r?.language==='en'||(!r?.language&&document.documentElement.lang==='en')}
 function fmt(n){n=Math.max(0,Math.round(+n||0));let m=Math.floor(n/60),s=n%60;return m?m+':'+String(s).padStart(2,'0'):n+' сек'}
 function text(r){let t=fmt(r?.duration_seconds);return en(r)?`I freed Pushok in ${t}! 🐾 Can you do it faster? 🔓 ${SITE}`:`Я освободил Пушка за ${t}! 🐾 А ты сможешь быстрее? 🔓 ${SITE}`}
 function share(k){let r=run(),t=text(r),u=k==='tg'?'https://t.me/share/url?url='+encodeURIComponent(SITE)+'&text='+encodeURIComponent(t.replace(SITE,'').trim()):'https://max.ru/:share?text='+encodeURIComponent(t);location.href=u}
 function visible(el){if(!el)return false;let s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
 function mount(){
  let f=document.getElementById('finish'); if(!f)return;
  let old=document.getElementById('pk-share');if(old)old.remove();
  let b=document.getElementById('pk-share2');
  if(!b){let r=run(),isEn=en(r);b=document.createElement('div');b.id='pk-share2';b.className='pk-share2';b.innerHTML=`<h3>${isEn?'Challenge a friend':'Брось вызов другу'}</h3><p>${isEn?'I freed Pushok — can you beat my time?':'Я освободил Пушка — а ты сможешь быстрее?'}</p><div class="pk-share2-row"><button class="tg" type="button">Telegram</button><button class="mx" type="button">MAX</button></div>`;b.querySelector('.tg').onclick=()=>share('tg');b.querySelector('.mx').onclick=()=>share('max')}
  // Put it before the restart/new-game action so it cannot sit below an oversized video.
  let restart=[...f.querySelectorAll('button,a')].find(x=>/новая игра|сыграть|ещё раз|new game|play again/i.test(x.textContent||''));
  if(restart)restart.parentNode.insertBefore(b,restart);else{let v=f.querySelector('#winVideo,.winVideo,video');v?.insertAdjacentElement('afterend',b)||f.appendChild(b)}
  b.style.display=visible(f)?'block':'none';
 }
 function tick(){let f=document.getElementById('finish'),b=document.getElementById('pk-share2');if(f&&!b)mount();if(f&&b)b.style.display=visible(f)?'block':'none'}
 let st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 addEventListener('DOMContentLoaded',()=>{mount();setInterval(tick,400)});
})();