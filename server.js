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
  const origin=req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin',origin);
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

app.get('/api/health', async (req,res)=>{
  if(!pool) return res.status(503).json({ok:false,error:'DATABASE_URL is not configured'});
  try{await ensureTable(); await pool.query('SELECT 1'); res.json({ok:true,database:true});}
  catch(e){res.status(500).json({ok:false,error:'Database unavailable'});}
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
  try{
    await ensureTable();
    await pool.query(`INSERT INTO mahmud_telecom_state(id,state,updated_at) VALUES(1,$1,NOW())
      ON CONFLICT(id) DO UPDATE SET state=EXCLUDED.state, updated_at=NOW()`,[JSON.stringify(state)]);
    res.json({ok:true,saved:true});
  }catch(e){console.error(e);res.status(500).json({ok:false,error:'Database unavailable'});}
});

app.use(express.static(__dirname));
app.use((req,res)=>res.sendFile(path.join(__dirname,'index.html')));

app.listen(port,()=>console.log(`Mahmud Telecom server listening on ${port}`));
