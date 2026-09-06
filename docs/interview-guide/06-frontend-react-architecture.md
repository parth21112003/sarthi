# 06 — Frontend React Architecture

## Entry and provider tree

```text
main.jsx
  └─ App.jsx
       BrowserRouter
       └─ AuthProvider
            └─ SocketProvider
                 ├─ Toaster (react-hot-toast)
                 └─ AppRoutes (Suspense + lazy pages)
```

**Order matters:** `SocketProvider` is inside `AuthProvider` because it reads `accessToken` and `isAuthenticated`.

## Routing

**File:** `AppRoutes.jsx`

| Type | Paths |
|------|--------|
| Public | `/`, `/login`, `/signup` |
| Student (protected) | `/student/dashboard`, `counselors`, `counselors/:id`, `meetings`, `messages`, `community`, `aptitude`, `profile` |
| Counselor (protected) | `/counselor/dashboard`, `schedule`, `meetings`, `messages`, `profile` |
| Fallback | `*` → NotFound |

**Code splitting:** each page is `lazy(() => import(...))` with shared `<Spinner />` fallback.

**Shared pages:** `Meetings`, `Messages`, `Profile` serve both roles; behavior adapts via `user.role` and API responses.

## Auth state

**File:** `context/AuthContext.jsx`

- `useReducer` with states: `user`, `accessToken`, `loading`, `isAuthenticated`.
- Actions: `LOGIN_SUCCESS`, `LOGOUT`, `SET_LOADING`, `UPDATE_USER`.
- Exposed methods: `login`, `register`, `logout`, `updateProfile`.

**Token storage split:**

| Store | Holds | Used by |
|-------|-------|---------|
| React state | user, accessToken | UI, SocketProvider |
| `tokenStore.js` module | accessToken variable | Axios interceptors |

Login writes both; logout clears both; refresh writes both via `authService.refreshToken`.

## HTTP layer

**File:** `services/api.js`

- `baseURL`: `import.meta.env.VITE_API_URL || 'http://localhost:5000'`
- `withCredentials: true` for refresh cookie
- Request interceptor: attach Bearer from `getAccessToken()`
- Response interceptor: on 401, single retry via `/api/auth/refresh`, then replay request

**Domain services** (thin wrappers — good separation for interviews):

| Service | Backend prefix |
|---------|----------------|
| `authService` | `/api/auth` |
| `userService` | `/api/users` |
| `counselorService` | `/api/counselors` |
| `meetingService` | `/api/meetings` |
| `chatService` | `/api/chats` |
| `notificationService` | `/api/notifications` |
| `communityService` | `/api/community` |
| `aptitudeService` | `/api/aptitude` |
| `ratingService` | `/api/ratings` |
| `dashboardService` | `/api/dashboard` |

Pages should call services, not raw Axios (mostly followed).

## Layout system

**DashboardLayout** wraps authenticated pages:

- **Navbar** — branding, mobile menu, **NotificationBell**
- **Sidebar** — role-specific links (`Sidebar.jsx`)
- Main content area

CSS split: global `styles/index.css`, page CSS (`Dashboard.css`, `Phase2.css`, `Phase4.css`, etc.), component-scoped CSS files.

## Reusable components (design system lite)

Under `components/common/`:

- `Button`, `Input`, `Card`, `Modal`, `Avatar`, `Badge`, `EmptyState`, `Spinner`

Pattern: presentational components + CSS co-located. No Storybook in repo.

## Key pages (what each does)

| Page | Student | Counselor |
|------|---------|-----------|
| `Landing.jsx` | Marketing / CTA to login | Same |
| `Login` / `Signup` | Auth forms | Same |
| `StudentDashboard` / `CounselorDashboard` | Summary cards from dashboard API | Same |
| `CounselorDirectory` | Search/filter list | N/A |
| `CounselorProfile` | Book meeting, message counselor | N/A |
| `Meetings` | List + cancel + rate modal | Accept/reject/complete |
| `CounselorSchedule` | N/A | Edit weekly slots |
| `Messages` | Chat UI | Chat UI |
| `Community` | Posts feed | Can participate if routed (student route only today) |
| `AptitudeTest` | Questions + submit + history | N/A |
| `Profile` | Edit profile | Edit profile |

**Note:** Community and Aptitude routes are under student protected routes only.

## User feedback

- **react-hot-toast** for success/error on actions (styled dark theme in `App.jsx`).
- Loading states with `Spinner` and `EmptyState` when lists are empty.

## ProtectedRoute behavior (frontend security)

This is **UI-level** protection only. Real enforcement is on the server. Interviewers expect you to say both layers exist.

Redirect wrong role to their dashboard — prevents counselor from bookmarking `/student/dashboard`.

## State management choice

No Redux/Zustand — **Context + local useState** per page.

**Why it's enough:** auth and socket are global; feature state (chats, posts) is page-local.

**If app grew:** React Query for server cache, or Zustand for chat unread counts globally.

## Vite configuration

`vite.config.js`: React plugin, dev server port **5173**. No proxy — frontend calls full API URL (CORS on backend).

## Build

`npm run build` → static assets in `dist/`. Preview with `vite preview`.

## Styling approach

CSS variables for dark/glass theme (`--bg-dark`, `--glass-border`). Lucide icons for consistent iconography.

## Placeholder navigation items

Sidebar links without routes in `AppRoutes.jsx`:

- Student: `/student/careers`
- Counselor: `/counselor/notes`, `/counselor/analytics`

Clicking them hits **NotFound** — mention as incomplete UX.

## Frontend file to trace for “how does X work?”

| Feature | Start here |
|---------|------------|
| Login UI | `pages/Login.jsx` + `AuthContext` |
| Counselor search | `pages/CounselorDirectory.jsx` + `counselorService` |
| Book meeting | `pages/CounselorProfile.jsx` + `meetingService.create` |
| Real-time chat | `pages/Messages.jsx` |
| Notifications UI | `components/notifications/NotificationBell.jsx` |
| Aptitude | `pages/AptitudeTest.jsx` |
| Community | `pages/Community.jsx` |

## Common interview question: “Why React Router nested routes?”

`ProtectedRoute` as layout route with `<Outlet />` avoids duplicating auth check on every student/counselor child route — one guard, many pages.
