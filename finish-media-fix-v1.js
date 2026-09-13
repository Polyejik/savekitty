(()=>{
  const q=s=>document.querySelector(s); let last=null;
  const css=`#sk-video-play{display:none;width:min(680px,100%);margin:-2px auto 10px;min-height:46px;border:0;border-radius:14px;background:#f0b84a;color:#382711;font:900 14px system-ui;cursor:pointer}.sk-video-fallback #sk-video-play{display:block}.winVideo,#winVideo{pointer-events:auto!important}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
  function ensureButton(v){let b=q('#sk-video-play');if(!b){b=document.createElement('button');b.id='sk-video-play';b.type='button';b.textContent='▶ Смотреть видео';v.insertAdjacentElement('afterend',b);b.onclick=()=>{v.play().then(()=>document.body.classList.remove('sk-video-fallback')).catch(()=>{})}}return b}
  function sync(){const f=q('#finish'),v=q('#winVideo')||q('.winVideo');if(!f||!v)return;ensureButton(v);v.controls=false;v.removeAttribute('controls');v.playsInline=true;v.setAttribute('playsinline','');if(visible(f)&&last!==v){last=v;try{v.currentTime=0}catch{};const p=v.play();if(p&&p.catch)p.catch(()=>document.body.classList.add('sk-video-fallback'))}if(!visible(f)){last=null;document.body.classList.remove('sk-video-fallback')}}
  addEventListener('DOMContentLoaded',()=>setInterval(sync,500));
})();