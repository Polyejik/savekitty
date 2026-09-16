(()=>{
 const API='https://spasipushka-api.kutuzovap.workers.dev',q=id=>document.getElementById(id);
 const kinds={need:'Потребность фонда',pledge:'Обязательство спонсора',transfer:'Перечисление / передача помощи',receipt:'Подтверждение получения',report:'Отчёт фонда',message:'Сообщение'};
 const roles={admin:'Организатор',fund:'Фонд',sponsor:'Спонсор'};
 const allowed={admin:Object.keys(kinds),fund:['need','receipt','report','message'],sponsor:['pledge','transfer','message']};
 const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(n)||0)+' ₽';
 let session=null,data=null,loading=false,draftId=crypto.randomUUID();
 try{session=JSON.parse(sessionStorage.getItem('pushok_partner_session')||'null')}catch{}
 const hash=new URLSearchParams(location.hash.slice(1));
 if(hash.has('room')&&hash.has('key')){
  session={id:hash.get('room'),key:hash.get('key'),access:{}};
  sessionStorage.setItem('pushok_partner_session',JSON.stringify(session));history.replaceState(null,'',location.pathname);
 }
 function persist(){sessionStorage.setItem('pushok_partner_session',JSON.stringify(session))}
 function error(e){q('roomError').textContent=e.message||String(e);q('roomError').hidden=false}
 async function api(path,body,auth=true){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(API+path,{method:body?'POST':'GET',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json',...(auth&&session?{Authorization:'Bearer '+session.key}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const result=await response.json();if(!response.ok||!result.ok)throw Object.assign(new Error(result.error||'Не удалось загрузить данные'),{status:response.status});return result;
  }catch(e){if(e.name==='AbortError')throw new Error('Сервер не ответил вовремя. Повторите запрос — запись не продублируется.');throw e}finally{clearTimeout(timer)}
 }
 const link=key=>location.origin+location.pathname+'#room='+session.id+'&key='+key;
 function accessLinks(){
  q('accessLinks').replaceChildren();const keys={...(session.access||{}),[data.room.role]:session.key};
  for(const [role,key] of Object.entries(keys)){
   const row=document.createElement('div');row.className='access-link';
   const label=document.createElement('label');label.textContent=roles[role]+(role===data.room.role?' — моя ссылка':' — приглашение');
   const input=document.createElement('input');input.readOnly=true;input.value=link(key);input.setAttribute('aria-label',label.textContent);
   const button=document.createElement('button');button.type='button';button.className='refresh';button.textContent='Копировать';button.onclick=async()=>{try{await navigator.clipboard.writeText(input.value);button.textContent='Скопировано'}catch{input.focus();input.select();q('roomNotice').textContent='Ссылка выделена — скопируйте её вручную.'}};
   label.append(input);row.append(label,button);q('accessLinks').append(row);
  }
  q('rotateLinks').hidden=data.room.role!=='admin';
 }
 function configureForm(){
  const kind=q('eventKind').value,expected={pledge:'need',transfer:'pledge',receipt:'transfer'}[kind],old=q('eventRelated').value;
  q('eventRelated').replaceChildren();const none=new Option(expected?'Выберите запись…':'Без связи','');q('eventRelated').append(none);
  for(const e of data?.events||[])if(!expected||e.kind===expected){const used=(data.events||[]).filter(x=>x.related_id===e.id&&x.kind===kind).reduce((n,x)=>n+Number(x.amount||0),0);q('eventRelated').append(new Option(kinds[e.kind]+': '+e.subject+(expected?' · осталось '+money(Number(e.amount)-used):e.amount?' · '+money(e.amount):''),e.id))}
  if([...q('eventRelated').options].some(o=>o.value===old))q('eventRelated').value=old;
  q('eventRelated').required=Boolean(expected);q('amountField').hidden=!['need','pledge','transfer','receipt'].includes(kind);q('eventAmount').required=!q('amountField').hidden;
  const hints={need:'Фонд описывает, какая помощь нужна и к какому сроку.',pledge:'Спонсор выбирает потребность и фиксирует сумму, которую планирует выделить.',transfer:'Укажите уже совершённое перечисление или передачу помощи и ссылку на подтверждение.',receipt:'Фонд подтверждает фактически полученную помощь по записи спонсора.',report:'Расскажите, что удалось сделать, и приложите ссылку на отчёт.',message:'Уточните детали, задайте вопрос или согласуйте следующий шаг.'};
  q('actionHint').textContent=hints[kind]||'';
 }
 function renderHistory(){
  const box=q('roomEvents'),filter=q('eventFilter').value;box.replaceChildren();
  const items=data.events.filter(e=>filter==='all'||e.kind===filter||(filter==='finance'&&['pledge','transfer','receipt'].includes(e.kind)));
  for(const e of items.slice().reverse()){
   const article=document.createElement('article');article.className='room-event '+e.kind;
   const meta=document.createElement('small');meta.textContent=roles[e.role]+' · '+new Date(e.created_at).toLocaleString('ru-RU')+' · '+kinds[e.kind];
   const title=document.createElement('h3');title.textContent=e.subject;article.append(meta,title);
   if(e.amount){const amount=document.createElement('strong');amount.className='event-money';amount.textContent=money(e.amount);article.append(amount)}
   if(e.body){const p=document.createElement('p');p.textContent=e.body;article.append(p)}
   if(e.due_date){const p=document.createElement('p');p.className='muted';p.textContent='Срок / дата: '+String(e.due_date).slice(0,10);article.append(p)}
   if(e.related_id){const parent=data.events.find(x=>x.id===e.related_id);const p=document.createElement('p');p.className='muted';p.textContent='К записи: '+(parent?.subject||'Связанная запись');article.append(p)}
   if(e.document_url){try{const u=new URL(e.document_url);if(u.protocol==='https:'){const a=document.createElement('a');a.textContent='Открыть документ ↗';a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';article.append(a)}}catch{}}
   box.append(article);
  }
  if(!items.length){const p=document.createElement('p');p.className='room-empty';p.textContent=data.events.length?'В этой категории пока нет записей.':'История начнётся с первой потребности фонда или сообщения участникам.';box.append(p)}
 }
 function render(result){
  const previousRole=data?.room.role;data=result;
  q('roomStart').hidden=true;q('roomWorkspace').hidden=false;q('activeRoomTitle').textContent=data.room.title;q('roomRole').textContent='Ваш доступ: '+roles[data.room.role];
  if(previousRole!==data.room.role){q('eventKind').replaceChildren();for(const kind of allowed[data.room.role])q('eventKind').append(new Option(kinds[kind],kind))}
  for(const kind of ['need','pledge','transfer','receipt'])q(kind+'Total').textContent=money(data.events.filter(e=>e.kind===kind).reduce((n,e)=>n+Number(e.amount||0),0));
  q('eventCount').textContent=data.events.length+' записей';q('roomUpdated').textContent='Обновлено '+new Date().toLocaleTimeString('ru-RU');
  q('roomError').hidden=true;accessLinks();configureForm();renderHistory();
 }
 async function load(){if(!session||loading)return;loading=true;q('roomRefresh').disabled=true;try{render(await api('/partner-rooms/'+session.id))}catch(e){if(e.status===401||e.status===403){data=null;q('roomWorkspace').hidden=true;q('roomEvents').replaceChildren();q('accessLinks').replaceChildren();q('roomStart').hidden=false}error(e)}finally{loading=false;q('roomRefresh').disabled=false}}
 q('createRoom').onsubmit=async event=>{
  event.preventDefault();const button=q('createRoom').querySelector('button');button.disabled=true;
  try{const r=await api('/partner-rooms',{title:q('roomTitle').value},false);session={id:r.room.id,key:r.access.admin,access:r.access};persist();q('roomNotice').textContent='Комната создана. Сохраните ссылку организатора в разделе «Мой доступ и приглашения».';await load();q('roomWorkspace').querySelector('details').open=true}catch(e){error(e)}finally{button.disabled=false}
 };
 q('eventForm').onsubmit=async event=>{
  event.preventDefault();const body=Object.fromEntries(new FormData(q('eventForm')));body.id=draftId;
  if(!q('amountField').hidden)body.amount=Number(body.amount);else delete body.amount;
  q('eventFields').disabled=true;
  try{await api('/partner-rooms/'+session.id+'/events',body);draftId=crypto.randomUUID();q('eventForm').reset();q('roomNotice').textContent='Запись сохранена. Участники увидят её при обновлении комнаты.';await load()}catch(e){if(e.status===409)draftId=crypto.randomUUID();error(e)}finally{q('eventFields').disabled=false;configureForm()}
 };
 q('eventKind').onchange=configureForm;q('eventFilter').onchange=renderHistory;q('roomRefresh').onclick=load;
 q('roomExit').onclick=()=>{sessionStorage.removeItem('pushok_partner_session');session=null;data=null;q('roomWorkspace').hidden=true;q('roomStart').hidden=false;q('roomNotice').textContent='Вы вышли. Для возвращения используйте свою сохранённую ссылку.'};
 for(const button of document.querySelectorAll('[data-rotate]'))button.onclick=async()=>{
  if(!confirm('Прежняя ссылка этой роли перестанет работать. Создать новое приглашение?'))return;button.disabled=true;
  try{const r=await api('/partner-rooms/'+session.id+'/invites',{role:button.dataset.rotate});session.access=session.access||{};session.access[r.role]=r.token;persist();accessLinks();q('roomNotice').textContent='Прежнее приглашение отозвано. Новое можно скопировать выше.'}catch(e){error(e)}finally{button.disabled=false}
 };
 q('roomExport').onclick=()=>{
  if(!data)return;const rows=[['Комната',data.room.title],['Дата','Роль','Тип','Заголовок','Описание','Сумма, руб.','Срок / дата','Документ'],...data.events.map(e=>[e.created_at,roles[e.role],kinds[e.kind],e.subject,e.body,e.amount,String(e.due_date||'').slice(0,10),e.document_url])];
  const cell=v=>'"'+String(v??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='pushok-partnership.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 load();setInterval(()=>{if(document.visibilityState==='visible')load()},30000);
})();
