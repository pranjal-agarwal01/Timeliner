# DSA Revision Tracker (1–3–10 Rule)

A full-stack MERN web app for tracking DSA question revisions using the **1–3–10 spaced repetition rule**. Solve a question today, revise it on Day 3, then again on Day 10 — and it's locked in.

## Features

- 🔐 **Email OTP Authentication** — Register, verify via OTP, and log in securely
- ➕ **Add Questions** — Log your solved DSA questions with title, link, tags, notes, and difficulty
- 📅 **Automatic Scheduling** — System auto-generates Day 3 and Day 10 revision dates
- ✅ **Dashboard** — See today's due revisions grouped by Day 3 / Day 10, with one-click "Mark Revised"
- 📚 **Completed Page** — View questions that cleared both revisions, with search and filters
- 🌙 **Dark Theme** — Premium glassmorphism UI with smooth animations

## Tech Stack

| Layer    | Tech                           |
|----------|--------------------------------|
| Frontend | React 19, React Router, Vite   |
| Backend  | Node.js, Express               |
| Database | MongoDB, Mongoose              |
| Auth     | JWT (httpOnly cookie), bcrypt   |
| Email    | Nodemailer (SMTP)              |
| Security | Rate limiting, express-validator|

## Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally or a MongoDB Atlas URI
- **SMTP credentials** (e.g. Gmail App Password)

### 1. Clone & Install

```bash
git clone <repo-url>
cd Timeliner

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** — create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/dsa-tracker
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="DSA Tracker <noreply@dsatracker.com>"
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

**Client** — create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/verify-otp` | Verify email with 6-digit OTP |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/resend-otp` | Resend verification OTP |
| POST | `/api/auth/logout` | Clear auth cookie |

### Questions (Auth Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/questions` | Add a solved question |
| GET | `/api/questions/today?date=YYYY-MM-DD` | Get today's due revisions |
| PATCH | `/api/questions/:id/revision3` | Mark Day 3 revision done |
| PATCH | `/api/questions/:id/revision10` | Mark Day 10 revision done |
| GET | `/api/questions/completed` | Get completed questions |
