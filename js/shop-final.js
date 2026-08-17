
const MT={
 key:"mahmud_telecom_shop_final_v2",
 defaultData(){
  return {
   products:[
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
   orders:[],
   settings:{shopName:"মাহমুদ টেলিকম",phone:"01846-655270",whatsapp:"8801846655270",deliveryInside:60,deliveryOutside:120,cod:true}
  }
 },
 get(){
  try{
   const d=JSON.parse(localStorage.getItem(this.key)||"null");
   if(d)return d;
  }catch(e){}
  const d=this.defaultData();this.save(d);return d;
 },
 save(d){localStorage.setItem(this.key,JSON.stringify(d))},
 next(a){return a.length?Math.max(...a.map(x=>Number(x.id)||0))+1:1},
 money(n){return "৳ "+Number(n||0).toLocaleString("bn-BD")},
 escape(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))},
 orderNo(){return "MT-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-6)}
};
function adminShell(active){
 return `<header class="admin-head"><a href="index.html" class="brand"><img src="images/logo.png"><span><b>মাহমুদ টেলিকম</b><small>Online Shop Admin</small></span></a><a class="site-btn" href="index.html">🛍️ Shop দেখুন</a></header>
<nav class="admin-nav">${[
["admin.html","ড্যাশবোর্ড"],["admin-products.html","পণ্য"],["admin-orders.html","অর্ডার"],["admin-settings.html","সেটিংস"]
].map(x=>`<a class="${active===x[0]?"active":""}" href="${x[0]}">${x[1]}</a>`).join("")}</nav>`;
}
