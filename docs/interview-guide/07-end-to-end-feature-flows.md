# 07 — End-to-End Feature Flows

Step-by-step traces you can draw on a whiteboard in an interview.

---

## Flow A: New student registers and lands on dashboard

1. User submits **Signup** form with `role: 'student'`.
2. `POST /api/auth/register` → user row + bcrypt password + cookies + accessToken JSON.
3. `AuthContext` → `LOGIN_SUCCESS` (user + accessToken in React state).
4. Navigate to `/student/dashboard`.
5. `ProtectedRoute` sees authenticated student → allow.
6. `StudentDashboard` mounts → `GET /api/dashboard/summary` with Bearer token.
7. Axios interceptor reads token from `tokenStore` (ensure login path set it; after register, refresh on reload may be needed — see auth doc).
8. Cards render counts (counselors, meetings, etc.).
9. `SocketProvider` opens Socket.IO with access token → user joins `user:{id}`, presence online.

---

## Flow B: Counselor sets availability

1. Counselor logs in → `/counselor/dashboard`.
2. Opens **Schedule** → `GET /api/counselors/:id/availability` (own id from auth context).
3. UI edits slot list locally (day + start/end).
4. Save → `PUT /api/counselors/me/availability` with `{ slots: [...] }`.
5. Server validates times, transaction: delete all old slots, insert new ones.
6. Response returns normalized slots; toast success.

**Gap:** student booking does not yet POST only slot-aligned times — availability is informational for counselor workflow.

---

## Flow C: Student finds counselor and books meeting

1. **Find Counselors** → `GET /api/counselors?search=&stream=`.
2. Click counselor → `GET /api/counselors/:id` (profile, slots, recent ratings).
3. Student fills date, start, end, topic → `POST /api/meetings`.
4. Server checks role student, counselor exists, no conflicting pending/accepted meeting.
5. Creates `Meeting` status `pending`.
6. `createNotification` → counselor gets DB row + `notification:new` if online.
7. Student redirected or toast; **My Meetings** lists pending item.

---

## Flow D: Counselor accepts meeting

1. Counselor opens **Meetings** → `GET /api/meetings` (filtered server-side by counselorId).
2. Clicks accept → `PATCH /api/meetings/:id/status` `{ status: 'accepted' }`.
3. Server verifies counselor owns meeting.
4. Updates row; notifies student with `meeting_response` notification.
5. Student sees updated status on refresh or live bell update.

**Complete path:** counselor later sets `completed` after session → enables rating (Flow G).

---

## Flow E: Start chat from counselor profile

1. Student clicks **Message counselor** on profile.
2. Navigate `/student/messages?participantId=` or service call `POST /api/chats` `{ participantId }`.
3. Server finds or creates 2-participant chat.
4. Messages page selects chat, loads history, `chat:join`.
5. Student types and sends → POST message → socket event to counselor.
6. Counselor gets notification with link `/counselor/messages?chatId=`.

---

## Flow F: Live chat message (dual path)

```text
Sender UI
  → chatService.send(chatId, content)
  → POST /api/chats/:id/messages
Server
  → INSERT message
  → UPDATE chat lastMessage/lastAt
  → emitToRoom('chat:X', 'chat:message')
  → createNotification for receiver
Receiver UI (if in room)
  → socket listener appends message
Receiver UI (if not in Messages)
  → notification:new increments bell
Receiver opens chat later
  → GET messages (full history from DB)
```

---

## Flow G: Rate counselor after session

1. Preconditions: `Meeting` with `status: 'completed'` for (student, counselor).
2. Student opens **Meetings** → rating modal → score 1–5 + optional review.
3. `POST /api/ratings` → upsert on unique (counselorId, studentId).
4. `recalculateCounselorRating` updates `User.rating`, `User.totalRatings`.
5. Notification to counselor.
6. Counselor profile and directory sort reflect new rating.

---

## Flow H: Aptitude test

1. Student → **Aptitude Test** → `GET /api/aptitude/questions` (no scores in response).
2. UI renders radio options per question.
3. Submit → `POST /api/aptitude/submit` with answers map.
4. Server scores each answer against internal question bank, aggregates by category.
5. Picks top category → recommendation string.
6. Inserts `AptitudeResult` with JSON scores.
7. UI shows breakdown + history from `GET /api/aptitude/results`.

---

## Flow I: Community post and engagement

1. `GET /api/community/posts` with optional search/category.
2. Student creates post → `POST /api/community/posts`.
3. Another user likes → `POST .../like` toggles PostLike + denormalized counter.
4. Comment → `POST .../comments`.
5. Author deletes own post → `DELETE` cascades comments and likes.

---

## Flow J: Session refresh after 15 minutes

1. User idle; access JWT expires.
2. Next API call → 401.
3. Axios interceptor POST `/api/auth/refresh` (cookie).
4. New access token → retry original request.
5. User may not notice.

If refresh expired (7 days): refresh fails → clear token → user must login again.

---

## Flow K: Logout

1. User clicks logout in sidebar.
2. `POST /api/auth/logout` clears DB refresh + cookie.
3. `clearAccessToken`, `LOGOUT` state.
4. SocketProvider effect cleans up → disconnect.
5. Redirect to login (typically via navigation in sidebar handler).

---

## Status machine: Meeting (memorize)

```text
pending ──accept──► accepted ──complete──► completed
   │                    │
   reject               cancel (student or counselor rules)
   ▼                    ▼
rejected            cancelled
```

Students create in `pending`. Counselor drives accept/reject/complete. Cancel rules differ by role (see API doc).

---

## What to say when asked “walk me through your favorite feature”

Pick **chat + notifications**:

- Shows full-stack ownership (DB, REST, sockets, React state).
- Demonstrates security (participant check, JWT on socket).
- Honest about tradeoffs (REST first, socket for fan-out).

Or pick **meetings + ratings**:

- Clear business rules and state machine.
- Shows integrity (completed meeting before rating).
- Denormalized rating for performance.
