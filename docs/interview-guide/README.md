# Sarthi — Interview Study Guide

This folder is a **deep-dive reference** for Sarthi 2.0 (`frontend-new` + `backend-new`). Use it to understand how the product works, how it is implemented, and how to explain it clearly in technical interviews.

> **New to these technologies?** Start with **[beginner-guide](../beginner-guide/)** first — plain English, no jargon. Come back here when you're ready for more detail.

## Recommended reading order

| # | Document | What you will learn |
|---|----------|---------------------|
| 1 | [01-project-overview-and-architecture.md](./01-project-overview-and-architecture.md) | Problem domain, stack, request lifecycle, folder layout |
| 2 | [02-authentication-and-security.md](./02-authentication-and-security.md) | JWT, refresh cookies, middleware, auth flows |
| 3 | [03-database-and-data-model.md](./03-database-and-data-model.md) | Prisma schema, relationships, constraints |
| 4 | [04-backend-api-deep-dive.md](./04-backend-api-deep-dive.md) | Every API area, business rules, status codes |
| 5 | [05-realtime-socketio-and-notifications.md](./05-realtime-socketio-and-notifications.md) | Socket rooms, chat events, notification pipeline |
| 6 | [06-frontend-react-architecture.md](./06-frontend-react-architecture.md) | Routing, context, services, UI patterns |
| 7 | [07-end-to-end-feature-flows.md](./07-end-to-end-feature-flows.md) | Step-by-step traces (booking, chat, rating, etc.) |
| 8 | [08-interview-questions-and-talking-points.md](./08-interview-questions-and-talking-points.md) | Likely questions, answers, tradeoffs, improvements |

## One-minute elevator pitch

**Sarthi** is a full-stack career counseling platform. **Students** discover counselors, book sessions, chat in real time, take aptitude assessments, join a community forum, and rate counselors after completed meetings. **Counselors** set weekly availability, accept or reject bookings, message students, and see dashboard metrics. The stack is **React + Vite** on the client, **Express + Prisma + SQLite** on the server, and **Socket.IO** for live chat, presence, and notifications.

## Before the interview

1. Run the app locally ([main README](../../README.md)) and click through one student path and one counselor path.
2. Skim **07-end-to-end-feature-flows.md** and be ready to whiteboard **auth refresh** and **chat message path** (REST + socket).
3. Open `backend-new/prisma/schema.prisma` once — interviewers often ask about your data model.
4. Know **what is not built** (video calls, slot-enforced booking, some sidebar links) so you can discuss roadmap honestly.

## Related docs

- [progress-reports/](../../progress-reports/) — phase-by-phase build history  
- [implementation_plan.md](../../implementation_plan.md) — original legacy codebase audit (historical)
