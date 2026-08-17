# Production deployment

## 1) PostgreSQL
Create a PostgreSQL database (Render PostgreSQL, Neon, Supabase, etc.) and copy its connection string into `DATABASE_URL`.

Run `server/schema.sql` once against that database.

## 2) Server
Install and run:
`cd server`
`npm install`
`npm start`

Environment:
- `DATABASE_URL`
- `ADMIN_KEY` — long random secret
- `CORS_ORIGIN` — your live shop domain

## 3) Important
Do NOT put `DATABASE_URL` or `ADMIN_KEY` inside frontend JavaScript.

The server validates stock and creates the order in a PostgreSQL transaction, so simultaneous orders cannot simply oversell the same stock.

## 4) Frontend connection
Set the shop API base URL to your deployed server URL. This package contains the backend; the remaining deployment-specific value is the live API URL.

## 5) Recommended production setup
- Frontend: Cloudflare Pages / Vercel
- API: Render / Railway
- Database: Render PostgreSQL / Neon / Supabase
- HTTPS: required
