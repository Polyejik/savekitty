// Private collaboration rooms. Possession of a role link grants only that room's role.
// Raw access tokens are returned once; the database stores SHA-256 digests only.
export const PARTNER_SCHEMA_SQL = `DO $partner$
BEGIN
 CREATE TABLE IF NOT EXISTS public.partner_rooms (
  id uuid PRIMARY KEY, campaign_id text NOT NULL REFERENCES public.campaigns(id),
  title text NOT NULL, admin_hash text NOT NULL, fund_hash text NOT NULL, sponsor_hash text NOT NULL,
  creator_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS public.partner_events (
  id uuid PRIMARY KEY, room_id uuid NOT NULL REFERENCES public.partner_rooms(id),
  role text NOT NULL CHECK(role IN ('admin','fund','sponsor')),
  kind text NOT NULL CHECK(kind IN ('need','pledge','transfer','receipt','report','message')),
  subject text NOT NULL, body text NOT NULL DEFAULT '', amount numeric(12,2),
  due_date date, document_url text NOT NULL DEFAULT '', related_id uuid REFERENCES public.partner_events(id),
  created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE INDEX IF NOT EXISTS partner_events_room ON public.partner_events(room_id,created_at);
 ALTER TABLE public.partner_rooms ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.partner_events ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON public.partner_rooms,public.partner_events FROM PUBLIC,anon,authenticated;
END $partner$;`;
let prepared=false;
export async function ensurePartnerSchema(c){if(!prepared){await c.query(PARTNER_SCHEMA_SQL);prepared=true}}
const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
async function bodyOf(request){const body=await request.text();if(body.length>12000)fail(413,'Слишком длинное сообщение');try{const result=JSON.parse(body);if(!result||typeof result!=='object'||Array.isArray(result))fail(400,'Некорректные данные');return result}catch{fail(400,'Некорректные данные')}}
const text=(v,max)=>String(v||'').trim().slice(0,max);
const publicEvent='id,room_id,role,kind,subject,body,amount,due_date,document_url,related_id,created_at';
export async function handlePartnerRequest(request,env,{withDb,json}){
 const url=new URL(request.url),match=url.pathname.match(/^\/partner-rooms\/([0-9a-f-]{36})(?:\/(events|invites))?$/i);
 if(url.pathname!='/partner-rooms'&&!match)return null;
 try{
  if(url.pathname==='/partner-rooms'&&request.method==='POST'){
   const b=await bodyOf(request),title=text(b.title,100);if(title.length<3)fail(400,'Назовите рабочую комнату');
   const id=crypto.randomUUID(),keys={admin:token(),fund:token(),sponsor:token()};
   const hashes=await Promise.all(Object.values(keys).map(digest));
   const ipHash=await digest(new Date().toISOString().slice(0,10)+'|'+(request.headers.get('CF-Connecting-IP')||'unknown'));
   await withDb(env,async c=>{
    await ensurePartnerSchema(c);await c.query('BEGIN');
    try{
     await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[ipHash]);
     const limit=(await c.query("SELECT count(*)::int n FROM public.partner_rooms WHERE creator_hash=$1 AND created_at>now()-interval '1 day'",[ipHash])).rows[0].n;
     if(limit>=5)fail(429,'На сегодня достаточно комнат. Используйте уже созданную.');
     await c.query('INSERT INTO public.partner_rooms(id,campaign_id,title,admin_hash,fund_hash,sponsor_hash,creator_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,'save-pushok-pilot',title,...hashes,ipHash]);
     await c.query('COMMIT');
    }catch(e){await c.query('ROLLBACK');throw e}
   });
   return json(request,{ok:true,room:{id,title},access:keys},201);
  }
  if(!match||!uuid(match[1]))return json(request,{ok:false,error:'Комната не найдена'},404);
  const secret=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!/^[a-f0-9]{64}$/.test(secret))fail(401,'Откройте личную ссылку приглашения');
  const hash=await digest(secret),roomId=match[1];
  return await withDb(env,async c=>{
   await ensurePartnerSchema(c);
   // A real volatile value makes permission reads non-cacheable in Hyperdrive.
   const room=(await c.query(`SELECT id,title,campaign_id,created_at,clock_timestamp() AS checked_at,
    CASE WHEN admin_hash=$2 THEN 'admin' WHEN fund_hash=$2 THEN 'fund' WHEN sponsor_hash=$2 THEN 'sponsor' END AS role
    FROM public.partner_rooms WHERE id=$1 AND $2 IN(admin_hash,fund_hash,sponsor_hash)`,[roomId,hash])).rows[0];
   if(!room)fail(403,'Приглашение недействительно или отозвано');
   if(request.method==='GET'&&!match[2]){
    const events=(await c.query(`SELECT ${publicEvent},clock_timestamp() AS checked_at FROM public.partner_events WHERE room_id=$1 ORDER BY created_at,id LIMIT 1000`,[roomId])).rows;
    return json(request,{ok:true,room,events});
   }
   if(request.method==='POST'&&match[2]==='invites'){
    if(room.role!=='admin')fail(403,'Приглашения обновляет только организатор');
    const b=await bodyOf(request);if(!['fund','sponsor'].includes(b.role))fail(400,'Выберите фонд или спонсора');
    const key=token(),column=b.role==='fund'?'fund_hash':'sponsor_hash';
    await c.query(`UPDATE public.partner_rooms SET ${column}=$2 WHERE id=$1`,[roomId,await digest(key)]);
    return json(request,{ok:true,role:b.role,token:key});
   }
   if(request.method==='POST'&&match[2]==='events'){
    const b=await bodyOf(request),kind=b.kind;
    const roles={need:['fund','admin'],pledge:['sponsor','admin'],transfer:['sponsor','admin'],receipt:['fund','admin'],report:['fund','admin'],message:['fund','sponsor','admin']};
    if(!roles[kind]?.includes(room.role))fail(403,'Это действие недоступно вашей роли');
    if(!uuid(b.id))fail(400,'Не указан идентификатор записи');
    const subject=text(b.subject,160),body=text(b.body,4000);if(!subject)fail(400,'Добавьте заголовок');
    const financial=['need','pledge','transfer','receipt'].includes(kind);
    const amount=financial?Number(b.amount):null;
    if(financial&&(!Number.isFinite(amount)||amount<=0||amount>999999999||Math.abs(amount*100-Math.round(amount*100))>0.00001))fail(400,'Введите сумму в рублях, до двух знаков после запятой');
    const due=b.due_date||null,date=due?new Date(due+'T00:00:00Z'):null;if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==due))fail(400,'Проверьте дату');
    const doc=text(b.document_url,1500);if(doc){let u;try{u=new URL(doc)}catch{fail(400,'Проверьте ссылку на документ')}if(u.protocol!=='https:'||u.username||u.password)fail(400,'Нужна ссылка https:// без пароля')}
    const relation=b.related_id||null;if(relation&&!uuid(relation))fail(400,'Выберите связанную запись');
    const expected={pledge:'need',transfer:'pledge',receipt:'transfer'}[kind];if(expected&&!relation)fail(400,'Выберите связанную потребность или платёж');
    await c.query('BEGIN');
    try{
     await c.query('SELECT id FROM public.partner_rooms WHERE id=$1 FOR UPDATE',[roomId]);
     const duplicate=(await c.query(`SELECT ${publicEvent},clock_timestamp() AS checked_at FROM public.partner_events WHERE id=$1`,[b.id])).rows[0];
     if(duplicate){if(duplicate.room_id!==roomId||duplicate.role!==room.role)fail(409,'Идентификатор уже использован');
      const same=duplicate.kind===kind&&duplicate.subject===subject&&duplicate.body===body&&Number(duplicate.amount)===Number(amount)&&(duplicate.due_date?new Date(duplicate.due_date).toISOString().slice(0,10):'')===String(due||'')&&duplicate.document_url===doc&&duplicate.related_id===relation;
      if(!same)fail(409,'Запись с этим номером уже сохранена с другими данными. Обновите комнату перед новой записью.');await c.query('COMMIT');return json(request,{ok:true,event:duplicate})}
     if(relation){
      const related=(await c.query('SELECT kind,amount,clock_timestamp() AS checked_at FROM public.partner_events WHERE id=$1 AND room_id=$2',[relation,roomId])).rows[0];
      if(!related||(expected&&related.kind!==expected))fail(400,'Связанная запись не подходит');
      if(expected){
       const used=Number((await c.query('SELECT coalesce(sum(amount),0) total,clock_timestamp() AS checked_at FROM public.partner_events WHERE room_id=$1 AND related_id=$2 AND kind=$3',[roomId,relation,kind])).rows[0].total);
       if(Math.round((used+amount)*100)>Math.round(Number(related.amount)*100))fail(400,'Сумма превышает остаток по связанной записи');
      }
     }
     const count=(await c.query('SELECT count(*)::int n,clock_timestamp() AS checked_at FROM public.partner_events WHERE room_id=$1',[roomId])).rows[0].n;
     if(count>=1000)fail(409,'Комната заполнена. Выгрузите отчёт и создайте новую.');
     const event=(await c.query(`INSERT INTO public.partner_events(id,room_id,role,kind,subject,body,amount,due_date,document_url,related_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${publicEvent}`,[b.id,roomId,room.role,kind,subject,body,amount,due,doc,relation])).rows[0];
     await c.query('COMMIT');return json(request,{ok:true,event},201);
    }catch(e){await c.query('ROLLBACK');throw e}
   }
   return json(request,{ok:false,error:'Действие не найдено'},404);
  });
 }catch(e){if(!e.status)console.error('Partner room request failed',e.code||'database');return json(request,{ok:false,error:e.status?e.message:'Не удалось сохранить данные. Попробуйте ещё раз.'},e.status||500)}
}
