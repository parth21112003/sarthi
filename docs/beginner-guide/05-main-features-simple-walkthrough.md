# Main Features — Simple Walkthrough

Do these in order once while the app is running. That connects docs to what you see.

## 1. Create accounts

- Sign up as **student** (email A).  
- Sign up as **counselor** (email B) — use another browser or incognito.

Remember: two roles, two dashboards.

## 2. Counselor: set free times

- Login as counselor → **Schedule**.  
- Add slots (e.g. Monday 10:00–11:00).  
- Save.

**What happened:** frontend sent slots to backend → old slots replaced → saved in `AvailabilitySlot` table.  
Students can **see** these on counselor profile (booking doesn’t force picking a slot yet — that’s a future improvement).

## 3. Student: find counselor and book

- Login as student → **Find Counselors**.  
- Open a profile → fill meeting form → submit.

**Status:** `pending`.

**What happened:** new row in `Meeting` table; counselor gets a **notification**.

## 4. Counselor: accept meeting

- Login as counselor → **Meetings** → Accept.

**Status:** `accepted`.

Student gets notification. Later counselor can mark **completed** when the session is done.

## 5. Messages

- From student profile: **Message counselor** (or open **Messages**).  
- Type and send.

**What happened:**

- Message saved in database (always).  
- If counselor has chat open, it appears live (Socket.IO).  
- Counselor also gets notification if not looking at chat.

## 6. Notification bell

Top of dashboard — list of “new meeting”, “new message”, etc.  
Mark all read clears the counter.

## 7. Aptitude test (student)

- **Aptitude Test** → answer questions → submit.

**What happened:** backend scores answers (logic in code, not AI), picks a career suggestion, saves `AptitudeResult`.  
You can see past attempts on the same page.

## 8. Community (student route)

- Create a post, like, comment.  
- You can delete **your own** post only.

## 9. Rate counselor (student)

Only after a meeting is **completed**:

- **My Meetings** → rate (stars + optional text).

Counselor’s average rating updates on their profile.

## 10. Dashboard numbers

Student and counselor home pages show **counts** (meetings, messages, etc.) from `GET /api/dashboard/summary` — real numbers from database, not fake placeholders.

---

## Meeting statuses — easy chart

```text
Student books     →  pending
Counselor accepts →  accepted
Counselor rejects →  rejected
Either can cancel →  cancelled (rules differ slightly by role)
Counselor marks done → completed  (needed before rating)
```

---

## What is NOT working yet (don’t panic)

- **Video call** — not built  
- **Career Paths / Session Notes / Analytics** menu — links go nowhere  
- **Editing** community posts in UI — backend can, UI doesn’t show edit yet  

It’s OK to say “planned” in an interview.

---

## One line per feature (memory aid)

| Feature | One line |
|---------|----------|
| Auth | Sign up/in; backend hashes password; tokens prove who you are |
| Counselors list | Backend filters users with role counselor |
| Meetings | Student creates; counselor changes status; stored in Meeting table |
| Chat | Messages in DB; Socket.IO for instant display |
| Notifications | Row in DB + ping to browser if online |
| Community | Posts, likes, comments in DB |
| Aptitude | Quiz in backend code; results in DB |
| Ratings | After completed meeting; updates counselor average |
