# 08 — Interview Questions and Talking Points

Use this as a mock interview sheet. Answer in **Problem → Approach → Tradeoff → What I’d improve**.

---

## Project summary (30 seconds)

“I built Sarthi, a career counseling platform with separate student and counselor experiences. The frontend is React with Vite; the backend is Express with Prisma on SQLite. Authentication uses short-lived JWT access tokens and httpOnly refresh cookies. Real-time features use Socket.IO for chat, presence, and notifications, while REST persists all messages and bookings.”

---

## Architecture and design

**Q: Why monolith instead of microservices?**  
A: Scope fits a single Express app; shared auth and Prisma simplify development. Socket.IO on the same server avoids extra infra. For production scale, I’d split read replicas or notification workers first, not premature microservices.

**Q: Why SQLite?**  
A: Zero-config for development and demos. Prisma makes migrating to PostgreSQL a config change plus migrations. Tradeoff: concurrent write limits vs simplicity.

**Q: How do frontend and backend communicate?**  
A: JSON REST on `/api/*` with Bearer tokens; Socket.IO for push. CORS with credentials for refresh cookies. Vite dev server on 5173, API on 5000.

**Q: Where is business logic?**  
A: Controllers in `backend-new/src/controllers`. Not in routes or React components (UI validates for UX only).

---

## Authentication

**Q: Explain your auth flow.**  
A: Login/register return 15m access JWT in JSON and 7d refresh in httpOnly cookie. Access token in memory for API. On 401, Axios refreshes via cookie. Refresh validated against DB-stored token for logout invalidation. Socket uses same access JWT.

**Q: Why not store JWT in localStorage?**  
A: XSS could steal it. Memory + httpOnly refresh reduces exposure. Refresh still needs XSS protection for CSRF on cookie endpoints — mitigated by SameSite and not using cookie for API auth on mutations (Bearer instead).

**Q: How do you authorize counselors vs students?**  
A: JWT payload includes `role`. Frontend `ProtectedRoute` redirects. Backend checks role in controllers (e.g. only students create meetings).

**Q: What happens on logout?**  
A: Clear refresh in DB, clear cookie, clear in-memory access token, disconnect socket.

---

## Database

**Q: Walk through your schema.**  
A: Central `User` with role. `Meeting` links student and counselor with status workflow. `Chat`/`ChatParticipant`/`Message` for 1:1 messaging. `Rating` unique per pair. Community `Post`/`Comment`/`PostLike`. `Notification` inbox. `AptitudeResult` stores scored assessments.

**Q: Why denormalize counselor rating on User?**  
A: Fast sort on counselor directory (`orderBy rating`). Updated synchronously after each rating via aggregate query — acceptable at small scale; could async queue later.

**Q: How prevent double booking?**  
A: Before insert, query existing meeting same counselor+date+startTime with active status pending/accepted → 409.

---

## Real-time

**Q: Why persist messages via REST if you have sockets?**  
A: Guaranteed delivery, retries, single source of truth. Sockets notify connected clients; offline users load history on open.

**Q: How do socket rooms work?**  
A: `user:{id}` for notifications; `chat:{id}` for message fan-out. Join chat only after server verifies participant.

**Q: How do you show online status?**  
A: On connect/disconnect server broadcasts `presence:update`; client maintains `onlineUsers` map in context.

---

## Features and business rules

**Q: When can a student rate a counselor?**  
A: After at least one completed meeting with that counselor. One rating row per pair (upsert updates review).

**Q: How does aptitude scoring work?**  
A: Fixed question bank in controller; each option has hidden score; categories summed; highest category maps to recommendation string; result stored in DB.

**Q: Can anyone delete community posts?**  
A: Only the author (`userId` match). Deletes cascade comments and likes in a transaction.

---

## Frontend

**Q: How do you structure React code?**  
A: Pages for screens, services for API, context for auth/socket, shared layout and UI components. Lazy routes for performance.

**Q: How handle loading and errors?**  
A: Spinners during auth init and fetches; toast for action errors; empty states for lists.

---

## Testing and quality (be honest)

**Q: How did you test?**  
A: Manual smoke flows documented in progress reports; production build via Vite; syntax checks on controllers. Automated tests not yet added — I’d add API integration tests with supertest and React Testing Library for critical flows.

---

## Weaknesses → improvements (shows maturity)

| Gap | Improvement |
|-----|-------------|
| Register doesn’t set `tokenStore` | Call `setAccessToken` on register like login |
| Rate limit not wired | Apply to auth routes |
| Booking ignores availability slots | Validate slot or UI slot picker |
| No automated tests | Jest/Vitest + supertest |
| SQLite in prod | PostgreSQL + connection pooling |
| Single server Socket.IO | Redis adapter for horizontal scale |
| No video | WebRTC + signaling via existing Socket.IO |
| Session notes in schema only | CRUD API + counselor UI |

---

## Behavioral / product questions

**Q: Who is the user?**  
A: Students exploring career paths; counselors managing requests and reputation.

**Q: What was the hardest part?**  
A: (Pick one you relate to) Unifying real-time chat with persistent messages; or designing meeting state transitions so ratings and notifications stay consistent.

**Q: What would you build next?**  
A: Slot-based booking, session notes after completed meetings, email notifications, admin moderation, deployment with env-based config.

---

## Quick technical flashcards

| Term | Your one-liner |
|------|----------------|
| Prisma | ORM; schema-first; generates client |
| JWT access 15m | Limits exposure window |
| httpOnly cookie | JS cannot read refresh token |
| Socket.IO ack on chat:join | Confirms membership before joining room |
| `Promise.all` in dashboard | Parallel counts for faster summary |
| Lazy import | Code splitting per route |
| 409 on meeting | Conflict / double book |
| upsert rating | Create or update single review per pair |

---

## Files to rehearse opening

If interviewer says “open any file and explain”:

1. `auth.controller.js` — full auth story  
2. `chat.controller.js` — REST + emit pattern  
3. `Messages.jsx` — socket + REST together  
4. `schema.prisma` — data model  
5. `api.js` — interceptors and refresh  

---

## Demo script (2 minutes live)

1. Show landing → login as student.  
2. Open counselor directory → profile → request meeting.  
3. Second browser: counselor login → accept meeting → complete.  
4. Student: rate counselor.  
5. Open messages; send chat; show notification bell.  
6. Mention dashboard numbers update from real API.

Practice this once before the interview.
