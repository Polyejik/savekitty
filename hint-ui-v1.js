(()=>{
  const $=id=>document.getElementById(id);
  const css=`#hintPanel{position:relative!important;display:block!important;grid-template-columns:1fr!important;padding:14px 10px 10px!important;background:linear-gradient(180deg,#fff8e8,#fff1cf)!important;border:1px solid #e2bf78!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important}#hintPanel[hidden]{display:none!important}#hintPanel .hintArtWrap,#hintPanel .storyTop,#hintPanel #visual,#hintPanel #timesBtn{display:none!important}#hintPanel .hintCopy{display:block!important}#hintCloseX{position:absolute;top:6px;right:7px;width:34px;height:34px;border:0;border-radius:50%;background:#fff9ed;color:#5a402a;box-shadow:0 2px 8px rgba(79,52,24,.14);font:900 24px/30px system-ui;display:flex;align-items:center;justify-content:center;z-index:2;cursor:pointer}#timesTable{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important}#timesTable[hidden]{display:none!important}#timesTable:before{content:attr(data-title);grid-column:1/-1;display:block;text-align:center;font:950 16px/1.2 system-ui;color:#5c3d28;margin:0 34px 2px;padding:4px 8px}#timesTable .timesFact{display:flex!important;align-items:center!important;justify-content:center!important;min-height:36px!important;padding:6px 8px!important;border:1px solid #dfc18a!important;border-bottom-width:3px!important;border-radius:10px!important;background:linear-gradient(#fffdf7,#f7e9cc)!important;color:#513823!important;font:900 16px/1 system-ui!important;box-sizing:border-box!important}#timesTable .timesFact.hit{background:linear-gradient(#fff0a8,#ffd65a)!important;border-color:#d79a24!important;color:#402b18!important;box-shadow:0 0 0 2px rgba(255,213,74,.26)!important}#timesTable .timesFact.hit:before{content:'🐾';margin-right:6px;font-size:14px}#hint.hintToggleOn{background:#6b8f3e!important;color:#fff!important}@media(max-width:430px){#hintPanel{padding:12px 8px 8px!important}#hintCloseX{top:5px;right:5px;width:32px;height:32px;font-size:22px}#timesTable{gap:5px!important}#timesTable .timesFact{min-height:34px!important;font-size:14px!important;padding:5px 6px!important}#timesTable:before{font-size:15px!important}}`;
  function lang(){return document.documentElement.lang==='en'?'en':'ru'}
  let last='';
  function render(){
    const panel=$('hintPanel'),box=$('timesTable'),btn=$('hint');
    if(!panel||!box||!btn)return;
    const d=Number(panel.dataset.divisor)||1;
    const hit=panel.dataset.mode==='divide' && Number(panel.dataset.solved)<3
      ? Math.floor(Number(panel.dataset.current)/d):0;
    const opened=!panel.hidden;
    box.hidden=!opened;
    btn.classList.toggle('hintToggleOn',opened);
    btn.setAttribute('aria-expanded',String(opened));
    btn.textContent=lang()==='ru'?`🐾 Таблица × ${d}`:`🐾 Table × ${d}`;
    $('hintCloseX')?.setAttribute('aria-label',lang()==='ru'?'Закрыть таблицу':'Close table');
    const key=[d,hit,lang()].join(':');
    if(last===key)return;
    last=key;
    box.dataset.title=lang()==='ru'?`🐾 Таблица на ${d}`:`🐾 ${d} times table`;
    box.replaceChildren();
    for(let i=1;i<=10;i++){
      const el=document.createElement('div');
      el.className='timesFact'+(i===hit?' hit':'');el.textContent=`${d} × ${i} = ${d*i}`;box.appendChild(el);
    }
  }
  function install(){
    const panel=$('hintPanel'),btn=$('hint');if(!panel||!btn)return;
    const st=document.createElement('style');st.id='hint-ui-v1-style';st.textContent=css;document.head.appendChild(st);
    const x=document.createElement('button');x.id='hintCloseX';x.type='button';x.textContent='×';
    x.onclick=()=>{if(!panel.hidden)btn.click()};panel.appendChild(x);
    document.addEventListener('savekitty:hint',render);
    document.querySelectorAll('.langBtn').forEach(b=>b.addEventListener('click',render));
    render();
  }
  document.addEventListener('DOMContentLoaded',install);
})();
