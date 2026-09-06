# Technologies in Plain English

You don’t need to master everything at once. This table is “what is this word?”

## Big picture

| Word | Simple meaning |
|------|----------------|
| **Website / web app** | Pages that run in Chrome, Edge, etc. |
| **Frontend** | The part you **see and click** (layouts, forms, colors). |
| **Backend** | The part on a **server** you don’t see — checks passwords, saves meetings, sends lists of counselors. |
| **Database** | A **file** (here: SQLite) where users, messages, and meetings are stored permanently. |
| **API** | A set of **URLs** the frontend calls, like “give me my meetings” or “save this message”. |

---

## Frontend (`frontend-new`)

| Technology | What it is | Why Sarthi uses it |
|------------|------------|-------------------|
| **HTML** | Structure of a page (headings, buttons). | Built for you by React. |
| **CSS** | Colors, spacing, layout. | Makes dashboards look consistent. |
| **JavaScript (JS)** | Logic in the browser (what happens on click). | Powers all interactivity. |
| **React** | A JS **library** to build UI from **components** (reusable pieces like `Button`, `Login page`). | Easier than updating raw HTML for every change. |
| **Vite** | Tool that **runs** the dev website on `localhost:5173` and bundles code for production. | Fast development. |
| **React Router** | Changes “page” without full reload — `/login`, `/student/dashboard`, etc. | Feels like a normal app with many screens. |
| **Axios** | Helper to **call the backend** over the internet (GET/POST). | Used in `services/` files. |

**Component** = one piece of UI, e.g. a sidebar or a login form.  
**Page** = full screen, e.g. `Meetings.jsx`.

---

## Backend (`backend-new`)

| Technology | What it is | Why Sarthi uses it |
|------------|------------|-------------------|
| **Node.js** | Runs JavaScript **on the server** (not in the browser). | Same language as frontend. |
| **Express** | Small **framework** on top of Node to define routes like `POST /api/auth/login`. | Standard way to build REST APIs. |
| **Prisma** | Tool that talks to the **database** using nice functions instead of raw SQL only. | Schema in `schema.prisma`; code uses `prisma.user.findMany(...)`. |
| **SQLite** | Database stored in **one file** (`dev.db`). Good for learning and local dev. | No separate database server to install. |
| **bcrypt** | **Hashes** passwords (one-way scramble). | Never store plain text passwords. |
| **JWT** | A **signed string** that proves “this request is from user 5, role student”. | Sent as `Authorization: Bearer ...` on each API call. |
| **Socket.IO** | **Live connection** between browser and server (chat appears instantly, notification bell updates). | Used for messages and notifications while open. |
| **Cookie** | Small piece of data the browser **automatically sends** with requests. | Stores **refresh token** for “stay logged in”. |

---

## Words you’ll hear a lot

| Term | Easy explanation |
|------|------------------|
| **JSON** | Text format for data: `{ "name": "Ali", "role": "student" }`. Frontend and backend speak JSON. |
| **REST** | Calling URLs with GET (read), POST (create), PATCH (update), DELETE (remove). |
| **localhost** | “This computer.” `localhost:5173` = frontend on your machine. `localhost:5000` = backend. |
| **Port** | Door number: 5173 vs 5000 = two different programs. |
| **Token** | Like a temporary **badge** after login. Short badge = access token (15 min). Longer stay-logged-in = refresh (cookie). |
| **Middleware** | Code that runs **before** your route, e.g. “is this user logged in?” |
| **Context (React)** | Shared info (logged-in user) available to many components without passing props everywhere. |

---

## What you do NOT need on day one

- How JWT signing math works internally  
- Every Prisma method  
- Socket.IO internals  

Start with: **user clicks → frontend calls API → backend saves → frontend shows result.**

When that chain is clear, the rest gets easier.
