(()=>{
  const ANALYTICS_KEY='savekitty_analytics_v1';
  const SITE='https://spasipushka.ru/';

  const css=`
  .pk-share{width:min(520px,100%);box-sizing:border-box;margin:14px auto 0;padding:14px;border:1px solid rgba(155,111,48,.28);border-radius:18px;background:linear-gradient(180deg,rgba(255,251,239,.98),rgba(250,238,209,.98));box-shadow:0 10px 30px rgba(65,42,22,.10);color:#4a3424}
  .pk-share-title{font:950 18px/1.15 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;margin:0 0 5px}
  .pk-share-sub{font:750 12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;color:#7a6048;margin:0 0 11px}
  .pk-share-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .pk-share-btn{appearance:none;-webkit-appearance:none;border:0;border-radius:13px;min-height:48px;padding:10px 12px;font:900 15px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;cursor:pointer;touch-action:manipulation;box-sizing:border-box}
  .pk-share-tg{background:#229ED9;color:#fff}
  .pk-share-max{background:#111;color:#fff}
  .pk-share-icon{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:15px;line-height:1;background:rgba(255,255,255,.14)}
  .pk-share-note{font:700 11px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;color:#8c745d;margin:9px 0 0}
  @media(max-width:430px){.pk-share{margin-top:11px;padding:12px;border-radius:16px}.pk-share-btn{min-height:46px;font-size:14px}.pk-share-title{font-size:17px}}
  `;

  function fmt(sec){
    sec=Math.max(0,Math.round(Number(sec)||0));
    const m=Math.floor(sec/60),s=sec%60;
    return m?`${m}:${String(s).padStart(2,'0')}`:`${s} сек`;
  }

  function latestCompleted(){
    try{
      const a=JSON.parse(localStorage.getItem(ANALYTICS_KEY)||'[]')||[];
      for(let i=a.length-1;i>=0;i--)if(a[i]?.completed)return a[i];
    }catch(e){}
    return null;
  }

  function isEnglish(run){
    if(run?.language)return run.language==='en';
    return document.documentElement.lang==='en';
  }

  function message(run){
    const time=fmt(run?.duration_seconds);
    if(isEnglish(run))return `I freed Pushok in ${time}! 🐾 Can you do it faster? 🔓 Save Pushok: ${SITE}`;
    return `Я освободил Пушка за ${time}! 🐾 А ты сможешь быстрее? 🔓 Спаси Пушка: ${SITE}`;
  }

  function ensureStyle(){
    if(document.getElementById('pk-share-style'))return;
    const s=document.createElement('style');s.id='pk-share-style';s.textContent=css;document.head.appendChild(s);
  }

  function openShare(kind){
    const run=latestCompleted();
    const text=message(run);
    let url='';
    if(kind==='tg'){
      const body=text.replace(SITE,'').trim();
      url='https://t.me/share/url?url='+encodeURIComponent(SITE)+'&text='+encodeURIComponent(body);
    }else{
      url='https://max.ru/:share?text='+encodeURIComponent(text);
    }
    const w=window.open(url,'_blank','noopener,noreferrer');
    if(!w)location.href=url;
  }

  function ensureShare(){
    const finish=document.getElementById('finish');
    if(!finish||document.getElementById('pk-share'))return;
    ensureStyle();
    const run=latestCompleted();
    const en=isEnglish(run);
    const box=document.createElement('div');
    box.id='pk-share';box.className='pk-share';
    box.innerHTML=`
      <div class="pk-share-title">${en?'Challenge a friend':'Брось вызов другу'}</div>
      <div class="pk-share-sub">${en?'Share your result and see who frees Pushok faster':'Поделись результатом — кто освободит Пушка быстрее?'}</div>
      <div class="pk-share-row">
        <button type="button" class="pk-share-btn pk-share-tg" data-share="tg"><span class="pk-share-icon">➤</span><span>Telegram</span></button>
        <button type="button" class="pk-share-btn pk-share-max" data-share="max"><span class="pk-share-icon">M</span><span>MAX</span></button>
      </div>
      <div class="pk-share-note">${en?'Your finish time is added automatically':'Твоё время добавится в сообщение автоматически'}</div>`;
    box.addEventListener('click',e=>{const b=e.target.closest('[data-share]');if(b)openShare(b.dataset.share)});
    finish.appendChild(box);
  }

  function refreshText(){
    const box=document.getElementById('pk-share');
    if(!box)return;
    const run=latestCompleted(),en=isEnglish(run);
    const title=box.querySelector('.pk-share-title'),sub=box.querySelector('.pk-share-sub'),note=box.querySelector('.pk-share-note');
    if(title)title.textContent=en?'Challenge a friend':'Брось вызов другу';
    if(sub)sub.textContent=en?'Share your result and see who frees Pushok faster':'Поделись результатом — кто освободит Пушка быстрее?';
    if(note)note.textContent=en?'Your finish time is added automatically':'Твоё время добавится в сообщение автоматически';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    ensureShare();refreshText();
    const obs=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList')){ensureShare();refreshText()}});
    obs.observe(document.body,{childList:true,subtree:true});
  });
})();
