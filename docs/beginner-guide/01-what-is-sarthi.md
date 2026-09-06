# What Is Sarthi?

## In one sentence

Sarthi is a **website** where **students** can find **career counselors**, book time with them, chat, take a small career quiz, and read community posts.

## Two types of users

### Student

Someone looking for career advice. They can:

- Browse counselors (like a directory)
- Request a meeting (pick date and time)
- Send messages (like WhatsApp, but inside the site)
- Take an **aptitude test** (short quiz → suggestion like “Engineering” or “Design”)
- Post and comment in **community**
- Rate a counselor **after** a finished meeting

### Counselor

Someone who gives advice. They can:

- Set **when they are free** (weekly schedule)
- See meeting requests → **accept** or **reject**
- Mark a meeting as **done** when the session happened
- Chat with students
- See their **rating** from students

There is no separate “admin” person in the app right now.

## What you see in the browser

1. **Landing page** — introduction, links to login/signup  
2. **Login / Sign up** — create account or sign in  
3. **Dashboard** — home after login (different for student vs counselor)  
4. **Other pages** — meetings, messages, profile, etc. (menu on the side)

## What “Sarthi 2.0” means in this repo

The **real app** you should learn is in:

- `frontend-new` — everything visual (buttons, pages)
- `backend-new` — the “brain” on the server (saves users, meetings, messages)

Old folders `frontend` and `backend` (without `-new`) are an **older version**. You can ignore them while learning.

## Simple picture

```text
  YOU (browser)
       │
       │  click, type, see pages
       ▼
  frontend-new  ────── asks for data ──────►  backend-new
  (React website)                              (saves in database)
       ▲                                              │
       └──────── gets answers (JSON) ◄────────────────┘
```

You never touch the database directly. The website asks the backend; the backend reads/writes the database and sends back answers.
