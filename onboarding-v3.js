(()=>{
  const $=id=>document.getElementById(id);
  let step=0;
  let tutorialLang='ru';
  let bypassStart=false;
  let installed=false;
  let tutorialDone=false;

  const slides={
    ru:[
      {
        title:'Пробный пример: 84 ÷ 4',
        coach:'Привет! Я Пушок. Сначала смотрим только на первую цифру: сколько раз 4 помещается в 8? Верно, 2 раза — пишем 2 в ответ.',
        text:'Берём первую цифру слева и ищем, сколько раз делитель помещается внутри неё.',
        q:'2', sub1:'', rem:'', down:'', sub2:'', focus:'8'
      },
      {
        title:'Вычитаем',
        coach:'Теперь проверяем ответ: 2 × 4 = 8. Записываем 8 под 8 и вычитаем. Получается остаток 0.',
        text:'То, что поместилось, всегда записываем под числом и вычитаем.',
        q:'2', sub1:'− 8', rem:'0', down:'', sub2:'', focus:''
      },
      {
        title:'Сносим цифру',
        coach:'Вот что значит «снести цифру»: берём следующую цифру справа — 4 — и аккуратно опускаем её вниз. Теперь делим уже число 4.',
        text:'Если сверху ещё остались цифры, сносим следующую вниз и продолжаем деление.',
        q:'2', sub1:'− 8', rem:'0', down:'↓ 4', sub2:'', focus:'4'
      },
      {
        title:'Получаем ответ 21',
        coach:'Последний шаг: 4 помещается в 4 один раз. Пишем 1 рядом с 2. Готово — ответ 21. Теперь можно начинать игру!',
        text:'Когда все цифры разобрали, пример решён.',
        q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''
      }
    ],
    en:[
      {
        title:'Practice example: 84 ÷ 4',
        coach:'Hi! I’m Pushok. First, look only at the first digit: how many times does 4 fit into 8? Right — 2 times, so we write 2 in the answer.',
        text:'Start with the first digit on the left and see how many times the divisor fits into it.',
        q:'2', sub1:'', rem:'', down:'', sub2:'', focus:'8'
      },
      {
        title:'Subtract',
        coach:'Now we check: 2 × 4 = 8. Write 8 under 8 and subtract. The remainder is 0.',
        text:'What fits is written underneath and then subtracted.',
        q:'2', sub1:'− 8', rem:'0', down:'', sub2:'', focus:''
      },
      {
        title:'Bring down the next digit',
        coach:'This is what “bring down” means: take the next digit on the right — 4 — and move it down. Now we divide 4.',
        text:'If there are more digits left above, bring the next one down and continue.',
        q:'2', sub1:'− 8', rem:'0', down:'↓ 4', sub2:'', focus:'4'
      },
      {
        title:'The answer is 21',
        coach:'Final step: 4 fits into 4 one time. Write 1 next to 2. Done — the answer is 21. Now the game can begin!',
        text:'When all digits are used, the problem is solved.',
        q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''
      }
    ]
  };

  const css=`
    .pk2{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(24,14,9,.94);backdrop-filter:blur(4px)}
    .pk2.show{display:flex}
    .pk2-card{width:min(560px,100%);max-height:calc(100dvh - 28px);overflow:auto;background:#fff4d6;color:#3f2d21;border:2px solid #d6a758;border-radius:24px;padding:16px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.48)}
    .pk2-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .pk2-badge{font-size:13px;font-weight:950;color:#2e75a6;background:#e5f3ff;border-radius:999px;padding:6px 12px}
    .pk2-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .pk2-count{font-size:13px;font-weight:900;color:#80664c}
    .pk2-lang{display:flex;background:#eee3d3;border-radius:999px;padding:2px;gap:2px}
    .pk2-lang button{border:0;background:transparent;border-radius:999px;padding:5px 8px;font:900 11px/1 system-ui;color:#745a42}
    .pk2-lang button.on{background:#75aa45;color:#fff}
    .pk2-title{font-size:24px;font-weight:950;line-height:1.1;margin:0 0 10px}
    .pk2-coach{display:grid;grid-template-columns:76px minmax(0,1fr);gap:12px;align-items:center;margin-bottom:12px}
    .pk2-avatarWrap{width:76px;height:76px;border-radius:50%;padding:4px;background:linear-gradient(#ffe3a7,#efbc54);box-shadow:0 6px 14px rgba(84,53,20,.18)}
    .pk2-avatar{width:100%;height:100%;display:block;border-radius:50%;object-fit:cover;object-position:54% 30%;border:3px solid #fff4d7;background:#f5d18a}
    .pk2-bubble{position:relative;background:#fffaf0;border:2px solid #e1c38b;border-radius:18px;padding:12px 14px;font-size:16px;line-height:1.35;font-weight:850;color:#4a392e}
    .pk2-bubble:before{content:'';position:absolute;left:-11px;top:24px;border-width:11px 11px 11px 0;border-style:solid;border-color:transparent #e1c38b transparent transparent}
    .pk2-bubble:after{content:'';position:absolute;left:-8px;top:25px;border-width:10px 10px 10px 0;border-style:solid;border-color:transparent #fffaf0 transparent transparent}
    .pk2-board{position:relative;height:180px;background:#fffaf0;border:1px solid #e5ce9c;border-radius:17px;margin-bottom:12px;overflow:hidden;background-image:linear-gradient(rgba(82,147,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(82,147,190,.08) 1px,transparent 1px);background-size:28px 28px}
    .pk2-long{position:absolute;left:50%;top:9px;width:300px;height:156px;transform:translateX(-50%);font:900 28px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#352820}
    .pk2-src{position:absolute;left:58px;top:18px;letter-spacing:10px}.pk2-src span{display:inline-block;min-width:20px;text-align:center}
    .pk2-focus{background:#fff0b6;outline:3px solid #efb132;border-radius:7px}
    .pk2-divisor{position:absolute;left:206px;top:18px}.pk2-stem{position:absolute;left:192px;top:9px;height:126px;border-left:5px solid #283740}.pk2-bar{position:absolute;left:205px;top:50px;width:94px;border-top:5px solid #283740}
    .pk2-q{position:absolute;left:210px;top:58px;color:#609a36;letter-spacing:8px;white-space:pre}
    .pk2-sub1{position:absolute;left:57px;top:56px;font-size:24px;white-space:pre}
    .pk2-line1{position:absolute;left:77px;top:88px;width:58px;border-top:3px solid #3a3734}
    .pk2-rem{position:absolute;left:92px;top:93px;font-size:24px;color:#2f7fb3;white-space:pre}
    .pk2-down{position:absolute;left:122px;top:90px;font-size:24px;color:#2f7fb3;white-space:pre;animation:pk2down .85s ease-in-out infinite alternate}
    .pk2-sub2{position:absolute;left:84px;top:124px;font-size:22px;white-space:pre}
    @keyframes pk2down{from{transform:translateY(-3px)}to{transform:translateY(5px)}}
    .pk2-text{font-size:15px;line-height:1.35;font-weight:760;margin:0 2px 14px;color:#655346}
    .pk2-text b{color:#236f9f}
    .pk2-next{width:100%;height:52px;border:0;border-radius:14px;background:linear-gradient(#8cc64a,#5aa02f);color:#fff;font:950 19px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 0 #3f7922;touch-action:manipulation}
    .pk2-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7922}
    @media(max-width:430px){
      .pk2{padding:10px}
      .pk2-card{padding:12px;border-radius:18px}
      .pk2-top{margin-bottom:10px}
      .pk2-title{font-size:19px;margin-bottom:8px}
      .pk2-coach{grid-template-columns:58px minmax(0,1fr);gap:9px;margin-bottom:10px}
      .pk2-avatarWrap{width:58px;height:58px;padding:3px}
      .pk2-bubble{padding:10px 11px;font-size:14px;border-radius:15px}
      .pk2-bubble:before{left:-9px;top:18px;border-width:9px 9px 9px 0}
      .pk2-bubble:after{left:-6px;top:19px;border-width:8px 8px 8px 0}
      .pk2-board{height:150px;margin-bottom:10px}
      .pk2-long{width:255px;height:135px;font-size:24px;top:7px}
      .pk2-src{left:46px;top:15px;letter-spacing:8px}
      .pk2-divisor{left:175px;top:15px}.pk2-stem{left:162px;top:8px;height:112px;border-left-width:4px}.pk2-bar{left:173px;top:45px;width:80px;border-top-width:4px}
      .pk2-q{left:178px;top:52px;letter-spacing:6px}
      .pk2-sub1{left:46px;top:48px;font-size:22px}.pk2-line1{left:63px;top:78px;width:48px}.pk2-rem{left:76px;top:82px;font-size:22px}.pk2-down{left:102px;top:80px;font-size:22px}.pk2-sub2{left:68px;top:110px;font-size:20px}
      .pk2-text{font-size:14px;margin-bottom:12px}
      .pk2-next{height:50px;font-size:18px}
    }
  `;

  function addStyle(){if($('pk2-style'))return;const s=document.createElement('style');s.id='pk2-style';s.textContent=css;document.head.appendChild(s)}
  function pageLang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function setPageLang(l){const btn=document.querySelector(`.langBtn[data-lang="${l}"]`);if(btn&&!btn.classList.contains('active'))btn.click()}

  function ensureModal(){
    let w=$('pk2');
    if(w)return w;
    w=document.createElement('div');
    w.id='pk2';
    w.className='pk2';
    w.setAttribute('aria-hidden','true');
    w.innerHTML=`<div class="pk2-card" role="dialog" aria-modal="true">
      <div class="pk2-top"><div class="pk2-badge" id="pk2-badge"></div><div class="pk2-tools"><div class="pk2-count" id="pk2-count"></div><div class="pk2-lang"><button id="pk2-ru" type="button">RU</button><button id="pk2-en" type="button">EN</button></div></div></div>
      <div class="pk2-title" id="pk2-title"></div>
      <div class="pk2-coach"><div class="pk2-avatarWrap"><img class="pk2-avatar" src="pushok_hq.jpg?v=5" alt="Pushok"></div><div class="pk2-bubble" id="pk2-coach"></div></div>
      <div class="pk2-board"><div class="pk2-long"><div class="pk2-src"><span id="pk2-d8">8</span><span id="pk2-d4">4</span></div><div class="pk2-divisor">4</div><div class="pk2-stem"></div><div class="pk2-bar"></div><div class="pk2-q" id="pk2-q"></div><div class="pk2-sub1" id="pk2-sub1"></div><div class="pk2-line1"></div><div class="pk2-rem" id="pk2-rem"></div><div class="pk2-down" id="pk2-down"></div><div class="pk2-sub2" id="pk2-sub2"></div></div></div>
      <div class="pk2-text" id="pk2-text"></div>
      <button class="pk2-next" id="pk2-next" type="button"></button>
    </div>`;
    document.body.appendChild(w);
    $('pk2-ru').addEventListener('click',()=>{tutorialLang='ru';step=0;render()});
    $('pk2-en').addEventListener('click',()=>{tutorialLang='en';step=0;render()});
    $('pk2-next').addEventListener('click',()=>{const a=slides[tutorialLang];if(step<a.length-1){step++;render();return}finish()});
    return w;
  }

  function render(){
    const a=slides[tutorialLang],s=a[step];
    $('pk2-badge').textContent=tutorialLang==='ru'?'Пробный пример':'Practice example';
    $('pk2-count').textContent=`${step+1} / ${a.length}`;
    $('pk2-title').textContent=s.title;
    $('pk2-coach').textContent=s.coach;
    $('pk2-text').textContent=s.text;
    $('pk2-q').textContent=s.q;
    $('pk2-sub1').textContent=s.sub1;
    $('pk2-rem').textContent=s.rem;
    $('pk2-down').textContent=s.down;
    $('pk2-sub2').textContent=s.sub2;
    $('pk2-d8').classList.toggle('pk2-focus',s.focus==='8');
    $('pk2-d4').classList.toggle('pk2-focus',s.focus==='4');
    $('pk2-ru').classList.toggle('on',tutorialLang==='ru');
    $('pk2-en').classList.toggle('on',tutorialLang==='en');
    $('pk2-next').textContent=step===a.length-1?(tutorialLang==='ru'?'Начать игру':'Start game'):(tutorialLang==='ru'?'Дальше':'Next');
  }

  function show(){tutorialLang=pageLang();step=0;const w=ensureModal();render();w.classList.add('show');w.setAttribute('aria-hidden','false');document.activeElement?.blur?.()}
  function finish(){const w=$('pk2');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}setPageLang(tutorialLang);tutorialDone=true;bypassStart=true;requestAnimationFrame(()=>{$('nameStart')?.click();bypassStart=false})}

  function install(){
    if(installed)return;
    const btn=$('nameStart'),input=$('playerName');
    if(!btn||!input)return;
    installed=true;
    btn.addEventListener('click',e=>{if(bypassStart||tutorialDone)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
    input.addEventListener('keydown',e=>{if(e.key!=='Enter'||bypassStart||tutorialDone)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
  }

  document.addEventListener('DOMContentLoaded',()=>{addStyle();install()});
})();