(()=>{
  function install(){
    const f=document.getElementById('finish'),v=document.getElementById('winVideo');
    if(!f||!v)return;
    const b=document.createElement('button');b.id='sk-video-play';b.type='button';b.hidden=true;
    b.style.cssText='margin:0 auto 10px;min-height:46px;border:0;border-radius:14px;background:#f0b84a;color:#382711;font:900 14px system-ui;padding:10px 20px';
    v.insertAdjacentElement('afterend',b);
    v.controls=false;v.playsInline=true;v.removeAttribute('controls');
    v.style.setProperty('pointer-events','auto','important');
    let open=false;
    const label=()=>{b.textContent=document.documentElement.lang==='en'?'▶ Play video':'▶ Смотреть видео'};
    label();
    async function play(){try{await v.play();b.hidden=true}catch{if(open)b.hidden=false}}
    b.onclick=play;
    function sync(){
      const next=f.classList.contains('show');
      if(next===open)return;
      open=next;b.hidden=true;
      if(open){v.currentTime=0;play()}else v.pause();
    }
    new MutationObserver(sync).observe(f,{attributes:true,attributeFilter:['class']});
    new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    sync();
  }
  document.addEventListener('DOMContentLoaded',install);
})();
