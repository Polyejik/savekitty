(()=>{
  const TOTAL_ROWS=8;
  const HERO_PARTS=9;
  const $=id=>document.getElementById(id);

  const css=`
    :root{--pk-cell:24px;--pk-sign:17px}
    .steps{display:none!important}
    .action{box-sizing:border-box!important;min-height:0!important;padding:10px!important}
    #actionTitle{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}
    #actionText{height:36px!important;min-height:36px!important;margin:4px 0 0!important;display:flex!important;align-items:center!important;overflow:hidden!important;line-height:1.18!important}
    .step1-compact #actionText{visibility:hidden!important}
    .question,.action.step1-compact .question{height:50px!important;min-height:50px!important;margin-top:6px!important;display:flex!important;align-items:center!important;overflow:hidden!important;box-sizing:border-box!important}
    .answerRow{height:46px!important;min-height:46px!important;margin-top:6px!important}
    .answerRow input,.ok{height:46px!important}
    .feedback{height:34px!important;min-height:34px!important;margin-top:6px!important;padding:6px 8px!important;overflow:hidden!important;box-sizing:border-box!important}

    .mathCard{height:220px!important;min-height:220px!important;max-height:220px!important;overflow:hidden!important;padding-bottom:5px!important}
    .corner{height:192px!important;min-height:192px!important;max-height:192px!important;align-items:start!important}
    .grid{height:192px!important;min-height:192px!important;max-height:192px!important;align-content:start!important;overflow:hidden!important}
    .mrow{height:var(--pk-cell)!important;min-height:var(--pk-cell)!important;grid-template-columns:var(--pk-sign) repeat(var(--n),var(--pk-cell))!important}
    .cell,.scell{width:var(--pk-cell)!important;height:var(--pk-cell)!important;font-size:18px!important}
    .sign{width:var(--pk-sign)!important;height:var(--pk-cell)!important;font-size:14px!important}
    .rhsRow{height:var(--pk-cell)!important;min-height:var(--pk-cell)!important}
    .pk-placeholder{visibility:hidden!important;pointer-events:none!important}

    #pushok-keypad{width:100%;margin:7px auto 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;box-sizing:border-box;user-select:none;-webkit-user-select:none}
    #pushok-keypad button{appearance:none;-webkit-appearance:none;border:1px solid #d9bb7d;border-bottom-width:3px;border-radius:11px;min-height:39px;padding:4px;background:linear-gradient(#fffdf7,#f8ecd1);color:#4a3424;font:900 20px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 2px 0 rgba(104,69,35,.1);touch-action:manipulation}
    #pushok-keypad button:active{transform:translateY(1px);border-bottom-width:2px;background:#f4e2bd}
    #pushok-keypad .pk-zero{grid-column:1/span 2}
    #pushok-keypad .pk-delete{background:linear-gradient(#f7eee4,#ead8c5);color:#65452f}

    .locksMeta{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:7px!important;align-items:stretch!important;margin-top:8px!important}
    .locksMeta .locks{min-width:0!important;margin-top:0!important}
    .locksMeta .honorBtn{min-width:46px!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important}
    .hero img{image-rendering:auto!important;filter:none!important;object-fit:cover!important;object-position:center center!important}
    .winVideo{pointer-events:none!important}
    .winVideo::-webkit-media-controls{display:none!important}

    @media(max-width:600px){.locksMeta .honorBtn{width:46px!important;padding:0!important;font-size:0!important}.locksMeta .honorBtn:before{content:'🏆';font-size:19px}.hero{height:228px!important}}
    @media(max-width:430px){
      :root{--pk-cell:23px;--pk-sign:16px}
      .mathCard{height:212px!important;min-height:212px!important;max-height:212px!important}
      .corner,.grid{height:184px!important;min-height:184px!important;max-height:184px!important}
      #actionText{height:34px!important;min-height:34px!important;font-size:13px!important}
      .question,.action.step1-compact .question{height:48px!important;min-height:48px!important}
      #pushok-keypad button{min-height:38px;font-size:20px}
    }
    @media(min-width:760px){
      :root{--pk-cell:32px;--pk-sign:22px}
      .mathCard{height:284px!important;min-height:284px!important;max-height:284px!important}
      .corner,.grid{height:256px!important;min-height:256px!important;max-height:256px!important}
      .cell,.scell{font-size:23px!important}.sign{font-size:17px!important}
      #pushok-keypad{grid-template-columns:repeat(5,minmax(0,1fr));max-width:520px}
      #pushok-keypad .pk-zero{grid-column:auto}
      #pushok-keypad button{min-height:44px;font-size:21px}
    }
  `;

  function addStyles(){
    if($('pushok-ui-v4-style')) return;
    const s=document.createElement('style');s.id='pushok-ui-v4-style';s.textContent=css;document.head.appendChild(s);
  }

  function findAnswer(){
    return $('answer')||[...document.querySelectorAll('input')].find(el=>el.id!=='playerName'&&!el.closest('.nameGate'))||null;
  }

  function fireInput(input){input.dispatchEvent(new Event('input',{bubbles:true}))}
  function typeDigit(d){const input=findAnswer();if(!input||input.disabled)return;let v=String(input.value||'').replace(/\D/g,'');if(v.length>=6)return;input.value=v+d;fireInput(input)}
  function erase(){const input=findAnswer();if(!input||input.disabled)return;input.value=String(input.value||'').slice(0,-1);fireInput(input)}

  function ensureKeypad(){
    const input=findAnswer();if(!input)return;
    input.readOnly=true;input.setAttribute('inputmode','none');input.setAttribute('autocomplete','off');
    let pad=$('pushok-keypad');
    if(!pad){
      pad=document.createElement('div');pad.id='pushok-keypad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Цифровая клавиатура');
      ['1','2','3','4','5','6','7','8','9'].forEach(n=>{const b=document.createElement('button');b.type='button';b.dataset.key=n;b.textContent=n;pad.appendChild(b)});
      const zero=document.createElement('button');zero.type='button';zero.dataset.key='0';zero.textContent='0';zero.className='pk-zero';pad.appendChild(zero);
      const del=document.createElement('button');del.type='button';del.dataset.key='back';del.textContent='⌫';del.className='pk-delete';del.setAttribute('aria-label','Стереть');pad.appendChild(del);
      pad.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.dataset.key==='back'?erase():typeDigit(b.dataset.key)});
      const row=input.closest('.answerRow')||input.parentElement;row.insertAdjacentElement('afterend',pad);
    }
    pad.querySelectorAll('button').forEach(b=>b.disabled=!!input.disabled);
  }

  function ensureRows(){
    const grid=$('grid');if(!grid)return;
    const existing=[...grid.children].filter(x=>x.classList&&x.classList.contains('mrow'));
    const n=Math.max(1,(existing[0]?.children.length||5)-1);
    for(let k=existing.length;k<TOTAL_ROWS;k++){
      const r=document.createElement('div');r.className='mrow pk-placeholder';r.style.setProperty('--n',n);
      const sg=document.createElement('div');sg.className='sign';sg.innerHTML='&nbsp;';r.appendChild(sg);
      for(let i=0;i<n;i++){const c=document.createElement('div');c.className='cell';c.innerHTML='&nbsp;';r.appendChild(c)}
      grid.appendChild(r);
    }
  }

  function compactStep(){
    const t=$('actionTitle');if(t)t.textContent='';
    const action=document.querySelector('.action');
    const text=$('actionText');
    if(action&&text&&action.classList.contains('step1-compact')) text.style.visibility='hidden';
    else if(text) text.style.visibility='visible';
  }

  function placeHall(){
    const locks=$('locks'),btn=$('honorBtn');if(!locks||!btn||locks.closest('.locksMeta'))return;
    const shell=document.createElement('div');shell.className='locksMeta';locks.parentNode.insertBefore(shell,locks);shell.appendChild(locks);shell.appendChild(btn);btn.title='Доска почёта / Hall of Fame';
  }

  async function loadHero(){
    const hero=document.querySelector('.hero img');if(!hero||hero.dataset.hq==='1'||hero.dataset.hq==='loading')return;
    hero.dataset.hq='loading';
    try{
      const parts=await Promise.all(Array.from({length:HERO_PARTS},(_,i)=>fetch(`_hero/p${String(i).padStart(2,'0')}.b64?v=4`,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()})));
      const raw=atob(parts.join('').replace(/\s+/g,''));const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
      hero.onload=()=>{hero.dataset.hq='1';hero.style.opacity='1'};hero.style.opacity='0';hero.style.transition='opacity .15s ease';hero.src=url;
    }catch(e){hero.dataset.hq='0';hero.style.opacity='1';console.warn('HQ Pushok',e)}
  }

  function cleanVideo(){const v=$('winVideo');if(!v)return;v.removeAttribute('controls');v.controls=false;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','')}
  function stabilize(){addStyles();ensureKeypad();ensureRows();compactStep();placeHall();cleanVideo()}

  document.addEventListener('DOMContentLoaded',()=>{stabilize();loadHero();new MutationObserver(()=>stabilize()).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','style']})});
  document.addEventListener('keydown',e=>{const ae=document.activeElement;if(ae&&ae.id==='playerName')return;if(/^\d$/.test(e.key)){e.preventDefault();typeDigit(e.key)}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase()}else if(e.key==='Enter'){const ok=$('ok');if(ok&&!ok.disabled){e.preventDefault();ok.click()}}});
})();
