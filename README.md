# 🧘 YogaFlow — Full-Stack Booking System

A production-ready yoga session booking platform with real authentication, OTP-based password reset, email notifications, and a complete admin panel.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | JWT access + refresh tokens, bcrypt passwords, session invalidation |
| **Forgot Password** | 6-digit OTP sent to real email via Nodemailer (Gmail SMTP) |
| **Booking** | Real-time slot availability, capacity checks, duplicate prevention |
| **Email Notifications** | Booking confirmation, cancellation, 24h reminder emails |
| **Admin Panel** | Stats dashboard, booking management, user list, check-in |
| **Rate Limiting** | Global + auth-specific limits, OTP cooldown |
| **Feedback** | Star ratings after completed sessions |
| **Auto Cleanup** | Expired OTPs cleaned hourly via cron |
| **Seed Data** | 6 realistic yoga sessions auto-seeded on first run |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (free tier) |
| **Email** | Nodemailer + Gmail SMTP App Password |
| **Auth** | JWT (access + refresh tokens), bcryptjs |
| **Hosting** | Backend → Railway · Frontend → Vercel |

---

## 📁 Project Structure

```
yogaflow/
├── backend/
│   ├── models/          # User, Session, Booking schemas
│   ├── routes/          # auth, sessions, bookings, users, admin
│   ├── middleware/       # JWT auth, role guards
│   ├── utils/           # email templates + sender
│   ├── server.js        # Express app + cron jobs + seeder
│   └── .env.example     # All required env vars
└── frontend/
    ├── src/
    │   ├── pages/       # All pages (Landing, Login, Signup, etc.)
    │   ├── components/  # Navbar, Footer, SessionCard, etc.
    │   ├── contexts/    # AuthContext (global auth state)
    │   └── api/         # Axios instance with token refresh
    ├── vite.config.js
    └── vercel.json
```

---

## ⚡ Local Setup (5 steps)

### Step 1 — Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/yogaflow.git
cd yogaflow
npm run install:all
```

### Step 2 — Set up MongoDB Atlas (free)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) → Create free account
2. Create a **Free M0 cluster** (any region)
3. Database Access → Add User → username + password (save these!)
4. Network Access → Add IP Address → **Allow from Anywhere** (0.0.0.0/0)
5. Connect → Drivers → Copy the connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```

### Step 3 — Set up Gmail App Password (for real emails)
1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **App Passwords** → Create one for "Mail"
4. You get a 16-character password like: `abcd efgh ijkl mnop`
5. Remove spaces: `abcdefghijklmnop`

### Step 4 — Create backend `.env`
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yoga_booking?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_key_at_least_32_chars_long_here
JWT_REFRESH_SECRET=another_secret_for_refresh_tokens_32_chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=YogaFlow <your.gmail@gmail.com>
FRONTEND_URL=http://localhost:5173
ADMIN_SECRET_KEY=my_admin_secret_key
OTP_EXPIRE_MINUTES=10
```

### Step 5 — Run locally
```bash
# From root (runs both backend + frontend simultaneously)
npm run dev

# Or run separately:
cd backend && npm run dev    # → http://localhost:5000
cd frontend && npm run dev   # → http://localhost:5173
```

The app will automatically seed 6 yoga sessions on first run! 🌱

---

## 🌐 Deployment (Free Hosting)

### Backend → Railway.app

1. **Create account** at [railway.app](https://railway.app) (GitHub login)

2. **New Project** → **Deploy from GitHub repo** → select your repo

3. **Set Root Directory** to `backend`

4. **Add environment variables** (Settings → Variables):
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your atlas URI>
   JWT_SECRET=<your secret>
   JWT_REFRESH_SECRET=<your secret>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=<your gmail>
   EMAIL_PASS=<your app password>
   EMAIL_FROM=YogaFlow <your gmail>
   FRONTEND_URL=https://your-app.vercel.app
   ADMIN_SECRET_KEY=<your admin key>
   OTP_EXPIRE_MINUTES=10
   ```

5. Railway auto-deploys! Copy your Railway URL:
   ```
   https://yogaflow-api-production.up.railway.app
   ```

6. **Test it**: `https://your-railway-url/api/health` → should return `{"success":true,"message":"YogaFlow API is running 🧘"}`

---

### Frontend → Vercel.com

1. **Create account** at [vercel.com](https://vercel.com) (GitHub login)

2. **New Project** → Import your GitHub repo

3. **Configure**:
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add environment variable**:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app/api
   ```

5. Deploy! Your app is live at `https://your-app.vercel.app` 🎉

6. **Update Railway**: Go back to Railway → Variables → update `FRONTEND_URL` to your Vercel URL

---

## 👑 Creating an Admin Account

After deployment, to make yourself an admin:

1. Sign up normally on the website
2. Make this API call (from Postman or any HTTP client):
   ```http
   POST https://your-railway-url/api/admin/create-admin
   Authorization: Bearer <your-jwt-token>
   Content-Type: application/json

   {
     "email": "your@email.com",
     "secretKey": "your_ADMIN_SECRET_KEY_from_env"
   }
   ```
3. Log out and back in → you'll see the Admin panel link

---

## 📧 How Emails Work

| Event | Email Sent |
|---|---|
| User registers | Welcome email |
| Forgot password | 6-digit OTP (valid 10 min) |
| Booking confirmed | Full details + location + what to bring |
| Booking cancelled | Cancellation confirmation |
| 24h before session | Reminder email (sent at 9 AM daily via cron) |

---

## 🔑 API Endpoints Summary

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login → returns JWT tokens
POST   /api/auth/logout            Invalidate refresh token
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/forgot-password   Send OTP to email
POST   /api/auth/verify-otp        Verify OTP → returns reset token
POST   /api/auth/reset-password    Set new password
GET    /api/auth/me                Get current user

GET    /api/sessions               List all sessions (with availability)
GET    /api/sessions/:id           Get session + availability
GET    /api/sessions/types         Get filter options

POST   /api/bookings               Create booking (auth required)
GET    /api/bookings/my            Get user's bookings (auth required)
GET    /api/bookings/:id           Get booking detail
PATCH  /api/bookings/:id/cancel    Cancel booking
POST   /api/bookings/:id/feedback  Submit rating + review

PUT    /api/users/profile          Update profile
PUT    /api/users/change-password  Change password

GET    /api/admin/stats            Admin dashboard stats
GET    /api/admin/bookings         All bookings list
GET    /api/admin/users            All users list
PATCH  /api/admin/bookings/:id/checkin  Check in a student
```

---

## 🛡 Security Features

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT access tokens** (7 day expiry) + **refresh tokens** (30 day)
- All refresh tokens stored in DB — single-click logout invalidates all devices
- **Rate limiting**: 200 req/15min global, 20 req/15min on auth routes
- OTP has **max 5 attempts** before lockout + automatic expiry
- **Helmet.js** security headers
- **CORS** restricted to specific frontend domains
- Password reset invalidates **all existing sessions**

---

## 🎨 Design

- **Fonts**: Cormorant Garamond (display) + DM Sans (body)
- **Colors**: Deep forest green palette + earthy tones
- **Fully responsive** — mobile, tablet, desktop
- Custom CSS variables, smooth transitions, skeleton loading states

---

## 📝 Troubleshooting

**"Cannot connect to MongoDB"**
→ Check your Atlas connection string. Make sure Network Access allows 0.0.0.0/0

**"Email not sending"**
→ Make sure you're using a Gmail **App Password** (not your normal Gmail password). 2FA must be enabled.

**"CORS error"**
→ Make sure `FRONTEND_URL` in backend `.env` exactly matches your Vercel URL (no trailing slash)

**"Sessions not loading"**
→ Backend seeder runs on startup. Check Railway logs for "🌱 Database seeded"

---

Built with ❤️ by YogaFlow
