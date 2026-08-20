
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

dotenv.config();
const {Pool}=pg;
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL) console.warn("DATABASE_URL is not set.");
const pool=new Pool({
  connectionString:DATABASE_URL,
  ssl:DATABASE_URL && !DATABASE_URL.includes("localhost") ? {rejectUnauthorized:false} : false
});
const app=express();
app.use(cors({origin:process.env.CORS_ORIGIN||"*"}));
app.use(express.json({limit:"12mb"}));

const admin=(req,res,next)=>{
  if(!process.env.ADMIN_KEY || req.header("x-admin-key")!==process.env.ADMIN_KEY)
    return res.status(401).json({error:"Unauthorized"});
  next();
};
const orderNo=()=>`MT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

app.get("/api/health",async(req,res)=>{
  try{await pool.query("select 1");res.json({ok:true})}
  catch(e){res.status(500).json({ok:false,error:"Database unavailable"})}
});

app.get("/api/products",async(req,res)=>{
  try{
    const r=await pool.query(`select id,name,category,price,old_price as "oldPrice",stock,image,active from products where active=true order by id desc`);
    res.json(r.rows);
  }catch(e){res.status(500).json({error:e.message})}
});
app.get("/api/products/admin",admin,async(req,res)=>{
  try{
    const r=await pool.query(`select id,name,category,price,old_price as "oldPrice",stock,image,active from products order by id desc`);
    res.json(r.rows);
  }catch(e){res.status(500).json({error:e.message})}
});
app.post("/api/products",admin,async(req,res)=>{
  try{
    const {name,category,price,oldPrice=0,stock=0,image="",active=true}=req.body;
    if(!String(name||"").trim()||!String(category||"").trim()) return res.status(400).json({error:"Name and category are required"});
    const r=await pool.query(`insert into products(name,category,price,old_price,stock,image,active)
      values($1,$2,$3,$4,$5,$6,$7)
      returning id,name,category,price,old_price as "oldPrice",stock,image,active`,
      [String(name).trim(),String(category).trim(),Number(price)||0,Number(oldPrice)||0,Math.max(0,Math.trunc(Number(stock)||0)),String(image||""),!!active]);
    res.status(201).json(r.rows[0]);
  }catch(e){res.status(400).json({error:e.message})}
});
app.put("/api/products/:id",admin,async(req,res)=>{
  try{
    const {name,category,price,oldPrice=0,stock=0,image="",active=true}=req.body;
    const r=await pool.query(`update products set name=$1,category=$2,price=$3,old_price=$4,stock=$5,image=$6,active=$7,updated_at=now()
      where id=$8 returning id,name,category,price,old_price as "oldPrice",stock,image,active`,
      [String(name||"").trim(),String(category||"").trim(),Number(price)||0,Number(oldPrice)||0,Math.max(0,Math.trunc(Number(stock)||0)),String(image||""),!!active,req.params.id]);
    if(!r.rowCount)return res.status(404).json({error:"Product not found"});
    res.json(r.rows[0]);
  }catch(e){res.status(400).json({error:e.message})}
});
app.delete("/api/products/:id",admin,async(req,res)=>{
  try{
    const r=await pool.query("delete from products where id=$1 returning id",[req.params.id]);
    if(!r.rowCount)return res.status(404).json({error:"Product not found"});
    res.json({ok:true});
  }catch(e){
    if(e.code==="23503"){
      const r=await pool.query("update products set active=false,updated_at=now() where id=$1 returning id",[req.params.id]);
      if(!r.rowCount)return res.status(404).json({error:"Product not found"});
      return res.json({ok:true,softDeleted:true});
    }
    res.status(400).json({error:e.message});
  }
});

app.get("/api/settings",async(req,res)=>{
  try{
    const r=await pool.query(`select shop_name as "shopName",phone,whatsapp,delivery_inside as "deliveryInside",delivery_outside as "deliveryOutside",cod from shop_settings where id=1`);
    res.json(r.rows[0]||{});
  }catch(e){res.status(500).json({error:e.message})}
});
app.put("/api/settings",admin,async(req,res)=>{
  try{
    const {shopName,phone,whatsapp,deliveryInside=60,deliveryOutside=120,cod=true}=req.body;
    const r=await pool.query(`update shop_settings set shop_name=$1,phone=$2,whatsapp=$3,delivery_inside=$4,delivery_outside=$5,cod=$6
      where id=1 returning shop_name as "shopName",phone,whatsapp,delivery_inside as "deliveryInside",delivery_outside as "deliveryOutside",cod`,
      [String(shopName||"মাহমুদ টেলিকম"),String(phone||""),String(whatsapp||""),Math.max(0,Number(deliveryInside)||0),Math.max(0,Number(deliveryOutside)||0),!!cod]);
    res.json(r.rows[0]);
  }catch(e){res.status(400).json({error:e.message})}
});

app.post("/api/orders",async(req,res)=>{
  const {customer,items,payment="Cash on Delivery",deliveryZone="inside",note=""}=req.body;
  if (String(customer?.name||"").trim().length < 2 || String(customer?.phone||"").trim().length < 8)
    return res.status(400).json({error:"সঠিক নাম ও মোবাইল নম্বর দিন"});
  if (!["inside","outside"].includes(deliveryZone))
    return res.status(400).json({error:"Invalid delivery zone"});
  if(!customer?.name||!customer?.phone||!customer?.address||!customer?.area||!Array.isArray(items)||!items.length)
    return res.status(400).json({error:"Missing order details"});
  const c=await pool.connect();
  try{
    await c.query("begin");
    const ids=items.map(x=>Number(x.id)).filter(Number.isFinite);
    if(ids.length!==items.length) throw new Error("Invalid product");
    if(new Set(ids).size!==ids.length) throw new Error("Duplicate product in order");
    const pr=await c.query("select id,name,price,stock,active from products where id=any($1::bigint[]) for update",[ids]);
    const map=new Map(pr.rows.map(x=>[String(x.id),x]));
    let subtotal=0,lines=[];
    for(const i of items){
      const p=map.get(String(i.id)), q=Math.trunc(Number(i.qty));
      if(!p||!p.active||q<1||p.stock<q)throw new Error(`Stock unavailable: ${i.id}`);
      const total=Number(p.price)*q; subtotal+=total; lines.push([p,q,total]);
    }
    const s=await c.query("select delivery_inside,delivery_outside from shop_settings where id=1");
    const dc=Number(deliveryZone==="outside"?s.rows[0].delivery_outside:s.rows[0].delivery_inside);
    const no=orderNo();
    const o=await c.query(`insert into orders(order_no,customer_name,phone,address,area,note,payment,delivery_zone,delivery_charge,subtotal,grand_total)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id,order_no`,
      [no,customer.name,customer.phone,customer.address,customer.area,note,payment,deliveryZone,dc,subtotal,subtotal+dc]);
    for(const [p,q,total] of lines){
      await c.query(`insert into order_items(order_id,product_id,product_name,price,quantity,line_total) values($1,$2,$3,$4,$5,$6)`,
        [o.rows[0].id,p.id,p.name,p.price,q,total]);
      await c.query("update products set stock=stock-$1,updated_at=now() where id=$2",[q,p.id]);
    }
    await c.query("commit");
    res.status(201).json({orderNo:no,subtotal,deliveryCharge:dc,grandTotal:subtotal+dc});
  }catch(e){await c.query("rollback");res.status(400).json({error:e.message})}
  finally{c.release()}
});

app.get("/api/orders",admin,async(req,res)=>{
  try{
    const r=await pool.query(`
      select o.id,o.order_no as "orderNo",o.customer_name as "customerName",o.phone,o.address,o.area,o.note,o.payment,
             o.delivery_zone as "deliveryZone",o.delivery_charge as "deliveryCharge",o.subtotal,o.grand_total as "grandTotal",
             o.status,o.created_at as "createdAt",
             coalesce(json_agg(json_build_object(
               'productId',oi.product_id,'productName',oi.product_name,'price',oi.price,
               'quantity',oi.quantity,'lineTotal',oi.line_total
             ) order by oi.id) filter (where oi.id is not null),'[]'::json) as items
      from orders o left join order_items oi on oi.order_id=o.id
      group by o.id order by o.created_at desc`);
    res.json(r.rows);
  }catch(e){res.status(500).json({error:e.message})}
});
app.patch("/api/orders/:id/status",admin,async(req,res)=>{
  const allowed=["New","Confirmed","Processing","Shipped","Delivered","Cancelled"];
  if(!allowed.includes(req.body.status))return res.status(400).json({error:"Invalid status"});
  const c=await pool.connect();
  try{
    await c.query("begin");
    const o=await c.query("select id,status from orders where id=$1 for update",[req.params.id]);
    if(!o.rowCount){await c.query("rollback");return res.status(404).json({error:"Order not found"});}
    const old=o.rows[0].status, next=req.body.status;
    if(old!=="Cancelled" && next==="Cancelled") {
      const items=await c.query("select product_id,quantity from order_items where order_id=$1",[req.params.id]);
      for(const i of items.rows) await c.query("update products set stock=stock+$1,updated_at=now() where id=$2",[i.quantity,i.product_id]);
    } else if(old==="Cancelled" && next!=="Cancelled") {
      const items=await c.query("select oi.product_id,oi.quantity,p.stock,p.active from order_items oi join products p on p.id=oi.product_id where oi.order_id=$1 for update",[req.params.id]);
      for(const i of items.rows){
        if(!i.active || Number(i.stock)<Number(i.quantity)) throw new Error(`Stock unavailable: ${i.product_id}`);
      }
      for(const i of items.rows) await c.query("update products set stock=stock-$1,updated_at=now() where id=$2",[i.quantity,i.product_id]);
    }
    const r=await c.query("update orders set status=$1,updated_at=now() where id=$2 returning id,status",[next,req.params.id]);
    await c.query("commit");
    res.json(r.rows[0]);
  }catch(e){await c.query("rollback");res.status(400).json({error:e.message})}
  finally{c.release()}
});
app.delete("/api/orders/:id",admin,async(req,res)=>{
  const c=await pool.connect();
  try{
    await c.query("begin");
    const o=await c.query("select id,status from orders where id=$1 for update",[req.params.id]);
    if(!o.rowCount){await c.query("rollback");return res.status(404).json({error:"Order not found"});}
    if(o.rows[0].status!=="Cancelled") {
      const items=await c.query("select product_id,quantity from order_items where order_id=$1",[req.params.id]);
      for(const i of items.rows) await c.query("update products set stock=stock+$1,updated_at=now() where id=$2",[i.quantity,i.product_id]);
    }
    await c.query("delete from orders where id=$1",[req.params.id]);
    await c.query("commit"); res.json({ok:true});
  }catch(e){await c.query("rollback");res.status(400).json({error:e.message})}
  finally{c.release()}
});

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

async function initDb(){
  if(!DATABASE_URL) return;
  const schemaPath=path.join(__dirname, "schema.sql");
  try{
    const schema=fs.readFileSync(schemaPath,"utf8");
    await pool.query(schema);
    console.log("Database schema is ready.");
  }catch(e){
    console.error("Database schema initialization failed:", e.message);
  }
}

app.use(express.static(path.join(__dirname,"..")));
app.use((req,res,next)=>req.path.startsWith("/api/")?res.status(404).json({error:"API route not found"}):next());

const port=Number(process.env.PORT)||3000;
initDb().finally(()=>app.listen(port,()=>console.log(`Mahmud Telecom API running on port ${port}`)));
