(()=>{
  const CFG=window.SAVEKITTY_SUPABASE||{};
  if(!CFG.campaignId)return;

  const WORKER='https://spasipushka-api.kutuzovap.workers.dev/game-run';
  const ANALYTICS_KEY='savekitty_analytics_v1';
  const SENT_KEY='savekitty_supabase_sent_v2';
  const PLAYER_KEY='savekitty_player_id';
  const IDS_KEY='savekitty_completion_ids_v1';
  const RECEIPTS_KEY='savekitty_sync_receipts_v1';
  let receipts={};
  try{receipts=JSON.parse(localStorage.getItem(RECEIPTS_KEY)||'{}')||{}}catch{}
  let activeId=null;
  const tr=(ru,en)=>document.documentElement.lang==='en'?en:ru;
  function showStatus(text, pending=false){
    let box=document.getElementById('sk-sync');
    if(!box){const anchor=document.getElementById('winTime');if(!anchor)return;box=document.createElement('p');box.id='sk-sync';box.setAttribute('role','status');box.style.cssText='font-size:14px;color:#64533f;text-align:center;margin:10px 0';anchor.after(box)}
    box.textContent=text;
    if(pending){const b=document.createElement('button');b.type='button';b.textContent=tr('Повторить отправку','Retry sync');b.style.cssText='margin-left:8px;font:inherit;cursor:pointer';b.onclick=scan;box.append(b)}
  }
  function receiptText(row){
    if(row.status==='confirmed')return tr('Результат сохранён. Прохождение зачтено в помощь.','Result saved and counted toward support.');
    if(row.reason==='daily_limit')return tr('Результат сохранён. Лимит начислений: 3 прохождения за 24 часа.','Result saved. Support is limited to 3 games per 24 hours.');
    if(row.status==='too_fast')return tr('Результат сохранён. Быстрый тест менее 45 секунд — без начисления.','Result saved. Tests under 45 seconds do not count toward support.');
    return tr('Результат сохранён. Статус зачёта: ','Result saved. Status: ')+row.status;
  }
  let ids={};
  try{ids=JSON.parse(localStorage.getItem(IDS_KEY)||'{}')||{}}catch{}
  const sent=new Set();
  try{(JSON.parse(localStorage.getItem(SENT_KEY)||'[]')||[]).forEach(x=>sent.add(x))}catch(e){}

  function uuid(){
    if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
  }
  function validUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||'')}
  function playerId(){
    let p='';
    try{p=localStorage.getItem(PLAYER_KEY)||''}catch(e){}
    if(!validUuid(p)){
      p=uuid();
      try{localStorage.setItem(PLAYER_KEY,p)}catch(e){}
    }
    return p;
  }
  function isCompleted(e){return e?.event==='completed'||e?.completed===true}
  function duration(e){return Math.max(0,Math.round(Number(e?.duration_seconds??e?.duration_sec??e?.elapsed_sec)||0))}
  function eventKey(e){return [e?.started_at||'',e?.completed_at||'',e?.player_name||e?.name||'',duration(e)].join('|')}
  function persistSent(){try{localStorage.setItem(SENT_KEY,JSON.stringify([...sent].slice(-500)))}catch(e){}}

  async function submit(e,key){
    const lang=e?.language??e?.lang;
    let completionId=e.completion_id;
    if(!validUuid(completionId)){
      completionId=ids[key] || uuid();
      ids[key]=completionId;
      localStorage.setItem(IDS_KEY,JSON.stringify(ids));
    }
    const payload={
      completion_id:completionId,
      campaign_id:CFG.campaignId,
      player_id:playerId(),
      player_name:String(e?.player_name??e?.name??'Игрок').slice(0,60),
      language:lang==='en'?'en':'ru',
      started_at:e?.started_at||null,
      completed_at:e?.completed_at||new Date().toISOString(),
      duration_seconds:duration(e),
      locks_opened:9,
      examples_solved:9,
      game_version:String(e?.game_version||'1.5')
    };

    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    let r;
    try{r=await fetch(WORKER,{
      signal:controller.signal,
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      keepalive:true
    });}finally{clearTimeout(timeout)}

    if(!r.ok){
      const msg=(await r.text()).slice(0,300);
      try{localStorage.setItem('savekitty_supabase_last_error',JSON.stringify({at:new Date().toISOString(),status:r.status,msg}))}catch(e){}
      throw Object.assign(new Error('Sync '+r.status+' '+msg),{status:r.status});
    }

    const result=await r.json();
    if(!result.ok || result.row?.completion_id!==completionId || !result.row?.status)throw new Error('Server did not acknowledge this completion');
    receipts[completionId]={...result.row,acknowledged_at:new Date().toISOString()};
    localStorage.setItem(RECEIPTS_KEY,JSON.stringify(receipts));
    document.dispatchEvent(new CustomEvent('savekitty:synced',{detail:receipts[completionId]}));
    if(activeId===completionId)showStatus(receiptText(receipts[completionId]));

    sent.add(key);persistSent();
    try{
      localStorage.setItem('savekitty_supabase_last_ok',new Date().toISOString());
      localStorage.removeItem('savekitty_supabase_last_error');
    }catch(e){}
    console.info('[SaveKitty] result synced via Worker');
    return true;
  }

  let busy=false;
  async function scan(){
    if(busy)return;
    busy=true;
    try{
      let rows=[];
      try{rows=JSON.parse(localStorage.getItem(ANALYTICS_KEY)||'[]')||[]}catch(e){}
      for(const e of rows){
        if(!isCompleted(e))continue;
        const key=eventKey(e);
        // Reconcile old sent markers against actual server receipts. Stable IDs make retries safe.
        if(sent.has(key) && (!validUuid(e.completion_id) || receipts[e.completion_id]))continue;
        try{await submit(e,key)}catch(err){
          console.warn('[SaveKitty] sync pending',err);
          if(activeId)showStatus(tr('Результат на устройстве. Ожидает отправки в дашборд.','Result is saved on this device, waiting to sync.'),true);
          // A damaged old record must not block later valid games.
          if(err.status===400)continue;
          break;
        }
      }
    }finally{busy=false}
  }

  const nativeSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    const out=nativeSetItem.apply(this,arguments);
    if(this===localStorage && k===ANALYTICS_KEY){queueMicrotask(scan)}
    return out;
  };

  window.saveKittySupabaseSync=scan;
  document.addEventListener('savekitty:completed',event=>{activeId=event.detail?.completion_id;showStatus(tr('Сохраняем результат в дашборд…','Saving result to the dashboard…'));queueMicrotask(scan)});
  document.addEventListener('savekitty:reset',()=>{activeId=null;const box=document.getElementById('sk-sync');if(box)box.textContent=''});
  scan();
  setInterval(scan,15000);
  addEventListener('online',scan);
  addEventListener('pageshow',scan);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()});
})();
