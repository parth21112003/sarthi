# 02 — Authentication and Security

## Strategy overview

Sarthi uses a **dual-token** pattern common in SPAs:

| Token | Lifetime | Storage | Used for |
|-------|----------|---------|----------|
| **Access token** (JWT) | 15 minutes | Browser **memory** (`tokenStore.js`) + React `AuthContext` | `Authorization: Bearer` on API calls; Socket.IO `auth.token` |
| **Refresh token** (JWT) | 7 days | **httpOnly cookie** `refreshToken` + copy in `User.refreshToken` column | `POST /api/auth/refresh` only |

### Why this split?

- **Access token in memory** reduces XSS impact compared to storing it in `localStorage` (older Sarthi frontend did store user data in localStorage).
- **Refresh token in httpOnly cookie** is not readable by JavaScript, so stolen XSS scripts cannot easily exfiltrate long-lived sessions.
- **Refresh token also stored in DB** allows **server-side invalidation** on logout and detection of token reuse (compared cookie/body token to DB value).

## Registration flow

**Endpoint:** `POST /api/auth/register`  
**Validation:** `registerValidation` in `middleware/validate.js` (email, password min 6, name, role in student/counselor/counsellor).

**Controller steps** (`auth.controller.js`):

1. Reject duplicate email (400).
2. `bcrypt.hash(password, 12)`.
3. Normalize role: `counsellor` → `counselor`.
4. Create `User` with role-specific fields (`specialization`, `experience` for counselors).
5. Generate access + refresh JWTs.
6. Save refresh token string on user row.
7. Set cookie: `httpOnly`, `sameSite: 'lax'`, `secure` in production, 7-day `maxAge`.
8. Return `{ accessToken, user }` without password or refresh token in JSON.

**Frontend:** `Signup.jsx` → `AuthContext.register` → `authService.registerUser`. Context stores user + accessToken.

**Implementation note:** `loginUser` calls `setAccessToken()` in `tokenStore`; `registerUser` currently returns the token but does not call `setAccessToken`. After signup, **REST calls** that rely on the Axios interceptor may fail until refresh runs (page reload triggers `initAuth` → refresh cookie works). Socket uses `accessToken` from context, so it may still connect. Good interview detail if asked about edge cases.

## Login flow

1. Find user by email; generic `Invalid credentials` for missing user or bad password (avoid user enumeration in message, though timing could still leak).
2. Same token + cookie issuance as register.
3. Frontend `setAccessToken` + `LOGIN_SUCCESS`.

## Session restore on page load

`AuthContext` `useEffect` on mount:

```text
authService.refreshToken() → POST /api/auth/refresh (cookie sent automatically)
  → if success: LOGIN_SUCCESS with new accessToken + user
  → if fail: LOGOUT
```

User stays logged in across refreshes **as long as refresh cookie is valid** and matches DB.

## Refresh flow

**Endpoint:** `POST /api/auth/refresh` (no Bearer header required; uses cookie).

1. Read `refreshToken` from `req.cookies`.
2. `verifyRefreshToken` with `JWT_REFRESH_SECRET`.
3. Load user; require `user.refreshToken === cookie token` (invalid if logout cleared DB or token rotated elsewhere).
4. Issue **new access token only** (refresh token not rotated on each refresh in current code).
5. Return `{ accessToken, user }`.

## Logout flow

1. If cookie present, try verify refresh JWT (ignore verify errors).
2. If decoded, set `User.refreshToken = null`.
3. `clearCookie('refreshToken')`.
4. Frontend `clearAccessToken()` and `LOGOUT`.

Expired refresh on logout does not crash the server (try/catch around verify).

## Protected API middleware

```javascript
// middleware/auth.js
authenticate → Bearer JWT → req.user = { id, email, role }
authorize(roles) → optional role array → 403 if mismatch
```

Most routes only use `authenticate`; role checks are **inline in controllers** (e.g. only students book meetings).

## Protected frontend routes

`ProtectedRoute.jsx`:

1. While `loading`, show full-page spinner (during initial refresh).
2. If not authenticated → `/login`.
3. If `role` prop set and `user.role` differs → redirect to `/${user.role}/dashboard`.
4. Else render `<Outlet />` for nested routes.

Nested structure in `AppRoutes.jsx`:

```text
<Route element={<ProtectedRoute role="student" />}>
  <Route path="/student/dashboard" ... />
  ...
</Route>
```

## Socket.IO authentication

Separate from Express middleware:

1. Client connects with `auth: { token: accessToken }`.
2. Server `io.use` hook verifies access JWT (same secret as REST).
3. On failure: connection rejected with `Authentication error`.
4. On success: `socket.user = decoded`, join room `user:{id}`.

If access token expires, socket may disconnect; client reconnects when `SocketProvider` gets new token from refresh (depends on user action or 401 retry).

## Password security

- bcrypt with cost factor **12** (adjust for production load vs security).
- Passwords never returned in API responses (destructured out).

## Input validation

- Auth: express-validator on register/login.
- Many other endpoints validate in controller (trim strings, numeric IDs, role checks).

## Error handler and auth errors

`errorHandler.js` maps `JsonWebTokenError` / `TokenExpiredError` to 401. Prisma unique violation `P2002` → 409.

## Security topics for interviews (and current status)

| Topic | Status in Sarthi 2.0 |
|-------|----------------------|
| HTTPS in production | Required for `secure` cookies |
| CSRF on refresh cookie | `sameSite: 'lax'` helps; state-changing APIs use Bearer header (not cookie auth for API) |
| Rate limiting login | Dependency present, **not applied** in server yet |
| XSS | React escapes by default; avoid `dangerouslySetInnerHTML` (project follows this) |
| Authorization on chat/meetings | Participant/owner checks in controllers |
| IDOR on profiles | `GET /api/users/profile/:id` requires authenticate — any logged-in user can read profiles (acceptable for directory-style app) |

## JWT payload shape

**Access:** `{ id, email, role }`  
**Refresh:** `{ id }` only — less exposure if leaked.

## Talking point: “How would you improve auth?”

- Rotate refresh token on each refresh and detect reuse.
- Wire rate limiting on `/api/auth/login` and `/api/auth/register`.
- Fix register → `setAccessToken` parity with login.
- Optional: email verification, password reset, OAuth.
- Move to refresh token family stored hashed in DB.
