(()=>{
  const q=s=>document.querySelector(s);
  const css=`
    .sk-end-wrap{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(540px,calc(100% - 8px));margin:10px auto 0}
    .sk-end-btn{min-height:48px;border:0;border-radius:14px;font:900 14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
    .sk-end-btn.primary{background:#f4bd45;color:#3b2b1d}.sk-end-btn.secondary{background:#24364b;color:#fff}
    #sk-thanks{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:#101821;color:#fff;text-align:center}
    #sk-thanks.show{display:flex}
    #sk-thanks .card{position:relative;width:min(980px,100%);max-height:94dvh;border-radius:22px;overflow:hidden;background:#0f1822;box-shadow:0 24px 70px rgba(0,0,0,.42)}
    #sk-thanks .family-art{display:block;width:100%;height:auto;max-height:88dvh;object-fit:contain;background:#0f1822}
    #sk-thanks .back{position:absolute;right:14px;bottom:14px;min-width:110px;min-height:44px;border:0;border-radius:14px;background:rgba(20,31,43,.86);color:#fff;font:850 14px system-ui;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
    @media(max-width:430px){.sk-end-wrap{gap:8px}.sk-end-btn{min-height:46px;font-size:13px}#sk-thanks{padding:0}#sk-thanks .card{width:100%;max-height:100dvh;border-radius:0}#sk-thanks .family-art{width:100%;height:100dvh;object-fit:contain}#sk-thanks .back{right:10px;bottom:calc(10px + env(safe-area-inset-bottom))}}
  `;
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
  function isRestart(x){return /новая игра|сыграть|ещё раз|new game|play again/i.test(x.textContent||'')}
  function lang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function ensureThanks(){
    if(q('#sk-thanks'))return;
    const el=document.createElement('div');el.id='sk-thanks';
    el.innerHTML=`<div class="card"><img class="family-art" src="family-end.jpg?v=1" alt="Спасибо, что играли с нами!"><button class="back"></button></div>`;
    document.body.appendChild(el);
    const update=()=>{const en=lang()==='en';el.querySelector('.back').textContent=en?'Back':'Назад';el.querySelector('.family-art').alt=en?'Thank you for playing with us!':'Спасибо, что играли с нами!'};
    update();
    el.querySelector('.back').onclick=()=>{el.classList.remove('show');update()};
  }
  function mount(){
    const f=q('#finish');if(!f||!visible(f))return;
    ensureThanks();
    let wrap=q('#sk-end-wrap');
    if(wrap)return;
    const rb=[...f.querySelectorAll('button,a')].find(isRestart);
    if(!rb)return;
    wrap=document.createElement('div');wrap.id='sk-end-wrap';wrap.className='sk-end-wrap';
    const clone=rb.cloneNode(true);clone.classList.add('sk-end-btn','primary');clone.removeAttribute('id');
    const end=document.createElement('button');end.type='button';end.className='sk-end-btn secondary';end.textContent=lang()==='en'?'End':'Конец';
    end.onclick=()=>{ensureThanks();q('#sk-thanks').classList.add('show')};
    clone.onclick=e=>{e.preventDefault();rb.click()};
    rb.style.display='none';
    wrap.append(clone,end);rb.parentNode.insertBefore(wrap,rb);
  }
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  addEventListener('DOMContentLoaded',()=>{ensureThanks();setInterval(mount,500)});
})();