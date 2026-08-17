# Mahmud Telecom — Final Online Shop

এই version-টি শুধুমাত্র Online Shopping + Delivery business-এর জন্য তৈরি।

## Current design
আপনার দেওয়া website-এর existing `index.html`, CSS, JS ও logo রাখা হয়েছে; customer-facing design পরিবর্তন করার চেষ্টা করা হয়নি।

## Added
- Admin dashboard
- Product add/edit/delete
- Real product image upload (browser storage)
- Category, price, old price, stock
- Online/hidden product control
- Customer checkout form
- Name, mobile, full address, area
- Delivery charge (inside/outside)
- Cash on Delivery
- Order number
- WhatsApp order submission
- Admin order list
- Order status: New / Confirmed / Processing / Shipped / Delivered / Cancelled
- Shop settings
- A4 print/PDF support for admin order list

## Important
এটি একটি static frontend package। Data browser localStorage-এ থাকে। একই browser/device-এ কাজ করবে। Real multi-device online business-এর জন্য server/database backend প্রয়োজন, কারণ localStorage থেকে অন্য ফোন/কম্পিউটারে order বা product sync হবে না।
