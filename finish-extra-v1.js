(()=>{
  const q=s=>document.querySelector(s);
  const css=`
    .sk-end-wrap{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(540px,calc(100% - 8px));margin:10px auto 0}
    .sk-end-btn{min-height:48px;border:0;border-radius:14px;font:900 14px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
    .sk-end-btn.primary{background:#f4bd45;color:#3b2b1d}.sk-end-btn.secondary{background:#24364b;color:#fff}
    #sk-thanks{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:radial-gradient(circle at 50% 15%,#27384d 0,#172333 38%,#0e1620 100%);color:#fff;text-align:center}
    #sk-thanks.show{display:flex}
    #sk-thanks .card{width:min(720px,100%);padding:26px 20px;border:1px solid rgba(255,255,255,.15);border-radius:24px;background:rgba(13,20,29,.78);box-shadow:0 20px 60px rgba(0,0,0,.35);backdrop-filter:blur(8px)}
    #sk-thanks h2{margin:0 0 10px;font:950 clamp(28px,7vw,48px)/1.05 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#ffe6a5}
    #sk-thanks p{margin:0;font:800 clamp(18px,4.8vw,26px)/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #sk-thanks .photo-slot{margin:18px auto 0;width:min(520px,100%);aspect-ratio:16/9;border:1.5px dashed rgba(255,230,165,.45);border-radius:18px;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;color:#d9caa8;font:700 14px/1.35 system-ui;background:rgba(255,255,255,.03)}
    #sk-thanks .back{margin-top:18px;min-width:190px;min-height:48px;border:0;border-radius:14px;background:#f4bd45;color:#3b2b1d;font:900 15px system-ui}
    @media(max-width:430px){.sk-end-wrap{gap:8px}.sk-end-btn{min-height:46px;font-size:13px}#sk-thanks{padding:12px}#sk-thanks .card{padding:22px 14px}}
  `;
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'}
  function isRestart(x){return /новая игра|сыграть|ещё раз|new game|play again/i.test(x.textContent||'')}
  function lang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function ensureThanks(){
    if(q('#sk-thanks'))return;
    const el=document.createElement('div');el.id='sk-thanks';
    el.innerHTML=`<div class="card"><h2></h2><p></p><div class="photo-slot"></div><button class="back"></button></div>`;
    document.body.appendChild(el);
    const update=()=>{const en=lang()==='en';el.querySelector('h2').textContent=en?'Thank you for playing with us!':'Спасибо, что играли с нами!';el.querySelector('p').textContent=en?'Dad, Herman and Lev':'Папа, Герман и Лев';el.querySelector('.photo-slot').textContent=en?'Family photo in the game style will be added here later':'Здесь позже будет ваше семейное фото в стиле игры';el.querySelector('.back').textContent=en?'Back':'Назад'};
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