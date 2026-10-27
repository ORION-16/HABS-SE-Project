# HABS — Healthcare Appointment Booking System
## Module 1 (Auth & User Management) & Module 2 (Doctor Availability Management)

---

### 👥 Authors
- **Oreo Rodrigues** (UID: 2024300197)
- **Anushree Sawant** (UID: 2024300210)  
*Sardar Patel Institute of Technology (SPIT), Mumbai — BTech Computer Engineering*  
*SRS Version: 1.0 (28 July 2026)*

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router v7, Axios, React Hook Form, Zod, TailwindCSS |
| **Backend** | Node.js v20+ LTS, Express.js v4 |
| **Database** | MongoDB Atlas / Local MongoDB (Mongoose ODM v8) |
| **Cache / Sessions** | Redis v8 (ioredis) |
| **Authentication** | JWT (RS256 / 64-char HS256 secret, 24h expiry), bcrypt (cost factor 12) |
| **Real-time Updates** | Socket.io v4 (Doctor room broadcast) |
| **Security** | Helmet.js, express-rate-limit (10 req/min on `/api/auth/*`), express-mongo-sanitize, Account lockout (5 failed attempts → 15 min lock), Redis token blacklist on logout |

---

## 📁 Project Architecture

```
se-project/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB Mongoose connection
│   │   │   └── redis.js           # ioredis client with auto-reconnect & fallback
│   │   ├── models/
│   │   │   ├── User.model.js      # User schema, bcrypt compare, isLocked
│   │   │   └── Availability.model.js # Doctor weekly slots & blocked dates
│   │   ├── controllers/
│   │   │   ├── auth.controller.js # Register, login, verify, logout, me, OTP
│   │   │   └── availability.controller.js # Set slots, block/unblock, cache, open slots
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── availability.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js # JWT verification & Redis blacklist check
│   │   │   └── role.middleware.js # Role-based access control (patient/doctor/admin)
│   │   ├── validators/
│   │   │   ├── auth.validator.js  # Zod validation schemas
│   │   │   └── availability.validator.js
│   │   ├── utils/
│   │   │   ├── jwt.js             # Sign & verify JWT tokens
│   │   │   └── email.js           # Email stub (verification & OTP links)
│   │   └── app.js                 # Express app factory with Socket.io injection
│   ├── server.js                  # HTTP & Socket.io server entry point
│   ├── seed.js                    # Demo user seeding script
│   └── test-suite.js              # Automated E2E test suite (28 assertions)
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js           # Axios instance with auth interceptor & 401 handling
│   │   │   ├── auth.api.js
│   │   │   └── availability.api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # User & token state, role, login/logout
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Modern glassmorphism navigation
│   │   │   ├── ProtectedRoute.jsx # Role-based route guard
│   │   │   └── SlotCalendar.jsx   # Patient view for 30-min available slots
│   │   ├── pages/
│   │   │   ├── Register.jsx       # Patient & Doctor conditional registration
│   │   │   ├── Login.jsx          # Login with role redirect & lockout warning
│   │   │   ├── VerifyEmail.jsx    # One-click email verification handler
│   │   │   ├── Dashboard.jsx      # Patient slot search & calendar view
│   │   │   ├── DoctorAvailability.jsx # Weekly schedule grid, date blocker, Socket.io
│   │   │   └── Unauthorized.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js       # Real-time WebSocket connection to doctor room
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css              # Custom design system with glassmorphism & gradients
│   ├── index.html
│   └── vite.config.js
│
├── package.json                   # Root scripts (concurrently)
└── README.md
```

---

## ⚡ Quick Start

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Run Development Servers (Concurrent Backend + Frontend)
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

### 3. Run Automated Test Suite (28 / 28 Assertions)
```bash
npm test
```

---

## 🧪 Acceptance Criteria Verification

- [x] `npm run install:all && npm run dev` starts both servers without errors.
- [x] `POST /api/auth/register` creates a patient and a doctor in MongoDB.
- [x] `POST /api/auth/login` returns a valid JWT.
- [x] `GET /api/auth/me` returns user info for a valid token.
- [x] Account lockout triggers after 5 failed logins (423 response, 15 min lock).
- [x] `POST /api/availability` saves weekly slots for a logged-in doctor.
- [x] `GET /api/availability/:doctorId` returns slots (from Redis cache on second call).
- [x] `GET /api/availability/open-slots/:doctorId?date=2026-11-10` returns 30-min interval slots.
- [x] Blocking a date removes it from open-slots response.
- [x] React Register page creates a user visible in MongoDB.
- [x] React Login page stores JWT and redirects by role.
- [x] Doctor Availability page saves slots and receives Socket.io confirmation.
- [x] Patient SlotCalendar displays available slots for a chosen date.
- [x] All API errors return `{ success: false, message }`.
