(()=>{
  const ID='pushok-keypad';
  let answerInput=null;

  const css=`
    #${ID}{
      width:min(360px,100%);margin:10px auto 4px;
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;
      box-sizing:border-box;user-select:none;-webkit-user-select:none;
    }
    #${ID} .pk-key{
      appearance:none;-webkit-appearance:none;border:1px solid #d9bb7d;
      border-bottom-width:3px;border-radius:13px;min-height:48px;padding:7px 4px;
      background:linear-gradient(180deg,#fffdf7 0%,#f8ecd1 100%);
      color:#4a3424;font:900 22px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      box-shadow:0 2px 0 rgba(104,69,35,.10);touch-action:manipulation;cursor:pointer;
    }
    #${ID} .pk-key:active{transform:translateY(1px);border-bottom-width:2px;background:#f4e2bd}
    #${ID} .pk-zero{grid-column:1 / span 2}
    #${ID} .pk-delete{font-size:21px;background:linear-gradient(180deg,#f7eee4 0%,#ead8c5 100%);color:#65452f}
    #${ID} .pk-key:focus-visible{outline:3px solid rgba(210,157,63,.35);outline-offset:2px}
    @media(max-width:430px){
      #${ID}{gap:7px;margin-top:8px}
      #${ID} .pk-key{min-height:46px;border-radius:12px;font-size:21px}
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
    if(!answerInput) return;
    answerInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function typeDigit(d){
    if(!answerInput||answerInput.disabled) return;
    let v=String(answerInput.value||'').replace(/\D/g,'');
    const max=Math.max(1,Math.min(8,Number(answerInput.maxLength)>0?Number(answerInput.maxLength):6));
    if(v.length>=max) return;
    answerInput.value=v+d;
    fireInput();
  }

  function erase(){
    if(!answerInput||answerInput.disabled) return;
    answerInput.value=String(answerInput.value||'').slice(0,-1);
    fireInput();
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

  function place(){
    const input=findAnswer();
    if(!input) return;
    answerInput=input;
    input.readOnly=true;
    input.setAttribute('inputmode','none');
    input.setAttribute('autocomplete','off');
    input.setAttribute('aria-haspopup','false');

    const pad=build();
    if(pad.isConnected) return;
    const parent=input.parentElement;
    if(parent){
      const display=getComputedStyle(parent).display;
      if(display.includes('flex')||display.includes('grid')||parent.querySelector('button')) parent.insertAdjacentElement('afterend',pad);
      else input.insertAdjacentElement('afterend',pad);
    }else{
      input.insertAdjacentElement('afterend',pad);
    }
  }

  addStyles();
  place();
  new MutationObserver(place).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','disabled']});

  document.addEventListener('keydown',e=>{
    const ae=document.activeElement;
    if(ae&&ae!==answerInput&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return;
    if(/^\d$/.test(e.key)){e.preventDefault();typeDigit(e.key)}
    else if(e.key==='Backspace'&&answerInput){e.preventDefault();erase()}
  });
})();