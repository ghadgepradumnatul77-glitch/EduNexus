# EduNexus — Docker Local Development Setup

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- No local PostgreSQL or Redis running on ports 5432 / 6379 (or stop them first)

---

## File Structure Created

```
EduNexus/
├── docker-compose.yml              ← Main orchestration file
├── docker/
│   ├── backend.env                 ← Backend env (Docker hostnames)
│   ├── frontend.env                ← Frontend env
│   └── postgres/
│       └── init/
│           └── 01_init.sh          ← Auto-runs schema + migrations on first boot
├── backend/
│   └── Dockerfile.dev              ← Dev backend (nodemon hot-reload)
└── frontend/
    ├── Dockerfile.dev              ← Dev frontend (Vite HMR)
    └── vite.config.js              ← Updated: proxies /api → backend:5000
```

---

## Exact Commands

### First time (or after `docker compose down -v`):
```powershell
cd C:\Users\pradu\OneDrive\Desktop\EduNexus

# Build all images and start all services
docker compose up --build
```
Wait for these lines in the logs:
```
edunexus_postgres  | ✅  All migrations applied. Database is ready.
edunexus_backend   | 🎓 EduNexus Backend Server running on port 5000
edunexus_frontend  | ➜  Local:   http://localhost:5173/
```
Then open: **http://localhost**

---

### Subsequent starts (images already built):
```powershell
docker compose up
```

### Start in background (detached):
```powershell
docker compose up -d
```

### View live logs:
```powershell
docker compose logs -f               # All services
docker compose logs -f backend       # Backend only
docker compose logs -f postgres      # DB only
```

### Stop containers (keep data):
```powershell
docker compose down
```

### Stop + delete all data (fresh database):
```powershell
docker compose down -v
```

### Rebuild a single service (e.g. after package.json change):
```powershell
docker compose up --build backend
docker compose up --build frontend
```

---

## Services & Ports

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost | Vite dev server, HMR active |
| **Backend API** | http://localhost:5000 | Node.js, nodemon hot-reload |
| **PostgreSQL** | localhost:5432 | User: `edunexus_user` / Pass: `edunexus_pass` |
| **PGBouncer** | localhost:5433 | Connection pooler (backend connects here) |
| **Redis** | localhost:6379 | No password in dev |

---

## Login Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@demo.edu` | `Admin@123` |
| Student | `student0@demo.edu` | `password123` |

> To seed demo data after first boot:
> ```powershell
> docker compose exec backend node scripts/seed-demo.js demo
> ```

---

## Connect to DB with psql (from host)

```powershell
docker compose exec postgres psql -U edunexus_user -d edunexus
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port already in use | `docker compose down` then check `netstat -ano \| findstr :5432` |
| DB migrations didn't run | `docker compose down -v && docker compose up --build` (fresh volume) |
| Frontend can't reach backend | Check `docker compose logs backend` — confirm it's healthy |
| Redis connection error | Backend will use mock fallback automatically (dev only) |
| `ECONNREFUSED pgbouncer` | PGBouncer starts after postgres — backend retries automatically |
