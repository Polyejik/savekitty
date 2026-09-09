(()=>{
  const KEY='savekitty_tutorial_v2';
  const $=id=>document.getElementById(id);
  let step=0;
  let finishTutorial=null;

  const slides={
    ru:[
      {title:'Пробный пример: 84 ÷ 4', text:'Сначала берём <b>8</b>. Четыре помещается в восьми <b>2 раза</b>. Пишем 2 в ответ.', q:'2', sub1:'', rem:'', down:'', sub2:'', focus:'8'},
      {title:'Проверяем умножением', text:'2 × 4 = 8. Записываем <b>8 под 8</b> и вычитаем: 8 − 8 = 0.', q:'2', sub1:'− 8', rem:'0', down:'', sub2:'', focus:''},
      {title:'Что значит «сносим цифру»?', text:'Берём следующую цифру справа — <b>4</b> — и <b>опускаем её вниз</b> к остатку. Теперь вместо 0 получаем число 4.', q:'2', sub1:'− 8', rem:'0', down:'↓ 4', sub2:'', focus:'4'},
      {title:'Делим ещё раз', text:'Четыре помещается в четырёх <b>1 раз</b>. Пишем 1 рядом с 2. Получается 21.', q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''},
      {title:'Готово — 84 ÷ 4 = 21', text:'Вот и весь алгоритм: <b>делим → умножаем → вычитаем → сносим следующую цифру</b>. Теперь спасаем Пушка!', q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''}
    ],
    en:[
      {title:'Practice: 84 ÷ 4', text:'Start with <b>8</b>. Four fits into eight <b>2 times</b>. Write 2 in the answer.', q:'2', sub1:'', rem:'', down:'', sub2:'', focus:'8'},
      {title:'Check by multiplying', text:'2 × 4 = 8. Write <b>8 under 8</b> and subtract: 8 − 8 = 0.', q:'2', sub1:'− 8', rem:'0', down:'', sub2:'', focus:''},
      {title:'What does “bring down” mean?', text:'Take the next digit on the right — <b>4</b> — and <b>move it down</b> beside the remainder. Now we work with 4.', q:'2', sub1:'− 8', rem:'0', down:'↓ 4', sub2:'', focus:'4'},
      {title:'Divide again', text:'Four fits into four <b>once</b>. Write 1 next to 2. The quotient is 21.', q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''},
      {title:'Done — 84 ÷ 4 = 21', text:'That is the whole pattern: <b>divide → multiply → subtract → bring down the next digit</b>. Now let’s save Pushok!', q:'21', sub1:'− 8', rem:'4', down:'', sub2:'− 4', focus:''}
    ]
  };

  const css=`
    .action:has(.ok.next) #actionText,
    .action:has(.ok.next) .question,
    .action:has(.ok.next) .feedback,
    .action:has(.ok.next) #pushok-keypad,
    .action:has(.ok.next) .answerRow input{display:none!important}
    .action:has(.ok.next) .answerRow{display:block!important;height:auto!important;min-height:0!important;margin-top:7px!important}
    .action:has(.ok.next) .answerRow .ok{display:block!important;width:100%!important;min-width:0!important;height:50px!important;margin:0!important}

    .pk-tutorial{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(25,14,9,.92);backdrop-filter:blur(3px)}
    .pk-tutorial.show{display:flex}
    .pk-tutorial-card{width:min(430px,100%);background:#fff4d6;color:#402c20;border:2px solid #d9ab59;border-radius:22px;padding:15px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.45)}
    .pk-tutorial-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}
    .pk-tutorial-badge{font-size:13px;font-weight:950;color:#2d75a7;background:#e5f3ff;border-radius:999px;padding:6px 10px}
    .pk-tutorial-count{font-size:13px;font-weight:900;color:#80664d}
    .pk-tutorial-title{font-size:21px;font-weight:950;line-height:1.15;margin:0 0 10px}
    .pk-board{position:relative;height:158px;background:#fffaf0;border:1px solid #e7cf9a;border-radius:15px;margin-bottom:11px;overflow:hidden;background-image:linear-gradient(rgba(82,147,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(82,147,190,.08) 1px,transparent 1px);background-size:28px 28px}
    .pk-long{position:absolute;left:50%;top:13px;width:230px;height:135px;transform:translateX(-50%);font:900 27px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#352820}
    .pk-src{position:absolute;left:30px;top:17px;letter-spacing:8px}
    .pk-src span{display:inline-block;min-width:18px;text-align:center}
    .pk-focus{background:#fff0b6;outline:3px solid #efb132;border-radius:7px}
    .pk-divisor{position:absolute;left:151px;top:17px}
    .pk-stem{position:absolute;left:137px;top:10px;height:111px;border-left:4px solid #283740}
    .pk-bar{position:absolute;left:146px;top:48px;width:70px;border-top:4px solid #283740}
    .pk-q{position:absolute;left:153px;top:57px;color:#609a36;letter-spacing:6px}
    .pk-sub1{position:absolute;left:31px;top:50px;font-size:22px}
    .pk-line1{position:absolute;left:48px;top:78px;width:45px;border-top:3px solid #3a3734}
    .pk-rem{position:absolute;left:62px;top:84px;font-size:22px;color:#2f7fb3}
    .pk-down{position:absolute;left:85px;top:82px;font-size:22px;color:#2f7fb3;animation:pk-down .72s ease-in-out infinite alternate}
    .pk-sub2{position:absolute;left:55px;top:111px;font-size:20px}
    @keyframes pk-down{from{transform:translateY(-3px)}to{transform:translateY(4px)}}
    .pk-tutorial-text{font-size:16px;line-height:1.34;font-weight:750;margin:0 2px 13px}
    .pk-tutorial-text b{color:#236f9f}
    .pk-tutorial-next{width:100%;height:49px;border:0;border-radius:13px;background:linear-gradient(#8cc64a,#5aa02f);color:#fff;font:950 18px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 0 #3f7922;touch-action:manipulation}
    .pk-tutorial-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7922}
    @media(max-width:430px){.pk-tutorial{padding:11px}.pk-tutorial-card{padding:13px}.pk-board{height:151px}.pk-tutorial-title{font-size:20px}.pk-tutorial-text{font-size:15px}}
  `;

  function seen(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
  function markSeen(){try{localStorage.setItem(KEY,'1')}catch(e){}}
  function currentLang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}

  function addStyle(){
    if($('pk-onboarding-style'))return;
    const s=document.createElement('style');s.id='pk-onboarding-style';s.textContent=css;document.head.appendChild(s);
  }

  function ensureModal(){
    let w=$('pk-tutorial');
    if(w)return w;
    w=document.createElement('div');w.id='pk-tutorial';w.className='pk-tutorial';w.setAttribute('aria-hidden','true');
    w.innerHTML=`<div class="pk-tutorial-card" role="dialog" aria-modal="true">
      <div class="pk-tutorial-head"><div class="pk-tutorial-badge" id="pk-tutorial-badge"></div><div class="pk-tutorial-count" id="pk-tutorial-count"></div></div>
      <div class="pk-tutorial-title" id="pk-tutorial-title"></div>
      <div class="pk-board"><div class="pk-long">
        <div class="pk-src"><span id="pk-d8">8</span><span id="pk-d4">4</span></div>
        <div class="pk-divisor">4</div><div class="pk-stem"></div><div class="pk-bar"></div>
        <div class="pk-q" id="pk-q"></div><div class="pk-sub1" id="pk-sub1"></div><div class="pk-line1"></div>
        <div class="pk-rem" id="pk-rem"></div><div class="pk-down" id="pk-down"></div><div class="pk-sub2" id="pk-sub2"></div>
      </div></div>
      <div class="pk-tutorial-text" id="pk-tutorial-text"></div>
      <button class="pk-tutorial-next" id="pk-tutorial-next" type="button"></button>
    </div>`;
    document.body.appendChild(w);
    $('pk-tutorial-next').addEventListener('click',()=>{
      const a=slides[currentLang()];
      if(step<a.length-1){step++;render();return}
      const done=finishTutorial;finishTutorial=null;if(done)done();
    });
    return w;
  }

  function render(){
    const l=currentLang(),a=slides[l],s=a[step];
    $('pk-tutorial-badge').textContent=l==='ru'?'Пробный пример':'Practice example';
    $('pk-tutorial-count').textContent=`${step+1} / ${a.length}`;
    $('pk-tutorial-title').textContent=s.title;
    $('pk-tutorial-text').innerHTML=s.text;
    $('pk-q').textContent=s.q;$('pk-sub1').textContent=s.sub1;$('pk-rem').textContent=s.rem;$('pk-down').textContent=s.down;$('pk-sub2').textContent=s.sub2;
    $('pk-d8').classList.toggle('pk-focus',s.focus==='8');$('pk-d4').classList.toggle('pk-focus',s.focus==='4');
    $('pk-tutorial-next').textContent=step===a.length-1?(l==='ru'?'Начать игру':'Start game'):(l==='ru'?'Дальше':'Next');
  }

  function show(done){
    finishTutorial=done;step=0;const w=ensureModal();render();w.classList.add('show');w.setAttribute('aria-hidden','false');document.activeElement?.blur?.();
  }
  function hide(){const w=$('pk-tutorial');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}}

  function installFirstRun(){
    if(seen())return;
    const originalInput=$('playerName'),originalBtn=$('nameStart');
    if(!originalInput||!originalBtn||originalBtn.dataset.pkGuard==='1')return;

    const input=originalInput.cloneNode(true),btn=originalBtn.cloneNode(true);
    input.dataset.pkGuard='1';btn.dataset.pkGuard='1';
    originalInput.replaceWith(input);originalBtn.replaceWith(btn);

    const beginTutorial=()=>{
      const typed=input.value.trim();
      if(!typed){input.focus();return}
      show(()=>{
        markSeen();hide();
        originalInput.value=input.value;
        originalInput.placeholder=input.placeholder;
        originalBtn.textContent=btn.textContent;
        input.replaceWith(originalInput);btn.replaceWith(originalBtn);
        requestAnimationFrame(()=>originalBtn.click());
      });
    };
    btn.addEventListener('click',e=>{e.preventDefault();beginTutorial()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();beginTutorial()}});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    addStyle();
    installFirstRun();
  });
})();
