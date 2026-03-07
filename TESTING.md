# EduNexus - Testing Guide

## 🚀 Quick Start Testing

Follow these steps to test the EduNexus MVP application:

---

## Prerequisites Check

Before starting, ensure you have:
- ✅ **PostgreSQL** installed and running
- ✅ **Redis** installed
- ✅ **Node.js** (LTS version)

---

## Step 1: Install Frontend Dependencies

```bash
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\frontend
npm install
```

This will install React, Vite, TailwindCSS, and all frontend dependencies.

---

## Step 2: Set Up PostgreSQL Database

### Option A: Using psql Command Line
```bash
# Open PowerShell and run:
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE edunexus;

# Exit psql:
\q
```

### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name it `edunexus`
5. Click "Save"

---

## Step 3: Configure Backend Environment

```bash
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend

# The .env file already exists (copied from .env.example)
# Edit it to set your PostgreSQL password:
```

Open `backend\.env` and update:
```env
DB_PASSWORD=your_actual_postgres_password
```

**Important**: Also generate strong secrets for JWT:
```env
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_now
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_now
```

---

## Step 4: Run Database Migrations

```bash
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend
npm run migrate
```

**Expected Output:**
```
🚀 Running database migrations...
✅ Database schema created successfully
```

This creates all tables (users, roles, departments, attendance, marks, etc.)

---

## Step 5: Seed Initial Data

```bash
npm run seed
```

**Expected Output:**
```
🌱 Seeding database...
✅ Database seeded successfully

📧 Default Admin Credentials:
   Email: admin@edunexus.com
   Password: Admin@123
   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!
```

---

## Step 6: Start Redis Server

### Option A: Windows (if installed via MSI)
```bash
redis-server
```

### Option B: Windows (if using WSL)
```bash
wsl
sudo service redis-server start
```

**Expected Output:**
```
Ready to accept connections
```

Keep this terminal open!

---

## Step 7: Start Backend Server

Open a **NEW terminal** and run:

```bash
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\backend
npm run dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 EduNexus Backend Server                             ║
║                                                           ║
║   🚀 Server running on port 5000                         ║
║   🌍 Environment: development                            ║
║   ...                                                    ║
╚═══════════════════════════════════════════════════════════╝

✅ Connected to PostgreSQL database
✅ Connected to Redis
```

Keep this terminal open!

---

## Step 8: Start Frontend Server

Open a **NEW terminal** and run:

```bash
cd c:\Users\pradu\OneDrive\Desktop\EduNexus\frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Keep this terminal open!

---

## Step 9: Test the Application

### 9.1 Open Browser
Navigate to: **http://localhost:5173**

### 9.2 Login
Use the default credentials:
- **Email**: `admin@edunexus.com`
- **Password**: `Admin@123`

### 9.3 Verify Dashboard
After successful login, you should see:
- Welcome message with your name
- Statistics cards (Students, Attendance Rate, Active Classes)
- Quick Actions based on your role (Admin)
- Recent Activity section

---

## 🧪 Testing Checklist

### Authentication Tests

#### ✅ Test 1: Successful Login
1. Go to http://localhost:5173/login
2. Enter: `admin@edunexus.com` / `Admin@123`
3. Click "Sign In"
4. **Expected**: Redirect to dashboard

#### ✅ Test 2: Failed Login (Wrong Password)
1. Enter: `admin@edunexus.com` / `WrongPassword`
2. Click "Sign In"
3. **Expected**: Error message "Invalid email or password"

#### ✅ Test 3: Account Locking
1. Try logging in with wrong password **5 times**
2. **Expected**: "Too many failed attempts. Account locked for 15 minutes."
3. Wait 15 minutes or reset in database:
   ```sql
   UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = 'admin@edunexus.com';
   ```

#### ✅ Test 4: Logout
1. Click "Logout" button in header
2. **Expected**: Redirect to login page

#### ✅ Test 5: Protected Routes
1. Logout if logged in
2. Try to access: http://localhost:5173/dashboard
3. **Expected**: Redirect to login page

---

### API Tests (Using Browser DevTools)

#### ✅ Test 6: Check Network Requests
1. Open Browser DevTools (F12)
2. Go to "Network" tab
3. Login to the application
4. **Expected**: See requests to `/api/auth/login` with 200 status

#### ✅ Test 7: Token Refresh
1. Stay logged in for 1+ hour (or manually expire token)
2. Make any API request
3. **Expected**: Automatic token refresh (see `/api/auth/refresh` in Network tab)

---

### Database Verification Tests

Open PostgreSQL and run these queries:

#### ✅ Test 8: Check Users
```sql
SELECT id, email, first_name, last_name, is_deleted 
FROM users;
```
**Expected**: See admin user with UUID

#### ✅ Test 9: Check Audit Logs
```sql
SELECT user_id, action, ip_address, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```
**Expected**: See login attempts logged

#### ✅ Test 10: Check Refresh Tokens
```sql
SELECT user_id, expires_at, revoked 
FROM refresh_tokens 
ORDER BY created_at DESC;
```
**Expected**: See active refresh token for logged-in user

---

### API Endpoint Tests (Using cURL or Postman)

#### ✅ Test 11: Login API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@edunexus.com\",\"password\":\"Admin@123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### ✅ Test 12: Get Current User
```bash
# Replace YOUR_TOKEN with the accessToken from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### ✅ Test 13: List Users (Admin only)
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### ✅ Test 14: Rate Limiting
Run this command **6 times rapidly**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test\"}"
```

**Expected**: After 5 attempts, get rate limit error

---

### Security Tests

#### ✅ Test 15: SQL Injection Prevention
Try logging in with:
- Email: `admin@edunexus.com' OR '1'='1`
- Password: `anything`

**Expected**: Login fails (SQL injection prevented)

#### ✅ Test 16: XSS Prevention
Try creating a user with:
- First Name: `<script>alert('XSS')</script>`

**Expected**: Script tags should be sanitized

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to database"
**Solution**: 
1. Check PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -U postgres -l`
3. Check credentials in `.env` file

### Problem: "Redis connection failed"
**Solution**:
1. Start Redis: `redis-server`
2. Check if running: `redis-cli ping` (should return "PONG")

### Problem: "Module not found" errors
**Solution**:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Port already in use"
**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## ✅ Success Criteria

Your application is working correctly if:

1. ✅ Backend server starts without errors
2. ✅ Frontend loads at http://localhost:5173
3. ✅ Login works with default credentials
4. ✅ Dashboard displays after login
5. ✅ Logout redirects to login page
6. ✅ Protected routes require authentication
7. ✅ Database contains users, roles, and audit logs
8. ✅ API endpoints return proper JSON responses

---

## 📊 Monitoring During Testing

### Watch Backend Logs
The backend terminal will show:
- Database queries executed
- API requests received
- Authentication attempts
- Errors (if any)

### Watch Browser Console
Open DevTools Console (F12) to see:
- React component renders
- API call responses
- Any JavaScript errors

### Watch Database
Query audit logs in real-time:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 🎉 Next Steps After Testing

Once basic testing is complete:

1. **Create Additional Users**
   - Use the admin panel (when UI is built)
   - Or use API: `POST /api/users`

2. **Test Attendance Module**
   - Mark attendance via API
   - View attendance statistics

3. **Test Marks Module**
   - Add student marks
   - View marks by class/student

4. **Customize**
   - Change admin password
   - Add departments and courses
   - Configure rate limits

---

## 📝 Test Results Template

Use this to track your testing:

```
[ ] Frontend dependencies installed
[ ] Database created
[ ] Migrations run successfully
[ ] Seed data loaded
[ ] Redis running
[ ] Backend server started
[ ] Frontend server started
[ ] Login successful
[ ] Dashboard loads
[ ] Logout works
[ ] API endpoints tested
[ ] Database verified
[ ] Security features tested
```

---

**Happy Testing! 🚀**
