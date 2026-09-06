# Sarthi — Full-Stack AI Career Counselling Platform

**Sarthi** is a comprehensive, modern career guidance and counselling platform designed to help students navigate educational choices, discover professional trajectories, and connect directly with verified career counselors. By combining psychometric assessment tools, an intelligent 24/7 AI mentor, and real-time communication channels, Sarthi bridges the gap between academic exploration and strategic career planning.

---

## 🚀 Key Features

### 🤖 24/7 AI Career Companion
- **Instant Career Guidance**: An interactive, conversational mentor available around the clock to answer questions about academic streams, degrees, and emerging career opportunities.
- **Contextual Counselor Recommendations**: The assistant analyzes student questions and recommends matching certified counselors on the platform for deeper human guidance.

### 🧠 Psychometric Aptitude Engine & Career Roadmaps
- **Multi-Dimensional Assessment**: Evaluates cognitive problem solving, language acumen, numerical skills, creativity, and interpersonal strengths.
- **Personalized Career Blueprints**: Synthesizes test results into actionable career roadmaps, identifying cognitive archetypes, top-fit industries, 3-year milestone plans, and growth recommendations.

### 🎯 Smart Counselor Matching & Directory
- **Compatibility Matching**: Intelligently recommends counselors based on stream alignment, assessment results, ratings, and domain expertise.
- **Comprehensive Directory**: Browse, search, and filter experienced counselors across Science, Engineering, Medicine, Commerce, Law, Design, and Management.

### 📅 Availability Scheduling & Booking
- **Live Slot Picker**: View real-time weekly availability and schedule 1-on-1 advisory sessions.
- **Session Management**: Transparent status tracking for pending, confirmed, and completed consultations.

### 💬 Real-Time Messaging & 📹 Video Consultations
- **1-on-1 Direct Chat**: Instant messaging with live typing indicators and online presence tracking.
- **In-Browser Video Calling**: Face-to-face peer-to-peer video sessions directly within the browser with camera and microphone controls.

### 📝 Session Notes & Feedback
- **Action Plans & Feedback**: Counselors provide actionable notes, recommended resources, and milestones after each session.
- **Verified Rating System**: Students leave reviews and ratings after completed meetings to maintain high mentorship quality.

---

## 🛠️ Technology Overview

- **Frontend**: React, Vite, React Router, Modern CSS & Component Design System
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Real-Time & Media**: Socket.IO, WebRTC
- **Intelligence**: LLM-powered Career Advisory Engine

---

## 💻 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm**
- **PostgreSQL** running locally

### 1. Install Dependencies
Clone the repository and install all required packages:
```bash
npm run install:all
```

### 2. Configure Environment
Set up your configuration files:
- In `backend-new/`, copy `.env.example` to `.env` and fill in your database credentials.
- In `frontend-new/`, copy `.env.example` to `.env` (optional for local development).

### 3. Database Setup
Initialize the database schema and seed questions:
```bash
cd backend-new
npx prisma db push
node prisma/seed-questions.js
cd ..
```

### 4. Run the Platform
Start both the frontend and backend servers concurrently with a single command:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📄 License
This project is licensed under the MIT License.