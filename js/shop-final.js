
/* Mahmud Telecom — shared data/API layer */
(() => {
  const KEY = "mahmud_telecom_shop_final_v3";
  const CART_KEY = "mt_cart";
  let apiState = "unknown"; // unknown | online | local

  const defaults = {
    products: [
      {id:1,name:"মোবাইল ব্যাক কভার",category:"মোবাইল এক্সেসরিজ",price:120,oldPrice:0,stock:20,image:"",active:true},
      {id:2,name:"USB ডাটা কেবল",category:"চার্জার ও কেবল",price:150,oldPrice:0,stock:25,image:"",active:true},
      {id:3,name:"ফাস্ট চার্জার (অ্যাডাপ্টার)",category:"চার্জার ও কেবল",price:350,oldPrice:0,stock:15,image:"",active:true},
      {id:4,name:"সেলফি স্টিক",category:"মোবাইল এক্সেসরিজ",price:250,oldPrice:0,stock:10,image:"",active:true},
      {id:5,name:"ব্লুটুথ হেডফোন",category:"অডিও",price:650,oldPrice:0,stock:12,image:"",active:true},
      {id:6,name:"হ্যান্ডসফ্রি ইয়ারফোন",category:"অডিও",price:180,oldPrice:0,stock:30,image:"",active:true},
      {id:7,name:"ব্লুটুথ স্পিকার",category:"অডিও",price:900,oldPrice:0,stock:8,image:"",active:true},
      {id:8,name:"টেম্পার্ড গ্লাস প্রোটেক্টর",category:"কভার ও গ্লাস",price:100,oldPrice:0,stock:30,image:"",active:true},
      {id:9,name:"প্রিমিয়াম মোবাইল কভার",category:"কভার ও গ্লাস",price:180,oldPrice:0,stock:18,image:"",active:true},
      {id:10,name:"স্ক্রিন গার্ড (ম্যাট)",category:"কভার ও গ্লাস",price:120,oldPrice:0,stock:20,image:"",active:true},
      {id:11,name:"মাল্টি প্লাগ সকেট",category:"ইলেকট্রিক",price:450,oldPrice:0,stock:10,image:"",active:true},
      {id:12,name:"এলইডি বাল্ব",category:"ইলেকট্রিক",price:130,oldPrice:0,stock:25,image:"",active:true},
      {id:13,name:"এক্সটেনশন বোর্ড",category:"ইলেকট্রিক",price:500,oldPrice:0,stock:8,image:"",active:true},
      {id:14,name:"পাসপোর্ট সাইজ ছবি",category:"ফটোগ্রাফি",price:50,oldPrice:0,stock:99,image:"",active:true},
      {id:15,name:"ছবি এডিটিং সার্ভিস",category:"ফটোগ্রাফি",price:80,oldPrice:0,stock:99,image:"",active:true},
      {id:16,name:"স্টুডিও ফটোগ্রাফি (ঘণ্টা)",category:"ফটোগ্রাফি",price:500,oldPrice:0,stock:99,image:"",active:true}
    ],
    orders: [],
    settings: {shopName:"মাহমুদ টেলিকম",phone:"01846-655270",whatsapp:"8801846655270",deliveryInside:60,deliveryOutside:120,cod:true}
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const base = () => String(window.MT_API_BASE || "").replace(/\/+$/,"");
  const apiUrl = path => `${base()}${path}`;
  const localGet = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d) return d;
    } catch (_) {}
    const d = clone(defaults);
    localStorage.setItem(KEY, JSON.stringify(d));
    return d;
  };
  const localSave = d => localStorage.setItem(KEY, JSON.stringify(d));

  async function raw(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type","application/json");
    const key = sessionStorage.getItem("mt_admin_key");
    if (key) headers.set("x-admin-key", key);
    const res = await fetch(apiUrl(path), {...options, headers});
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function detectApi() {
    if (apiState !== "unknown") return apiState === "online";
    try {
      const r = await fetch(apiUrl("/api/health"), {cache:"no-store"});
      apiState = r.ok ? "online" : "local";
    } catch (_) {
      apiState = "local";
    }
    return apiState === "online";
  }

  const money = n => "৳ " + Number(n || 0).toLocaleString("bn-BD");
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
  const next = a => a.length ? Math.max(...a.map(x => Number(x.id)||0)) + 1 : 1;
  const orderNo = () => "MT-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-6);

  async function getProducts(admin=false) {
    if (await detectApi()) {
      try { return await raw(admin ? "/api/products/admin" : "/api/products"); }
      catch (e) { if (admin) throw e; }
    }
    return localGet().products.filter(x => !admin ? x.active : true);
  }
  async function getSettings() {
    if (await detectApi()) {
      try { return await raw("/api/settings"); } catch (_) {}
    }
    return localGet().settings;
  }
  async function getOrders() {
    if (await detectApi()) {
      try { return await raw("/api/orders"); } catch (e) { throw e; }
    }
    return localGet().orders.slice().reverse();
  }
  async function createProduct(obj) {
    if (await detectApi()) return raw("/api/products",{method:"POST",body:JSON.stringify(obj)});
    const d=localGet(); obj={...obj,id:next(d.products)}; d.products.push(obj); localSave(d); return obj;
  }
  async function updateProduct(id,obj) {
    if (await detectApi()) return raw(`/api/products/${id}`,{method:"PUT",body:JSON.stringify(obj)});
    const d=localGet(); d.products=d.products.map(x=>x.id===id?{...obj,id}:x); localSave(d); return obj;
  }
  async function deleteProduct(id) {
    if (await detectApi()) return raw(`/api/products/${id}`,{method:"DELETE"});
    const d=localGet(); d.products=d.products.filter(x=>x.id!==id); localSave(d); return {ok:true};
  }
  async function saveSettings(obj) {
    if (await detectApi()) return raw("/api/settings",{method:"PUT",body:JSON.stringify(obj)});
    const d=localGet(); d.settings=obj; localSave(d); return obj;
  }
  async function createOrder(payload) {
    if (await detectApi()) return raw("/api/orders",{method:"POST",body:JSON.stringify(payload)});
    const d=localGet();
    const no=orderNo();
    const subtotal=payload.items.reduce((s,i)=>s+Number(i.price)*Number(i.qty),0);
    const dc=payload.deliveryZone==="outside"?Number(d.settings.deliveryOutside):Number(d.settings.deliveryInside);
    const order={id:Date.now(),orderNo:no,date:new Date().toLocaleString("bn-BD"),customer:payload.customer,items:payload.items,total:subtotal,deliveryCharge:dc,grandTotal:subtotal+dc,payment:payload.payment,note:payload.note||"",status:"New"};
    d.orders.push(order);
    d.products=d.products.map(p=>{const i=payload.items.find(x=>Number(x.id)===Number(p.id)); return i?{...p,stock:Number(p.stock)-Number(i.qty)}:p});
    localSave(d);
    return {orderNo:no,subtotal,deliveryCharge:dc,grandTotal:subtotal+dc};
  }
  async function updateOrderStatus(id,status) {
    if (await detectApi()) return raw(`/api/orders/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});
    const d=localGet(); const x=d.orders.find(o=>Number(o.id)===Number(id)); if(x)x.status=status; localSave(d); return x||{};
  }
  async function deleteOrder(id) {
    if (await detectApi()) return raw(`/api/orders/${id}`,{method:"DELETE"});
    const d=localGet(); d.orders=d.orders.filter(o=>Number(o.id)!==Number(id)); localSave(d); return {ok:true};
  }

  async function requireAdminKey() {
    if (!(await detectApi())) return true;
    const key=sessionStorage.getItem("mt_admin_key") || "";
    if (!key) return false;
    try { await raw("/api/products/admin"); return true; }
    catch (_) { sessionStorage.removeItem("mt_admin_key"); return false; }
  }

  function adminShell(active) {
    return `<header class="admin-head">
      <a href="index.html" class="brand"><img src="images/logo.png" alt="Logo"><span><b>মাহমুদ টেলিকম</b><small>Online Shop Admin</small></span></a>
      <div class="admin-head-actions"><button class="site-btn" onclick="MT.logout()">🔒 Logout</button><a class="site-btn" href="index.html">🛍️ Shop দেখুন</a></div>
    </header>
    <nav class="admin-nav">${[
      ["admin.html","ড্যাশবোর্ড"],["admin-products.html","পণ্য"],["admin-orders.html","অর্ডার"],["admin-settings.html","সেটিংস"]
    ].map(x=>`<a class="${active===x[0]?"active":""}" href="${x[0]}">${x[1]}</a>`).join("")}</nav>`;
  }

  async function openCheckout() {
    const products = await getProducts(false);
    let cart = {};
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); } catch (_) {}
    const items = Object.entries(cart).map(([id,qty])=>{
      const p=products.find(x=>Number(x.id)===Number(id));
      return p ? {id:p.id,name:p.name,price:Number(p.price),qty:Number(qty)} : null;
    }).filter(Boolean).filter(x=>x.qty>0);
    if (!items.length) { alert("আপনার কার্ট খালি।"); return; }

    const settings=await getSettings();
    const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);
    const m=document.createElement("div");
    m.id="mtCheckout"; m.className="mt-checkout-overlay";
    m.innerHTML=`<div class="mt-checkout-box">
      <h2>অর্ডার কনফার্ম করুন</h2><p>পণ্যের মোট: <b>${money(subtotal)}</b></p>
      <form id="mtOrderForm">
        <input name="name" placeholder="আপনার নাম" required>
        <input name="phone" placeholder="মোবাইল নম্বর" required>
        <input name="address" placeholder="সম্পূর্ণ ঠিকানা" required>
        <input name="area" placeholder="এলাকা / থানা / উপজেলা" required>
        <select name="delivery"><option value="inside">শহরের ভিতরে — ${money(settings.deliveryInside)}</option><option value="outside">শহরের বাইরে — ${money(settings.deliveryOutside)}</option></select>
        <select name="payment">${settings.cod?'<option>Cash on Delivery</option>':""}<option>WhatsApp Payment</option></select>
        <textarea name="note" placeholder="অতিরিক্ত নির্দেশনা (ঐচ্ছিক)"></textarea>
        <div class="mt-checkout-actions"><button class="btn btn-primary" type="submit">অর্ডার পাঠান</button><button class="btn btn-outline" type="button" id="mtClose">বাতিল</button></div>
      </form>
    </div>`;
    document.body.appendChild(m);
    document.getElementById("mtClose").onclick=()=>m.remove();
    document.getElementById("mtOrderForm").onsubmit=async e=>{
      e.preventDefault();
      const f=new FormData(e.target);
      const payload={customer:{name:f.get("name"),phone:f.get("phone"),address:f.get("address"),area:f.get("area")},items,deliveryZone:f.get("delivery"),payment:f.get("payment"),note:f.get("note")||""};
      const btn=e.target.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="পাঠানো হচ্ছে...";
      try{
        const result=await createOrder(payload);
        localStorage.removeItem(CART_KEY);
        const lines=[`*${settings.shopName} - New Order*`,`Order: ${result.orderNo}`,`Name: ${payload.customer.name}`,`Phone: ${payload.customer.phone}`,`Address: ${payload.customer.address}, ${payload.customer.area}`,"Items:",...items.map(i=>`${i.name} x ${i.qty} = ${i.price*i.qty} Tk`),`Subtotal: ${result.subtotal} Tk`,`Delivery: ${result.deliveryCharge} Tk`,`Total: ${result.grandTotal} Tk`,`Payment: ${payload.payment}`];
        const url="https://wa.me/"+settings.whatsapp+"?text="+encodeURIComponent(lines.join("\n"));
        location.href=url;
      }catch(err){ alert("অর্ডার পাঠানো যায়নি: "+err.message); btn.disabled=false; btn.textContent="অর্ডার পাঠান"; }
    };
  }

  window.MT = {
    key:KEY, CART_KEY, defaults,
    get:localGet, save:localSave, money, escape:escapeHtml, next, orderNo,
    detectApi, getProducts, getSettings, getOrders, createProduct, updateProduct, deleteProduct,
    saveSettings, createOrder, updateOrderStatus, deleteOrder, requireAdminKey, adminShell,
    openCheckout, logout(){sessionStorage.removeItem("mt_admin_key");location.reload();}
  };
  window.MT_OPEN_CHECKOUT = openCheckout;
})();
