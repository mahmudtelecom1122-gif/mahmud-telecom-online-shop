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
function mergeArray(local=[],remote=[],base=[]){
  const lm=new Map((Array.isArray(local)?local:[]).map(x=>[x.id,x]));
  const rm=new Map((Array.isArray(remote)?remote:[]).map(x=>[x.id,x]));
  const bm=new Map((Array.isArray(base)?base:[]).map(x=>[x.id,x]));
  const ids=new Set([...lm.keys(),...rm.keys(),...bm.keys()]);
  const out=[];
  for(const id of ids){
    const hasL=lm.has(id),hasR=rm.has(id),hasB=bm.has(id);
    const l=lm.get(id),r=rm.get(id),b=bm.get(id);
    if(!hasL && hasB){
      if(!hasR || same(r,b)) continue;
      const lt=Number(l?. _mt)||0,rt=Number(r?._mt)||0;
      if(rt>lt) out.push(r);
      else continue;
    } else if(!hasR && hasB){
      if(!hasL || same(l,b)) continue;
      const lt=Number(l?._mt)||0,rt=Number(r?._mt)||0;
      if(lt>rt) out.push(l);
      else continue;
    } else if(!hasL && hasR){
      out.push(r);
    } else if(hasL && !hasR){
      out.push(l);
    } else {
      const lt=Number(l?._mt)||0,rt=Number(r?._mt)||0;
      if(lt>rt) out.push(l);
      else if(rt>lt) out.push(r);
      else if(same(l,r)) out.push(l);
      else {
        const lc=!same(l,b),rc=!same(r,b);
        if(lc&&!rc) out.push(l);
        else if(!lc&&rc) out.push(r);
        else out.push(l);
      }
    }
  }
  return out;
}
function mergeState(local,remote,base){
  local=clone(local);remote=clone(remote);base=clone(base);
  const out={...remote};
  for(const key of new Set([...Object.keys(local),...Object.keys(remote),...Object.keys(base)])){
    if(arrays.includes(key)) out[key]=mergeArray(local[key],remote[key],base[key]);
    else {
      const lc=!same(local[key],base[key]),rc=!same(remote[key],base[key]);
      out[key]=lc&&!rc?local[key]:(lc&&rc&&!same(local[key],remote[key])?local[key]:remote[key]);
    }
  }
  return out;
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
app.listen(port,()=>console.log(`Mahmud Telecom V16 server listening on ${port}`));
