// =========================================================
// MAHMUD TELECOM — shop logic
// =========================================================

const SHOP_PHONE = "8801846655270"; // WhatsApp order number

const PRODUCTS = [
  { id:1,  name:"মোবাইল ব্যাক কভার",        cat:"accessories", price:120,  icon:"📱" },
  { id:2,  name:"USB ডাটা কেবল",            cat:"accessories", price:150,  icon:"🔌" },
  { id:3,  name:"ফাস্ট চার্জার (অ্যাডাপ্টার)", cat:"accessories", price:350,  icon:"🔋" },
  { id:4,  name:"সেলফি স্টিক",               cat:"accessories", price:250,  icon:"🤳" },
  { id:5,  name:"ব্লুটুথ হেডফোন",            cat:"audio",       price:650,  icon:"🎧" },
  { id:6,  name:"হ্যান্ডসফ্রি ইয়ারফোন",       cat:"audio",       price:180,  icon:"🎧" },
  { id:7,  name:"ব্লুটুথ স্পিকার",            cat:"audio",       price:900,  icon:"🔊" },
  { id:8,  name:"টেম্পার্ড গ্লাস প্রোটেক্টর",   cat:"protect",     price:100,  icon:"🛡️" },
  { id:9,  name:"প্রিমিয়াম মোবাইল কভার",      cat:"protect",     price:180,  icon:"📱" },
  { id:10, name:"স্ক্রিন গার্ড (ম্যাট)",        cat:"protect",     price:120,  icon:"🛡️" },
  { id:11, name:"মাল্টি প্লাগ সকেট",          cat:"electric",    price:450,  icon:"🔌" },
  { id:12, name:"এলইডি বাল্ব",                cat:"electric",    price:130,  icon:"💡" },
  { id:13, name:"এক্সটেনশন বোর্ড",            cat:"electric",    price:500,  icon:"🔌" },
  { id:14, name:"পাসপোর্ট সাইজ ছবি (কপি)",     cat:"photo",       price:50,   icon:"📸" },
  { id:15, name:"ছবি এডিটিং সার্ভিস",          cat:"photo",       price:80,   icon:"🖌️" },
  { id:16, name:"স্টুডিও ফটোগ্রাফি (ঘণ্টা)",    cat:"photo",       price:500,  icon:"📷" },
];

const CAT_LABEL = {
  accessories:"এক্সেসরিজ", audio:"অডিও", protect:"গ্লাস ও কভার",
  electric:"ইলেকট্রিক", photo:"ফটোগ্রাফি"
};

let cart = JSON.parse(localStorage.getItem("mt_cart") || "{}");
let activeFilter = "all";
let searchTerm = "";

// ---------- render products ----------
function renderProducts(){
  const grid = document.getElementById("productGrid");
  const emptyMsg = document.getElementById("emptyMsg");
  const filtered = PRODUCTS.filter(p=>{
    const matchCat = activeFilter === "all" || p.cat === activeFilter;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  grid.innerHTML = "";
  emptyMsg.hidden = filtered.length !== 0;

  filtered.forEach(p=>{
    const card = document.createElement("div");
    card.className = "product-card neu";
    card.innerHTML = `
      <span class="product-cat cat-${p.cat}">${CAT_LABEL[p.cat]}</span>
      <div class="product-thumb">${p.icon}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-row">
        <span class="product-price">৳ ${p.price}</span>
        <button class="add-btn" data-id="${p.id}" aria-label="কার্টে যোগ করুন">+</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".add-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> addToCart(Number(btn.dataset.id)));
  });
}

// ---------- filter buttons ----------
document.getElementById("filterRow").addEventListener("click", e=>{
  const btn = e.target.closest(".filter-btn");
  if(!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
});

// ---------- category chips in hero ----------
document.getElementById("categoryChips").addEventListener("click", e=>{
  const chip = e.target.closest(".chip");
  if(!chip) return;
  const cat = chip.dataset.cat;
  activeFilter = cat;
  document.querySelectorAll(".filter-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.filter === cat);
  });
  renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
});

// ---------- search ----------
function doSearch(){
  searchTerm = document.getElementById("searchInput").value.trim();
  renderProducts();
  if(searchTerm) document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
document.getElementById("searchBtn").addEventListener("click", doSearch);
document.getElementById("searchInput").addEventListener("keydown", e=>{
  if(e.key === "Enter") doSearch();
});

// ---------- cart ----------
function saveCart(){ localStorage.setItem("mt_cart", JSON.stringify(cart)); }

function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function changeQty(id, delta){
  cart[id] = (cart[id] || 0) + delta;
  if(cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function renderCart(){
  const wrap = document.getElementById("cartItems");
  const ids = Object.keys(cart);
  let total = 0;
  let count = 0;

  if(ids.length === 0){
    wrap.innerHTML = `<p class="cart-empty">আপনার কার্ট খালি।<br>পণ্য যোগ করুন।</p>`;
  } else {
    wrap.innerHTML = ids.map(id=>{
      const p = PRODUCTS.find(x=>x.id === Number(id));
      const qty = cart[id];
      total += p.price * qty;
      count += qty;
      return `
        <div class="cart-item">
          <div class="cart-item-ico">${p.icon}</div>
          <div class="cart-item-info">
            <div class="name">${p.name}</div>
            <div class="price">৳ ${p.price} × ${qty}</div>
          </div>
          <div class="cart-item-qty">
            <button data-id="${id}" data-delta="-1">−</button>
            <span>${qty}</span>
            <button data-id="${id}" data-delta="1">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("cartTotal").textContent = `৳ ${total}`;
  document.getElementById("cartCount").textContent = count;

  wrap.querySelectorAll("button[data-delta]").forEach(btn=>{
    btn.addEventListener("click", ()=> changeQty(btn.dataset.id, Number(btn.dataset.delta)));
  });

  // build whatsapp checkout link
  let msg = "আসসালামু আলাইকুম, আমি মাহমুদ টেলিকম থেকে নিচের পণ্যগুলো অর্ডার করতে চাই:%0A%0A";
  ids.forEach(id=>{
    const p = PRODUCTS.find(x=>x.id === Number(id));
    msg += `• ${p.name} × ${cart[id]} = ৳${p.price * cart[id]}%0A`;
  });
  msg += `%0Aমোট: ৳${total}`;
  document.getElementById("checkoutBtn").href = `https://wa.me/${SHOP_PHONE}?text=${msg}`;
}

function openCart(){
  document.getElementById("cartDrawer").classList.add("show");
  document.getElementById("overlay").classList.add("show");
}
function closeCartFn(){
  document.getElementById("cartDrawer").classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
}
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCartFn);
document.getElementById("overlay").addEventListener("click", closeCartFn);

// ---------- pill nav active state on scroll ----------
const navLinks = document.querySelectorAll("#pillnav a");
navLinks.forEach(link=>{
  link.addEventListener("click", ()=>{
    navLinks.forEach(l=>l.classList.remove("active"));
    link.classList.add("active");
  });
});

const sections = ["home","products","services","contact"].map(id=>document.getElementById(id));
window.addEventListener("scroll", ()=>{
  let current = "home";
  sections.forEach(sec=>{
    if(window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navLinks.forEach(l=>{
    l.classList.toggle("active", l.dataset.target === current);
  });
});

// ---------- contact form -> whatsapp ----------
document.getElementById("contactForm").addEventListener("submit", e=>{
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input, textarea");
  const name = inputs[0].value;
  const phone = inputs[1].value;
  const message = inputs[2].value;
  const text = encodeURIComponent(`আসসালামু আলাইকুম, আমার নাম ${name} (${phone})।\n${message}`);
  window.open(`https://wa.me/${SHOP_PHONE}?text=${text}`, "_blank");
  e.target.reset();
});

// ---------- init ----------
renderProducts();
renderCart();

/* Final Online Shop additions — preserves existing UI and cart logic. */
(function(){
 const data=MT.get();
 window.MT_OPEN_CHECKOUT=function(){
   let cart=[];
   try{cart=JSON.parse(localStorage.getItem("cart")||localStorage.getItem("mahmud_cart")||"[]")}catch(e){}
   if(!cart.length){alert("আপনার কার্ট খালি।");return}
   const old=document.getElementById("mtCheckout");if(old)old.remove();
   const items=cart.map(i=>{const p=data.products.find(x=>x.id==i.id||x.name===i.name)||i;return {id:p.id,name:p.name,price:Number(p.price),qty:Number(i.qty||i.quantity||1)}}); 
   const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);
   const m=document.createElement("div");m.id="mtCheckout";m.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;overflow:auto;padding:20px";
   m.innerHTML=`<div style="max-width:620px;margin:30px auto;background:#fff;border-radius:18px;padding:22px;font-family:Arial,sans-serif"><h2>অর্ডার কনফার্ম করুন</h2><p>পণ্যের মোট: <b>${MT.money(subtotal)}</b></p><form id="mtOrderForm"><input name="name" placeholder="আপনার নাম" required style="width:100%;padding:12px;margin:5px 0"><input name="phone" placeholder="মোবাইল নম্বর" required style="width:100%;padding:12px;margin:5px 0"><input name="address" placeholder="সম্পূর্ণ ঠিকানা" required style="width:100%;padding:12px;margin:5px 0"><input name="area" placeholder="এলাকা / থানা / উপজেলা" required style="width:100%;padding:12px;margin:5px 0"><select name="delivery" style="width:100%;padding:12px;margin:5px 0"><option value="inside">শহরের ভিতরে — ${MT.money(data.settings.deliveryInside)}</option><option value="outside">শহরের বাইরে — ${MT.money(data.settings.deliveryOutside)}</option></select><select name="payment" style="width:100%;padding:12px;margin:5px 0">${data.settings.cod?'<option>Cash on Delivery</option>':""}<option>WhatsApp Payment</option></select><textarea name="note" placeholder="অতিরিক্ত নির্দেশনা (ঐচ্ছিক)" style="width:100%;padding:12px;margin:5px 0"></textarea><div style="display:flex;gap:8px;margin-top:12px"><button style="background:#1769e0;color:#fff;border:0;border-radius:9px;padding:12px 18px">অর্ডার পাঠান</button><button type="button" id="mtClose" style="padding:12px 18px;border:0;border-radius:9px">বাতিল</button></div></form></div>`;
   document.body.appendChild(m);document.getElementById("mtClose").onclick=()=>m.remove();
   document.getElementById("mtOrderForm").onsubmit=function(e){
    e.preventDefault();const f=new FormData(e.target);const dc=f.get("delivery")==="inside"?Number(data.settings.deliveryInside):Number(data.settings.deliveryOutside);
    const total=subtotal+dc;const order={orderNo:MT.orderNo(),date:new Date().toLocaleString("bn-BD"),customer:{name:f.get("name"),phone:f.get("phone"),address:f.get("address"),area:f.get("area"),note:f.get("note")},items,total:subtotal,deliveryCharge:dc,grandTotal:total,payment:f.get("payment"),status:"New"};
    data.orders.push(order);MT.save(data);
    const lines=[`*${data.settings.shopName} - New Order*`,`Order: ${order.orderNo}`,`Name: ${order.customer.name}`,`Phone: ${order.customer.phone}`,`Address: ${order.customer.address}, ${order.customer.area}`,"Items:",...items.map(i=>`${i.name} x ${i.qty} = ${i.price*i.qty} Tk`),`Subtotal: ${subtotal} Tk`,`Delivery: ${dc} Tk`,`Total: ${total} Tk`,`Payment: ${order.payment}`];const url="https://wa.me/"+data.settings.whatsapp+"?text="+encodeURIComponent(lines.join("\n"));localStorage.removeItem("cart");localStorage.removeItem("mahmud_cart");location.href=url;
   };
 };
})();
