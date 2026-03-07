# Quick Start Commands - EduNexus

## 📍 Step-by-Step Commands (Copy & Paste)

### 1. Install Frontend Dependencies
```powershell
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\frontend
npm install
```

### 2. Create PostgreSQL Database
```powershell
# Option 1: Using psql
psql -U postgres -c "CREATE DATABASE edunexus;"

# Option 2: If above doesn't work, open psql first
psql -U postgres
# Then in psql prompt:
CREATE DATABASE edunexus;
\q
```

### 3. Run Database Migrations
```powershell
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend
npm run migrate
```

### 4. Seed Initial Data
```powershell
npm run seed
```

### 5. Start Redis (Keep this terminal open)
```powershell
redis-server
```

### 6. Start Backend Server (Open NEW terminal)
```powershell
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend
npm run dev
```

### 7. Start Frontend Server (Open NEW terminal)
```powershell
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\frontend
npm run dev
```

### 8. Open Browser
Navigate to: **http://localhost:5173**

Login with:
- Email: `admin@edunexus.com`
- Password: `Admin@123`

---

## 🔧 Common Issues & Fixes

### Issue: "npm is not recognized"
**Fix**: Restart your terminal or run:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Issue: "Cannot find module"
**Fix**: Make sure you're in the correct directory before running npm commands
```powershell
# Check current directory
pwd

# Should show: C:\Users\pradu\OneDrive\Desktop\EduNexus\frontend
# or: C:\Users\pradu\OneDrive\Desktop\EduNexus\backend
```

### Issue: "Port already in use"
**Fix**: Kill the process using the port
```powershell
# For port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# For port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### Issue: "Database connection failed"
**Fix**: Make sure PostgreSQL is running and credentials in `.env` are correct
```powershell
# Check if PostgreSQL is running
pg_isready

# Edit .env file
notepad c:\Users\pradu\OneDrive\Desktop\EduNexus\backend\.env
# Update DB_PASSWORD with your actual PostgreSQL password
```

---

## ✅ Verification Commands

### Check if services are running:
```powershell
# Check PostgreSQL
pg_isready

# Check Redis
redis-cli ping
# Should return: PONG

# Check if backend is running (in browser or curl)
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:5173
```

### Check database:
```powershell
psql -U postgres -d edunexus -c "SELECT COUNT(*) FROM users;"
# Should return: 1 (the admin user)
```

---

## 📝 All-in-One Setup Script

Copy this entire block and run in PowerShell (after creating database):

```powershell
# Navigate to backend
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend

# Run migrations and seed
npm run migrate
npm run seed

# Navigate to frontend
cd ..\frontend

# Install dependencies (if not already done)
npm install

Write-Host "✅ Setup complete! Now start the servers:"
Write-Host "1. Terminal 1: redis-server"
Write-Host "2. Terminal 2: cd backend && npm run dev"
Write-Host "3. Terminal 3: cd frontend && npm run dev"
```

---

## 🎯 Quick Test After Setup

```powershell
# Test login API
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"admin@edunexus.com\",\"password\":\"Admin@123\"}'
```

If you see a JSON response with `"success": true`, everything is working! 🎉
