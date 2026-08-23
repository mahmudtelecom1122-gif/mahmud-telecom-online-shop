const KEY='mahmutel_v9';
const bn=n=>Number(n||0).toLocaleString('bn-BD',{maximumFractionDigits:2});
const money=n=>'৳ '+bn(n);
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
const today=()=>{const d=new Date();const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const month=()=>today().slice(0,7);
const stateDefault={
 shop:{name:'মাহমুদ টেলিকম',owner:'মোঃ নুরুল্লাহ',phone:'01846655270',address:'বাংলাদেশ'},
 products:[
  {id:'p1',name:'USB কেবল',cat:'এক্সেসরিজ',buy:90,sell:150,stock:18,min:5,icon:'🔌'},
  {id:'p2',name:'মোবাইল কভার',cat:'এক্সেসরিজ',buy:150,sell:250,stock:12,min:4,icon:'📱'},
  {id:'p3',name:'হেডফোন',cat:'এক্সেসরিজ',buy:300,sell:450,stock:8,min:3,icon:'🎧'},
  {id:'p4',name:'রাউটার',cat:'মোবাইল',buy:1400,sell:1850,stock:5,min:2,icon:'📶'},
  {id:'p5',name:'চার্জার',cat:'এক্সেসরিজ',buy:360,sell:550,stock:10,min:3,icon:'🔋'},
  {id:'p6',name:'LED বাল্ব',cat:'ইলেকট্রিক',buy:120,sell:180,stock:22,min:5,icon:'💡'}
 ],
 customers:[{id:'c1',name:'রহিম',phone:'01700000000',total:9000,paid:7500,last:'2026-08-15'},{id:'c2',name:'করিম',phone:'01800000000',total:6200,paid:4200,last:'2026-08-14'},{id:'c3',name:'সুমন',phone:'01900000000',total:3500,paid:3500,last:'2026-08-12'}],
 suppliers:[{id:'s1',name:'ABC Telecom',phone:'01711111111',total:15000,paid:12000,last:'2026-08-14'},{id:'s2',name:'Smart Accessories',phone:'01822222222',total:8000,paid:8000,last:'2026-08-10'}],
 sales:[{id:'S-1001',date:'2026-08-15',customer:'রহিম',phone:'01700000000',total:2100,paid:2100,profit:350},{id:'S-1000',date:'2026-08-14',customer:'করিম',phone:'01800000000',total:1800,paid:1000,profit:300}],
 purchases:[{id:'P-5001',date:'2026-08-14',supplier:'ABC Telecom',total:5000,paid:4000,items:'USB কেবল, চার্জার'}],
 recharge:[{id:'R-1',date:'2026-08-15',phone:'01700000000',operator:'GP',type:'সাধারণ',amount:100,method:'নগদ'}],
 banking:[{id:'B-1',date:'2026-08-15',method:'বিকাশ',type:'Cash Out',phone:'01700000000',amount:500,paid:500,due:0,charge:10},{id:'B-2',date:'2026-08-15',method:'নগদ',type:'Cash In',phone:'01800000000',amount:1000,paid:1000,due:0,charge:0}],
 numbers:[]
};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(stateDefault);
let cloudSyncReady=false;
let cloudSyncBusy=false;
let cloudSyncTimer=null;
function apiBase(){return String(window.MT_API_BASE||'').replace(/\/$/,'')}
function showSyncStatus(text,ok=true){
  const el=document.querySelector('.online-badge');
  if(el){el.textContent=ok?'● '+text:'● '+text;el.style.opacity=ok?'1':'.75';}
}
async function cloudGet(){
  const base=apiBase(); if(!base) return null;
  const r=await fetch(base+'/api/state',{method:'GET',cache:'no-store'});
  if(!r.ok) throw new Error('Cloud GET '+r.status);
  const j=await r.json();
  return j && j.state ? j.state : null;
}
async function cloudPut(state){
  const base=apiBase();
  if(!base) return null;

  const r=await fetch(base+'/api/state',{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({state})
  });

  const text=await r.text();

  if(!r.ok){
    throw new Error('Cloud PUT '+r.status+' '+text);
  }

  try{
    return JSON.parse(text);
  }catch(e){
    return text;
  }
}
async function syncPush(){
  if(!apiBase()||!cloudSyncReady||cloudSyncBusy)return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer=setTimeout(async()=>{
    cloudSyncBusy=true;showSyncStatus('Syncing…');
    try{await cloudPut(db);showSyncStatus('Cloud Sync');}
    catch(e){console.warn('Cloud sync failed',e);showSyncStatus('Local Mode',false);}
    finally{cloudSyncBusy=false;}
  },250);
}
async function initCloudSync(){
  if(!apiBase()){showSyncStatus('Local Mode',false);return;}
  showSyncStatus('Connecting…');
  try{
    const remote=await cloudGet();
    if(remote && typeof remote==='object'){
      db=remote;
      db.numbers=Array.isArray(db.numbers)?db.numbers:[];
      db.recharge=(db.recharge||[]).map(x=>({...x,paid:Number(x.paid??x.amount??0),due:Math.max(0,Number(x.due??((x.amount??0)-(x.paid??x.amount??0))))}));
      db.banking=(db.banking||[]).map(x=>({...x,paid:Number(x.paid??x.amount??0),due:Math.max(0,Number(x.due??((x.amount??0)-(x.paid??x.amount??0))))}));
      localStorage.setItem(KEY,JSON.stringify(db));
      renderAll();
      showSyncStatus('Cloud Sync');
    }else{
      await cloudPut(db);
      showSyncStatus('Cloud Sync');
    }
    cloudSyncReady=true;
  }catch(e){console.warn('Cloud connection unavailable',e);showSyncStatus('Local Mode',false);cloudSyncReady=true;}
}

db.numbers=Array.isArray(db.numbers)?db.numbers:[];
db.recharge=(db.recharge||[]).map(x=>({...x,paid:Number(x.paid??x.amount??0),due:Math.max(0,Number(x.due??((x.amount??0)-(x.paid??x.amount??0))))}));
db.banking=(db.banking||[]).map(x=>({...x,paid:Number(x.paid??x.amount??0),due:Math.max(0,Number(x.due??((x.amount??0)-(x.paid??x.amount??0))))}));
function save(){
  localStorage.setItem(KEY,JSON.stringify(db));
  try{localStorage.setItem(KEY+'_updated',String(Date.now()))}catch(e){}
  renderAll();
  syncPush();
}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2200)}
function showPage(page){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));const titles={dashboard:'ড্যাশবোর্ড',numbers:'নম্বর হিসাব',sales:'বিক্রয় ব্যবস্থাপনা',purchases:'ক্রয় ব্যবস্থাপনা',products:'স্টক / পণ্য',customers:'কাস্টমার',suppliers:'সাপ্লায়ার',dues:'বাকি ও কালেকশন',recharge:'মোবাইল রিচার্জ',banking:'মোবাইল ব্যাংকিং','service-dues':'সেবা বাকি',reports:'রিপোর্ট ও হিসাব',settings:'সেটিংস'};document.getElementById('pageTitle').textContent=titles[page]||'ড্যাশবোর্ড';document.getElementById('sidebar').classList.remove('open');history.replaceState(null,'','#'+page);window.scrollTo({top:0,behavior:'smooth'});if(page==='reports')renderReport();if(page==='service-dues')renderServiceDues()}
document.getElementById('newNumberBtn').onclick=()=>openModal('নম্বর হিসাব',`<div class="form-grid">${field('তারিখ','date',today(),'date','required')}${field('নাম','name','','text','required')}${field('মোবাইল নম্বর','phone','','tel','required')}${field('বিবরণ','note','','text')}${field('মোট টাকা','amount','0','number','required min="0"')}${field('পরিশোধ','paid','0','number','required min="0"')}</div>`,f=>{const amount=+f.get('amount'),paid=+f.get('paid');db.numbers.push({id:uid('N'),date:f.get('date'),name:f.get('name'),phone:f.get('phone'),note:f.get('note'),amount,paid,due:Math.max(0,amount-paid)});save();toast('নম্বর হিসাব সংরক্ষণ হয়েছে')});
function collectServiceDue(type,id){const arr=db[type],x=arr.find(v=>v.id===id);if(!x||!(x.due>0))return;openModal('বাকি আদায়',`<div class="form-grid">${field('লেনদেন','tx',x.id,'text','readonly')}${field('বর্তমান বাকি','due',x.due,'number','readonly')}${field('আদায়ের টাকা','amount',x.due,'number','required min="1" max="'+x.due+'"')}${field('তারিখ','date',today(),'date','required')}</div>`,f=>{const a=+f.get('amount');x.paid=(x.paid||0)+a;x.due=Math.max(0,x.amount-x.paid);x.lastPaidDate=f.get('date');save();toast('বাকি আদায় সংরক্ষণ হয়েছে')})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)showPage(b.dataset.page)});
document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
function openModal(title,html,onSubmit){
  const m=document.getElementById('modal');
  const hasSubmit=typeof onSubmit==='function';
  document.getElementById('modalContent').innerHTML=`<h2>${title}</h2><form id="dynamicForm">${html}${hasSubmit?`<div class="modal-actions"><button type="button" class="outline-btn" data-close>বাতিল</button><button type="submit" class="primary-btn">সংরক্ষণ করুন</button></div>`:`<div class="modal-actions"><button type="button" class="outline-btn" data-close>বাতিল</button><button type="button" class="primary-btn" data-receipt-save>সংরক্ষণ করুন</button></div>`}</form>`;
  m.classList.add('show');
  const form=document.getElementById('dynamicForm');
  form.onsubmit=e=>{
    e.preventDefault();
    if(hasSubmit){onSubmit(new FormData(e.target));m.classList.remove('show');}
  };
  const close=m.querySelector('[data-close]');
  if(close)close.onclick=()=>m.classList.remove('show');
  const receiptSave=m.querySelector('[data-receipt-save]');
  if(receiptSave){
    receiptSave.onclick=()=>{
      const png=m.querySelector('#pngServiceReceipt')||m.querySelector('#pngReceipt');
      if(png){png.click();}
      else{m.classList.remove('show');}
    };
  }
}
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))document.getElementById('modal').classList.remove('show')});document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('modal').classList.remove('show')});
function field(label,name,value='',type='text',extra=''){return `<label>${label}<input name="${name}" type="${type}" value="${value}" ${extra}></label>`}
function selectField(label,name,opts){return `<label>${label}<select name="${name}">${opts.map(o=>`<option>${o}</option>`).join('')}</select></label>`}
function renderDashboard(){const d=today(),m=month();const todaySales=db.sales.filter(x=>x.date===d).reduce((a,x)=>a+x.total,0);const monthSales=db.sales.filter(x=>x.date.startsWith(m)).reduce((a,x)=>a+x.total,0);const due=db.customers.reduce((a,x)=>a+Math.max(0,x.total-x.paid),0);const profit=db.sales.filter(x=>x.date.startsWith(m)).reduce((a,x)=>a+x.profit,0);const duePaidToday=db.customers.reduce((a,x)=>a+0,0);document.getElementById('todaySales').textContent=money(todaySales);document.getElementById('monthSales').textContent=money(monthSales);document.getElementById('totalDue').textContent=money(due);document.getElementById('monthProfit').textContent=money(profit);document.getElementById('todayCollection').textContent=money(todaySales+duePaidToday);document.getElementById('todayCash').textContent=money(todaySales);document.getElementById('todayDuePaid').textContent=money(duePaidToday);document.getElementById('monthCollection').textContent=money(monthSales);document.getElementById('cashMonth').textContent=money(monthSales);document.getElementById('dueMonth').textContent=money(0);document.getElementById('monthTx').textContent=bn(db.sales.filter(x=>x.date.startsWith(m)).length)+'টি লেনদেন';document.getElementById('collectionText').textContent=todaySales?'আজকের বিক্রয় ও কালেকশন হিসাব':'আজ কোনো কালেকশন যোগ করা হয়নি';document.getElementById('todayDate').textContent=new Intl.DateTimeFormat('bn-BD',{day:'numeric',month:'long',year:'numeric'}).format(new Date());document.getElementById('recentSales').innerHTML=db.sales.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(x=>`<div class="recent-row"><span class="round-mini">৳</span><div><b>${x.id} • ${x.customer}</b><small>${x.date}</small></div><strong>${money(x.total)}</strong></div>`).join('')||'<div class="empty">কোনো বিক্রয় নেই</div>';document.getElementById('topDues').innerHTML=db.customers.map(x=>({...x,due:x.total-x.paid})).filter(x=>x.due>0).sort((a,b)=>b.due-a.due).slice(0,5).map(x=>`<div class="recent-row"><span class="round-mini">${x.name.slice(0,1)}</span><div><b>${x.name}</b><small>${x.phone}</small></div><strong class="stock-low">${money(x.due)}</strong></div>`).join('')||'<div class="empty">কোনো বাকি নেই</div>'}
function renderSales(){const q=(document.getElementById('saleSearch').value||'').toLowerCase(),f=document.getElementById('saleFilter').value;let rows=db.sales.filter(x=>(`${x.id} ${x.customer} ${x.phone}`).toLowerCase().includes(q));if(f==='cash')rows=rows.filter(x=>x.paid>=x.total);if(f==='due')rows=rows.filter(x=>x.paid===0);if(f==='partial')rows=rows.filter(x=>x.paid>0&&x.paid<x.total);document.getElementById('salesTable').innerHTML=rows.map(x=>{const due=x.total-x.paid;return `<tr><td><strong>${x.id}</strong></td><td>${x.date}</td><td>${x.customer}<br><small>${x.phone||''}</small></td><td>${money(x.total)}</td><td>${money(x.paid)}</td><td>${money(due)}</td><td><span class="badge ${due?'red':'green'}">${due?'বাকি':'পরিশোধিত'}</span></td><td><button class="row-btn" data-receipt="${x.id}">রসিদ</button></td></tr>`}).join('')||`<tr><td colspan="8"><div class="empty">কোনো বিক্রয় পাওয়া যায়নি</div></td></tr>`}
function renderPurchases(){const q=(document.getElementById('purchaseSearch').value||'').toLowerCase(),f=document.getElementById('purchaseFilter').value;let rows=db.purchases.filter(x=>`${x.id} ${x.supplier} ${x.items}`.toLowerCase().includes(q));if(f==='paid')rows=rows.filter(x=>x.paid>=x.total);if(f==='due')rows=rows.filter(x=>x.paid<x.total);document.getElementById('purchaseTable').innerHTML=rows.map(x=>`<tr><td><strong>${x.id}</strong></td><td>${x.date}</td><td>${x.supplier}</td><td>${x.items}</td><td>${money(x.total)}</td><td>${money(x.paid)}</td><td>${money(x.total-x.paid)}</td><td><button class="row-btn" data-delete-purchase="${x.id}">মুছুন</button></td></tr>`).join('')||`<tr><td colspan="8"><div class="empty">কোনো ক্রয় নেই</div></td></tr>`}
function renderProducts(){const q=(document.getElementById('productSearch').value||'').toLowerCase(),cat=document.getElementById('productCat').value;let rows=db.products.filter(x=>(`${x.name} ${x.cat}`).toLowerCase().includes(q)&&(cat==='all'||x.cat===cat));document.getElementById('productCount').textContent=bn(db.products.length);document.getElementById('stockUnits').textContent=bn(db.products.reduce((a,x)=>a+x.stock,0));document.getElementById('stockValue').textContent=money(db.products.reduce((a,x)=>a+x.buy*x.stock,0));document.getElementById('lowStockCount').textContent=bn(db.products.filter(x=>x.stock<=x.min).length);const cats=[...new Set(db.products.map(x=>x.cat))];document.getElementById('productCat').innerHTML='<option value="all">সব ক্যাটাগরি</option>'+cats.map(x=>`<option>${x}</option>`).join('');document.getElementById('productGrid').innerHTML=rows.map(x=>`<article class="product-card"><div class="product-thumb">${x.icon||'📦'}</div><div class="product-body"><h3>${x.name}</h3><small>${x.cat} • কোড ${x.id}</small><div class="product-meta"><div><b>${money(x.sell)}</b><small class="${x.stock<=x.min?'stock-low':'stock-good'}">স্টক ${bn(x.stock)}</small></div><button class="row-btn" data-edit-product="${x.id}">এডিট</button></div></div></article>`).join('')||'<div class="empty">কোনো পণ্য নেই</div>'}
function renderCustomers(){const q=(document.getElementById('customerSearch').value||'').toLowerCase();document.getElementById('customerGrid').innerHTML=db.customers.filter(x=>`${x.name} ${x.phone}`.toLowerCase().includes(q)).map(x=>{const due=x.total-x.paid;return `<article class="customer-card"><div class="customer-top"><div class="customer-avatar">${x.name.slice(0,1)}</div><div><b>${x.name}</b><small>${x.phone}</small></div></div><div class="customer-balance"><div><small>মোট বিক্রয়</small><b>${money(x.total)}</b></div><div><small>বাকি</small><b class="${due?'stock-low':'stock-good'}">${money(due)}</b></div></div><div style="margin-top:10px"><button class="row-btn" data-collect="${x.id}">বাকি আদায়</button></div></article>`}).join('')||'<div class="empty">কোনো কাস্টমার নেই</div>'}
function renderSuppliers(){document.getElementById('supplierGrid').innerHTML=db.suppliers.map(x=>{const due=x.total-x.paid;return `<article class="customer-card"><div class="customer-top"><div class="customer-avatar">${x.name.slice(0,1)}</div><div><b>${x.name}</b><small>${x.phone}</small></div></div><div class="customer-balance"><div><small>মোট ক্রয়</small><b>${money(x.total)}</b></div><div><small>পাওনা</small><b class="${due?'stock-low':'stock-good'}">${money(due)}</b></div></div></article>`}).join('')||'<div class="empty">কোনো সাপ্লায়ার নেই</div>'}
function renderDues(){const rows=db.customers.map(x=>({...x,due:x.total-x.paid})).filter(x=>x.due>0);const total=rows.reduce((a,x)=>a+x.due,0);document.getElementById('dueTotalPage').textContent=money(total);document.getElementById('dueCollectedPage').textContent=money(0);document.getElementById('dueCustomerCount').textContent=bn(rows.length);document.getElementById('dueTable').innerHTML=rows.map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.phone}</td><td>${money(x.total)}</td><td>${money(x.paid)}</td><td class="stock-low">${money(x.due)}</td><td>${x.last||'-'}</td><td><button class="row-btn" data-collect="${x.id}">আদায়</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="empty">কোনো বাকি নেই 🎉</div></td></tr>'}
function renderServiceDues(){
  const items=[...(db.recharge||[]).map(x=>({...x,service:'রিচার্জ'})),...(db.banking||[]).map(x=>({...x,service:'মোবাইল ব্যাংকিং'}))]
    .filter(x=>(Number(x.due)||0)>0).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const total=items.reduce((a,x)=>a+Number(x.due||0),0);
  const rechargeDue=items.filter(x=>x.service==='রিচার্জ').reduce((a,x)=>a+Number(x.due||0),0);
  const bankingDue=items.filter(x=>x.service==='মোবাইল ব্যাংকিং').reduce((a,x)=>a+Number(x.due||0),0);
  document.getElementById('serviceDueTotal').textContent=money(total);
  document.getElementById('serviceRechargeDue').textContent=money(rechargeDue);
  document.getElementById('serviceBankingDue').textContent=money(bankingDue);
  document.getElementById('serviceDueCount').textContent=bn(items.length);
  document.getElementById('serviceDueTable').innerHTML=items.map(x=>`<tr><td>${x.date||'-'}</td><td><strong>${x.service}</strong></td><td>${x.method||'-'}</td><td>${x.phone||'-'}</td><td>${x.type||'-'}</td><td>${money(x.amount||0)}</td><td>${money(x.paid||0)}</td><td class="stock-low">${money(x.due||0)}</td><td><button class="row-btn" data-service-due-collect="${x.service==='রিচার্জ'?'recharge':'banking'}:${x.id}">আদায়</button></td></tr>`).join('')||'<tr><td colspan="9"><div class="empty">রিচার্জ বা মোবাইল ব্যাংকিংয়ে কোনো বাকি নেই 🎉</div></td></tr>';
}
function renderRecharge(){const m=month(),d=today(),todaySum=db.recharge.filter(x=>x.date===d).reduce((a,x)=>a+x.amount,0),monthSum=db.recharge.filter(x=>x.date.startsWith(m)).reduce((a,x)=>a+x.amount,0);document.getElementById('rechargeToday').textContent=money(todaySum);document.getElementById('rechargeMonth').textContent=money(monthSum);document.getElementById('rechargeCount').textContent=bn(db.recharge.length);document.getElementById('rechargeTable').innerHTML=db.recharge.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${x.phone}</td><td>${x.operator}</td><td>${x.type}</td><td>${money(x.amount)}</td><td>${money(x.paid||0)}</td><td class="${x.due?'stock-low':''}">${money(x.due||0)}</td><td>${x.method}</td><td><button class="row-btn" data-recharge-receipt="${x.id}">রসিদ</button> <button class="row-btn" data-edit-recharge="${x.id}">এডিট</button> <button class="row-btn" data-collect-recharge="${x.id}">বাকি</button> <button class="row-btn" data-delete-recharge="${x.id}">মুছুন</button></td></tr>`).join('')||'<tr><td colspan="9"><div class="empty">কোনো রিচার্জ নেই</div></td></tr>'}
function renderBanking(){const methods=['বিকাশ','নগদ','রকেট','উপায়'];document.getElementById('walletGrid').innerHTML=methods.map(m=>{const sum=db.banking.filter(x=>x.method===m).reduce((a,x)=>a+x.amount,0);return `<div class="wallet-card"><div class="wallet-logo">৳</div><b>${m}</b><small>মোট লেনদেন</small><b>${money(sum)}</b></div>`}).join('');document.getElementById('bankTable').innerHTML=db.banking.slice().reverse().map(x=>`<tr><td>${x.date}</td><td><strong>${x.method}</strong></td><td>${x.type}</td><td>${x.phone||'-'}</td><td>${money(x.amount)}</td><td>${money(x.paid||0)}</td><td class="${x.due?'stock-low':''}">${money(x.due||0)}</td><td>${money(x.charge||0)}</td><td><button class="row-btn" data-bank-receipt="${x.id}">রসিদ</button> <button class="row-btn" data-edit-bank="${x.id}">এডিট</button> <button class="row-btn" data-collect-bank="${x.id}">বাকি</button> <button class="row-btn" data-delete-bank="${x.id}">মুছুন</button></td></tr>`).join('')||'<tr><td colspan="9"><div class="empty">কোনো ব্যাংকিং লেনদেন নেই</div></td></tr>'}
function renderNumbers(){const q=(document.getElementById('numberSearch').value||'').toLowerCase(),f=document.getElementById('numberFilter').value;let rows=db.numbers.filter(x=>`${x.name||''} ${x.phone||''} ${x.note||''}`.toLowerCase().includes(q));if(f==='due')rows=rows.filter(x=>(x.due||0)>0);if(f==='paid')rows=rows.filter(x=>(x.due||0)<=0);document.getElementById('numberTable').innerHTML=rows.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${x.name||'-'}</td><td>${x.phone||'-'}</td><td>${x.note||'-'}</td><td>${money(x.amount)}</td><td>${money(x.paid||0)}</td><td class="${x.due?'stock-low':''}">${money(x.due||0)}</td><td><button class="row-btn" data-number-receipt="${x.id}">রসিদ</button> <button class="row-btn" data-edit-number="${x.id}">এডিট</button> <button class="row-btn" data-delete-number="${x.id}">মুছুন</button></td></tr>`).join('')||'<tr><td colspan="8"><div class="empty">কোনো নম্বর হিসাব নেই</div></td></tr>'}
function renderReport(){const from=document.getElementById('reportFrom').value||month()+'-01',to=document.getElementById('reportTo').value||today();document.getElementById('reportFrom').value=from;document.getElementById('reportTo').value=to;const sales=db.sales.filter(x=>x.date>=from&&x.date<=to),purchase=db.purchases.filter(x=>x.date>=from&&x.date<=to),recharge=db.recharge.filter(x=>x.date>=from&&x.date<=to),bank=db.banking.filter(x=>x.date>=from&&x.date<=to);const sale=sales.reduce((a,x)=>a+x.total,0),paid=sales.reduce((a,x)=>a+x.paid,0),profit=sales.reduce((a,x)=>a+x.profit,0),pur=purchase.reduce((a,x)=>a+x.total,0);document.getElementById('reportDateText').textContent=`${from} → ${to}`;document.getElementById('reportKpis').innerHTML=[['মোট বিক্রয়',money(sale)],['মোট পরিশোধ',money(paid)],['মোট ক্রয়',money(pur)],['আনুমানিক লাভ',money(profit)]].map(x=>`<div class="report-kpi"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');const max=Math.max(sale,paid,1);document.getElementById('barChart').innerHTML=`<div class="bar-group"><span class="bar-value">${money(sale)}</span><div class="bar" style="height:${Math.max(4,sale/max*130)}px"></div><span class="bar-label">বিক্রয়</span></div><div class="bar-group"><span class="bar-value">${money(paid)}</span><div class="bar collection" style="height:${Math.max(4,paid/max*130)}px"></div><span class="bar-label">কালেকশন</span></div><div class="bar-group"><span class="bar-value">${money(pur)}</span><div class="bar" style="height:${Math.max(4,pur/max*130)}px"></div><span class="bar-label">ক্রয়</span></div>`;document.getElementById('reportSummary').innerHTML=`<div class="report-summary"><div class="summary-line"><span>বিক্রয় লেনদেন</span><b>${bn(sales.length)}</b></div><div class="summary-line"><span>রিচার্জ</span><b>${money(recharge.reduce((a,x)=>a+x.amount,0))}</b></div><div class="summary-line"><span>মোবাইল ব্যাংকিং</span><b>${money(bank.reduce((a,x)=>a+x.amount,0))}</b></div><div class="summary-line"><span>বাকি বিক্রয়</span><b>${money(sales.reduce((a,x)=>a+x.total-x.paid,0))}</b></div></div>`}
function renderAll(){renderDashboard();renderNumbers();renderSales();renderPurchases();renderProducts();renderCustomers();renderSuppliers();renderDues();renderRecharge();renderBanking();renderServiceDues();renderReport()}

// Modal creators
document.getElementById('newSaleBtn').onclick=()=>openModal('নতুন বিক্রয়',`<div class="form-grid">${field('কাস্টমারের নাম','customer','','text','required')}${field('ফোন','phone','','tel')} ${field('মোট টাকা','total','','number','required min="0"')}${field('পরিশোধ','paid','','number','required min="0"')} ${field('তারিখ','date',today(),'date','required')}<label>নোট<textarea name="note"></textarea></label></div>`,f=>{const x={id:uid('S'),date:f.get('date'),customer:f.get('customer'),phone:f.get('phone'),total:+f.get('total'),paid:+f.get('paid'),profit:Math.round(+f.get('total')*.12)};db.sales.push(x);let c=db.customers.find(c=>c.phone&&c.phone===x.phone);if(!c){c={id:uid('c'),name:x.customer,phone:x.phone,total:0,paid:0,last:x.date};db.customers.push(c)}c.total+=x.total;c.paid+=x.paid;c.last=x.date;save();toast('বিক্রয় সংরক্ষণ হয়েছে')});
document.getElementById('newPurchaseBtn').onclick=()=>openModal('নতুন ক্রয়',`<div class="form-grid">${field('সাপ্লায়ারের নাম','supplier','','text','required')}${field('পণ্য','items','','text','required')}${field('মোট টাকা','total','','number','required min="0"')}${field('পরিশোধ','paid','','number','required min="0"')}${field('তারিখ','date',today(),'date','required')}</div>`,f=>{db.purchases.push({id:uid('P'),date:f.get('date'),supplier:f.get('supplier'),items:f.get('items'),total:+f.get('total'),paid:+f.get('paid')});save();toast('ক্রয় সংরক্ষণ হয়েছে')});
document.getElementById('newProductBtn').onclick=()=>openModal('নতুন পণ্য',`<div class="form-grid">${field('পণ্যের নাম','name','','text','required')}${field('ক্যাটাগরি','cat','এক্সেসরিজ','text','required')}${field('ক্রয় মূল্য','buy','','number','required min="0"')}${field('বিক্রয় মূল্য','sell','','number','required min="0"')}${field('স্টক','stock','0','number','required min="0"')}${field('কম স্টক সীমা','min','3','number','required min="0"')}${field('আইকন','icon','📦','text')}</div>`,f=>{db.products.push({id:uid('p'),name:f.get('name'),cat:f.get('cat'),buy:+f.get('buy'),sell:+f.get('sell'),stock:+f.get('stock'),min:+f.get('min'),icon:f.get('icon')});save();toast('পণ্য যোগ হয়েছে')});
document.getElementById('newCustomerBtn').onclick=()=>openModal('নতুন কাস্টমার',`<div class="form-grid">${field('নাম','name','','text','required')}${field('ফোন','phone','','tel','required')}${field('মোট বিক্রয়','total','0','number','min="0"')}${field('পরিশোধ','paid','0','number','min="0"')}</div>`,f=>{db.customers.push({id:uid('c'),name:f.get('name'),phone:f.get('phone'),total:+f.get('total'),paid:+f.get('paid'),last:today()});save();toast('কাস্টমার যোগ হয়েছে')});
document.getElementById('newSupplierBtn').onclick=()=>openModal('নতুন সাপ্লায়ার',`<div class="form-grid">${field('নাম','name','','text','required')}${field('ফোন','phone','','tel','required')}${field('মোট ক্রয়','total','0','number','min="0"')}${field('পরিশোধ','paid','0','number','min="0"')}</div>`,f=>{db.suppliers.push({id:uid('s'),name:f.get('name'),phone:f.get('phone'),total:+f.get('total'),paid:+f.get('paid'),last:today()});save();toast('সাপ্লায়ার যোগ হয়েছে')});
function collect(id){const c=db.customers.find(x=>x.id===id);if(!c)return;const due=c.total-c.paid;openModal('বাকি আদায়',`<div class="form-grid">${field('কাস্টমার','customer',c.name,'text','readonly')}${field('বর্তমান বাকি','due',due,'number','readonly')}${field('আদায়ের টাকা','amount',due,'number','required min="1" max="'+due+'"')}${field('তারিখ','date',today(),'date','required')}</div>`,f=>{c.paid+=+f.get('amount');c.last=f.get('date');save();toast('বাকি আদায় সংরক্ষণ হয়েছে')})}
document.getElementById('collectDueBtn').onclick=()=>{const c=db.customers.find(x=>x.total-x.paid>0);if(c)collect(c.id);else toast('কোনো বাকি নেই')};
document.getElementById('newRechargeBtn').onclick=()=>openModal('মোবাইল রিচার্জ',`<div class="form-grid">${field('তারিখ','date',today(),'date','required')}${field('মোবাইল নম্বর','phone','','tel','required')}${selectField('অপারেটর','operator',['GP','Robi','Banglalink','Airtel','Teletalk'])}${field('টাকার পরিমাণ','amount','100','number','required min="1"')}${field('পরিশোধ','paid','100','number','required min="0"')}${selectField('ধরন','type',['সাধারণ','ইন্টারনেট','মিনিট','বান্ডেল'],x.type)}${selectField('মাধ্যম','method',['নগদ','বিকাশ','নগদ MFS','রকেট'],x.method)}</div>`,f=>{const amount=+f.get('amount'),paid=+f.get('paid');db.recharge.push({id:uid('R'),date:f.get('date'),phone:f.get('phone'),operator:f.get('operator'),type:f.get('type'),amount,paid,due:Math.max(0,amount-paid),method:f.get('method')});save();toast('রিচার্জ লেনদেন সংরক্ষণ হয়েছে')});
document.getElementById('newBankBtn').onclick=()=>openModal('মোবাইল ব্যাংকিং লেনদেন',`<div class="form-grid">${field('তারিখ','date',today(),'date','required')}${selectField('মাধ্যম','method',['বিকাশ','নগদ','রকেট','উপায়'])}${selectField('ধরন','type',['Cash In','Cash Out','Send Money','Payment'])}${field('নম্বর','phone','','tel')}${field('টাকার পরিমাণ','amount','0','number','required min="0"')}${field('পরিশোধ','paid','0','number','required min="0"')}${field('চার্জ','charge','0','number','min="0"')}</div>`,f=>{const amount=+f.get('amount'),paid=+f.get('paid');db.banking.push({id:uid('B'),date:f.get('date'),method:f.get('method'),type:f.get('type'),phone:f.get('phone'),amount,paid,due:Math.max(0,amount-paid),charge:+f.get('charge')});save();toast('ব্যাংকিং লেনদেন সংরক্ষণ হয়েছে')});

document.getElementById('newNumberBtn').onclick=()=>openModal('নম্বর হিসাব',`<div class="form-grid">${field('তারিখ','date',today(),'date','required')}${field('নাম','name','','text','required')}${field('মোবাইল নম্বর','phone','','tel','required')}${field('বিবরণ','note','','text')}${field('মোট টাকা','amount','0','number','required min="0"')}${field('পরিশোধ','paid','0','number','required min="0"')}</div>`,f=>{const amount=+f.get('amount'),paid=+f.get('paid');db.numbers.push({id:uid('N'),date:f.get('date'),name:f.get('name'),phone:f.get('phone'),note:f.get('note'),amount,paid,due:Math.max(0,amount-paid)});save();toast('নম্বর হিসাব সংরক্ষণ হয়েছে')});
document.addEventListener('click',e=>{const c=e.target.closest('[data-collect]');if(c)collect(c.dataset.collect);const cr=e.target.closest('[data-collect-recharge]');if(cr)collectServiceDue('recharge',cr.dataset.collectRecharge);const cb=e.target.closest('[data-collect-bank]');if(cb)collectServiceDue('banking',cb.dataset.collectBank);const sd=e.target.closest('[data-service-due-collect]');if(sd){const [type,id]=sd.dataset.serviceDueCollect.split(':');collectServiceDue(type,id);}const p=e.target.closest('[data-delete-purchase]');if(p&&confirm('এই ক্রয়টি মুছে ফেলবেন?')){db.purchases=db.purchases.filter(x=>x.id!==p.dataset.deletePurchase);save();toast('মুছে ফেলা হয়েছে')}const r=e.target.closest('[data-delete-recharge]');if(r&&confirm('এই রিচার্জটি মুছে ফেলবেন?')){db.recharge=db.recharge.filter(x=>x.id!==r.dataset.deleteRecharge);save();toast('মুছে ফেলা হয়েছে')}const b=e.target.closest('[data-delete-bank]');if(b&&confirm('এই লেনদেনটি মুছে ফেলবেন?')){db.banking=db.banking.filter(x=>x.id!==b.dataset.deleteBank);save();toast('মুছে ফেলা হয়েছে')}
const dr=e.target.closest('[data-delete-number]');if(dr&&confirm('এই নম্বর হিসাবটি মুছে ফেলবেন?')){db.numbers=db.numbers.filter(x=>x.id!==dr.dataset.deleteNumber);save();toast('মুছে ফেলা হয়েছে')}
const er=e.target.closest('[data-edit-recharge]');if(er){const x=db.recharge.find(v=>v.id===er.dataset.editRecharge);if(x)openModal('রিচার্জ সম্পাদনা',`<div class="form-grid">${field('তারিখ','date',x.date,'date','required')}${field('মোবাইল নম্বর','phone',x.phone||'','tel','required')}${selectField('অপারেটর','operator',['GP','Robi','Banglalink','Airtel','Teletalk'],x.operator)}${field('টাকার পরিমাণ','amount',x.amount,'number','required min="1"')}${field('পরিশোধ','paid',x.paid??x.amount,'number','required min="0"')}${selectField('ধরন','type',['সাধারণ','ইন্টারনেট','মিনিট','বান্ডেল'])}${selectField('মাধ্যম','method',['নগদ','বিকাশ','নগদ MFS','রকেট'])}</div>`,f=>{Object.assign(x,{date:f.get('date'),phone:f.get('phone'),operator:f.get('operator'),type:f.get('type'),method:f.get('method'),amount:+f.get('amount'),paid:+f.get('paid')});x.due=Math.max(0,x.amount-x.paid);save();toast('রিচার্জ আপডেট হয়েছে')})}
const eb=e.target.closest('[data-edit-bank]');if(eb){const x=db.banking.find(v=>v.id===eb.dataset.editBank);if(x)openModal('ব্যাংকিং সম্পাদনা',`<div class="form-grid">${field('তারিখ','date',x.date||today(),'date','required')}${selectField('মাধ্যম','method',['বিকাশ','নগদ','রকেট','উপায়'],x.method)}${selectField('ধরন','type',['Cash In','Cash Out','Send Money','Payment'],x.type)}${field('নম্বর','phone',x.phone||'','tel')}${field('টাকার পরিমাণ','amount',x.amount,'number','required min="0"')}${field('পরিশোধ','paid',x.paid??x.amount,'number','required min="0"')}${field('চার্জ','charge',x.charge||0,'number','min="0"')}</div>`,f=>{Object.assign(x,{date:f.get('date'),method:f.get('method'),type:f.get('type'),phone:f.get('phone'),amount:+f.get('amount'),paid:+f.get('paid'),charge:+f.get('charge')});x.due=Math.max(0,x.amount-x.paid);save();toast('ব্যাংকিং আপডেট হয়েছে')})}
const en=e.target.closest('[data-edit-number]');if(en){const x=db.numbers.find(v=>v.id===en.dataset.editNumber);if(x)openModal('নম্বর হিসাব সম্পাদনা',`<div class="form-grid">${field('তারিখ','date',x.date,'date','required')}${field('নাম','name',x.name||'','text','required')}${field('মোবাইল নম্বর','phone',x.phone||'','tel','required')}${field('বিবরণ','note',x.note||'','text')}${field('মোট টাকা','amount',x.amount,'number','required min="0"')}${field('পরিশোধ','paid',x.paid||0,'number','required min="0"')}</div>`,f=>{Object.assign(x,{date:f.get('date'),name:f.get('name'),phone:f.get('phone'),note:f.get('note'),amount:+f.get('amount'),paid:+f.get('paid')});x.due=Math.max(0,x.amount-x.paid);save();toast('নম্বর হিসাব আপডেট হয়েছে')})}
const rr=e.target.closest('[data-recharge-receipt]');if(rr){const x=db.recharge.find(v=>v.id===rr.dataset.rechargeReceipt);if(x)serviceReceipt('মোবাইল রিচার্জ',x,'recharge')}const br=e.target.closest('[data-bank-receipt]');if(br){const x=db.banking.find(v=>v.id===br.dataset.bankReceipt);if(x)serviceReceipt('মোবাইল ব্যাংকিং',x,'banking')}const nr=e.target.closest('[data-number-receipt]');if(nr){const x=db.numbers.find(v=>v.id===nr.dataset.numberReceipt);if(x)numberReceipt(x)}const pr=e.target.closest('[data-edit-product]');if(pr){const x=db.products.find(p=>p.id===pr.dataset.editProduct);openModal('পণ্য সম্পাদনা',`<div class="form-grid">${field('পণ্যের নাম','name',x.name,'text','required')}${field('ক্যাটাগরি','cat',x.cat,'text','required')}${field('ক্রয় মূল্য','buy',x.buy,'number','required')}${field('বিক্রয় মূল্য','sell',x.sell,'number','required')}${field('স্টক','stock',x.stock,'number','required')}${field('কম স্টক সীমা','min',x.min,'number','required')}${field('আইকন','icon',x.icon||'📦')}</div>`,f=>{Object.assign(x,{name:f.get('name'),cat:f.get('cat'),buy:+f.get('buy'),sell:+f.get('sell'),stock:+f.get('stock'),min:+f.get('min'),icon:f.get('icon')});save();toast('পণ্য আপডেট হয়েছে')})}const rec=e.target.closest('[data-receipt]');if(rec){const x=db.sales.find(s=>s.id===rec.dataset.receipt);receipt(x)}});
function receipt(x){openModal('বিক্রয় রসিদ',`<div class="receipt" id="receiptBox"><img src="assets/logo.png"><h2>${db.shop.name}</h2><p>${db.shop.phone}</p><p>${x.date} • ${x.id}</p><table><tr><td>কাস্টমার</td><td style="text-align:right">${x.customer}</td></tr><tr><td>মোট</td><td style="text-align:right">${money(x.total)}</td></tr><tr><td>পরিশোধ</td><td style="text-align:right">${money(x.paid)}</td></tr><tr><td>বাকি</td><td style="text-align:right">${money(x.total-x.paid)}</td></tr></table><div class="total">ধন্যবাদ। আবার আসবেন।</div></div><div class="modal-actions"><button type="button" class="outline-btn" id="printReceipt">🖨️ প্রিন্ট</button><button type="button" class="primary-btn" id="pngReceipt">🖼️ PNG</button></div>`);setTimeout(()=>{document.getElementById('printReceipt').onclick=()=>{document.body.classList.add('receipt-printing');window.setTimeout(()=>window.print(),80)};document.getElementById('pngReceipt').onclick=async()=>{try{toast('PNG তৈরি হচ্ছে...');const blob=await makeStandardReceiptPngData(x);await downloadBlob(blob,`receipt-${safeFileName(x.id)}.png`);toast('PNG সফলভাবে ডাউনলোড হয়েছে')}catch(err){console.error(err);toast('PNG তৈরি করা যায়নি। আবার চেষ্টা করুন।')}}} ,50)}

function numberReceipt(x){openModal('নম্বর হিসাবের রসিদ',`<div class="service-receipt" id="serviceReceiptBox"><div class="service-brand"><img src="assets/logo.png"><div><h2>${db.shop.name}</h2><p>${db.shop.address||''}</p><p>${db.shop.phone}</p></div></div><div class="service-meta"><div><span>হিসাব আইডি:</span><b>${x.id}</b></div><div><span>তারিখ:</span><b>${x.date}</b></div></div><div class="service-receipt-lines"><div class="receipt-line"><span>নাম:</span><b>${x.name||'-'}</b></div><div class="receipt-line"><span>মোবাইল নম্বর:</span><b>${x.phone||'-'}</b></div><div class="receipt-line"><span>বিবরণ:</span><b>${x.note||'-'}</b></div><div class="receipt-line"><span>মোট:</span><b>${money(x.amount)}</b></div><div class="receipt-line"><span>পরিশোধ:</span><b>${money(x.paid||0)}</b></div><div class="receipt-line"><span>বাকি:</span><b>${money(x.due||0)}</b></div></div></div><div class="modal-actions"><button type="button" class="outline-btn" id="printNumberReceipt">🖨️ প্রিন্ট</button><button type="button" class="primary-btn" id="pngNumberReceipt">🖼️ PNG</button></div>`);setTimeout(()=>{const p=document.getElementById('printNumberReceipt'),n=document.getElementById('pngNumberReceipt');if(p)p.onclick=()=>{document.body.classList.add('receipt-printing');setTimeout(()=>window.print(),80)};if(n)n.onclick=async()=>{try{toast('PNG তৈরি হচ্ছে...');const blob=await makeReceiptPng(document.getElementById('serviceReceiptBox'));await downloadBlob(blob,`number-receipt-${safeFileName(x.id)}.png`);toast('PNG সফলভাবে ডাউনলোড হয়েছে')}catch(err){console.error(err);toast('PNG তৈরি করা যায়নি। আবার চেষ্টা করুন।')}}},50)}
function serviceReceipt(title,x,type){const id=x.id||uid(type==='banking'?'MB':'MR');const isBank=type==='banking';const rows=isBank?`<div class="receipt-line"><span>গ্রাহকের মোবাইল:</span><b>${x.phone||'-'}</b></div><div class="receipt-line"><span>লেনদেনের ধরন:</span><b>${x.type||'-'}</b></div><div class="receipt-line"><span>মাধ্যম:</span><b>${x.method||'-'}</b></div><div class="receipt-line"><span>চার্জ:</span><b>${money(x.charge||0)}</b></div><div class="receipt-line"><span>মোট পরিমাণ:</span><b>${money(x.amount||0)}</b></div>`:`<div class="receipt-line"><span>গ্রাহকের মোবাইল:</span><b>${x.phone||'-'}</b></div><div class="receipt-line"><span>অপারেটর:</span><b>${x.operator||'-'}</b></div><div class="receipt-line"><span>রিচার্জের ধরন:</span><b>${x.type||'-'}</b></div><div class="receipt-line"><span>মাধ্যম:</span><b>${x.method||'-'}</b></div><div class="receipt-line"><span>পরিমাণ:</span><b>${money(x.amount||0)}</b></div>`;openModal(title,`<div class="service-receipt-wrap"><div class="service-receipt-toolbar"><strong>${title}</strong><div class="receipt-toolbar-actions"><button type="button" class="outline-btn" id="printServiceReceipt">🖨️ প্রিন্ট</button><button type="button" class="primary-btn" id="pngServiceReceipt">🖼️ PNG</button></div></div><div class="service-receipt" id="serviceReceiptBox"><div class="service-brand"><img src="assets/logo.png"><div><h2>${db.shop.name}</h2><p>${db.shop.address||'Barura, Cumilla'}</p><p>${db.shop.phone}</p></div></div><div class="service-meta"><div><span>লেনদেন আইডি:</span><b>${id}</b></div><div><span>তারিখ:</span><b>${x.date||today()}</b></div><div><span>সময়:</span><b>${new Date().toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'})}</b></div></div>${isBank&&x.method?`<div class="service-method">${x.method}</div>`:''}<div class="service-receipt-lines">${rows}</div><div class="service-total"><span>মোট পরিমাণ:</span><b>${money(x.amount||0)}</b></div><div class="service-status">স্ট্যাটাস: <b>সফল</b></div><div class="service-thanks">ধন্যবাদ!<small>Powered by Mahmud Telecom</small></div></div></div>`);setTimeout(()=>{const print=document.getElementById('printServiceReceipt'),png=document.getElementById('pngServiceReceipt');if(print)print.onclick=()=>{document.body.classList.add('receipt-printing');window.setTimeout(()=>window.print(),80)};if(png)png.onclick=async()=>{try{toast('PNG তৈরি হচ্ছে...');if(document.fonts&&document.fonts.ready)await document.fonts.ready;const receipt=document.getElementById('serviceReceiptBox');if(!receipt)throw new Error('Receipt not found');const blob=await makeServiceReceiptPngData(title,x,type);await downloadBlob(blob,`${type}-receipt-${safeFileName(id)}.png`);toast('PNG সফলভাবে ডাউনলোড হয়েছে')}catch(err){console.error(err);toast('PNG তৈরি করা যায়নি। আবার চেষ্টা করুন।')}}},50)}

document.getElementById('saleSearch').oninput=renderSales;document.getElementById('saleFilter').onchange=renderSales;document.getElementById('purchaseSearch').oninput=renderPurchases;document.getElementById('purchaseFilter').onchange=renderPurchases;document.getElementById('productSearch').oninput=renderProducts;document.getElementById('productCat').onchange=renderProducts;document.getElementById('customerSearch').oninput=renderCustomers;document.getElementById('numberSearch').oninput=renderNumbers;document.getElementById('numberFilter').onchange=renderNumbers;document.getElementById('applyReport').onclick=renderReport;
const savedTheme=localStorage.getItem('mah_theme')==='dark';function theme(d){document.body.classList.toggle('dark',d);document.getElementById('darkToggle').checked=d;document.getElementById('themeBtn').textContent=d?'☾':'☼';localStorage.setItem('mah_theme',d?'dark':'light')}theme(savedTheme);document.getElementById('themeBtn').onclick=()=>theme(!document.body.classList.contains('dark'));document.getElementById('darkToggle').onchange=e=>theme(e.target.checked);
let english=false;function toggleLang(){english=!english;document.getElementById('langBtn').textContent=english?'বাং':'EN';document.getElementById('settingLang').textContent=english?'English':'বাংলা';toast(english?'Language mode is ready for English labels':'বাংলা ভাষা সক্রিয়');}document.getElementById('langBtn').onclick=toggleLang;document.getElementById('settingLangBtn').onclick=toggleLang;
document.getElementById('saveShop').onclick=()=>{db.shop={name:document.getElementById('shopName').value,owner:document.getElementById('ownerName').value,phone:document.getElementById('shopPhone').value,address:document.getElementById('shopAddress').value};save();toast('দোকানের তথ্য সংরক্ষণ হয়েছে')};
document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mahmud-telecom-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup ডাউনলোড হয়েছে')};
document.getElementById('importInput').onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();toast('Backup সফলভাবে Import হয়েছে')}catch{toast('Backup ফাইলটি সঠিক নয়')}};r.readAsText(file)};
document.getElementById('resetData').onclick=()=>{if(confirm('সব হিসাব মুছে ডেমো ডাটায় ফিরিয়ে নিতে চান?')){db=structuredClone(stateDefault);save();toast('ডাটা রিসেট হয়েছে')}};
function pageLabel(page){const labels={dashboard:'ড্যাশবোর্ড',numbers:'নম্বর হিসাব',sales:'বিক্রয়',purchases:'ক্রয় রিপোর্ট',products:'স্টক ও পণ্য',customers:'কাস্টমার',suppliers:'সাপ্লায়ার',dues:'বকেয়ার তালিকা',recharge:'মোবাইল রিচার্জ',banking:'মোবাইল ব্যাংকিং','service-dues':'সেবা বাকি',reports:'রিপোর্ট ও হিসাব',settings:'সেটিংস'};return labels[page]||'রিপোর্ট'}
function printCurrentPage(){document.body.classList.add('printing');window.setTimeout(()=>window.print(),80)}
function safeFileName(s){return String(s).replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'mahmud-telecom'}
async function imageToDataURL(img){
  try{
    if(img.src.startsWith('data:')) return img.src;
    const res=await fetch(img.currentSrc||img.src,{mode:'cors',cache:'no-store'});
    if(!res.ok) throw new Error('image fetch failed');
    const blob=await res.blob();
    return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
  }catch(e){return null}
}

function svgEsc(v){
  return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
async function svgToPng(svg,width,height){
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error('SVG render failed'));
      img.src=url;
    });
    const scale=2;
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(width*scale);
    canvas.height=Math.ceil(height*scale);
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas unavailable');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return await new Promise((resolve,reject)=>{
      canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG blob failed')),'image/png',1);
    });
  }finally{
    URL.revokeObjectURL(url);
  }
}
async function makeServiceReceiptPngData(title,x,type){
  const box=document.getElementById('serviceReceiptBox');
  const logoEl=box?box.querySelector('img'):null;
  const logo=logoEl?await imageToDataURL(logoEl):null;
  const W=760, pad=42, inner=W-pad*2;
  const isBank=type==='banking';
  const rows=isBank?[
    ['গ্রাহকের মোবাইল:',x.phone||'-'],
    ['লেনদেনের ধরন:',x.type||'-'],
    ['মাধ্যম:',x.method||'-'],
    ['চার্জ:',money(x.charge||0)],
    ['মোট পরিমাণ:',money(x.amount||0)]
  ]:[
    ['গ্রাহকের মোবাইল:',x.phone||'-'],
    ['অপারেটর:',x.operator||'-'],
    ['রিচার্জের ধরন:',x.type||'-'],
    ['মাধ্যম:',x.method||'-'],
    ['পরিমাণ:',money(x.amount||0)]
  ];
  const H=760;
  const logoSvg=logo?`<image href="${logo}" x="${pad+2}" y="48" width="78" height="78" preserveAspectRatio="xMidYMid slice"/>`:
    `<rect x="${pad+2}" y="48" width="78" height="78" rx="14" fill="#ff315f"/><text x="${pad+41}" y="98" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">MT</text>`;
  // Start the detail rows below the transaction meta and transaction-type title.
  // The old y=190 overlapped the date/time area, making the customer's mobile number
  // appear on the same line as the date. Keep a clear vertical gap before the rows.
  let y=292;
  const rowSvg=rows.map(([a,b])=>{
    const out=`<text x="${pad}" y="${y}" font-size="20" fill="#626a84">${svgEsc(a)}</text>
      <text x="${W-pad}" y="${y}" text-anchor="end" font-size="20" font-weight="700" fill="#20284b">${svgEsc(b)}</text>
      <line x1="${pad}" y1="${y+18}" x2="${W-pad}" y2="${y+18}" stroke="#e1e4ec" stroke-dasharray="5 5"/>`;
    y+=58; return out;
  }).join('');
  const totalY=y+22;
  const statusY=totalY+58;
  const thanksY=statusY+58;
  const h=Math.max(H,thanksY+70);
  const methodTitle=String(x.type||title||'লেনদেন');
  const metaTime=new Date().toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
    <rect width="100%" height="100%" fill="#fff"/>
    <rect x="20" y="20" width="${W-40}" height="${h-40}" rx="24" fill="#fff" stroke="#e5e8f4" stroke-width="2"/>
    ${logoSvg}
    <text x="${pad+96}" y="75" font-family="Hind Siliguri, Arial, sans-serif" font-size="26" font-weight="800" fill="#178f3f">${svgEsc(db.shop.name)}</text>
    <text x="${pad+96}" y="101" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" fill="#4e556e">${svgEsc(db.shop.address||'Barura, Cumilla')}</text>
    <text x="${pad+96}" y="124" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" fill="#4e556e">${svgEsc(db.shop.phone||'')}</text>
    <line x1="${pad}" y1="150" x2="${W-pad}" y2="150" stroke="#edf0f6"/>
    <text x="${pad}" y="178" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" fill="#7b829d">লেনদেন আইডি:</text>
    <text x="${pad+150}" y="178" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" font-weight="700" fill="#283153">${svgEsc(x.id||'-')}</text>
    <text x="${W-pad-190}" y="178" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" fill="#7b829d">তারিখ:</text>
    <text x="${W-pad}" y="178" text-anchor="end" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" font-weight="700" fill="#283153">${svgEsc(x.date||today())}</text>
    <text x="${pad}" y="204" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" fill="#7b829d">সময়:</text>
    <text x="${pad+150}" y="204" font-family="Hind Siliguri, Arial, sans-serif" font-size="15" font-weight="700" fill="#283153">${svgEsc(metaTime)}</text>
    <line x1="${pad}" y1="222" x2="${W-pad}" y2="222" stroke="#edf0f6"/>
    <text x="${W/2}" y="260" text-anchor="middle" font-family="Hind Siliguri, Arial, sans-serif" font-size="28" font-weight="800" fill="#d62c83">${svgEsc(methodTitle)}</text>
    ${rowSvg}
    <line x1="${pad}" y1="${totalY-15}" x2="${W-pad}" y2="${totalY-15}" stroke="#dfe3ee"/>
    <text x="${pad}" y="${totalY+12}" font-family="Hind Siliguri, Arial, sans-serif" font-size="21" fill="#283153">মোট পরিমাণ:</text>
    <text x="${W-pad}" y="${totalY+12}" text-anchor="end" font-family="Hind Siliguri, Arial, sans-serif" font-size="28" font-weight="800" fill="#20284b">${svgEsc(money(x.amount||0))}</text>
    <text x="${W-pad}" y="${statusY}" text-anchor="end" font-family="Hind Siliguri, Arial, sans-serif" font-size="16" fill="#6e768f">স্ট্যাটাস: <tspan fill="#18a96b" font-weight="800">সফল</tspan></text>
    <text x="${W/2}" y="${thanksY}" text-anchor="middle" font-family="Hind Siliguri, Arial, sans-serif" font-size="20" font-weight="800" fill="#20284b">ধন্যবাদ!</text>
    <text x="${W/2}" y="${thanksY+25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b91a5">Powered by Mahmud Telecom</text>
  </svg>`;
  return svgToPng(svg,W,h);
}
async function makeStandardReceiptPngData(x){
  const box=document.getElementById('receiptBox');
  const logoEl=box?box.querySelector('img'):null;
  const logo=logoEl?await imageToDataURL(logoEl):null;
  const W=760,H=690,pad=52;
  const logoSvg=logo?`<image href="${logo}" x="${W/2-55}" y="38" width="110" height="110" preserveAspectRatio="xMidYMid slice"/>`:
    `<rect x="${W/2-55}" y="38" width="110" height="110" rx="18" fill="#ff315f"/>`;
  const vals=[
    ['কাস্টমার',x.customer||'-'],
    ['মোট',money(x.total||0)],
    ['পরিশোধ',money(x.paid||0)],
    ['বাকি',money((x.total||0)-(x.paid||0))]
  ];
  let y=245;
  const lines=vals.map(([a,b])=>{
    const s=`<text x="${pad}" y="${y}" font-family="Hind Siliguri, Arial, sans-serif" font-size="20" fill="#555">${svgEsc(a)}</text><text x="${W-pad}" y="${y}" text-anchor="end" font-family="Hind Siliguri, Arial, sans-serif" font-size="20" font-weight="700" fill="#111">${svgEsc(b)}</text><line x1="${pad}" y1="${y+15}" x2="${W-pad}" y2="${y+15}" stroke="#bbb" stroke-dasharray="5 5"/>`; y+=58; return s;
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${logoSvg}<text x="${W/2}" y="180" text-anchor="middle" font-family="Hind Siliguri, Arial, sans-serif" font-size="28" font-weight="800">${svgEsc(db.shop.name)}</text><text x="${W/2}" y="207" text-anchor="middle" font-family="Arial,sans-serif" font-size="16">${svgEsc(db.shop.phone||'')}</text><text x="${W/2}" y="230" text-anchor="middle" font-family="Arial,sans-serif" font-size="14">${svgEsc(x.date||today())} • ${svgEsc(x.id||'-')}</text>${lines}<text x="${W-pad}" y="${y+35}" text-anchor="end" font-family="Hind Siliguri, Arial, sans-serif" font-size="24" font-weight="800">ধন্যবাদ। আবার আসবেন।</text></svg>`;
  return svgToPng(svg,W,H);
}

async function makeReceiptPng(source){
  if(!source) throw new Error('Receipt element not found');
  if(document.fonts&&document.fonts.ready) await document.fonts.ready;

  const rect=source.getBoundingClientRect();
  const width=Math.max(340,Math.min(380,Math.ceil(rect.width||360)));
  const height=Math.max(260,Math.ceil(source.scrollHeight||rect.height||480));

  const clone=source.cloneNode(true);
  clone.style.cssText += `;display:block!important;position:relative!important;visibility:visible!important;opacity:1!important;width:${width}px!important;min-width:${width}px!important;max-width:${width}px!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;background:#fff!important;margin:0!important;`;

  const originalEls=source.querySelectorAll('*');
  const cloneEls=clone.querySelectorAll('*');
  const props=['box-sizing','display','position','top','right','bottom','left','width','min-width','max-width','height','min-height','max-height','margin','padding','border','border-radius','background','background-color','background-image','background-size','background-position','background-repeat','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-transform','white-space','vertical-align','overflow','overflow-x','overflow-y','grid-template-columns','grid-template-rows','grid-column','grid-row','gap','column-gap','align-items','align-content','justify-content','flex-direction','flex-wrap','flex','order','box-shadow','opacity','transform'];
  for(let i=0;i<cloneEls.length;i++){
    const cs=getComputedStyle(originalEls[i]);
    let inline='';
    for(const prop of props){const v=cs.getPropertyValue(prop);if(v)inline+=`${prop}:${v};`}
    cloneEls[i].setAttribute('style',(cloneEls[i].getAttribute('style')||'')+';'+inline);
  }

  const imgs=[...clone.querySelectorAll('img')];
  const originals=[...source.querySelectorAll('img')];
  await Promise.all(imgs.map(async(img,i)=>{
    const data=await imageToDataURL(originals[i]);
    if(data) img.src=data;
    img.removeAttribute('srcset');
    img.removeAttribute('loading');
  }));

  const holder=document.createElement('div');
  holder.style.cssText=`position:fixed;left:-100000px;top:0;width:${width}px;overflow:visible;background:#fff;z-index:-1;padding:0;`;
  holder.appendChild(clone);
  document.body.appendChild(holder);

  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

  const finalHeight=Math.ceil(clone.getBoundingClientRect().height||height);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${finalHeight}" viewBox="0 0 ${width} ${finalHeight}"><foreignObject x="0" y="0" width="${width}" height="${finalHeight}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;min-height:${finalHeight}px;background:#fff;overflow:visible;">${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`;
  const svgBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const svgUrl=URL.createObjectURL(svgBlob);

  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Receipt PNG render failed'));img.src=svgUrl});
    const scale=2;
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(width*scale);
    canvas.height=Math.ceil(finalHeight*scale);
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Receipt PNG blob failed')),'image/png',1));
  }finally{
    URL.revokeObjectURL(svgUrl);
    holder.remove();
  }
}
async function makePngFromElement(source){
  const rect=source.getBoundingClientRect();
  const width=Math.max(source.scrollWidth,Math.ceil(rect.width),320);
  const height=Math.max(source.scrollHeight,Math.ceil(rect.height),240);
  const clone=source.cloneNode(true);
  clone.classList.remove('active');
  clone.style.cssText += `;display:block!important;position:relative!important;visibility:visible!important;opacity:1!important;width:${width}px!important;min-width:${width}px!important;max-width:none!important;height:${height}px!important;min-height:${height}px!important;max-height:none!important;overflow:visible!important;background:#fff!important;`;

  const originalEls=source.querySelectorAll('*');
  const cloneEls=clone.querySelectorAll('*');
  const props=['box-sizing','display','position','top','right','bottom','left','width','min-width','max-width','height','min-height','max-height','margin','padding','border','border-radius','background','background-color','background-image','background-size','background-position','background-repeat','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-transform','white-space','vertical-align','overflow','overflow-x','overflow-y','grid-template-columns','grid-template-rows','grid-column','grid-row','gap','column-gap','row-gap','align-items','align-content','justify-content','flex-direction','flex-wrap','flex','order','box-shadow','opacity','transform'];
  for(let i=0;i<cloneEls.length;i++){
    const cs=getComputedStyle(originalEls[i]);
    let css='';
    for(const prop of props){const v=cs.getPropertyValue(prop);if(v)css+=`${prop}:${v};`}
    cloneEls[i].setAttribute('style',(cloneEls[i].getAttribute('style')||'')+';'+css);
  }
  const imgs=[...clone.querySelectorAll('img')];
  await Promise.all(imgs.map(async(img,i)=>{const src=await imageToDataURL(source.querySelectorAll('img')[i]);if(src)img.src=src;img.removeAttribute('srcset');img.style.maxWidth=img.style.maxWidth||'100%'}));

  const holder=document.createElement('div');
  holder.style.cssText=`position:fixed;left:-100000px;top:0;width:${width}px;height:${height}px;overflow:hidden;background:#fff;z-index:-1;`;
  holder.appendChild(clone);document.body.appendChild(holder);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#fff;overflow:visible;">${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`;
  const svgBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const svgUrl=URL.createObjectURL(svgBlob);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('SVG render failed'));img.src=svgUrl});
    const scale=2;
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG blob failed')),'image/png',1));
  }finally{URL.revokeObjectURL(svgUrl);holder.remove()}
}
async function downloadBlob(blob,filename){
  if(!blob) throw new Error('PNG blob পাওয়া যায়নি');
  const url=URL.createObjectURL(blob);
  const save=()=>{
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.rel='noopener';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  try{ save(); }catch(e){ console.warn('direct download blocked',e); }
  // Also provide a guaranteed user-click save link/preview for Chrome when automatic downloads are blocked.
  showPngSaveDialog(url,filename);
  setTimeout(()=>URL.revokeObjectURL(url),120000);
}
function showPngSaveDialog(url,filename){
  let box=document.getElementById('pngSaveDialog');
  if(box)box.remove();
  box=document.createElement('div');
  box.id='pngSaveDialog';
  box.innerHTML=`<div class="png-save-backdrop"></div><div class="png-save-card"><button type="button" class="png-save-close" aria-label="close">×</button><h3>🖼️ Receipt PNG প্রস্তুত</h3><p>নিচের <b>PNG সংরক্ষণ করুন</b> বাটনে চাপুন।</p><img src="${url}" alt="Receipt PNG"><div class="png-save-actions"><a class="primary-btn png-save-link" href="${url}" download="${filename}">⬇️ PNG সংরক্ষণ করুন</a><button type="button" class="outline-btn png-save-close2">বন্ধ</button></div></div>`;
  document.body.appendChild(box);
  const close=()=>box.remove();
  box.querySelector('.png-save-close').onclick=close;
  box.querySelector('.png-save-close2').onclick=close;
  box.querySelector('.png-save-backdrop').onclick=close;
}

async function pngCurrentPage(){
  const page=document.querySelector('.page.active');if(!page)return;
  try{toast('PNG তৈরি হচ্ছে...');if(document.fonts&&document.fonts.ready)await document.fonts.ready;const blob=await makePngFromElement(page);await downloadBlob(blob,`${safeFileName(pageLabel(page.id.replace('page-','')))}-${today()}.png`);toast('PNG সফলভাবে ডাউনলোড হয়েছে')}catch(err){console.error('PNG error:',err);toast('PNG তৈরি করা যায়নি। আবার চেষ্টা করুন।')}
}
function clearPageData(page){
 const map={numbers:['numbers','নম্বর হিসাব'],sales:['sales','বিক্রয়'],purchases:['purchases','ক্রয়'],products:['products','পণ্য'],customers:['customers','কাস্টমার'],suppliers:['suppliers','সাপ্লায়ার'],dues:[null,'বাকি'],recharge:['recharge','রিচার্জ'],banking:['banking','মোবাইল ব্যাংকিং']};
 const item=map[page];if(!item||!item[0]){toast('এই পাতার হিসাব সরাসরি মুছতে পারবেন না');return}
 if(confirm(`এই পাতার সব ${item[1]} হিসাব মুছে ফেলবেন?`)){db[item[0]]=[];save();toast(`${item[1]} হিসাব মুছে ফেলা হয়েছে`)}
}
function addPageActions(){document.querySelectorAll('.page').forEach(page=>{let host=page.querySelector('.section-title');if(page.id==='page-dashboard')host=page.querySelector('.dashboard-header');if(!host)return;let actions=host.querySelector('.report-actions')||host.querySelector('.page-print-actions');if(!actions){actions=document.createElement('div');actions.className='page-print-actions';actions.innerHTML='<button type="button" class="outline-btn page-print-btn">🖨️ প্রিন্ট</button><button type="button" class="primary-btn page-png-btn">🖼️ PNG</button>';host.appendChild(actions)}else{actions.classList.add('page-print-actions');const pb=actions.querySelector('#printReportBtn');const nb=actions.querySelector('#pngReportBtn');if(pb)pb.classList.add('page-print-btn');if(nb)nb.classList.add('page-png-btn')}const pb=actions.querySelector('.page-print-btn');const nb=actions.querySelector('.page-png-btn');if(pb)pb.onclick=printCurrentPage;if(nb)nb.onclick=pngCurrentPage;const p=page.id.replace('page-','');if(!actions.querySelector('.page-clear-btn')&&['numbers','sales','purchases','products','customers','suppliers','recharge','banking'].includes(p)){const cb=document.createElement('button');cb.type='button';cb.className='danger-btn page-clear-btn';cb.textContent='🗑️ সব মুছুন';cb.onclick=()=>clearPageData(p);actions.appendChild(cb)}})}


setTimeout(()=>{renderAll();addPageActions();initCloudSync();},0);
