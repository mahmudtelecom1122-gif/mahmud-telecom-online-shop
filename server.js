import express from 'express';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 10000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

app.use(express.json({ limit: '5mb' }));
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.sendStatus(204);
  next();
});

async function ensureTable(){
  if(!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS mahmud_telecom_state (
    id INTEGER PRIMARY KEY CHECK (id=1),
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}
const arrays=['products','customers','suppliers','sales','purchases','recharge','banking','numbers'];
const clone=x=>x&&typeof x==='object'?JSON.parse(JSON.stringify(x)):{};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const recordSame=(a,b)=>{if(!a||!b)return false;const x={...a},y={...b};delete x._mt;delete y._mt;return same(x,y)};
const norm=s=>{const x=clone(s);x._deleted=x._deleted&&typeof x._deleted==='object'?x._deleted:{};for(const k of arrays){x[k]=Array.isArray(x[k])?x[k]:[];x._deleted[k]=x._deleted[k]&&typeof x._deleted[k]==='object'?x._deleted[k]:{}}return x};
function eventTime(state,key,id){const d=Number(state?._deleted?.[key]?.[id]||0);const r=(state?.[key]||[]).find(x=>x.id===id);return Math.max(d,Number(r?._mt)||0)}
function mergeArray(local,remote,base,key){
  const lm=new Map((local||[]).map(x=>[x.id,x])),rm=new Map((remote||[]).map(x=>[x.id,x])),bm=new Map((base||[]).map(x=>[x.id,x]));
  const ids=new Set([...lm.keys(),...rm.keys(),...bm.keys(),...Object.keys(local?._deleted?.[key]||{}),...Object.keys(remote?._deleted?.[key]||{}),...Object.keys(base?._deleted?.[key]||{})]);
  const out=[],deleted={};
  for(const id of ids){
    const lt=eventTime(local,key,id),rt=eventTime(remote,key,id),bt=eventTime(base,key,id),l=lm.get(id),r=rm.get(id),b=bm.get(id);let winner='remote';
    if(lt>rt)winner='local'; else if(rt>lt)winner='remote';
    else if(l&&r&&recordSame(l,r))winner='same';
    else {const lc=!recordSame(l,b)||(lt!==bt),rc=!recordSame(r,b)||(rt!==bt);if(lc&&!rc)winner='local';else if(!lc&&rc)winner='remote';else if(lc&&rc)winner='local';}
    if(winner==='local'){if(local?._deleted?.[key]?.[id]){deleted[id]=Number(local._deleted[key][id]);continue}if(l)out.push(l);else if(r)out.push(r)}
    else if(winner==='remote'){if(remote?._deleted?.[key]?.[id]){deleted[id]=Number(remote._deleted[key][id]);continue}if(r)out.push(r);else if(l)out.push(l)}
    else if(l)out.push(l);
  }
  return {items:out,deleted};
}
function mergeState(local,remote,base){
  const a=norm(local),r=norm(remote),b=norm(base||remote),out={...r,_deleted:{}};
  for(const key of arrays){const m=mergeArray(a[key],r[key],b[key],key);out[key]=m.items;out._deleted[key]=m.deleted;}
  if(!same(a.shop,b.shop)&&same(r.shop,b.shop))out.shop=a.shop;else if(!same(a.shop,b.shop)&&!same(r.shop,b.shop)&&!same(a.shop,r.shop))out.shop=a.shop;
  return norm(out);
}

app.get('/api/health', async (req,res)=>{
  if(!pool) return res.status(503).json({ok:false,error:'DATABASE_URL is not configured'});
  try{await ensureTable(); await pool.query('SELECT 1'); res.json({ok:true,database:true});}
  catch(e){console.error(e);res.status(500).json({ok:false,error:'Database unavailable'});}
});

app.get('/api/state', async (req,res)=>{
  if(!pool) return res.status(503).json({ok:false,error:'Database unavailable'});
  try{
    await ensureTable();
    const r=await pool.query('SELECT state, updated_at FROM mahmud_telecom_state WHERE id=1');
    if(!r.rows.length) return res.json({ok:true,state:null});
    res.json({ok:true,state:r.rows[0].state,updated_at:r.rows[0].updated_at});
  }catch(e){console.error(e);res.status(500).json({ok:false,error:'Database unavailable'});}
});

app.put('/api/state', async (req,res)=>{
  if(!pool) return res.status(503).json({ok:false,error:'Database unavailable'});
  const state=req.body?.state;
  if(!state || typeof state!=='object') return res.status(400).json({ok:false,error:'Invalid state'});
  const base=req.body?.base_state && typeof req.body.base_state==='object' ? req.body.base_state : state;
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS mahmud_telecom_state (id INTEGER PRIMARY KEY CHECK (id=1), state JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const r=await client.query('SELECT state FROM mahmud_telecom_state WHERE id=1 FOR UPDATE');
    const merged=r.rows.length ? mergeState(state,r.rows[0].state,base) : clone(state);
    const q=await client.query(`INSERT INTO mahmud_telecom_state(id,state,updated_at) VALUES(1,$1,NOW())
      ON CONFLICT(id) DO UPDATE SET state=EXCLUDED.state, updated_at=NOW() RETURNING updated_at`,[JSON.stringify(merged)]);
    await client.query('COMMIT');
    res.json({ok:true,saved:true,updated_at:q.rows[0]?.updated_at||null,state:merged});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(e);res.status(500).json({ok:false,error:'Database unavailable'});}finally{client.release();}
});

app.use(express.static(__dirname));
app.use((req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(port,()=>console.log(`Mahmud Telecom V19 server listening on ${port}`));
