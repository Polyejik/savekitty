(()=>{
  let scheduled=false;

  const css=`
    .pk2-actions{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
    .pk2-skip{height:52px;border:1px solid #d8bf91;border-radius:14px;background:#fffaf0;color:#80664c;padding:0 16px;font:900 14px/1 system-ui,-apple-system,sans-serif;box-shadow:0 2px 0 #e3cfaa;white-space:nowrap;touch-action:manipulation}
    .pk2-skip:active{transform:translateY(1px);box-shadow:0 1px 0 #e3cfaa}
    @media(max-width:430px){.pk2-actions{grid-template-columns:1fr;gap:8px}.pk2-skip{height:42px;font-size:13px;order:2}.pk2-next{order:1}}
  `;

  function lang(){
    return document.getElementById('pk2-en')?.classList.contains('on')?'en':'ru';
  }

  function label(){
    return lang()==='en'?'Skip tutorial':'Пропустить обучение';
  }

  function finishThroughExistingFlow(){
    const next=document.getElementById('pk2-next');
    const modal=document.getElementById('pk2');
    if(!next||!modal)return;
    // Use the onboarding module's own tested Next/finish path so its
    // session flag, language sync and real game start stay intact.
    for(let i=0;i<16 && modal.classList.contains('show');i++) next.click();
  }

  function enhance(){
    scheduled=false;
    const modal=document.getElementById('pk2');
    const next=document.getElementById('pk2-next');
    if(!modal||!next)return;

    let style=document.getElementById('pk2-skip-style');
    if(!style){style=document.createElement('style');style.id='pk2-skip-style';style.textContent=css;document.head.appendChild(style)}

    if(document.getElementById('pk2-skip'))return;
    const actions=document.createElement('div');
    actions.className='pk2-actions';
    next.parentNode.insertBefore(actions,next);
    actions.appendChild(next);

    const skip=document.createElement('button');
    skip.id='pk2-skip';
    skip.className='pk2-skip';
    skip.type='button';
    skip.textContent=label();
    skip.addEventListener('click',finishThroughExistingFlow);
    actions.appendChild(skip);

    document.getElementById('pk2-ru')?.addEventListener('click',()=>{skip.textContent='Пропустить обучение'});
    document.getElementById('pk2-en')?.addEventListener('click',()=>{skip.textContent='Skip tutorial'});
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
  document.addEventListener('DOMContentLoaded',()=>{
    schedule();
    const observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'&&x.addedNodes.length))schedule()});
    observer.observe(document.body,{childList:true,subtree:true});
  });
})();
