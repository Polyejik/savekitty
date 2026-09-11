(()=>{
  const $=id=>document.getElementById(id);
  let installed=false;
  let bypass=false;
  let open=false;
  let step=0;

  const copy={
    ru:[
      {title:'Привет! 🐾', text:'Привет{name}! Я так рад, что ты пришёл! 😻'},
      {title:'Мне нужна твоя помощь 🔒', text:'Смотри, сколько тут замков! Надо открыть их все и выпустить меня из клетки. Поможешь? 🥹🐾'},
      {title:'Я знаю секрет! ✨', text:'Чтобы открыть замки, нужно делить уголком. Не пугайся — сейчас покажу на мисках и котлетках. Это легко! 🥣🍖'}
    ],
    en:[
      {title:'Hi! 🐾', text:'Hi{name}! I’m so happy you came! 😻'},
      {title:'I need your help 🔒', text:'Look at all these locks! We need to open every one and get me out of the cage. Will you help me? 🥹🐾'},
      {title:'I know a secret! ✨', text:'To open the locks, we need long division. Don’t worry — I’ll show you with bowls and tasty meatballs. It’s easy! 🥣🍖'}
    ]
  };

  const css=`
    .pi{position:fixed;inset:0;z-index:11000;display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(24,14,9,.94);backdrop-filter:blur(5px)}
    .pi.show{display:flex}
    .pi-card{width:min(480px,100%);background:#fff4d6;border:2px solid #d6a758;border-radius:24px;padding:18px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.48);color:#412f22}
    .pi-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .pi-badge{font:950 13px/1 system-ui;color:#2e75a6;background:#e5f3ff;border-radius:999px;padding:7px 12px}
    .pi-dots{display:flex;gap:6px}.pi-dot{width:8px;height:8px;border-radius:50%;background:#dcc9a9}.pi-dot.on{background:#75aa45;transform:scale(1.18)}
    .pi-title{font:950 26px/1.08 system-ui;margin:0 0 16px}
    .pi-talk{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;align-items:center;margin-bottom:18px}
    .pi-avatarWrap{width:96px;height:96px;border-radius:50%;padding:4px;background:linear-gradient(#ffe3a7,#efbc54);box-shadow:0 5px 14px rgba(84,53,20,.18);box-sizing:border-box}
    .pi-avatar{display:block;width:100%;height:100%;object-fit:contain;border-radius:50%;border:3px solid #fff4d7;background:#fff8e8;box-sizing:border-box}
    .pi-bubble{position:relative;background:#fffaf0;border:2px solid #e1c38b;border-radius:18px;padding:14px 15px;font:850 18px/1.35 system-ui;color:#4a392e;min-height:92px;display:flex;align-items:center;box-sizing:border-box}
    .pi-bubble:before{content:'';position:absolute;left:-12px;top:30px;border-width:12px 12px 12px 0;border-style:solid;border-color:transparent #e1c38b transparent transparent}
    .pi-bubble:after{content:'';position:absolute;left:-9px;top:31px;border-width:11px 11px 11px 0;border-style:solid;border-color:transparent #fffaf0 transparent transparent}
    .pi-next{width:100%;height:54px;border:0;border-radius:14px;background:linear-gradient(#8cc64a,#5aa02f);color:#fff;font:950 19px/1 system-ui;box-shadow:0 4px 0 #3f7922;touch-action:manipulation}
    .pi-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7922}
    @media(max-width:430px){
      .pi{padding:9px}.pi-card{padding:14px;border-radius:19px}.pi-title{font-size:21px;margin-bottom:12px}
      .pi-talk{grid-template-columns:72px minmax(0,1fr);gap:10px;margin-bottom:15px}.pi-avatarWrap{width:72px;height:72px}
      .pi-bubble{padding:11px 12px;font-size:15px;min-height:76px;border-radius:15px}.pi-bubble:before{left:-10px;top:23px;border-width:10px 10px 10px 0}.pi-bubble:after{left:-7px;top:24px;border-width:9px 9px 9px 0}
      .pi-next{height:50px;font-size:18px}
    }
  `;

  function lang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function avatar(){return document.querySelector('.nameCatImg')?.src||document.querySelector('.nameCat img')?.src||'pushok_hq.jpg?v=6'}
  function player(){return ($('playerName')?.value||'').trim()}

  function ensure(){
    let w=$('pushok-intro');
    if(w)return w;
    const st=document.createElement('style');st.id='pushok-intro-style';st.textContent=css;document.head.appendChild(st);
    w=document.createElement('div');w.id='pushok-intro';w.className='pi';w.setAttribute('aria-hidden','true');
    w.innerHTML=`<div class="pi-card" role="dialog" aria-modal="true">
      <div class="pi-top"><div class="pi-badge" id="pi-badge"></div><div class="pi-dots" id="pi-dots"></div></div>
      <div class="pi-title" id="pi-title"></div>
      <div class="pi-talk"><div class="pi-avatarWrap"><img class="pi-avatar" id="pi-avatar" alt="Pushok"></div><div class="pi-bubble" id="pi-text"></div></div>
      <button class="pi-next" id="pi-next" type="button"></button>
    </div>`;
    document.body.appendChild(w);
    $('pi-next').addEventListener('click',()=>{
      const a=copy[lang()];
      if(step<a.length-1){step++;render();return}
      finish();
    });
    return w;
  }

  function render(){
    const l=lang(),a=copy[l],s=a[step];
    $('pi-badge').textContent=l==='ru'?'Пушок рассказывает 🐾':'Pushok says 🐾';
    $('pi-title').textContent=s.title;
    const name=player();
    const insert=name?(l==='ru'?`, ${name}`:` ${name}`):'';
    $('pi-text').textContent=s.text.replace('{name}',insert);
    $('pi-avatar').src=avatar();
    $('pi-dots').innerHTML=a.map((_,i)=>`<span class="pi-dot${i===step?' on':''}"></span>`).join('');
    $('pi-next').textContent=step===a.length-1?(l==='ru'?'Показывай секрет! ✨':'Show me the secret! ✨'):(l==='ru'?'Дальше 🐾':'Next 🐾');
  }

  function show(){step=0;open=true;const w=ensure();render();w.classList.add('show');w.setAttribute('aria-hidden','false');document.activeElement?.blur?.()}
  function finish(){
    const w=$('pushok-intro');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}
    open=false;bypass=true;
    requestAnimationFrame(()=>{$('nameStart')?.click();bypass=false});
  }

  function install(){
    if(installed)return;
    const btn=$('nameStart'),input=$('playerName');
    if(!btn||!input)return;
    installed=true;
    btn.addEventListener('click',e=>{if(bypass||open)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
    input.addEventListener('keydown',e=>{if(e.key!=='Enter'||bypass||open)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
  }

  document.addEventListener('DOMContentLoaded',install);
})();