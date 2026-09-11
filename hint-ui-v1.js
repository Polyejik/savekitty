(()=>{
  const $=id=>document.getElementById(id);
  let installed=false;

  const css=`
    #hintPanel{display:block!important;grid-template-columns:1fr!important;padding:10px!important;background:linear-gradient(180deg,#fff8e8,#fff1cf)!important;border:1px solid #e2bf78!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important}
    #hintPanel[hidden]{display:none!important}
    #hintPanel .hintArtWrap,#hintPanel .storyTop,#hintPanel #visual,#hintPanel #timesBtn{display:none!important}
    #hintPanel .hintCopy{display:block!important}
    #timesTable{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important}
    #timesTable[hidden]{display:grid!important}
    #timesTable:before{content:attr(data-title);grid-column:1/-1;display:block;text-align:center;font:950 16px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#5c3d28;margin:0 0 2px;padding:4px 8px}
    #timesTable .timesFact{display:flex!important;align-items:center!important;justify-content:center!important;min-height:36px!important;padding:6px 8px!important;border:1px solid #dfc18a!important;border-bottom-width:3px!important;border-radius:10px!important;background:linear-gradient(#fffdf7,#f7e9cc)!important;color:#513823!important;font:900 16px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;box-sizing:border-box!important}
    #timesTable .timesFact.hit{background:linear-gradient(#fff0a8,#ffd65a)!important;border-color:#d79a24!important;color:#402b18!important;box-shadow:0 0 0 2px rgba(255,213,74,.26)!important}
    #timesTable .timesFact.hit:before{content:'🐾';margin-right:6px;font-size:14px}
    #hint.hintToggleOn{background:#6b8f3e!important;color:#fff!important}
    @media(max-width:430px){
      #hintPanel{padding:8px!important}
      #timesTable{gap:5px!important}
      #timesTable .timesFact{min-height:34px!important;font-size:14px!important;padding:5px 6px!important}
      #timesTable:before{font-size:15px!important}
    }
  `;

  function lang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function getNumbers(){
    const q=($('question')?.textContent||'').match(/\d+/g)?.map(Number)||[];
    let d=q[0]||Number(($('divisor')?.textContent||'').replace(/\D/g,''))||1;
    let current=q[1]||0;
    if(!current)current=d;
    return {d,current};
  }
  function render(){
    const panel=$('hintPanel'),box=$('timesTable'),btn=$('hint');
    if(!panel||!box||!btn)return;
    const {d,current}=getNumbers();
    const hit=Math.max(1,Math.min(10,current?Math.floor(current/d):1));
    box.hidden=false;
    box.dataset.title=lang()==='ru'?`🐾 Таблица на ${d}`:`🐾 ${d} times table`;
    box.innerHTML='';
    for(let i=1;i<=10;i++){
      const el=document.createElement('div');
      el.className='timesFact'+(i===hit?' hit':'');
      el.textContent=`${d} × ${i} = ${d*i}`;
      box.appendChild(el);
    }
    const opened=!panel.hidden;
    btn.textContent=opened?(lang()==='ru'?'🙈 Скрыть таблицу':'🙈 Hide table'):(lang()==='ru'?`🐾 Таблица × ${d}`:`🐾 Table × ${d}`);
    btn.setAttribute('aria-expanded',String(opened));
  }
  function install(){
    if(installed)return;
    const panel=$('hintPanel'),btn=$('hint');
    if(!panel||!btn)return;
    installed=true;
    const st=document.createElement('style');st.id='hint-ui-v1-style';st.textContent=css;document.head.appendChild(st);
    const oldTimes=$('timesBtn');if(oldTimes)oldTimes.tabIndex=-1;
    btn.addEventListener('click',()=>requestAnimationFrame(render));
    const panelObs=new MutationObserver(()=>requestAnimationFrame(render));
    panelObs.observe(panel,{attributes:true,attributeFilter:['hidden']});
    const question=$('question');
    if(question){const qObs=new MutationObserver(()=>requestAnimationFrame(render));qObs.observe(question,{childList:true,subtree:true,characterData:true});}
    document.querySelectorAll('.langBtn').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(render)));
    render();
  }
  document.addEventListener('DOMContentLoaded',install);
})();