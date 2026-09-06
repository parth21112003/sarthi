# Sarthi — Full-Stack AI Career Counselling Platform

Sarthi is an enterprise-grade, full-stack career counseling platform connecting **students** with verified **human counselors** and an intelligent **24/7 AI Career Companion**. 

Students can take dimensional psychometric aptitude assessments, generate AI-powered career roadmaps, discover and book matching counselors based on real availability, consult via real-time WebSocket chat and WebRTC video calling, explore industry roadmaps, and track their progress through counselor session notes.

---

## 🌟 Key Platform Capabilities

### 1. 🤖 24/7 Sarthi AI Career Companion (Groq LLM)
- **Live Counselor Triage**: An interactive floating AI assistant on every dashboard view. Students can ask about streams, degrees, competitive entrance exams, and college roadmaps. The AI contextually queries the database and refers real, verified human counselors by name, specialization, and rating.
- **Rich Markdown & Table Formatting**: Powered by `react-markdown` and `remark-gfm` with responsive table wrappers and styled headers.
- **Resilient Multi-Model Fallback**: Automated failover across `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b` with intelligent rate-limit handling.

### 2. 🧠 Dynamic 25-Question Aptitude Engine & AI Career Blueprint
- **Psychometric Testing**: 25 questions across 5 dimensions: *Logical Reasoning, Verbal Ability, Quantitative Aptitude, Creative & Design, Social & Leadership*.
- **AI Career Roadmap**: Converts assessment results into a structured blueprint:
  - **Dominant Psychometric Archetype** (e.g., *Analytical Quant*, *Strategic Technologist*).
  - **Executive Summary** synthesizing unique student strengths.
  - **Top Career Pathways** with match percentage, target roles, and salary benchmarks.
  - **3-Year Milestone Plan** (Year 1: Foundations, Year 2: Specialization, Year 3: Industry Readiness).
  - **Blindspots & Proactive Growth Remedies**.

### 3. 🎯 Smart Counselor Matching & Directory
- **Compatibility Scoring**: Evaluates academic stream alignment (35%), aptitude strengths (30%), counselor rating quality (20%), and industry experience (15%).
- **Multi-Criteria Search**: Filter counselors by stream, minimum rating (4.0+, 4.5+), and sort by highest rated or most experienced.
- **Pre-registered Counselors**: 12 verified counselors spanning Engineering, Finance, Medicine, Law, Design, Psychology, and Management.

### 4. 📅 Availability-Based Scheduling & Session Notes
- **Strict Slot Validation**: 14-day visual calendar picker enforcing real counselor time slots; prevents past bookings and double-booking.
- **Session Notes & Homework**: Counselors document key discussions, action plans, and resources for students after completed sessions.

### 5. 💬 Real-Time Chat & 📹 WebRTC Video Calling
- **Socket.IO Real-Time Messaging**: 1-on-1 direct messaging threads with online presence, typing indicators, and read receipts.
- **Peer-to-Peer Video Calling**: WebRTC-powered video rooms with mic/camera toggles and Picture-in-Picture preview.
- **Rating & Review System**: 1–5 star ratings with verified student reviews and star distribution histograms.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Axios, Socket.IO Client, Lucide React, React Markdown, Remark GFM, Hot Toast |
| **Backend** | Node.js, Express, Prisma ORM, Socket.IO, Bcrypt, JSON Web Tokens (JWT), Cookie-Parser |
| **Database** | PostgreSQL |
| **AI / LLM** | Groq Cloud API (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) |
| **Deployment** | Vercel (Frontend), Render (Backend & WebSockets), Neon.tech (Cloud PostgreSQL) |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js** (v18 or v20+)
- **PostgreSQL** running locally or a cloud database URL

### 1. Install Dependencies
```bash
npm run install:all
```
*(Installs root, backend, and frontend packages simultaneously)*

### 2. Environment Configuration

In `backend-new/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sarthi?schema=public"
JWT_SECRET="sarthi-jwt-secret-key-2024-super-secure"
JWT_REFRESH_SECRET="sarthi-refresh-secret-key-2024-super-secure"
PORT=5000
CLIENT_URL="http://localhost:5173"
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="openai/gpt-oss-120b"
```

In `frontend-new/.env` (optional for local):
```env
VITE_API_URL="http://localhost:5000"
```

### 3. Database Migration & Seeding
```bash
cd backend-new
npx prisma db push
node prisma/seed-questions.js
```

### 4. Run the Application
From the root directory, start both frontend and backend concurrently:
```bash
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Login Accounts

All accounts are pre-seeded in the database:

### Student Account
- **Email**: `parth@gmail.com`
- **Password**: `@Parth2003`

### Counselor Accounts (12 Stream Specialists)
All counselor accounts use their email and password format `@Firstname2003`:

| Counselor Name | Specialization / Stream | Email | Password |
|---|---|---|---|
| **Aarav Sharma** | Computer Science & Artificial Intelligence | `aarav.sharma@sarthi.edu` | `@Aarav2003` |
| **Priya Patel** | Medicine, NEET & Healthcare Sciences | `priya.patel@sarthi.edu` | `@Priya2003` |
| **Rohan Mehta** | Commerce, Chartered Accountancy & Finance | `rohan.mehta@sarthi.edu` | `@Rohan2003` |
| **Ananya Iyer** | Design, UI/UX & Architecture | `ananya.iyer@sarthi.edu` | `@Ananya2003` |
| **Vikram Malhotra** | Corporate Law, CLAT & Civil Services | `vikram.malhotra@sarthi.edu` | `@Vikram2003` |
| **Neha Kapoor** | Investment Banking & FinTech | `neha.kapoor@sarthi.edu` | `@Neha2003` |
| **Kabir Verma** | Mechanical & Robotics Engineering | `kabir.verma@sarthi.edu` | `@Kabir2003` |
| **Dr. Sneha Roy** | Biotechnology & Biomedical Research | `sneha.roy@sarthi.edu` | `@Sneha2003` |
| **Arjun Singhania** | Business Management & MBA Prep | `arjun.singhania@sarthi.edu` | `@Arjun2003` |
| **Meera Deshmukh** | Psychology & Human Resources | `meera.deshmukh@sarthi.edu` | `@Meera2003` |
| **Devendra Shukla** | Journalism & Mass Media | `devendra.shukla@sarthi.edu` | `@Devendra2003` |
| **Siddharth Nair** | Civil Engineering & Urban Planning | `siddharth.nair@sarthi.edu` | `@Siddharth2003` |

---

## 🌐 Cloud Deployment Guide (100% Free Tier)

Because Sarthi requires **persistent WebSockets (Socket.IO)** for real-time chat and WebRTC call signaling, the recommended architecture separates the stateless React frontend and the persistent Node.js backend:

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│     Vercel (Free)       │ ────> │      Render (Free)      │ ────> │    Neon.tech (Free)     │
│   React 18 + Vite SPA   │ HTTP/ │ Express API + Socket.IO │ SQL   │   Cloud PostgreSQL DB   │
│   (frontend-new)        │ WS    │ (backend-new)           │       │                         │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### 1. Database Setup (Neon.tech)
1. Sign up at [neon.tech](https://neon.tech) and create a free project.
2. Copy your connection string (`postgresql://...`).
3. Run `npx prisma db push && node prisma/seed-questions.js` with your cloud URL.

### 2. Backend Deployment (Render.com)
1. Create a **New Web Service** pointing to your GitHub repository.
2. Configure:
   - **Root Directory**: `backend-new`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `DATABASE_URL` = *Your Neon PostgreSQL connection string*
   - `JWT_SECRET` = *Secure random string*
   - `JWT_REFRESH_SECRET` = *Secure random string*
   - `GROQ_API_KEY` = *Your Groq API Key*
   - `GROQ_MODEL` = `openai/gpt-oss-120b`
   - `CLIENT_URL` = *Your Vercel URL (or `*` during initial setup)*

### 3. Frontend Deployment (Vercel.com)
1. Import your GitHub repository on [vercel.com](https://vercel.com).
2. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend-new`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = *Your Render Backend URL (e.g., `https://sarthi-backend.onrender.com`)*
4. Click **Deploy**. *(The included `frontend-new/vercel.json` ensures all client-side routes rewrite properly to `index.html`)*.

---

## 📂 Project Architecture

```
sarthi/
├── package.json                   # Root workspace scripts
├── README.md                      # Platform documentation
├── backend-new/                   # Express + Socket.IO API
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL relational schema
│   │   └── seed-questions.js      # 25-question aptitude test bank seed
│   ├── src/
│   │   ├── config/                # Prisma client singleton
│   │   ├── controllers/           # Feature controllers (AI, Chat, Meetings, etc.)
│   │   ├── middleware/            # Auth JWT & Central error handler
│   │   ├── routes/                # REST endpoints
│   │   ├── services/              # AI (Groq), Matching, Notification services
│   │   ├── socket/                # Socket.IO WebSocket & WebRTC signaling
│   │   └── server.js              # Server entry point
│   └── .env
└── frontend-new/                  # React 18 + Vite SPA
    ├── vercel.json                # Vercel SPA client rewrite config
    └── src/
        ├── components/
        │   ├── ai/                # Floating Sarthi AI chat widget & styling
        │   ├── common/            # Buttons, Cards, Inputs, Modals, Badges
        │   ├── layout/            # Navbar, Sidebar, Dashboard layout
        │   └── notifications/     # Real-time notification bell dropdown
        ├── context/               # AuthContext, SocketContext (WebRTC)
        ├── pages/                 # Role dashboards, Aptitude, Chat, Meetings, Video
        └── services/              # Axios API clients
```

---

## 📡 Backend API Endpoints

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Health** | `/api/health` | `GET` | Health check & service version |
| **Auth** | `/api/auth/register` | `POST` | Register student or counselor |
| | `/api/auth/login` | `POST` | User login (JWT issuance) |
| | `/api/auth/refresh` | `POST` | Cookie-based token renewal |
| | `/api/auth/logout` | `POST` | Safely clear refresh session |
| | `/api/auth/me` | `GET` | Current authenticated user profile |
| **AI (Groq)** | `/api/ai/chat` | `POST` | 24/7 AI companion chat with counselor triage |
| | `/api/ai/roadmap` | `POST` | AI-generated career roadmap from aptitude test |
| **Counselors** | `/api/counselors` | `GET` | List counselors with stream & search filters |
| | `/api/counselors/recommended` | `GET` | Smart algorithm matches based on aptitude |
| | `/api/counselors/:id` | `GET` | Counselor profile & reviews |
| | `/api/counselors/:id/availability` | `GET` | Active recurring availability slots |
| **Meetings** | `/api/meetings` | `GET` / `POST` | List and book sessions with slot verification |
| | `/api/meetings/:id/status` | `PATCH` | Confirm, complete, or cancel meeting |
| **Messaging** | `/api/chats` | `GET` / `POST` | User chat conversations & start thread |
| | `/api/chats/:id/messages` | `GET` / `POST` | Message history & send direct message |
| **Aptitude** | `/api/aptitude/questions` | `GET` | 25-question test bank |
| | `/api/aptitude/submit` | `POST` | Submit answers & compute scores |
| | `/api/aptitude/results` | `GET` | Evaluation history |
| **Session Notes**| `/api/session-notes` | `GET` / `POST` | Counselor notes & action plans for meetings |
| **Ratings** | `/api/ratings` | `POST` | Submit 1–5 star rating for completed session |
| | `/api/ratings/counselor/:id`| `GET` | Review cards & star distribution histogram |

---

## 📄 License
This project is licensed under the MIT License.