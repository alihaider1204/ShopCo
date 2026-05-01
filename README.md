# ShopCo (SHOP.CO)

Full-stack ecommerce: **React (Vite)** storefront and admin dashboard, **Node.js / Express** API, **MongoDB**, **Stripe** payments, optional **Cloudinary** image uploads and SMTP email.

## Repository layout

```
├── frontend/          # Vite + React (customer site + admin UI)
├── backend/           # Express API (REST + Stripe webhooks)
└── README.md
```

## Tech stack

| Area | Technology |
|------|------------|
| Frontend | React 19, React Router, Axios, Stripe.js, Recharts |
| Backend | Express 4, Mongoose, JWT, express-fileupload, Cloudinary |
| Data | MongoDB (Atlas recommended in production) |
| Payments | Stripe (Payment Intents + webhooks) |

## Prerequisites

- **Node.js** 18+ recommended  
- **MongoDB** (local URI or [MongoDB Atlas](https://www.mongodb.com/atlas))  
- **Stripe** account (test keys for development)  
- Optional: **Cloudinary**, SMTP (e.g. Gmail) for production-grade uploads and email

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/alihaider1204/shopco.git
cd shopco

cd backend && npm install
cd ../frontend && npm install
```

If your GitHub slug still differs, use the clone URL from **Code** on the repository page.

### 2. Environment variables

Do **not** commit real secrets. Copy examples and fill in values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- **Backend** — see `backend/.env.example` (`MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`, Stripe, Cloudinary, SMTP, etc.).
- **Frontend** — `VITE_API_URL` = API origin only (no `/api` suffix), e.g. `http://localhost:5000` in dev; `VITE_STRIPE_PUBLISHABLE_KEY` for checkout.

### 3. Run

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

**Terminal 2 — SPA**

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Ensure the API port matches `VITE_API_URL`.

### Backend scripts (reference)

| Command | Purpose |
|--------|---------|
| `npm start` | Production: `node server.js` |
| `npm run dev` | Development with nodemon |
| `npm run seed:admin` | Seed admin user (see `.env.example`) |
| `npm run test:email` | Quick SMTP check |

## Deployment (overview)

Typical setup:

- **API:** [Render](https://render.com) — root directory `backend`, start `npm start`, set all server env vars.  
- **Frontend:** [Vercel](https://vercel.com) — root directory `frontend`, framework Vite, set `VITE_API_URL` and `VITE_STRIPE_PUBLISHABLE_KEY`.

Set **`FRONTEND_URL`** and **`CORS_ORIGIN`** on the server to your live storefront origin(s). Configure the **Stripe webhook** to `https://<your-api-host>/api/payment/webhook` and set `STRIPE_WEBHOOK_SECRET`.

`frontend/vercel.json` provides SPA fallback so client-side routes work on refresh.

## Security notes

- Keep **`JWT_SECRET`** long and random in production.  
- Never commit **`.env`** files; GitHub push protection may block Stripe-like strings in examples—use real keys only in host env or local `.env`.  
- Restrict **MongoDB Atlas** IPs in production when you know your host’s egress.

## License

This project is provided as-is for demonstration and portfolio use unless you add a separate license file.
