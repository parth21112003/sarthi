# How Login and Saving Data Works

## Sign up — what happens?

1. You fill name, email, password, role (student or counselor) on **Signup** page.  
2. Frontend sends `POST /api/auth/register` with that data.  
3. Backend checks email not already used.  
4. Backend **hashes** password (bcrypt) — cannot get original password back from hash.  
5. Backend creates a row in **User** table in the database.  
6. Backend creates two **tokens** (see below) and sets a **cookie** in your browser.  
7. Frontend stores **access token** in memory and shows dashboard.

You are now “logged in”.

## Login — same idea

Email + password → backend compares password to hash → if OK, new tokens + cookie → dashboard.

Wrong password → error message, no token.

## Two tokens — why two?

Think of a **building**:

| Token | Like | Lasts | Stored where |
|-------|------|-------|--------------|
| **Access token** | Day pass | ~15 minutes | Browser memory (JavaScript variable) |
| **Refresh token** | Long-term badge | ~7 days | **HttpOnly cookie** (JS cannot read it) + copy in database |

Every API call sends the **day pass** in the header:  
`Authorization: Bearer eyJhbG...`

When the day pass **expires**, frontend automatically calls `POST /api/auth/refresh`.  
Browser sends the **cookie**; backend checks it; backend gives a **new day pass**.  
You usually don’t notice.

If you’re away for more than 7 days, refresh expires → you must log in again.

## Logout

Backend clears refresh token in database and deletes cookie.  
Frontend clears memory token. Socket disconnects. You go to login page.

## Where is data stored?

One SQLite file (development): `backend-new/prisma/dev.db`

Prisma **models** (tables) include:

- **User** — account info  
- **Meeting** — booking between student and counselor  
- **Chat**, **Message** — conversations  
- **Post**, **Comment** — community  
- **Notification** — bell icon items  
- **Rating** — stars/review for counselor  
- **AptitudeResult** — quiz results  

You can open `schema.prisma` to see fields — it’s like a blueprint.

## Example: saving a meeting

1. Student submits form on counselor profile.  
2. Frontend: `POST /api/meetings` with counselor id, date, time, topic.  
3. Backend checks: user is student, counselor exists, no double-book at same time.  
4. Backend: `prisma.meeting.create({ ... status: 'pending' })`.  
5. Backend creates **notification** for counselor.  
6. Response returns the new meeting object.  
7. Frontend shows “requested” or refreshes list.

Data now lives in `dev.db` until someone changes or deletes it.

## Passwords — what NOT to say in an interview

Wrong: “We store the password in the database.”  
Right: “We store a **bcrypt hash**; login compares hash to typed password.”

## Protected pages on the website

`ProtectedRoute` in React:

- Not logged in? → send to `/login`.  
- Logged in as counselor but URL is `/student/...`? → redirect to counselor dashboard.

That’s **UI protection**. Backend **also** checks token on every API call.

## Common beginner confusion

**Q: Is React storing my users?**  
A: No. React only shows data. **Backend + database** store users.

**Q: Why two folders if it’s one app?**  
A: Industry standard split: UI team vs server team; can deploy separately; clearer code.

**Q: What is `services/authService.js`?**  
A: A small file with functions like `loginUser` that only know **which URL to call**. Pages call `authService`, not the whole backend themselves.
