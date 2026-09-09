(()=>{
  const TOTAL_ROWS=8;
  const TUTORIAL_KEY='savekitty_tutorial_v1';
  const $=id=>document.getElementById(id);
  let scheduled=false;
  let allowStart=false;
  let tutorialStep=0;

  const css=`
    :root{--pk-cell:24px;--pk-sign:17px}

    /* Keep only information that helps solve the current step. */
    .steps,.mathTitle,.progress,#exampleLabel{display:none!important}
    .action{box-sizing:border-box!important;min-height:0!important;padding:10px!important}
    #actionTitle{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}
    #actionText{height:30px!important;min-height:30px!important;margin:0!important;display:flex!important;align-items:center!important;overflow:hidden!important;line-height:1.18!important}
    .step1-compact #actionText{visibility:hidden!important}
    .question,.action.step1-compact .question{height:48px!important;min-height:48px!important;margin-top:4px!important;display:flex!important;align-items:center!important;overflow:hidden!important;box-sizing:border-box!important}
    .answerRow{height:46px!important;min-height:46px!important;margin-top:5px!important}
    .answerRow input,.ok{height:46px!important}

    /* Feedback only exists for a useful correction. Pushok handles praise. */
    .feedback{height:27px!important;min-height:27px!important;margin-top:3px!important;padding:3px 8px!important;overflow:hidden!important;box-sizing:border-box!important;visibility:hidden!important}
    .feedback.bad{visibility:visible!important}
    .feedback.good{visibility:hidden!important}

    /* Solved state: one clear message + one clear action. No second “Готово”. */
    .action.pk-solved{padding-bottom:9px!important}
    .action.pk-solved #actionText,
    .action.pk-solved .question,
    .action.pk-solved .feedback{display:none!important}
    .action.pk-solved .answerRow{display:block!important;height:auto!important;min-height:0!important;margin-top:5px!important}
    .action.pk-solved .answerRow input{display:none!important}
    .action.pk-solved .answerRow .ok{display:block!important;width:100%!important;min-width:0!important;height:50px!important;margin:0!important}
    .action.pk-solved #pushok-keypad{display:none!important}

    /* All calculation rows are reserved from the first frame: no vertical jumps. */
    .mathCard{height:194px!important;min-height:194px!important;max-height:194px!important;overflow:hidden!important;padding-top:6px!important;padding-bottom:4px!important}
    .corner{height:184px!important;min-height:184px!important;max-height:184px!important;align-items:start!important}
    .grid{height:184px!important;min-height:184px!important;max-height:184px!important;align-content:start!important;overflow:hidden!important}
    .mrow{height:var(--pk-cell)!important;min-height:var(--pk-cell)!important;grid-template-columns:var(--pk-sign) repeat(var(--n),var(--pk-cell))!important}
    .cell,.scell{width:var(--pk-cell)!important;height:var(--pk-cell)!important;font-size:18px!important}
    .sign{width:var(--pk-sign)!important;height:var(--pk-cell)!important;font-size:14px!important}
    .rhsRow{height:var(--pk-cell)!important;min-height:var(--pk-cell)!important}
    .pk-placeholder{visibility:hidden!important;pointer-events:none!important}

    #pushok-keypad{width:100%;margin:5px auto 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;box-sizing:border-box;user-select:none;-webkit-user-select:none}
    #pushok-keypad button{appearance:none;-webkit-appearance:none;border:1px solid #d9bb7d;border-bottom-width:3px;border-radius:11px;min-height:39px;padding:4px;background:linear-gradient(#fffdf7,#f8ecd1);color:#4a3424;font:900 20px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 2px 0 rgba(104,69,35,.1);touch-action:manipulation}
    #pushok-keypad button:active{transform:translateY(1px);border-bottom-width:2px;background:#f4e2bd}
    #pushok-keypad .pk-zero{grid-column:1/span 2}
    #pushok-keypad .pk-delete{background:linear-gradient(#f7eee4,#ead8c5);color:#65452f}

    .locksMeta{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:7px!important;align-items:stretch!important;margin-top:8px!important}
    .locksMeta .locks{min-width:0!important;margin-top:0!important}
    .locksMeta .honorBtn{min-width:46px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important}

    /* The original uploaded JPEG is served directly; CSS only fits it to the viewport. */
    .hero img{image-rendering:auto!important;filter:none!important;object-fit:cover!important;object-position:center center!important}
    .winVideo{pointer-events:none!important}
    .winVideo::-webkit-media-controls{display:none!important}

    /* First-run walkthrough */
    .pk-tutorial{position:fixed;inset:0;z-index:80;background:rgba(24,14,9,.90);display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
    .pk-tutorial.show{display:flex}
    .pk-tutorial-card{width:min(430px,100%);background:#fff4d5;color:#432f22;border:2px solid #d6a95a;border-radius:22px;padding:16px;box-shadow:0 24px 70px rgba(0,0,0,.45);box-sizing:border-box}
    .pk-tutorial-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
    .pk-tutorial-badge{font-size:13px;font-weight:950;color:#2f75a7;background:#e4f3ff;border-radius:999px;padding:6px 10px}
    .pk-tutorial-count{font-size:13px;font-weight:900;color:#846a51}
    .pk-demo{background:#fffaf0;border:1px solid #e6cf9e;border-radius:16px;padding:12px 12px 10px;margin-bottom:12px;min-height:174px;box-sizing:border-box;background-image:linear-gradient(rgba(82,147,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(82,147,190,.08) 1px,transparent 1px);background-size:28px 28px}
    .pk-demo-title{font-size:28px;font-weight:950;margin:0 0 8px}
    .pk-mini-div{position:relative;width:210px;height:92px;margin:4px auto 0;font:900 28px/1.05 ui-monospace,SFMono-Regular,Menlo,monospace;color:#332820}
    .pk-mini-left{position:absolute;left:24px;top:20px;letter-spacing:8px}
    .pk-mini-divisor{position:absolute;left:126px;top:20px}
    .pk-mini-bar{position:absolute;left:118px;top:48px;width:74px;border-top:4px solid #24343d}
    .pk-mini-stem{position:absolute;left:108px;top:14px;height:69px;border-left:4px solid #24343d}
    .pk-mini-q{position:absolute;left:133px;top:53px;color:#5b982f;letter-spacing:6px}
    .pk-mini-sub{position:absolute;left:34px;top:52px;font-size:21px}
    .pk-mini-arrow{position:absolute;left:67px;top:50px;color:#3484bb;font-size:29px;animation:pkDown .8s ease-in-out infinite alternate}
    .pk-mini-focus{display:inline-block;border:3px solid #f2b334;border-radius:8px;padding:0 3px;background:#fff1bd}
    @keyframes pkDown{from{transform:translateY(-2px)}to{transform:translateY(4px)}}
    .pk-tutorial-copy{font-size:17px;line-height:1.32;font-weight:800;margin:0 2px 12px}
    .pk-tutorial-copy b{color:#226c9f}
    .pk-tutorial-next{width:100%;height:50px;border:0;border-radius:13px;background:linear-gradient(#8cc64b,#599f2e);color:#fff;font:950 18px/1 system-ui;box-shadow:0 4px 0 #3f7b22;touch-action:manipulation}
    .pk-tutorial-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7b22}

    @media(max-width:600px){
      .locksMeta .honorBtn{width:46px!important;padding:0!important;font-size:0!important}
      .locksMeta .honorBtn:before{content:'🏆';font-size:19px}
      .hero{height:228px!important}
    }
    @media(max-width:430px){
      :root{--pk-cell:23px;--pk-sign:16px}
      .mathCard{height:188px!important;min-height:188px!important;max-height:188px!important}
      .corner,.grid{height:184px!important;min-height:184px!important;max-height:184px!important}
      #actionText{height:28px!important;min-height:28px!important;font-size:13px!important}
      .question,.action.step1-compact .question{height:46px!important;min-height:46px!important}
      #pushok-keypad button{min-height:38px;font-size:20px}
      .pk-tutorial-card{padding:14px}
      .pk-demo{min-height:164px}
      .pk-tutorial-copy{font-size:16px}
    }
    @media(min-width:760px){
      :root{--pk-cell:32px;--pk-sign:22px}
      .mathCard{height:264px!important;min-height:264px!important;max-height:264px!important}
      .corner,.grid{height:256px!important;min-height:256px!important;max-height:256px!important}
      .cell,.scell{font-size:23px!important}.sign{font-size:17px!important}
      #pushok-keypad{grid-template-columns:repeat(5,minmax(0,1fr));max-width:520px}
      #pushok-keypad .pk-zero{grid-column:auto}
      #pushok-keypad button{min-height:44px;font-size:21px}
    }
  `;

  const TUTORIAL={
    ru:[
      {title:'84 ÷ 4',copy:'Сначала смотрим на <b>8</b>. Четыре помещается в восьми <b>2 раза</b>. Пишем 2 в ответ.',left:'<span class="pk-mini-focus">8</span>4',q:'2',sub:'',arrow:''},
      {title:'84 ÷ 4',copy:'Теперь проверяем: 2 × 4 = 8. <b>Вычитаем 8 − 8 = 0</b>.',left:'84',q:'2',sub:'− 8',arrow:''},
      {title:'Что значит «снести цифру»?',copy:'Берём следующую цифру справа — <b>4</b> — и <b>опускаем её вниз</b> к остатку. Теперь работаем с числом 4.',left:'84',q:'2',sub:'− 8',arrow:'↓ 4'},
      {title:'Готово',copy:'Четыре помещается в четырёх 1 раз. Получаем ответ <b>21</b>. Теперь начинается настоящая игра.',left:'84',q:'21',sub:'− 8',arrow:''}
    ],
    en:[
      {title:'84 ÷ 4',copy:'Start with <b>8</b>. Four fits into eight <b>2 times</b>. Write 2 in the answer.',left:'<span class="pk-mini-focus">8</span>4',q:'2',sub:'',arrow:''},
      {title:'84 ÷ 4',copy:'Now check it: 2 × 4 = 8. <b>Subtract 8 − 8 = 0</b>.',left:'84',q:'2',sub:'− 8',arrow:''},
      {title:'What does “bring down” mean?',copy:'Take the next digit on the right — <b>4</b> — and <b>move it down</b> beside the remainder. Now we work with 4.',left:'84',q:'2',sub:'− 8',arrow:'↓ 4'},
      {title:'Done',copy:'Four fits into four once. The answer is <b>21</b>. Now the real game begins.',left:'84',q:'21',sub:'− 8',arrow:''}
    ]
  };

  function lang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function tutorialSeen(){try{return localStorage.getItem(TUTORIAL_KEY)==='1'}catch(e){return false}}
  function markTutorialSeen(){try{localStorage.setItem(TUTORIAL_KEY,'1')}catch(e){}}

  function addStyles(){
    if($('pushok-ui-v7-style'))return;
    const s=document.createElement('style');s.id='pushok-ui-v7-style';s.textContent=css;document.head.appendChild(s);
  }

  function ensureTutorial(){
    if($('pk-tutorial'))return;
    const wrap=document.createElement('div');
    wrap.id='pk-tutorial';wrap.className='pk-tutorial';wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<div class="pk-tutorial-card" role="dialog" aria-modal="true">
      <div class="pk-tutorial-top"><div class="pk-tutorial-badge" id="pk-tutorial-badge"></div><div class="pk-tutorial-count" id="pk-tutorial-count"></div></div>
      <div class="pk-demo"><div class="pk-demo-title" id="pk-demo-title"></div><div class="pk-mini-div"><div class="pk-mini-left" id="pk-mini-left"></div><div class="pk-mini-divisor">4</div><div class="pk-mini-stem"></div><div class="pk-mini-bar"></div><div class="pk-mini-q" id="pk-mini-q"></div><div class="pk-mini-sub" id="pk-mini-sub"></div><div class="pk-mini-arrow" id="pk-mini-arrow"></div></div></div>
      <div class="pk-tutorial-copy" id="pk-tutorial-copy"></div>
      <button class="pk-tutorial-next" id="pk-tutorial-next" type="button"></button>
    </div>`;
    document.body.appendChild(wrap);
    $('pk-tutorial-next').addEventListener('click',()=>{
      if(tutorialStep<TUTORIAL[lang()].length-1){tutorialStep++;renderTutorial();return}
      finishTutorial();
    });
  }

  function renderTutorial(){
    ensureTutorial();
    const l=lang(),slides=TUTORIAL[l],s=slides[tutorialStep];
    $('pk-tutorial-badge').textContent=l==='ru'?'Пробный пример':'Practice example';
    $('pk-tutorial-count').textContent=`${tutorialStep+1} / ${slides.length}`;
    $('pk-demo-title').textContent=s.title;
    $('pk-mini-left').innerHTML=s.left;
    $('pk-mini-q').textContent=s.q;
    $('pk-mini-sub').textContent=s.sub;
    $('pk-mini-arrow').textContent=s.arrow;
    $('pk-tutorial-copy').innerHTML=s.copy;
    $('pk-tutorial-next').textContent=tutorialStep===slides.length-1?(l==='ru'?'Начать игру':'Start game'):(l==='ru'?'Дальше':'Next');
  }

  function showTutorial(){
    tutorialStep=0;ensureTutorial();renderTutorial();
    const w=$('pk-tutorial');w.classList.add('show');w.setAttribute('aria-hidden','false');
    document.activeElement?.blur?.();
  }

  function finishTutorial(){
    markTutorialSeen();
    const w=$('pk-tutorial');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}
    allowStart=true;
    const b=$('nameStart');if(b)b.click();
    allowStart=false;
  }

  function interceptStart(e){
    const target=e.target?.closest?.('#nameStart');
    if(!target||allowStart||tutorialSeen())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    showTutorial();
  }
  document.addEventListener('click',interceptStart,true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&document.activeElement?.id==='playerName'&&!allowStart&&!tutorialSeen()){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showTutorial();
    }
  },true);

  function findAnswer(){return $('answer')||[...document.querySelectorAll('input')].find(el=>el.id!=='playerName'&&!el.closest('.nameGate'))||null}
  function fireInput(input){input.dispatchEvent(new Event('input',{bubbles:true}))}
  function typeDigit(d){const input=findAnswer();if(!input||input.disabled)return;let v=String(input.value||'').replace(/\D/g,'');if(v.length>=6)return;input.value=v+d;fireInput(input)}
  function erase(){const input=findAnswer();if(!input||input.disabled)return;input.value=String(input.value||'').slice(0,-1);fireInput(input)}

  function ensureKeypad(){
    const input=findAnswer();if(!input)return;
    if(!input.readOnly)input.readOnly=true;
    if(input.getAttribute('inputmode')!=='none')input.setAttribute('inputmode','none');
    if(input.getAttribute('autocomplete')!=='off')input.setAttribute('autocomplete','off');
    let pad=$('pushok-keypad');
    if(!pad){
      pad=document.createElement('div');pad.id='pushok-keypad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Цифровая клавиатура');
      ['1','2','3','4','5','6','7','8','9'].forEach(n=>{const b=document.createElement('button');b.type='button';b.dataset.key=n;b.textContent=n;pad.appendChild(b)});
      const zero=document.createElement('button');zero.type='button';zero.dataset.key='0';zero.textContent='0';zero.className='pk-zero';pad.appendChild(zero);
      const del=document.createElement('button');del.type='button';del.dataset.key='back';del.textContent='⌫';del.className='pk-delete';del.setAttribute('aria-label','Стереть');pad.appendChild(del);
      pad.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.dataset.key==='back'?erase():typeDigit(b.dataset.key)});
      const row=input.closest('.answerRow')||input.parentElement;row.insertAdjacentElement('afterend',pad);
    }
    const disabled=!!input.disabled;pad.querySelectorAll('button').forEach(b=>{if(b.disabled!==disabled)b.disabled=disabled});
  }

  function ensureRows(){
    const grid=$('grid');if(!grid)return;
    const existing=[...grid.children].filter(x=>x.classList&&x.classList.contains('mrow'));
    const n=Math.max(1,(existing[0]?.children.length||5)-1);
    if(existing.length>=TOTAL_ROWS)return;
    const frag=document.createDocumentFragment();
    for(let k=existing.length;k<TOTAL_ROWS;k++){
      const r=document.createElement('div');r.className='mrow pk-placeholder';r.style.setProperty('--n',n);
      const sg=document.createElement('div');sg.className='sign';sg.innerHTML='&nbsp;';r.appendChild(sg);
      for(let i=0;i<n;i++){const c=document.createElement('div');c.className='cell';c.innerHTML='&nbsp;';r.appendChild(c)}
      frag.appendChild(r);
    }
    grid.appendChild(frag);
  }

  function compactStep(){
    const t=$('actionTitle');if(t&&t.textContent!=='')t.textContent='';
    const action=document.querySelector('.action'),text=$('actionText');if(!action||!text)return;
    const wanted=action.classList.contains('step1-compact')?'hidden':'visible';if(text.style.visibility!==wanted)text.style.visibility=wanted;
  }

  function updateSolvedState(){
    const action=document.querySelector('.action'),input=findAnswer(),ok=$('ok'),pad=$('pushok-keypad');
    if(!action||!input||!ok)return;
    const solved=!!input.disabled&&(ok.classList.contains('next')||/Открыть замок|Open lock/i.test(ok.textContent||''));
    action.classList.toggle('pk-solved',solved);
    if(pad)pad.style.display=solved?'none':'';
  }

  function placeHall(){
    const locks=$('locks'),btn=$('honorBtn');if(!locks||!btn||locks.closest('.locksMeta'))return;
    const shell=document.createElement('div');shell.className='locksMeta';locks.parentNode.insertBefore(shell,locks);shell.appendChild(locks);shell.appendChild(btn);btn.title='Доска почёта / Hall of Fame';
  }

  function ensureHero(){
    const hero=document.querySelector('.hero img');if(!hero||hero.dataset.directHq==='1')return;
    hero.dataset.directHq='1';
    hero.src='pushok_hq.jpg?v=2';
  }

  function cleanVideo(){
    const v=$('winVideo');if(!v)return;if(v.hasAttribute('controls'))v.removeAttribute('controls');if(v.controls)v.controls=false;if(!v.playsInline)v.playsInline=true;if(!v.hasAttribute('playsinline'))v.setAttribute('playsinline','');if(!v.hasAttribute('webkit-playsinline'))v.setAttribute('webkit-playsinline','');
  }

  function stabilize(){addStyles();ensureTutorial();ensureKeypad();ensureRows();compactStep();updateSolvedState();placeHall();ensureHero();cleanVideo()}
  function scheduleStabilize(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;stabilize()})}

  document.addEventListener('DOMContentLoaded',()=>{
    stabilize();
    const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.type==='childList'))scheduleStabilize()});
    observer.observe(document.body,{childList:true,subtree:true});
  });
  document.addEventListener('click',()=>requestAnimationFrame(updateSolvedState),true);

  document.addEventListener('keydown',e=>{
    const ae=document.activeElement;if(ae&&ae.id==='playerName')return;
    if($('pk-tutorial')?.classList.contains('show'))return;
    if(/^\d$/.test(e.key)){e.preventDefault();typeDigit(e.key)}
    else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase()}
    else if(e.key==='Enter'){const ok=$('ok');if(ok&&!ok.disabled){e.preventDefault();ok.click()}}
  });
})();
