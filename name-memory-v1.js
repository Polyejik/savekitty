(()=>{
 const K='savekitty_player_name_v1';
 function saved(){try{return (localStorage.getItem(K)||'').trim()}catch(e){return''}}
 function store(v){v=(v||'').trim();if(v)try{localStorage.setItem(K,v)}catch(e){}}
 function nameInput(){return document.getElementById('playerName')||document.querySelector('.nameGate input,input[name="playerName"]')}
 function startButton(inp){let root=inp?.closest('.nameGate')||inp?.parentElement?.parentElement||document;return [...root.querySelectorAll('button')].find(b=>/начать|играть|start|play/i.test(b.textContent||''))}
 function fill(){let i=nameInput();if(!i)return;let n=saved();if(n&&!i.value){i.value=n;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}}
 // Save the name whenever the player starts for the first time.
 document.addEventListener('input',e=>{if(e.target===nameInput())store(e.target.value)},true);
 document.addEventListener('click',e=>{let i=nameInput();if(i&&e.target.closest('button'))store(i.value)},true);
 // When "New game" is pressed and we already know the player, skip the repeated name gate.
 document.addEventListener('click',e=>{let b=e.target.closest('button,a');if(!b||!/новая игра|сыграть ещё|new game|play again/i.test(b.textContent||''))return;let n=saved();if(!n)return;setTimeout(()=>{let i=nameInput();if(!i)return;i.value=n;i.dispatchEvent(new Event('input',{bubbles:true}));let s=startButton(i);if(s)setTimeout(()=>s.click(),40)},80)},true);
 addEventListener('DOMContentLoaded',()=>{fill();let o=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'))fill()});o.observe(document.body,{childList:true,subtree:true})});
})();