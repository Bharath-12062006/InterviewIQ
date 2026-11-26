# InterviewIQ

AI-powered campus placement preparation and interview simulation platform.

```
interviewiq/
├── client/     React + Vite + Tailwind   (Phase 1 frontend)
├── server/     Node + Express + MongoDB  (Phase 2 backend & database)
└── ai-service/ Python + FastAPI          (Phase 5)
```

## Prerequisites

- **Node.js**: v18 or later
- **MongoDB**: Community Server (v7.0+ or v8.0+) or MongoDB Atlas connection URI

---

## 1. Start MongoDB

If using local MongoDB:
```bash
cd server
npm run db:start
```
*Alternatively, provide a `MONGODB_URI` pointing to your MongoDB Atlas cluster in `server/.env`.*

---

## 2. Run the Backend Server

```bash
cd server
npm install
npm run seed       # Seeds initial candidate, interviews, resume & study plan
npm run dev        # Starts API server on http://localhost:5000
```

Check server & database health:
```bash
curl http://localhost:5000/api/health
```

---

## 3. Run the Frontend Client

```bash
cd client
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

All `/api/*` network requests from the frontend client are automatically proxied to `http://localhost:5000` via Vite.
