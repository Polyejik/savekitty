(()=>{
const KEY='savekitty_player_name_v1';let pending=false;
function getName(){try{return(localStorage.getItem(KEY)||'').trim()}catch(e){return''}}
function saveName(v){v=(v||'').trim();if(v)try{localStorage.setItem(KEY,v)}catch(e){}}
function field(){return document.getElementById('playerName')||document.querySelector('.nameGate input,input[name="playerName"]')}
function findStart(i){let root=i?.closest('.nameGate')||i?.parentElement?.parentElement||document;let buttons=[...root.querySelectorAll('button')];return buttons.find(b=>/начать|играть|start|play/i.test(b.textContent||''))}
function fillAndStart(){if(!pending)return;let n=getName(),i=field();if(!n||!i)return;i.value=n;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));let b=findStart(i);if(b){pending=false;requestAnimationFrame(()=>b.click())}}
document.addEventListener('input',e=>{if(e.target===field())saveName(e.target.value)},true);
document.addEventListener('click',e=>{let b=e.target.closest('button,a');if(!b)return;let i=field();if(i)saveName(i.value);if(/новая игра|сыграть ещё|ещё раз|new game|play again/i.test(b.textContent||'')&&getName()){pending=true;setTimeout(fillAndStart,0);setTimeout(fillAndStart,80);setTimeout(fillAndStart,250);setTimeout(fillAndStart,600)}},true);
addEventListener('DOMContentLoaded',()=>{let i=field(),n=getName();if(i&&n&&!i.value){i.value=n;i.dispatchEvent(new Event('input',{bubbles:true}))}let o=new MutationObserver(()=>fillAndStart());o.observe(document.body,{childList:true,subtree:true})});
})();