(()=>{
  const CFG=window.SAVEKITTY_SUPABASE||{};
  if(!CFG.url||!CFG.anonKey||!CFG.campaignId)return;

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
  function eventKey(e){return [e?.started_at||'',e?.completed_at||'',e?.player_name||'',e?.duration_seconds||''].join('|')}
  function persistSent(){try{localStorage.setItem(SENT_KEY,JSON.stringify([...sent].slice(-500)))}catch(e){}}

  async function submit(e,key){
    const payload={
      campaign_id:CFG.campaignId,
      player_id:playerId(),
      player_name:String(e?.player_name||'Игрок').slice(0,60),
      language:e?.language==='en'?'en':'ru',
      started_at:e?.started_at||null,
      completed_at:e?.completed_at||new Date().toISOString(),
      duration_seconds:Math.max(0,Math.round(Number(e?.duration_seconds)||0)),
      locks_opened:9,
      examples_solved:9,
      game_version:String(e?.game_version||'1.5')
    };

    const r=await fetch(CFG.url.replace(/\/$/,'')+'/rest/v1/game_runs',{
      method:'POST',
      headers:{
        'apikey':CFG.anonKey,
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify(payload),
      keepalive:true
    });

    if(!r.ok){
      const msg=(await r.text()).slice(0,300);
      try{localStorage.setItem('savekitty_supabase_last_error',JSON.stringify({at:new Date().toISOString(),status:r.status,msg}))}catch(e){}
      throw new Error('Supabase '+r.status+' '+msg);
    }

    sent.add(key);persistSent();
    try{localStorage.setItem('savekitty_supabase_last_ok',new Date().toISOString())}catch(e){}
    console.info('[SaveKitty] result synced');
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
        if(!e?.completed)continue;
        const key=eventKey(e);
        if(sent.has(key))continue;
        try{await submit(e,key)}catch(err){console.warn('[SaveKitty] sync pending',err);break}
      }
    }finally{busy=false}
  }

  // Important on iPhone: sync immediately when the completed run is written,
  // so leaving the victory screen cannot lose the event.
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
