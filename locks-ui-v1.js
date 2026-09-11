(()=>{
  const css=`
    .locks{gap:5px!important;background:linear-gradient(180deg,#241914,#1b120f)!important;border:1px solid #5d4030!important;padding:6px!important;box-shadow:inset 0 1px rgba(255,255,255,.04)!important}
    .lock{height:42px!important;border-radius:10px!important;background:linear-gradient(180deg,#403936,#2b2725)!important;border:1px solid #655954!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 4px rgba(0,0,0,.22)!important;overflow:visible!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important}
    .lock:before{content:''!important;position:absolute!important;width:18px!important;height:17px!important;border:3px solid #817874!important;border-bottom:0!important;border-radius:10px 10px 0 0!important;top:3px!important;left:50%!important;transform:translateX(-50%)!important;box-sizing:border-box!important}
    .lock:after{content:''!important;position:absolute!important;width:5px!important;height:7px!important;border-radius:50% 50% 40% 40%!important;background:#171311!important;top:20px!important;left:50%!important;transform:translateX(-50%)!important;box-shadow:0 0 0 1px rgba(255,255,255,.04)!important}
    .lock strong{position:absolute!important;bottom:3px!important;left:0!important;right:0!important;text-align:center!important;font-size:10px!important;font-weight:900!important;color:#cfc7c2!important;z-index:2!important;text-shadow:0 1px 1px #000!important}
    .lock.current{transform:translateY(-1px)!important;background:linear-gradient(180deg,#5a4630,#3a2b20)!important;border-color:#e0a640!important;box-shadow:0 0 0 2px #f7cc69,0 0 10px rgba(231,170,65,.34),inset 0 1px rgba(255,255,255,.12)!important}
    .lock.current:before{border-color:#d2a45b!important}
    .lock.current:after{background:#f0b947!important;box-shadow:0 0 5px rgba(255,194,78,.45)!important}
    .lock.current strong{color:#ffe3a3!important}
    .lock.open{background:linear-gradient(180deg,#c47c32,#8a4b22)!important;border-color:#d79b54!important;box-shadow:inset 0 1px rgba(255,255,255,.16),0 2px 5px rgba(61,29,8,.26)!important}
    .lock.open:before{border-color:#d7a15d!important;transform:translateX(-33%) rotate(25deg)!important;transform-origin:left bottom!important}
    .lock.open:after{background:#5e3519!important}
    .lock.open strong{color:#fff0c9!important;text-shadow:0 1px 1px #5b2f13!important}
    @media(max-width:430px){.locks{gap:4px!important;padding:5px!important}.lock{height:38px!important}.lock:before{width:16px!important;height:15px!important}.lock:after{top:18px!important}.lock strong{font-size:9px!important}}
  `;
  function install(){if(document.getElementById('locks-ui-v1-style'))return;const s=document.createElement('style');s.id='locks-ui-v1-style';s.textContent=css;document.head.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
