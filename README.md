# Task 02 - Authentication System

A secure JWT-based authentication system built with Express.js, SQLite, and HTTP-only cookies. Supports register, login, logout, token refresh, and password reset flows with role-based access control.

## Features

- **JWT Authentication** - Access tokens (15min) + Refresh tokens (7d)
- **HTTP-only Cookies** - Tokens stored securely, inaccessible to JavaScript
- **Bearer Header Support** - Also supports `Authorization: Bearer` for Postman/API clients
- **Password Reset** - Tokenized reset flow with expiry
- **Role-Based Access** - Admin and user roles with middleware guards
- **Input Validation** - Zod schema validation with descriptive error messages
- **Rate Limiting** - Separate limits for auth endpoints and password reset
- **Security** - Helmet headers, CORS, HTTP-only cookies with SameSite
- **Logging** - Morgan request logging

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT (jsonwebtoken + bcryptjs + crypto)
- **Cookies:** cookie-parser (HTTP-only, SameSite)
- **Validation:** Zod
- **Security:** Helmet, express-rate-limit, CORS

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, receive JWT tokens |
| POST | `/api/auth/logout` | Yes | Logout, invalidate refresh token |
| POST | `/api/auth/refresh` | No (cookie) | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Password Reset

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/password/forgot` | No | Request password reset link |
| POST | `/api/password/reset` | No | Reset password with token |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List users (`?search=`, `?page=`, `?limit=`) |
| GET | `/api/users/:id` | Yes | Get user by ID |
| PUT | `/api/users/:id` | Admin/self | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env - set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

# Seed the database
npm run seed

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`.

## Testing with Postman

### Setup
1. Open Postman, create a new collection called "Auth System"
2. **Seed users first:** `npm run seed` (creates admin + 3 users)

### Flow
1. Login/Register to receive tokens in the response body
2. Copy the `accessToken` from the response
3. For protected endpoints: go to **Authorization** tab, select **Bearer Token**, paste the token
4. For requests with a body: go to **Body** tab, select **raw** and **JSON**

### Postman Request Table

| Method | URL | Auth | Body (raw JSON) |
|--------|-----|------|-----------------|
| `POST` | `http://localhost:5000/api/auth/register` | None | `{"name":"Test User","email":"test@example.com","password":"password123"}` |
| `POST` | `http://localhost:5000/api/auth/login` | None | `{"email":"admin@example.com","password":"password123"}` |
| `POST` | `http://localhost:5000/api/auth/logout` | Bearer Token | — |
| `POST` | `http://localhost:5000/api/auth/refresh` | Cookie only | — |
| `GET` | `http://localhost:5000/api/auth/me` | Bearer Token | — |
| `POST` | `http://localhost:5000/api/password/forgot` | None | `{"email":"john@example.com"}` |
| `POST` | `http://localhost:5000/api/password/reset` | None | `{"token":"<from-server-console>","password":"newpassword123"}` |
| `GET` | `http://localhost:5000/api/users` | Bearer Token (admin) | — |
| `GET` | `http://localhost:5000/api/users?search=john&page=1&limit=5` | Bearer Token (admin) | — |
| `GET` | `http://localhost:5000/api/users/1` | Bearer Token | — |
| `PUT` | `http://localhost:5000/api/users/1` | Bearer Token | `{"name":"Updated Name"}` |
| `DELETE` | `http://localhost:5000/api/users/5` | Bearer Token (admin) | — |

> **Note:** The `/api/auth/refresh` endpoint uses HTTP-only cookies. In Postman, cookies are handled automatically — just login first and the refresh cookie will be stored.
>
> **Password reset:** In dev mode, the reset link is printed in the server console. Copy the token from the URL and use it in the `/reset` endpoint.

### Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| john@example.com | password123 | user |
| jane@example.com | password123 | user |
| bob@example.com | password123 | user |
