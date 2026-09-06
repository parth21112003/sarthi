# Two Parts: Frontend and Backend

## Restaurant analogy

| Real world | Sarthi |
|------------|--------|
| Dining room, menu, waiter | **Frontend** (React) |
| Kitchen, recipes, storage | **Backend** (Express) |
| Pantry / fridge | **Database** (SQLite file) |

You (customer) only sit in the dining room. You don’t go into the kitchen.  
When you order “my meetings”, the waiter (frontend) tells the kitchen (backend), kitchen checks storage (database), kitchen sends plates back (JSON data), waiter shows it on your table (screen).

## Two terminals when developing

1. **Terminal 1** — `cd backend-new` → `npm run dev` → server on **port 5000**  
2. **Terminal 2** — `cd frontend-new` → `npm run dev` → website on **port 5173**

You open the browser at **5173**. That site talks to **5000** in the background.

If backend is off, login and lists will **fail** (errors in browser or toast messages).

## How they talk (normal request)

Example: student opens “My Meetings”.

```text
1. Meetings page loads (React)
2. meetingService calls GET http://localhost:5000/api/meetings
3. Browser adds header: Authorization: Bearer <access token>
4. Backend checks token → knows user id and role
5. Backend reads meetings from database for that student
6. Backend sends JSON: { meetings: [ ... ] }
7. React puts that list on screen
```

No magic: always **request → response**.

## Folder roles

```text
frontend-new/src/
  pages/          ← full screens (Login, Meetings, …)
  components/     ← smaller UI pieces (Button, Sidebar, …)
  services/       ← “call backend” functions (authService, meetingService, …)
  context/        ← logged-in user + socket connection
  AppRoutes.jsx   ← which URL shows which page

backend-new/src/
  routes/         ← maps URL to controller (thin)
  controllers/    ← real work (create meeting, send message, …)
  middleware/     ← login check, validation, errors
  prisma/         ← database shape (schema.prisma)
  socket/         ← live chat / notifications
  server.js       ← starts everything
```

## Frontend vs backend — who decides what?

| Job | Who |
|-----|-----|
| Show button, form, colors | Frontend |
| “Only students can book” rule | **Backend** (must enforce; frontend can hide buttons but hacker could still call API) |
| Store password safely | Backend (hash) |
| Remember you’re logged in (session) | Backend (cookie + token) + frontend (keeps short token in memory) |
| Chat message saved forever | Backend (database) |
| Chat bubble appears instantly | Backend emits via Socket.IO; frontend listens and updates screen |

**Rule for interviews and real jobs:** never trust the browser alone; important rules live on the server.

## CORS (one confusing word)

Browser blocks website A from calling website B **unless** B allows it.

Here: frontend `5173` calls backend `5000` — different ports = different “origins”.  
Backend sets `CLIENT_URL=http://localhost:5173` so the browser is allowed to call it (and send cookies).

## Live updates (chat) — slightly different path

Sending a message:

1. Frontend **POST** `/api/chats/5/messages` → message **saved in database** (important!)  
2. Backend also **pushes** to connected browsers via Socket.IO (“new message event”)  
3. Other person’s screen updates without refreshing the page  

So: **save with normal API**, **notify live with sockets**.

That’s why both exist — not two separate chat systems.
