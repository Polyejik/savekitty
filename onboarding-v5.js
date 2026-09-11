(()=>{
  const $=id=>document.getElementById(id);
  const SESSION_KEY='savekitty_onboarding_done_v5';
  let step=0;
  let tutorialLang='ru';
  let bypassStart=false;
  let installed=false;
  let tutorialDone=false;

  const slides={
    ru:[
      {
        phase:'intro',
        title:'Привет!',
        coach:'Привет{name}! Я так рад, что ты пришёл! 😻',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'intro',
        title:'Надо открыть замки',
        coach:'Смотри, сколько тут замков. Надо открыть их все и выпустить меня из клетки. Поможешь? 🐾',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'intro',
        title:'Я знаю секрет',
        coach:'Я знаю секрет, как их открыть! Сейчас покажу. Представим миски и сочные котлетки — так деление становится совсем понятным. 🥣🍖',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'lesson',
        title:'Сначала делим',
        coach:'Представь: в одну миску помещается 4 сочные котлетки. У нас 8 котлеток. Сколько получится полных мисок? Две! Поэтому пишем 2 в ответ. 🥣',
        q:'2', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:'d8'
      },
      {
        phase:'lesson',
        title:'Вычитаем',
        coach:'Две полные миски — это 2 × 4 = 8 котлеток. Мы разложили все 8 по мискам, поэтому здесь осталось 0.',
        q:'2', showSub1:true, showRem:true, showDown:false, showSub2:false, focus:'p8'
      },
      {
        phase:'lesson',
        title:'Сносим следующую цифру',
        coach:'Теперь сносим следующую цифру — 4 — вниз. Это как будто нам принесли ещё 4 котлетки. Снова смотрим, сколько полных мисок можно наполнить. ⬇️',
        q:'2', showSub1:true, showRem:false, showDown:true, showSub2:false, focus:'d4'
      },
      {
        phase:'lesson',
        title:'Готово!',
        coach:'4 котлетки заполняют одну миску, поэтому пишем 1 рядом с 2. Итого у нас было 84 котлетки, и мы разложили их все по мисочкам по 4 — получилось 21 полная мисочка. Ничего не осталось! 🐾',
        q:'21', showSub1:true, showRem:false, showDown:true, showSub2:true, focus:'q1'
      }
    ],
    en:[
      {
        phase:'intro',
        title:'Hi!',
        coach:'Hi{name}! I’m so happy you came! 😻',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'intro',
        title:'We need to open the locks',
        coach:'Look at all these locks. We need to open every one and get me out of the cage. Will you help me? 🐾',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'intro',
        title:'I know the secret',
        coach:'I know the secret to opening them! I’ll show you now. Let’s imagine little bowls and tasty meatballs — division becomes much easier that way. 🥣🍖',
        q:'', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:''
      },
      {
        phase:'lesson',
        title:'Start by dividing',
        coach:'Imagine one bowl holds 4 tasty meatballs. We have 8 meatballs. How many full bowls can we make? Two! So we write 2 in the answer. 🥣',
        q:'2', showSub1:false, showRem:false, showDown:false, showSub2:false, focus:'d8'
      },
      {
        phase:'lesson',
        title:'Subtract',
        coach:'Two full bowls means 2 × 4 = 8 meatballs. We put all 8 into bowls, so 0 is left here.',
        q:'2', showSub1:true, showRem:true, showDown:false, showSub2:false, focus:'p8'
      },
      {
        phase:'lesson',
        title:'Bring down the next digit',
        coach:'Now bring the next digit — 4 — down. It is like 4 more meatballs arrived. Again, we ask how many full bowls we can fill. ⬇️',
        q:'2', showSub1:true, showRem:false, showDown:true, showSub2:false, focus:'d4'
      },
      {
        phase:'lesson',
        title:'Done!',
        coach:'4 meatballs fill one bowl, so we write 1 next to 2. Altogether we had 84 meatballs, and we put every one into bowls of 4 — that makes 21 full bowls. Nothing is left! 🐾',
        q:'21', showSub1:true, showRem:false, showDown:true, showSub2:true, focus:'q1'
      }
    ]
  };

  const css=`
    .pk2{position:fixed;inset:0;z-index:11000;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(24,14,9,.94);backdrop-filter:blur(4px)}
    .pk2.show{display:flex}
    .pk2-card{width:min(560px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#fff4d6;color:#3f2d21;border:2px solid #d6a758;border-radius:24px;padding:16px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.48)}
    .pk2-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .pk2-badge{font-size:13px;font-weight:950;color:#2e75a6;background:#e5f3ff;border-radius:999px;padding:6px 12px}
    .pk2-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .pk2-count{font-size:13px;font-weight:900;color:#80664c;min-width:38px;text-align:right}
    .pk2-lang{display:flex;background:#eee3d3;border-radius:999px;padding:2px;gap:2px}
    .pk2-lang button{border:0;background:transparent;border-radius:999px;padding:5px 8px;font:900 11px/1 system-ui;color:#745a42}
    .pk2-lang button.on{background:#75aa45;color:#fff}
    .pk2-title{font-size:24px;font-weight:950;line-height:1.1;margin:0 0 10px}
    .pk2-coach{display:grid;grid-template-columns:72px minmax(0,1fr);gap:12px;align-items:center;margin-bottom:12px}
    .pk2-avatarWrap{width:72px;height:72px;border-radius:50%;padding:4px;background:linear-gradient(#ffe3a7,#efbc54);box-shadow:0 5px 14px rgba(84,53,20,.18);box-sizing:border-box}
    .pk2-avatar{width:100%;height:100%;display:block;border-radius:50%;object-fit:contain;border:3px solid #fff4d7;background:#fff8e8;box-sizing:border-box}
    .pk2-bubble{position:relative;background:#fffaf0;border:2px solid #e1c38b;border-radius:18px;padding:11px 13px;font-size:15px;line-height:1.34;font-weight:820;color:#4a392e;min-height:72px;display:flex;align-items:center;box-sizing:border-box}
    .pk2-bubble:before{content:'';position:absolute;left:-11px;top:24px;border-width:11px 11px 11px 0;border-style:solid;border-color:transparent #e1c38b transparent transparent}
    .pk2-bubble:after{content:'';position:absolute;left:-8px;top:25px;border-width:10px 10px 10px 0;border-style:solid;border-color:transparent #fffaf0 transparent transparent}
    .pk2-card.pk2-intro .pk2-coach{grid-template-columns:94px minmax(0,1fr);margin:18px 0 20px}
    .pk2-card.pk2-intro .pk2-avatarWrap{width:94px;height:94px}
    .pk2-card.pk2-intro .pk2-bubble{font-size:18px;min-height:92px}
    .pk2-card.pk2-intro .pk2-board{display:none}
    .pk2-board{height:220px;background:#fffaf0;border:1px solid #e5ce9c;border-radius:17px;margin-bottom:14px;overflow:hidden;background-image:linear-gradient(rgba(82,147,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(82,147,190,.08) 1px,transparent 1px);background-size:28px 28px;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
    .pk2-math{--cw:48px;--rh:42px;display:grid;grid-template-columns:auto 126px;align-items:start;font:900 30px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#352820}
    .pk2-left{display:grid;grid-template-rows:repeat(4,var(--rh));padding-top:2px}
    .pk2-row{display:grid;grid-template-columns:24px repeat(2,var(--cw));height:var(--rh);align-items:center}
    .pk2-sign,.pk2-cell{height:var(--rh);display:flex;align-items:center;justify-content:center;position:relative}
    .pk2-sign{font-size:24px;font-weight:800}.pk2-cell{font-size:30px}
    .pk2-cell.line:after{content:'';position:absolute;left:5px;right:5px;bottom:1px;height:3px;background:#3a3734;border-radius:3px}
    .pk2-cell.blue{color:#2f7fb3}.pk2-focus{background:#fff0b6;outline:3px solid #efb132;border-radius:7px}
    .pk2-down4{color:#2f7fb3;animation:pk2down .8s ease-in-out infinite alternate}
    .pk2-down4:before{content:'↓';position:absolute;top:-24px;font-size:22px;color:#2f7fb3}
    .pk2-right{border-left:5px solid #283740;display:grid;grid-template-rows:var(--rh) var(--rh);min-height:calc(var(--rh)*2);padding-left:12px}
    .pk2-divisor{height:var(--rh);display:flex;align-items:center;border-bottom:5px solid #283740;padding-left:4px;font-size:30px}
    .pk2-quotient{height:var(--rh);display:flex;align-items:center;padding-left:4px;color:#609a36;letter-spacing:8px;font-size:30px;white-space:pre}
    .pk2-next{width:100%;height:52px;border:0;border-radius:14px;background:linear-gradient(#8cc64a,#5aa02f);color:#fff;font:950 19px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 0 #3f7922;touch-action:manipulation}
    .pk2-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7922}
    @keyframes pk2down{from{transform:translateY(-3px)}to{transform:translateY(5px)}}
    @media(max-width:430px){
      .pk2{padding:8px}.pk2-card{padding:12px;border-radius:18px}.pk2-top{margin-bottom:9px}.pk2-title{font-size:20px;margin-bottom:8px}
      .pk2-coach{grid-template-columns:56px minmax(0,1fr);gap:9px;margin-bottom:10px}.pk2-avatarWrap{width:56px;height:56px;padding:3px}
      .pk2-bubble{padding:9px 10px;font-size:13px;border-radius:14px;min-height:58px}.pk2-bubble:before{left:-9px;top:17px;border-width:9px 9px 9px 0}.pk2-bubble:after{left:-6px;top:18px;border-width:8px 8px 8px 0}
      .pk2-card.pk2-intro .pk2-coach{grid-template-columns:72px minmax(0,1fr);margin:14px 0 18px}.pk2-card.pk2-intro .pk2-avatarWrap{width:72px;height:72px}.pk2-card.pk2-intro .pk2-bubble{font-size:15px;min-height:76px}
      .pk2-board{height:182px;margin-bottom:11px;padding:10px}.pk2-math{--cw:42px;--rh:36px;grid-template-columns:auto 108px;font-size:26px}.pk2-row{grid-template-columns:20px repeat(2,var(--cw))}
      .pk2-sign{font-size:21px}.pk2-cell{font-size:26px}.pk2-right{border-left-width:4px;padding-left:10px}.pk2-divisor{font-size:26px;border-bottom-width:4px}.pk2-quotient{font-size:26px;letter-spacing:6px}.pk2-down4:before{top:-20px;font-size:18px}
      .pk2-next{height:50px;font-size:18px}
    }
  `;

  function addStyle(){if($('pk2-style'))return;const s=document.createElement('style');s.id='pk2-style';s.textContent=css;document.head.appendChild(s)}
  function pageLang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function setPageLang(l){const btn=document.querySelector(`.langBtn[data-lang="${l}"]`);if(btn&&!btn.classList.contains('active'))btn.click()}
  function getNameCatSrc(){return document.querySelector('.nameCatImg')?.src||document.querySelector('.nameCat img')?.src||'pushok_hq.jpg?v=6'}

  function phaseIndex(slideIndex,lang){
    const a=slides[lang], phase=a[slideIndex].phase;
    const same=a.map((s,i)=>({s,i})).filter(x=>x.s.phase===phase);
    return {pos:same.findIndex(x=>x.i===slideIndex)+1,total:same.length,phase};
  }

  function ensureModal(){
    let w=$('pk2');
    if(w)return w;
    w=document.createElement('div');w.id='pk2';w.className='pk2';w.setAttribute('aria-hidden','true');
    w.innerHTML=`<div class="pk2-card" role="dialog" aria-modal="true">
      <div class="pk2-top"><div class="pk2-badge" id="pk2-badge"></div><div class="pk2-tools"><div class="pk2-count" id="pk2-count"></div><div class="pk2-lang"><button id="pk2-ru" type="button">RU</button><button id="pk2-en" type="button">EN</button></div></div></div>
      <div class="pk2-title" id="pk2-title"></div>
      <div class="pk2-coach"><div class="pk2-avatarWrap"><img class="pk2-avatar" id="pk2-avatar" alt="Pushok"></div><div class="pk2-bubble" id="pk2-coach"></div></div>
      <div class="pk2-board"><div class="pk2-math">
        <div class="pk2-left">
          <div class="pk2-row"><div class="pk2-sign"></div><div class="pk2-cell" id="pk2-d8">8</div><div class="pk2-cell" id="pk2-d4">4</div></div>
          <div class="pk2-row"><div class="pk2-sign" id="pk2-minus1">−</div><div class="pk2-cell line" id="pk2-p8">8</div><div class="pk2-cell"></div></div>
          <div class="pk2-row"><div class="pk2-sign"></div><div class="pk2-cell blue" id="pk2-rem0">0</div><div class="pk2-cell blue pk2-down4" id="pk2-down4">4</div></div>
          <div class="pk2-row"><div class="pk2-sign" id="pk2-minus2">−</div><div class="pk2-cell"></div><div class="pk2-cell line" id="pk2-p4">4</div></div>
        </div>
        <div class="pk2-right"><div class="pk2-divisor">4</div><div class="pk2-quotient" id="pk2-q"></div></div>
      </div></div>
      <button class="pk2-next" id="pk2-next" type="button"></button>
    </div>`;
    document.body.appendChild(w);
    $('pk2-ru').addEventListener('click',()=>{tutorialLang='ru';step=0;render()});
    $('pk2-en').addEventListener('click',()=>{tutorialLang='en';step=0;render()});
    $('pk2-next').addEventListener('click',()=>{const a=slides[tutorialLang];if(step<a.length-1){step++;render();return}finish()});
    return w;
  }

  function setVisible(id,on){const el=$(id);if(el)el.style.visibility=on?'visible':'hidden'}
  function clearFocus(){document.querySelectorAll('#pk2 .pk2-focus').forEach(el=>el.classList.remove('pk2-focus'))}

  function render(){
    const a=slides[tutorialLang],s=a[step],meta=phaseIndex(step,tutorialLang);
    const card=document.querySelector('#pk2 .pk2-card');
    card?.classList.toggle('pk2-intro',s.phase==='intro');
    $('pk2-badge').textContent=s.phase==='intro'?(tutorialLang==='ru'?'Пушок рядом':'Pushok is here'):(tutorialLang==='ru'?'Пробный пример':'Practice example');
    $('pk2-count').textContent=`${meta.pos} / ${meta.total}`;
    $('pk2-title').textContent=s.title;
    const player=($('playerName')?.value||'').trim();
    const name=player?(tutorialLang==='ru'?`, ${player}`:` ${player}`):'';
    $('pk2-coach').textContent=s.coach.replace('{name}',name);
    $('pk2-q').textContent=s.q;
    $('pk2-avatar').src=getNameCatSrc();
    setVisible('pk2-minus1',s.showSub1);setVisible('pk2-p8',s.showSub1);setVisible('pk2-rem0',s.showRem);setVisible('pk2-down4',s.showDown);setVisible('pk2-minus2',s.showSub2);setVisible('pk2-p4',s.showSub2);
    clearFocus();
    if(s.focus==='d8')$('pk2-d8').classList.add('pk2-focus');
    if(s.focus==='d4')$('pk2-d4').classList.add('pk2-focus');
    if(s.focus==='p8')$('pk2-p8').classList.add('pk2-focus');
    if(s.focus==='q1')$('pk2-q').classList.add('pk2-focus');
    $('pk2-ru').classList.toggle('on',tutorialLang==='ru');$('pk2-en').classList.toggle('on',tutorialLang==='en');
    const last=step===a.length-1;
    $('pk2-next').textContent=last?(tutorialLang==='ru'?'Начать игру':'Start game'):(tutorialLang==='ru'?'Дальше':'Next');
  }

  function show(){tutorialLang=pageLang();step=0;const w=ensureModal();render();w.classList.add('show');w.setAttribute('aria-hidden','false');document.activeElement?.blur?.()}
  function finish(){
    const w=$('pk2');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}
    tutorialDone=true;
    try{sessionStorage.setItem(SESSION_KEY,'1')}catch(e){}
    setPageLang(tutorialLang);
    bypassStart=true;
    requestAnimationFrame(()=>{const b=$('nameStart');if(b)b.click();setTimeout(()=>{bypassStart=false},0)});
  }

  function install(){
    if(installed)return;
    const btn=$('nameStart'),input=$('playerName');
    if(!btn||!input)return;
    installed=true;
    try{tutorialDone=sessionStorage.getItem(SESSION_KEY)==='1'}catch(e){}
    btn.addEventListener('click',e=>{if(bypassStart||tutorialDone)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
    input.addEventListener('keydown',e=>{if(e.key!=='Enter'||bypassStart||tutorialDone)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
  }

  document.addEventListener('DOMContentLoaded',()=>{addStyle();install()});
})();
