# Where Code Lives (Beginner Map)

When someone says “where is login?” — open these files.

## “User clicks Login”

| Step | File |
|------|------|
| Form on screen | `frontend-new/src/pages/Login.jsx` |
| Calls login API | `frontend-new/src/services/authService.js` |
| Adds token to requests | `frontend-new/src/services/api.js` + `tokenStore.js` |
| Saves user in app state | `frontend-new/src/context/AuthContext.jsx` |
| Server login logic | `backend-new/src/controllers/auth.controller.js` |
| URL `/api/auth/login` | `backend-new/src/routes/auth.routes.js` |
| Check password | same controller + `bcrypt` |
| User table definition | `backend-new/prisma/schema.prisma` → model `User` |

## “Which page is this URL?”

Open **`frontend-new/src/AppRoutes.jsx`**.

Examples:

- `/student/meetings` → `Meetings.jsx`  
- `/counselor/schedule` → `CounselorSchedule.jsx`  

## “Who can see this page?”

**`frontend-new/src/components/auth/ProtectedRoute.jsx`**

## Layout (sidebar + top bar)

**`frontend-new/src/components/layout/DashboardLayout.jsx`**  
Sidebar links: **`Sidebar.jsx`**

## Backend: “where is feature X?”

Pattern is always:

```text
routes/xxx.routes.js   →  controllers/xxx.controller.js
```

| Feature | Controller file |
|---------|-----------------|
| Meetings | `meeting.controller.js` |
| Chat | `chat.controller.js` |
| Counselors | `counselor.controller.js` |
| Community | `community.controller.js` |
| Aptitude | `aptitude.controller.js` |
| Ratings | `rating.controller.js` |
| Notifications | `notification.controller.js` + `services/notification.service.js` |
| Dashboard stats | `dashboard.controller.js` |

## Live chat connection

| Part | File |
|------|------|
| Server sockets | `backend-new/src/socket/index.js` |
| Client connects after login | `frontend-new/src/context/SocketContext.jsx` |
| Chat screen | `frontend-new/src/pages/Messages.jsx` |

## Server starts here

**`backend-new/src/server.js`** — loads routes, CORS, Socket.IO, error handler.

## App starts here

**`frontend-new/src/main.jsx`** → **`App.jsx`** → **`AppRoutes.jsx`**

## Learning path inside the repo

1. Read **`AppRoutes.jsx`** — see all screens.  
2. Pick one page (e.g. `Login.jsx`) — see what service it calls.  
3. Open that **service** — see URL path.  
4. Open **route + controller** on backend — see database calls (`prisma....`).

That’s the whole loop. Every feature repeats this loop.

## Docs in this repo

| Folder | For whom |
|--------|----------|
| **`docs/beginner-guide/`** (you are here) | New to web dev / this stack |
| **`docs/interview-guide/`** | Deep technical + interview Q&A |
| **`progress-reports/`** | What was built each phase |
| **`README.md`** (root) | Run instructions + feature list |

Start beginner → when comfortable, read interview guide file **01** and **07** only, then go deeper as needed.
