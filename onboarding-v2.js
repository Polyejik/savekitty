(()=>{
  const $=id=>document.getElementById(id);
  let step=0;
  let tutorialLang='ru';
  let bypassStart=false;
  let installed=false;

  const slides={
    ru:[
      {title:'Пробный пример: 84 ÷ 4',text:'Сначала берём <b>8</b>. Четыре помещается в восьми <b>2 раза</b>. Пишем <b>2</b> в ответ.',q:'2',sub1:'',rem:'',down:'',sub2:'',focus:'8'},
      {title:'Вычитаем',text:'Проверяем: 2 × 4 = 8. Записываем <b>8 под 8</b> и вычитаем. Остаток — 0.',q:'2',sub1:'− 8',rem:'0',down:'',sub2:'',focus:''},
      {title:'Вот что значит «снести цифру»',text:'Берём следующую цифру справа — <b>4</b> — и <b>опускаем её вниз</b>. Теперь дальше делим уже число 4.',q:'2',sub1:'− 8',rem:'0',down:'↓ 4',sub2:'',focus:'4'},
      {title:'Получаем ответ 21',text:'Четыре помещается в четырёх <b>1 раз</b>. Пишем 1 рядом с 2. Пробный пример готов — теперь начинаем игру.',q:'21',sub1:'− 8',rem:'4',down:'',sub2:'− 4',focus:''}
    ],
    en:[
      {title:'Practice: 84 ÷ 4',text:'Start with <b>8</b>. Four fits into eight <b>2 times</b>. Write <b>2</b> in the answer.',q:'2',sub1:'',rem:'',down:'',sub2:'',focus:'8'},
      {title:'Subtract',text:'Check it: 2 × 4 = 8. Write <b>8 under 8</b> and subtract. The remainder is 0.',q:'2',sub1:'− 8',rem:'0',down:'',sub2:'',focus:''},
      {title:'This is what “bring down” means',text:'Take the next digit on the right — <b>4</b> — and <b>move it down</b>. Now continue dividing the number 4.',q:'2',sub1:'− 8',rem:'0',down:'↓ 4',sub2:'',focus:'4'},
      {title:'The answer is 21',text:'Four fits into four <b>once</b>. Write 1 next to 2. Practice is done — now the game begins.',q:'21',sub1:'− 8',rem:'4',down:'',sub2:'− 4',focus:''}
    ]
  };

  const css=`
    .pk2{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;background:rgba(24,14,9,.94);backdrop-filter:blur(4px)}
    .pk2.show{display:flex}
    .pk2-card{width:min(430px,100%);max-height:calc(100dvh - 28px);overflow:auto;background:#fff4d6;color:#3f2d21;border:2px solid #d6a758;border-radius:22px;padding:14px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.48)}
    .pk2-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
    .pk2-badge{font-size:13px;font-weight:950;color:#2e75a6;background:#e5f3ff;border-radius:999px;padding:6px 10px}
    .pk2-tools{display:flex;align-items:center;gap:8px}.pk2-count{font-size:13px;font-weight:900;color:#80664c}
    .pk2-lang{display:flex;background:#eee3d3;border-radius:999px;padding:2px;gap:2px}.pk2-lang button{border:0;background:transparent;border-radius:999px;padding:5px 7px;font:900 11px/1 system-ui;color:#745a42}.pk2-lang button.on{background:#75aa45;color:#fff}
    .pk2-title{font-size:21px;font-weight:950;line-height:1.16;margin:0 0 9px}
    .pk2-board{position:relative;height:154px;background:#fffaf0;border:1px solid #e5ce9c;border-radius:15px;margin-bottom:11px;overflow:hidden;background-image:linear-gradient(rgba(82,147,190,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(82,147,190,.08) 1px,transparent 1px);background-size:28px 28px}
    .pk2-long{position:absolute;left:50%;top:10px;width:230px;height:135px;transform:translateX(-50%);font:900 27px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#352820}
    .pk2-src{position:absolute;left:30px;top:18px;letter-spacing:8px}.pk2-src span{display:inline-block;min-width:18px;text-align:center}.pk2-focus{background:#fff0b6;outline:3px solid #efb132;border-radius:7px}
    .pk2-divisor{position:absolute;left:151px;top:18px}.pk2-stem{position:absolute;left:137px;top:11px;height:108px;border-left:4px solid #283740}.pk2-bar{position:absolute;left:146px;top:48px;width:70px;border-top:4px solid #283740}
    .pk2-q{position:absolute;left:153px;top:57px;color:#609a36;letter-spacing:6px}.pk2-sub1{position:absolute;left:31px;top:50px;font-size:22px}.pk2-line1{position:absolute;left:48px;top:78px;width:45px;border-top:3px solid #3a3734}
    .pk2-rem{position:absolute;left:62px;top:84px;font-size:22px;color:#2f7fb3}.pk2-down{position:absolute;left:85px;top:82px;font-size:22px;color:#2f7fb3;animation:pk2down .72s ease-in-out infinite alternate}.pk2-sub2{position:absolute;left:55px;top:111px;font-size:20px}
    @keyframes pk2down{from{transform:translateY(-3px)}to{transform:translateY(5px)}}
    .pk2-text{font-size:16px;line-height:1.34;font-weight:750;margin:0 2px 12px}.pk2-text b{color:#236f9f}
    .pk2-next{width:100%;height:50px;border:0;border-radius:13px;background:linear-gradient(#8cc64a,#5aa02f);color:#fff;font:950 18px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 0 #3f7922;touch-action:manipulation}.pk2-next:active{transform:translateY(2px);box-shadow:0 2px 0 #3f7922}
    @media(max-width:430px){.pk2{padding:10px}.pk2-card{padding:12px}.pk2-title{font-size:19px}.pk2-text{font-size:15px}.pk2-board{height:148px}.pk2-long{top:8px}}
  `;

  function addStyle(){if($('pk2-style'))return;const s=document.createElement('style');s.id='pk2-style';s.textContent=css;document.head.appendChild(s)}
  function pageLang(){return document.querySelector('.langBtn.active')?.dataset.lang==='en'?'en':'ru'}
  function setPageLang(l){const btn=document.querySelector(`.langBtn[data-lang="${l}"]`);if(btn&&!btn.classList.contains('active'))btn.click()}

  function ensureModal(){
    let w=$('pk2');if(w)return w;
    w=document.createElement('div');w.id='pk2';w.className='pk2';w.setAttribute('aria-hidden','true');
    w.innerHTML=`<div class="pk2-card" role="dialog" aria-modal="true">
      <div class="pk2-top"><div class="pk2-badge" id="pk2-badge"></div><div class="pk2-tools"><div class="pk2-count" id="pk2-count"></div><div class="pk2-lang"><button id="pk2-ru" type="button">RU</button><button id="pk2-en" type="button">EN</button></div></div></div>
      <div class="pk2-title" id="pk2-title"></div>
      <div class="pk2-board"><div class="pk2-long"><div class="pk2-src"><span id="pk2-d8">8</span><span id="pk2-d4">4</span></div><div class="pk2-divisor">4</div><div class="pk2-stem"></div><div class="pk2-bar"></div><div class="pk2-q" id="pk2-q"></div><div class="pk2-sub1" id="pk2-sub1"></div><div class="pk2-line1"></div><div class="pk2-rem" id="pk2-rem"></div><div class="pk2-down" id="pk2-down"></div><div class="pk2-sub2" id="pk2-sub2"></div></div></div>
      <div class="pk2-text" id="pk2-text"></div><button class="pk2-next" id="pk2-next" type="button"></button>
    </div>`;
    document.body.appendChild(w);
    $('pk2-ru').addEventListener('click',()=>{tutorialLang='ru';step=0;render()});$('pk2-en').addEventListener('click',()=>{tutorialLang='en';step=0;render()});
    $('pk2-next').addEventListener('click',()=>{const a=slides[tutorialLang];if(step<a.length-1){step++;render();return}finish()});
    return w;
  }

  function render(){
    const a=slides[tutorialLang],s=a[step];$('pk2-badge').textContent=tutorialLang==='ru'?'Пробный пример':'Practice example';$('pk2-count').textContent=`${step+1} / ${a.length}`;$('pk2-title').textContent=s.title;$('pk2-text').innerHTML=s.text;$('pk2-q').textContent=s.q;$('pk2-sub1').textContent=s.sub1;$('pk2-rem').textContent=s.rem;$('pk2-down').textContent=s.down;$('pk2-sub2').textContent=s.sub2;$('pk2-d8').classList.toggle('pk2-focus',s.focus==='8');$('pk2-d4').classList.toggle('pk2-focus',s.focus==='4');$('pk2-ru').classList.toggle('on',tutorialLang==='ru');$('pk2-en').classList.toggle('on',tutorialLang==='en');$('pk2-next').textContent=step===a.length-1?(tutorialLang==='ru'?'Начать игру':'Start game'):(tutorialLang==='ru'?'Дальше':'Next')
  }

  function show(){tutorialLang=pageLang();step=0;const w=ensureModal();render();w.classList.add('show');w.setAttribute('aria-hidden','false');document.activeElement?.blur?.()}
  function finish(){const w=$('pk2');if(w){w.classList.remove('show');w.setAttribute('aria-hidden','true')}setPageLang(tutorialLang);bypassStart=true;requestAnimationFrame(()=>{$('nameStart')?.click();bypassStart=false})}

  function install(){
    if(installed)return;const btn=$('nameStart'),input=$('playerName');if(!btn||!input)return;installed=true;
    btn.addEventListener('click',e=>{if(bypassStart)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
    input.addEventListener('keydown',e=>{if(e.key!=='Enter'||bypassStart)return;e.preventDefault();e.stopImmediatePropagation();show()},true);
  }

  document.addEventListener('DOMContentLoaded',()=>{addStyle();install()});
})();
