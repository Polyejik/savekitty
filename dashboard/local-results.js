(()=>{
 const q=id=>document.getElementById(id);if(!q('localRuns'))return;
 function render(){
  let rows=[],receipts={},sent=[];try{rows=JSON.parse(localStorage.getItem('savekitty_analytics_v1')||'[]');receipts=JSON.parse(localStorage.getItem('savekitty_sync_receipts_v1')||'{}')||{};sent=JSON.parse(localStorage.getItem('savekitty_supabase_sent_v2')||'[]')||[]}catch{}
  const list=q('localRuns');list.replaceChildren();
  const runs=(Array.isArray(rows)?rows:[]).filter(x=>x.event==='completed'||x.completed===true).slice(-10).reverse();
  for(const r of runs){const li=document.createElement('li'),receipt=receipts[r.completion_id];
   const when=new Date(r.completed_at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
   const legacySent=!r.completion_id&&sent.includes([r.started_at||'',r.completed_at||'',r.player_name||r.name||'',Math.round(Number(r.duration_seconds??r.duration_sec??r.elapsed_sec)||0)].join('|'));
   const status=!receipt?(legacySent?'Ранее отправлено старой версией · без квитанции':'Ждёт подтверждения сервера'):receipt.reason==='daily_limit'?'Сохранено · сверх лимита начислений':receipt.status==='too_fast'?'Сохранено · менее 45 секунд':receipt.status==='confirmed'?'Сохранено · зачтено в помощь':'Сохранено · '+receipt.status;
   li.textContent=when+' · '+Math.round(r.duration_seconds||0)+' сек. · '+status;list.append(li);
  }
  if(!runs.length){const li=document.createElement('li');li.textContent='В этом браузере нет сохранённых прохождений. Откройте игру на том устройстве, где играли.';list.append(li)}
 }
 q('retrySync').onclick=async()=>{q('retrySync').disabled=true;try{await window.saveKittySupabaseSync?.();render()}finally{q('retrySync').disabled=false}};
 document.addEventListener('savekitty:synced',render);addEventListener('storage',render);render();
})();
