# 🧺 Tokri — Local Grocery Delivery

> Apni dukaan, ghar tak — Your neighbourhood kirana store, delivered.

Hyperlocal grocery marketplace connecting customers with local kirana stores in Pimpri-Chinchwad, Pune. Built as a learning project with the help of Claude AI.

---

## 🌐 Live

| | URL |
|---|---|
| App | https://tokri.vercel.app |
| API | https://tokri-production.up.railway.app/health |

---

## 📱 What it does

**Customers** — browse nearby stores → add to cart → place COD order → track delivery live

**Vendors** — open/close shop → accept orders → manage products → track earnings

---

## 🛠️ Stack

```
Frontend   React.js + Vite → Vercel
Backend    Node.js + Express → Railway
Database   Supabase (PostgreSQL)
Auth       Phone OTP + JWT
```

---

## 📁 Structure

```
tokri/
├── backend/
│   ├── src/routes/     auth, vendors, products, orders, user
│   ├── src/middleware/ JWT auth
│   ├── src/lib/        Supabase client
│   └── server.js
└── frontend/
    └── src/pages/      Login, Home, Store, Cart, Orders,
                        Profile, VendorDashboard, VendorOrders,
                        VendorProducts
```

---

## 🚀 Run locally

```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in your keys
node server.js         # runs on :3000

# Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:3000/api" > .env
npm run dev            # runs on :5173
```

---

## 🗺️ Roadmap

- [x] Phase 1 — PWA, COD orders, vendor dashboard, deployed live
- [ ] Phase 2 — Razorpay, WhatsApp notifications, AI dish search
- [ ] Phase 3 — React Native apps on Play Store
- [ ] Phase 4 — Delivery app, ONDC, B2B

---

## 👨‍💻 About

Built by **Soumitro Ghosh** — Economics + MBA AI/ML student, Pune.
Developed with assistance from **Claude AI** (Anthropic) as a real-world learning project.

---

*Built for Pimpri-Chinchwad's kirana stores* 🧺
