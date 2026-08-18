
// Mahmud Telecom — customer shop
const CAT_LABEL = {
  accessories:"এক্সেসরিজ", audio:"অডিও", protect:"গ্লাস ও কভার",
  electric:"ইলেকট্রিক", photo:"ফটোগ্রাফি"
};
const CAT_MAP = {
  "মোবাইল এক্সেসরিজ":"accessories","চার্জার ও কেবল":"accessories","অডিও":"audio",
  "কভার ও গ্লাস":"protect","ইলেকট্রিক":"electric","ফটোগ্রাফি":"photo"
};

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem(MT.CART_KEY) || "{}");
let activeFilter = "all";
let searchTerm = "";
let SHOP_SETTINGS = MT.get().settings;

function categoryCode(p){ return p.cat || CAT_MAP[p.category] || "accessories"; }

function renderProducts(){
  const grid=document.getElementById("productGrid"), empty=document.getElementById("emptyMsg");
  const filtered=PRODUCTS.filter(p=>{
    const cat=categoryCode(p);
    return (activeFilter==="all"||cat===activeFilter) &&
      String(p.name).toLowerCase().includes(searchTerm.toLowerCase());
  });
  grid.innerHTML="";
  empty.hidden=filtered.length!==0;
  filtered.forEach(p=>{
    const card=document.createElement("div"); card.className="product-card neu";
    const img=p.image ? `<img class="shop-product-image" src="${p.image}" alt="${MT.escape(p.name)}">` : `<span class="shop-product-icon">${p.icon||"📦"}</span>`;
    card.innerHTML=`<span class="product-cat cat-${categoryCode(p)}">${CAT_LABEL[categoryCode(p)]||MT.escape(p.category||"পণ্য")}</span>
      <div class="product-thumb">${img}</div>
      <div class="product-name">${MT.escape(p.name)}</div>
      <div class="product-row"><span><span class="product-price">${MT.money(p.price)}</span>${Number(p.oldPrice)>0?` <del class="old-price">${MT.money(p.oldPrice)}</del>`:""}</span>
      <button class="add-btn" data-id="${p.id}" ${Number(p.stock)<=0?"disabled":""}>${Number(p.stock)<=0?"×":"+"}</button></div>
      <small class="stock-note">${Number(p.stock)>0?`স্টক: ${p.stock}`:"স্টক শেষ"}</small>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll(".add-btn:not([disabled])").forEach(b=>b.onclick=()=>addToCart(Number(b.dataset.id)));
}

function renderCart(){
  const wrap=document.getElementById("cartItems"), ids=Object.keys(cart);
  let total=0,count=0;
  if(!ids.length) wrap.innerHTML=`<p class="cart-empty">আপনার কার্ট খালি।<br>পণ্য যোগ করুন।</p>`;
  else wrap.innerHTML=ids.map(id=>{
    const p=PRODUCTS.find(x=>Number(x.id)===Number(id)); if(!p) return "";
    const qty=Math.min(Number(cart[id]),Number(p.stock)||0); if(qty<=0)return "";
    cart[id]=qty; total+=Number(p.price)*qty; count+=qty;
    return `<div class="cart-item"><div class="cart-item-ico">${p.image?`<img src="${p.image}" alt="">`:(p.icon||"📦")}</div>
      <div class="cart-item-info"><div class="name">${MT.escape(p.name)}</div><div class="price">${MT.money(p.price)} × ${qty}</div></div>
      <div class="cart-item-qty"><button data-id="${id}" data-delta="-1">−</button><span>${qty}</span><button data-id="${id}" data-delta="1">+</button></div></div>`;
  }).join("");
  localStorage.setItem(MT.CART_KEY,JSON.stringify(cart));
  document.getElementById("cartTotal").textContent=MT.money(total);
  document.getElementById("cartCount").textContent=count;
  wrap.querySelectorAll("button[data-delta]").forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.id),Number(b.dataset.delta)));
  const checkout=document.getElementById("checkoutBtn");
  checkout.onclick=e=>{e.preventDefault();MT.openCheckout();};
}

function addToCart(id){
  const p=PRODUCTS.find(x=>Number(x.id)===id); if(!p||Number(p.stock)<=0)return;
  cart[id]=Math.min((cart[id]||0)+1,Number(p.stock)); localStorage.setItem(MT.CART_KEY,JSON.stringify(cart)); renderCart(); openCart();
}
function changeQty(id,delta){
  const p=PRODUCTS.find(x=>Number(x.id)===id); if(!p)return;
  cart[id]=(cart[id]||0)+delta;
  if(cart[id]<=0)delete cart[id]; else cart[id]=Math.min(cart[id],Number(p.stock));
  renderCart();
}
function openCart(){document.getElementById("cartDrawer").classList.add("show");document.getElementById("overlay").classList.add("show");}
function closeCart(){document.getElementById("cartDrawer").classList.remove("show");document.getElementById("overlay").classList.remove("show");}

async function initShop(){
  PRODUCTS=await MT.getProducts(false);
  const settings=await MT.getSettings();
  SHOP_SETTINGS=settings;
  document.querySelectorAll(".shop-phone").forEach(x=>x.textContent=settings.phone);
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a=>a.href="https://wa.me/"+settings.whatsapp);
  renderProducts(); renderCart();
}

document.getElementById("filterRow").onclick=e=>{
  const b=e.target.closest(".filter-btn"); if(!b)return;
  activeFilter=b.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderProducts();
};
document.getElementById("categoryChips").onclick=e=>{
  const b=e.target.closest(".chip"); if(!b)return;
  activeFilter=b.dataset.cat;
  document.querySelectorAll(".filter-btn").forEach(x=>x.classList.toggle("active",x.dataset.filter===activeFilter));
  renderProducts(); document.getElementById("products").scrollIntoView({behavior:"smooth"});
};
function doSearch(){searchTerm=document.getElementById("searchInput").value.trim();renderProducts();if(searchTerm)document.getElementById("products").scrollIntoView({behavior:"smooth"});}
document.getElementById("searchBtn").onclick=doSearch;
document.getElementById("searchInput").onkeydown=e=>{if(e.key==="Enter")doSearch();};
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
document.getElementById("overlay").onclick=closeCart;
document.getElementById("contactForm").onsubmit=e=>{
  e.preventDefault(); const v=[...e.target.querySelectorAll("input,textarea")];
  const text=encodeURIComponent(`আসসালামু আলাইকুম, আমার নাম ${v[0].value} (${v[1].value})।\n${v[2].value}`);
  window.open(`https://wa.me/${SHOP_SETTINGS.whatsapp}?text=${text}`,"_blank"); e.target.reset();
};
const navLinks=document.querySelectorAll("#pillnav a");
window.addEventListener("scroll",()=>{
  let current="home";
  ["home","products","services","contact"].forEach(id=>{const s=document.getElementById(id);if(s&&scrollY>=s.offsetTop-140)current=id;});
  navLinks.forEach(l=>l.classList.toggle("active",l.dataset.target===current));
});
initShop().catch(err=>console.error(err));
