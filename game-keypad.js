(()=>{
  const ID='pushok-keypad';
  const TOTAL_MATH_ROWS=8; // dividend row + maximum 7 solution rows
  let answerInput=null;
  let heroObjectUrl=null;

  const css=`
    :root{--pk-cell:24px;--pk-sign:17px}

    #${ID}{
      width:min(360px,100%);margin:8px auto 3px;
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;
      box-sizing:border-box;user-select:none;-webkit-user-select:none;
    }
    #${ID} .pk-key{
      appearance:none;-webkit-appearance:none;border:1px solid #d9bb7d;
      border-bottom-width:3px;border-radius:12px;min-height:40px;padding:5px 4px;
      background:linear-gradient(180deg,#fffdf7 0%,#f8ecd1 100%);
      color:#4a3424;font:900 20px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      box-shadow:0 2px 0 rgba(104,69,35,.10);touch-action:manipulation;cursor:pointer;
    }
    #${ID} .pk-key:active{transform:translateY(1px);border-bottom-width:2px;background:#f4e2bd}
    #${ID} .pk-zero{grid-column:1 / span 2}
    #${ID} .pk-delete{font-size:19px;background:linear-gradient(180deg,#f7eee4 0%,#ead8c5 100%);color:#65452f}
    #${ID} .pk-key:focus-visible{outline:3px solid rgba(210,157,63,.35);outline-offset:2px}
    #${ID} .pk-key:disabled{opacity:.48;cursor:default;transform:none}

    /* Fixed math canvas: all possible rows exist from the first frame. */
    .mathCard{
      overflow:hidden!important;
      min-height:0!important;
      height:226px!important;
      box-sizing:border-box!important;
      padding-bottom:7px!important;
    }
    .corner{
      height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      min-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      max-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      align-items:start!important;
    }
    .grid{
      height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      min-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      max-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      align-content:start!important;overflow:hidden!important;
    }
    .mrow{
      min-height:var(--pk-cell)!important;height:var(--pk-cell)!important;
      grid-template-columns:var(--pk-sign) repeat(var(--n),var(--pk-cell))!important;
    }
    .cell,.scell{width:var(--pk-cell)!important;height:var(--pk-cell)!important;font-size:18px!important}
    .sign{width:var(--pk-sign)!important;height:var(--pk-cell)!important;font-size:14px!important}
    .rhsRow{min-height:var(--pk-cell)!important;height:var(--pk-cell)!important}
    .mrow.pk-placeholder{visibility:hidden;pointer-events:none}

    /* Step card keeps the same geometry on both steps. */
    .action{box-sizing:border-box!important;min-height:0!important}
    .step1-compact #actionTitle,.step1-compact #actionText{display:block!important;visibility:hidden!important}
    .action h2{min-height:21px!important;height:21px!important;margin:5px 0 2px!important;overflow:hidden!important}
    .action p{min-height:31px!important;height:31px!important;overflow:hidden!important;line-height:1.2!important}
    .question{min-height:52px!important;height:52px!important;display:flex!important;align-items:center!important;overflow:hidden!important;margin-top:6px!important}
    .action.step1-compact .question{margin-top:6px!important}
    .answerRow{min-height:46px!important;height:46px!important;margin-top:6px!important}
    .answerRow input,.ok{height:46px!important}
    .feedback{min-height:34px!important;height:34px!important;overflow:hidden!important;margin-top:6px!important;padding-top:6px!important;padding-bottom:6px!important;box-sizing:border-box!important}

    /* Hall of Fame is meta-navigation, beside the locks rather than inside the task flow. */
    .locksShell{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:stretch;min-width:0}
    .locksShell .locks{min-width:0}
    .locksShell .honorBtn{margin:0;min-width:46px;border-radius:13px;display:flex;align-items:center;justify-content:center}

    /* The supplied artwork is already cropped to the exact hero ratio, so no scaling artifacts. */
    .hero{background:#21140e!important}
    .hero img{image-rendering:auto!important;filter:none!important;object-fit:cover!important;object-position:center center!important}

    @media(max-width:600px){
      .locksShell .honorBtn{width:46px;padding:0!important;font-size:0!important}
      .locksShell .honorBtn:before{content:'🏆';font-size:19px}
    }
    @media(max-width:430px){
      #${ID}{gap:6px;margin-top:7px}
      #${ID} .pk-key{min-height:39px;border-radius:11px;font-size:20px}
      .mathCard{height:220px!important}
    }
    @media(min-width:760px){
      :root{--pk-cell:32px;--pk-sign:22px}
      .mathCard{height:294px!important}
      .corner,.grid{
        height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
        min-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
        max-height:calc(${TOTAL_MATH_ROWS} * var(--pk-cell))!important;
      }
      .cell,.scell{font-size:23px!important}
      .sign{font-size:17px!important}
      .hero img{height:100%!important;object-fit:cover!important;object-position:center center!important}
      #${ID}{grid-template-columns:repeat(5,minmax(0,1fr));max-width:520px}
      #${ID} .pk-zero{grid-column:auto}
      #${ID} .pk-key{min-height:44px;font-size:21px}
    }
  `;

  function addStyles(){
    if(document.getElementById(ID+'-style')) return;
    const s=document.createElement('style');s.id=ID+'-style';s.textContent=css;document.head.appendChild(s);
  }

  function looksLikeAnswer(el){
    if(!(el instanceof HTMLInputElement)) return false;
    if(el.id==='playerName'||el.closest('.nameGate')) return false;
    const sig=((el.id||'')+' '+(el.className||'')+' '+(el.name||'')).toLowerCase();
    const mode=(el.getAttribute('inputmode')||'').toLowerCase();
    const type=(el.getAttribute('type')||'text').toLowerCase();
    return type==='number'||type==='tel'||mode==='numeric'||mode==='decimal'||/(^|\s)(ans|answer|result|reply|response)(\s|$)/.test(sig)||/answer|ansinput|resultinput/.test(sig);
  }

  function visible(el){
    if(!el||el.disabled) return false;
    const st=getComputedStyle(el);
    return st.display!=='none'&&st.visibility!=='hidden';
  }

  function findAnswer(){
    const inputs=[...document.querySelectorAll('input')].filter(looksLikeAnswer);
    return inputs.find(visible)||inputs[0]||null;
  }

  function fireInput(){
    if(answerInput) answerInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function typeDigit(d){
    if(!answerInput||answerInput.disabled) return;
    let v=String(answerInput.value||'').replace(/\D/g,'');
    const max=Math.max(1,Math.min(8,Number(answerInput.maxLength)>0?Number(answerInput.maxLength):6));
    if(v.length>=max) return;
    answerInput.value=v+d;fireInput();
  }

  function erase(){
    if(!answerInput||answerInput.disabled) return;
    answerInput.value=String(answerInput.value||'').slice(0,-1);fireInput();
  }

  function makeKey(label,cls,aria,key){
    const b=document.createElement('button');
    b.type='button';b.className='pk-key '+(cls||'');b.textContent=label;b.setAttribute('aria-label',aria||label);b.dataset.key=key||label;
    return b;
  }

  function build(){
    let pad=document.getElementById(ID);
    if(pad) return pad;
    pad=document.createElement('div');pad.id=ID;pad.setAttribute('role','group');pad.setAttribute('aria-label','Цифровая клавиатура');
    ['1','2','3','4','5','6','7','8','9'].forEach(n=>pad.appendChild(makeKey(n,'','',n)));
    pad.appendChild(makeKey('0','pk-zero','0','0'));
    pad.appendChild(makeKey('⌫','pk-delete','Стереть последнюю цифру','backspace'));
    pad.addEventListener('click',e=>{
      const b=e.target.closest('.pk-key');if(!b) return;
      b.dataset.key==='backspace'?erase():typeDigit(b.dataset.key);
    });
    return pad;
  }

  function placeKeypad(){
    const input=findAnswer();
    if(!input) return;
    answerInput=input;
    input.readOnly=true;
    input.setAttribute('inputmode','none');
    input.setAttribute('autocomplete','off');
    input.setAttribute('aria-haspopup','false');

    const pad=build();
    [...pad.querySelectorAll('.pk-key')].forEach(k=>k.disabled=!!input.disabled);
    if(pad.isConnected) return;
    const parent=input.parentElement;
    if(parent){
      const display=getComputedStyle(parent).display;
      if(display.includes('flex')||display.includes('grid')||parent.querySelector('button')) parent.insertAdjacentElement('afterend',pad);
      else input.insertAdjacentElement('afterend',pad);
    }else input.insertAdjacentElement('afterend',pad);
  }

  function fillMathRows(){
    const grid=document.getElementById('grid');
    if(!grid) return;
    const n=Math.max(1,Number(getComputedStyle(grid).getPropertyValue('--n'))||grid.querySelector('.mrow')?.children.length-1||4);
    let rows=[...grid.children].filter(el=>el.classList&&el.classList.contains('mrow'));
    while(rows.length<TOTAL_MATH_ROWS){
      const row=document.createElement('div');
      row.className='mrow pk-placeholder';row.style.setProperty('--n',n);
      const sign=document.createElement('div');sign.className='sign';sign.innerHTML='&nbsp;';row.appendChild(sign);
      for(let i=0;i<n;i++){const c=document.createElement('div');c.className='cell';c.innerHTML='&nbsp;';row.appendChild(c)}
      grid.appendChild(row);rows.push(row);
    }
  }

  function placeHonor(){
    const btn=document.getElementById('honorBtn');
    const locks=document.getElementById('locks');
    if(!btn||!locks||locks.closest('.locksShell')) return;
    const shell=document.createElement('div');shell.className='locksShell';
    locks.parentNode.insertBefore(shell,locks);shell.appendChild(locks);shell.appendChild(btn);
    btn.title='Доска почёта / Hall of Fame';
  }

  async function upgradeHero(){
    const hero=document.querySelector('.hero img');
    if(!hero||hero.dataset.hq==='1'||hero.dataset.hq==='loading') return;
    hero.dataset.hq='loading';
    try{
      const r=await fetch('pushok-hero.b64?v=2',{cache:'reload'});
      if(!r.ok) throw new Error('hero '+r.status);
      const b64=(await r.text()).trim();
      const raw=atob(b64);const bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
      hero.onload=()=>{
        if(heroObjectUrl) URL.revokeObjectURL(heroObjectUrl);
        heroObjectUrl=url;hero.dataset.hq='1';hero.style.opacity='1';
      };
      hero.style.opacity='0';hero.style.transition='opacity .18s ease';hero.src=url;
    }catch(e){hero.dataset.hq='0';hero.style.opacity='1';console.warn('Pushok HQ image',e)}
  }

  function stabilize(){placeKeypad();fillMathRows();placeHonor();}

  addStyles();stabilize();upgradeHero();
  new MutationObserver(stabilize).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','disabled']});

  document.addEventListener('keydown',e=>{
    const ae=document.activeElement;
    if(ae&&ae!==answerInput&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return;
    if(/^\d$/.test(e.key)){e.preventDefault();typeDigit(e.key)}
    else if((e.key==='Backspace'||e.key==='Delete')&&answerInput){e.preventDefault();erase()}
  });
})();