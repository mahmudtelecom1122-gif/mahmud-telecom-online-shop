# Mahmud Telecom — Online Shop Production

এই প্যাকেজটি **আপনার বর্তমান Mahmud Telecom Shop**-এর জন্য। নতুন Shop বানানো হয়নি।

## 1) কী কী প্রস্তুত

- Admin Login
- Product add/edit/delete
- Product image upload
- Online/Hidden product
- Customer cart
- Checkout
- Cash on Delivery
- Inside/Outside delivery charge
- PostgreSQL order save
- Order-time stock locking + stock deduction
- Admin order list + status
- Cancelled order / delete order stock handling
- Shop settings
- Public Shop ↔ Admin navigation
- Backend health check

## 2) Recommended live setup

সবচেয়ে সহজ ও নিরাপদ পদ্ধতি: **Express backend-কে এমন hosting-এ deploy করুন যেখানে static frontend-ও server করতে পারে।**
এই project-এর `server/server.js` নিজেই `mahmud-telecom` folder serve করে। তাই একই domain-এ Shop + API চালানো যায়।

### Environment variables

Hosting-এ:

- `DATABASE_URL` = আপনার PostgreSQL connection string
- `ADMIN_KEY` = একটি শক্তিশালী secret key (কমপক্ষে 16+ অক্ষর)
- `CORS_ORIGIN` = একই domain, অথবা প্রয়োজন হলে `*`
- `PORT` = hosting নিজে দিলে খালি রাখুন

Start command:
`npm start`

Health test:
`https://YOUR-DOMAIN/api/health`

সফল হলে:
`{"ok":true}`

## 3) PostgreSQL

`server/schema.sql` server চালুর সময় স্বয়ংক্রিয়ভাবে initialize হবে। চাইলে PostgreSQL-এ manually run করলেও হবে।

## 4) Admin

Live site-এ:
`/admin-login.html`

Admin Key দিন। এরপর:
- ড্যাশবোর্ড
- পণ্য
- অর্ডার
- সেটিংস

সব পাওয়া যাবে।

## 5) নতুন পণ্য

Admin → **পণ্য** → **নতুন পণ্য**

দিতে পারবেন:
- পণ্যের নাম
- ক্যাটাগরি
- বিক্রয় মূল্য
- পুরনো মূল্য
- স্টক
- ছবি
- Online/Hidden

## 6) Customer order flow

Shop → পণ্য → Cart → **অর্ডার / Checkout** → নাম + ফোন + ঠিকানা + এলাকা → Delivery zone → Payment → Order.

Online API চালু থাকলে order database-এ transaction-এর মধ্যে save হবে এবং stock একই transaction-এ কমবে।

## 7) GitHub Pages

GitHub Pages শুধু static frontend চালাতে পারে। PostgreSQL/Express API সেখানে চলে না।

যদি frontend GitHub Pages-এ রাখতে চান, তাহলে `js/api-config.js`-এ লিখুন:

`window.MT_API_BASE = "https://YOUR-API-DOMAIN";`

এবং API server-এ `CORS_ORIGIN`-এ আপনার GitHub Pages origin দিন।

## 8) নিরাপত্তা

`DATABASE_URL` বা `ADMIN_KEY` কোনো HTML/JS ফাইলে লিখবেন না। এগুলো শুধু hosting environment variables-এ রাখবেন।
