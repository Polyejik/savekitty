(() => {
  const API='https://spasipushka-api.kutuzovap.workers.dev/dashboard?campaign=save-pushok-pilot';
  const q=id=>document.getElementById(id);
  const nf=n=>new Intl.NumberFormat('ru-RU').format(Math.round(Number(n)||0));
  const money=n=>nf(n)+' ₽';
  const tm=n=>{const s=Math.max(0,Math.round(Number(n)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const fields=['confirmed','donation','players','today','avg','repeat','raw','valid','dup','fast','rate','totalBudget','remain','days','limited'];
  let loading=false,lastData=null;
  function emptyRow(message){
    q('runs').replaceChildren();const tr=document.createElement('tr'),td=document.createElement('td');
    td.colSpan=5;td.className='table-empty';td.textContent=message;tr.append(td);q('runs').append(tr);
  }
  function blank(){
    lastData=null;q('exportCsv').disabled=true;fields.forEach(id=>q(id).textContent='—');q('budget').textContent='—';q('budgetPercent').textContent='—';
    q('budgetFill').style.width='0%';q('budgetProgress').removeAttribute('aria-valuenow');
    q('dailyChart').replaceChildren();q('dailyNote').textContent='История появится после восстановления связи.';
    emptyRow('Не удалось загрузить прохождения. Обновите показатели.');
  }
  function renderDays(days){
    const chart=q('dailyChart');chart.replaceChildren();
    const rows=Array.isArray(days)?days.slice(-14):[];
    if(!rows.length){q('dailyNote').textContent='История прохождений пока недоступна.';return}
    const max=Math.max(1,...rows.map(r=>Number(r.value)||0));
    for(const r of rows){
      const count=Math.max(0,Number(r.value)||0),date=new Date(r.day);
      const label=date.toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'});
      const col=document.createElement('div');col.className='chart-col';col.setAttribute('role','img');col.setAttribute('aria-label',label+': '+nf(count));col.title=label+' · прохождений: '+nf(count);
      const track=document.createElement('div');track.className='chart-track';
      const bar=document.createElement('div');bar.className='chart-bar';bar.style.height=(count/max*84)+'%';
      if(count){const value=document.createElement('span');value.className='chart-value';value.textContent=nf(count);bar.append(value)}
      const day=document.createElement('span');day.className='chart-day';day.textContent=String(date.getUTCDate()).padStart(2,'0');
      track.append(bar);col.append(track,day);chart.append(col);
    }
    const total=rows.reduce((sum,r)=>sum+(Number(r.value)||0),0);
    q('dailyNote').textContent=total?'За '+rows.length+' дней: '+nf(total)+' подтверждённых прохождений.':'За этот период подтверждённых прохождений пока нет.';
  }
  function render(d){
    const s=d.summary;
    if(!s||!Number.isFinite(Number(s.confirmed_rescues)))throw new Error('Invalid dashboard response');
    const values={confirmed:nf(s.total_runs??s.confirmed_rescues),donation:money(s.donation_rub),players:nf(s.total_players??s.unique_players),today:nf(s.today_total??s.today_runs),avg:tm(s.avg_seconds),repeat:nf(s.repeat_rate)+'%',raw:nf(s.raw_runs),valid:nf(s.confirmed_rescues),dup:nf(s.retry_duplicates??s.duplicates),limited:nf(s.limited_runs),fast:nf(s.fast_runs??s.too_fast),rate:money(s.rate_rub),totalBudget:money(s.budget_rub),remain:money(Math.max(0,s.budget_rub-s.donation_rub)),days:nf(s.days_left)+' дн.'};
    for(const [id,value] of Object.entries(values))q(id).textContent=value;
    q('budget').textContent='Бюджет '+money(s.budget_rub);
    const pct=s.budget_rub>0?Math.min(100,Math.max(0,s.donation_rub/s.budget_rub*100)):0;
    q('budgetPercent').textContent=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(pct)+'%';
    q('budgetFill').style.width=pct+'%';q('budgetProgress').setAttribute('aria-valuenow',String(pct));
    renderDays(d.daily);
    q('runs').replaceChildren();
    for(const r of d.runs||[]){
      const tr=document.createElement('tr');
      for(const value of [new Date(r.completed_at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),r.participant||'Участник',tm(r.duration_seconds),r.game_version||'—']){const td=document.createElement('td');td.textContent=value;tr.append(td)}
      const td=document.createElement('td'),tag=document.createElement('span');tag.className='status-tag';tag.textContent=r.reason==='daily_limit'?'Лимит 3 / 24 ч':r.status==='too_fast'?'Менее 45 сек.':r.status==='confirmed'?'✓ Зачтено':String(r.status||'На проверке');if(r.status!=='confirmed')tag.classList.add('neutral');td.append(tag);tr.append(td);q('runs').append(tr);
    }
    if(!(d.runs||[]).length)emptyRow('Здесь появится первое сохранённое прохождение.');
    lastData=d;q('exportCsv').disabled=false;q('campaignMeta').textContent=d.campaign?.sponsor_name==='Demo Sponsor'?'Пилотные параметры — обязательства спонсора ещё не согласованы.':(d.campaign?.sponsor_name||'');q('state').textContent='LIVE';q('state').dataset.mode='live';q('err').hidden=true;
    q('updated').textContent='Обновлено '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+' · автообновление каждые 30 сек.';
  }
  async function load(){
    if(loading)return;loading=true;q('refresh').disabled=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(API,{cache:'no-store',signal:controller.signal});if(!r.ok)throw new Error('HTTP '+r.status);
      const d=await r.json();if(!d.ok)throw new Error(d.error||'API');render(d);
    }catch(e){blank();q('state').textContent='НЕТ СВЯЗИ';q('state').dataset.mode='offline';q('err').hidden=false;q('updated').textContent='Данные не загружены'}
    finally{clearTimeout(timer);loading=false;q('refresh').disabled=false}
  }
  q('printReport').onclick=()=>window.print();
  q('exportCsv').onclick=()=>{
    if(!lastData)return;const d=lastData,s=d.summary;
    const rows=[['Спаси Пушка — отчёт',d.server_time||new Date().toISOString()],['Всего завершённых игр',s.total_runs??s.confirmed_rescues],['Зачтено в помощь',s.confirmed_rescues],['Начислено по параметрам кампании, руб.',s.donation_rub],['Бюджет, руб.',s.budget_rub],['Сверх лимита',s.limited_runs||0],['Быстрые тесты',s.fast_runs??s.too_fast],[],['Дата (UTC)','Зачтённые прохождения'],...(d.daily||[]).map(r=>[String(r.day).slice(0,10),r.value]),[],['Последние 20 игр: дата','Участник','Секунды','Статус','Причина'],...(d.runs||[]).map(r=>[r.completed_at,r.participant,r.duration_seconds,r.status,r.reason||''])];
    const cell=value=>'"'+String(value??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pushok-report-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  document.addEventListener('savekitty:synced',()=>setTimeout(load,300));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
  q('refresh').addEventListener('click',load);load();setInterval(load,30000);
})();
