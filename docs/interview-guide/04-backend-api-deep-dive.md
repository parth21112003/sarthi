# 04 — Backend API Deep Dive

All routes require `authenticate` unless noted. Base URL: `http://localhost:5000`.

---

## Health

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/health` | No | `{ status, service, version }` |

---

## Auth — `/api/auth`

| Method | Path | Body / cookie | Success |
|--------|------|---------------|---------|
| POST | `/register` | name, email, password, role, optional profile fields | 201 + accessToken, user; Set-Cookie refresh |
| POST | `/login` | email, password | 200 + tokens |
| POST | `/refresh` | cookie `refreshToken` | 200 + new accessToken, user |
| POST | `/logout` | cookie | 200, clears cookie |
| GET | `/me` | Bearer | `{ user }` selected fields |

**Files:** `routes/auth.routes.js`, `controllers/auth.controller.js`, `middleware/validate.js`.

---

## Users — `/api/users`

| Method | Path | Rules |
|--------|------|-------|
| GET | `/profile/:id` | Any authenticated user; public profile fields |
| PUT | `/profile` | Updates **own** profile; counselor can set experience/specialization |

**File:** `controllers/user.controller.js`.

---

## Counselors — `/api/counselors`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List counselors; query `search`, `stream` |
| GET | `/:id` | Profile + active slots + last 5 ratings |
| GET | `/:id/availability` | Active slots for counselor id |
| PUT | `/me/availability` | Counselor only; body `{ slots: [...] }` replaces all slots |

**Listing sort:** rating desc, totalRatings desc, name asc.

**Search:** OR across name, email, bio, specialization (and stream filter OR stream/specialization contains).

**Availability validation:** day 0–6, times `HH:mm` regex, start < end.

**File:** `controllers/counselor.controller.js`.

---

## Meetings — `/api/meetings`

| Method | Path | Role / rules |
|--------|------|--------------|
| GET | `/` | Lists meetings where user is student or counselor |
| GET | `/stats` | Counts total, pending, accepted, completed |
| POST | `/` | **Student only**; body counselorId, date, startTime, endTime, topic?, notes? |
| PATCH | `/:id/status` | Counselor updates status; student may set `cancelled` only |

**Statuses:** `pending` → counselor `accepted` | `rejected`; counselor can `complete` or `cancel`; student `cancel`.

**Side effect:** `createNotification` to the other party on create and status update.

**File:** `controllers/meeting.controller.js`.

---

## Chats — `/api/chats`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/` | Inbox for current user, ordered by `lastAt` |
| POST | `/` | Body `{ participantId }`; reuse existing 1:1 chat or create |
| GET | `/:id/messages` | Ascending history; must be participant |
| POST | `/:id/messages` | Body `{ content }`; persists, updates chat preview, emits socket, notifies |
| PATCH | `/:id/read` | Marks others' messages read; emits `chat:read` |

**File:** `controllers/chat.controller.js`.

---

## Notifications — `/api/notifications`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/` | List + unreadCount |
| PATCH | `/:id/read` | Single read |
| PATCH | `/read-all` | Mark all for user |

Creation is internal via `services/notification.service.js` → DB + `notification:new` socket to `user:{id}`.

**File:** `controllers/notification.controller.js`.

---

## Community — `/api/community`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/posts` | Query `search`, `category`; adds `likedByMe`, `likeCount` |
| POST | `/posts` | Create; content required |
| PUT | `/posts/:id` | Owner only edit |
| DELETE | `/posts/:id` | Owner only; cascades comments/likes |
| POST | `/posts/:id/like` | Toggle like |
| POST | `/posts/:id/comments` | Add comment |

**File:** `controllers/community.controller.js`.

---

## Aptitude — `/api/aptitude`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/questions` | Returns questions **without** option scores |
| POST | `/submit` | Student only; body `{ answers: { [questionId]: optionId } }` |
| GET | `/results` | Student's past results, scores parsed from JSON |

**Scoring:** sum scores per category (`logical`, `verbal`, `quantitative`, `creative`, `social`); top category picks recommendation string.

**File:** `controllers/aptitude.controller.js` (questions array inline).

---

## Ratings — `/api/ratings`

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/` | Student; counselorId, score 1–5, optional review; requires completed meeting |
| GET | `/counselor/:counselorId` | List reviews for profile |

**File:** `controllers/rating.controller.js`.

---

## Dashboard — `/api/dashboard`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/summary` | Role-specific counts (parallel `Promise.all`) |

**Counselor summary:** meeting counts, unread messages in user's chats, post count, unique students, rating.

**Student summary:** counselor count, meeting counts, unread messages, aptitude attempt count, post count.

**File:** `controllers/dashboard.controller.js`.

---

## Cross-cutting middleware

| Middleware | Role |
|------------|------|
| `errorHandler` | Last Express middleware; maps JWT/Prisma errors |
| 404 handler | `{ error: 'Route not found' }` before error handler |

**CORS:** `CLIENT_URL`, `credentials: true` — required for cookies on refresh.

---

## Controller design pattern (repeatable story)

1. Parse and validate input (types, role, ownership).
2. Early return with correct HTTP status (400, 403, 404, 409).
3. Prisma read/write.
4. Side effects (notifications, socket emit).
5. JSON response.
6. `catch → next(error)`.

---

## HTTP status codes used meaningfully

| Code | When |
|------|------|
| 400 | Validation, missing fields |
| 401 | Missing/invalid JWT, refresh |
| 403 | Wrong role or not owner/participant |
| 404 | Missing resource |
| 409 | Meeting conflict, unique constraint |
| 201 | Created (register, meeting, message, post, rating, aptitude result) |
| 500 | Unhandled (stack in development only) |

---

## What is NOT exposed as API yet

- Session notes CRUD
- Admin/moderation
- File upload for avatars (field exists, upload pipeline not built)
- Password reset
