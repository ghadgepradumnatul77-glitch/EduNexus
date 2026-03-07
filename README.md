# EduNexus - Campus Management Platform (MVP)

A secure, production-ready campus management system built with Node.js, Express, PostgreSQL, React, and Redis.

## 🚀 Features

### Authentication & Security
- JWT access tokens (1 hour expiry) + refresh tokens (7 days)
- HTTP-only secure cookie support
- Account locking after 5 failed login attempts (15-minute lockout)
- Password hashing with bcrypt (12 rounds)
- IP address logging on login
- Comprehensive audit logging
- Role-based access control (RBAC)

### Core Modules
- **User Management**: CRUD operations with soft delete
- **Attendance Management**: Mark and track student attendance
- **Marks Management**: Record and manage student grades
- **Analytics Dashboard**: Real-time statistics with Redis caching

### Security Middleware
- Helmet (security headers)
- CORS (configurable origins)
- Rate limiting (global: 1000 req/15min, login: 5 req/15min)
- Input validation with express-validator
- SQL injection protection (parameterized queries)

## 📋 Prerequisites

- Node.js (LTS version)
- PostgreSQL 12+
- Redis 6+

## 🛠️ Installation

### 1. Clone the repository
```bash
cd EduNexus
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and update the following:
# - DB_PASSWORD: Your PostgreSQL password
# - JWT_ACCESS_SECRET: Generate a strong secret
# - JWT_REFRESH_SECRET: Generate a different strong secret
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb edunexus

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 5. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Start Redis (Terminal 3)
```bash
redis-server
```

## 🔐 Default Credentials

**Email**: `admin@edunexus.com`  
**Password**: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 📁 Project Structure

```
EduNexus/
├── backend/
│   ├── config/          # Redis configuration
│   ├── controllers/     # Business logic
│   ├── db/              # Database connection, schema, migrations
│   ├── middleware/      # Auth, security, validation, audit
│   ├── routes/          # API routes
│   └── server.js        # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── contexts/    # React contexts (Auth)
    │   ├── pages/       # Page components
    │   ├── utils/       # API client, helpers
    │   └── App.jsx      # Main app component
    └── index.html
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user
- `GET /api/users/roles` - Get all roles

### Attendance
- `POST /api/attendance` - Mark attendance (Faculty/Admin)
- `GET /api/attendance/class/:classId` - Get attendance by class
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/stats` - Get attendance statistics

### Marks
- `POST /api/marks` - Add marks (Faculty/Admin)
- `GET /api/marks/class/:classId` - Get marks by class
- `GET /api/marks/student/:studentId` - Get student marks
- `PUT /api/marks/:id` - Update marks
- `DELETE /api/marks/:id` - Delete marks (Admin only)

## 🧪 Testing

```bash
cd backend
npm test
```

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with 12 rounds
   - Strong password policy enforcement

2. **Token Management**
   - JWT with short-lived access tokens
   - Refresh token rotation
   - Secure HTTP-only cookies option

3. **Account Protection**
   - Failed login attempt tracking
   - Automatic account locking
   - IP address logging

4. **API Security**
   - Helmet security headers
   - CORS protection
   - Rate limiting (global + endpoint-specific)
   - Input validation and sanitization

5. **Audit Trail**
   - Comprehensive action logging
   - IP and user agent tracking
   - Soft delete for data retention

## 📊 Database Schema

Key tables:
- `users` - User accounts with UUID primary keys
- `roles` - User roles (Admin, Faculty, Student, Staff)
- `refresh_tokens` - Token rotation tracking
- `departments` - Academic departments
- `courses` - Course catalog
- `classes` - Class sections
- `attendance` - Attendance records
- `marks` - Grade records
- `audit_logs` - System audit trail

All tables include:
- UUID primary keys
- Soft delete support (`is_deleted`, `deleted_at`)
- Audit fields (`created_at`, `updated_at`, `created_by`, `updated_by`)
- Proper indexing for performance

## 🎯 Role-Based Access

- **Super Admin**: Full system access
- **Admin**: User management, reports, system configuration
- **Faculty**: Mark attendance, upload marks, view classes
- **Student**: View attendance, marks, assignments
- **Staff**: Document handling, notices, events

## 📝 License

MIT

## 👥 Support

For issues or questions, please create an issue in the repository.
 