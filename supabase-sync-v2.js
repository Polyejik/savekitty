(()=>{
  const CFG=window.SAVEKITTY_SUPABASE||{};
  if(!CFG.campaignId)return;

  const WORKER='https://spasipushka-api.kutuzovap.workers.dev/game-run';
  const ANALYTICS_KEY='savekitty_analytics_v1';
  const SENT_KEY='savekitty_supabase_sent_v2';
  const PLAYER_KEY='savekitty_player_id';
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
    const payload={
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

    const r=await fetch(WORKER,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      keepalive:true
    });

    if(!r.ok){
      const msg=(await r.text()).slice(0,300);
      try{localStorage.setItem('savekitty_supabase_last_error',JSON.stringify({at:new Date().toISOString(),status:r.status,msg}))}catch(e){}
      throw new Error('Sync '+r.status+' '+msg);
    }

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
        if(sent.has(key))continue;
        try{await submit(e,key)}catch(err){console.warn('[SaveKitty] sync pending',err);break}
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
  scan();
  setInterval(scan,1000);
  addEventListener('pageshow',scan);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scan()});
})();
