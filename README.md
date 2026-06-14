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

Server runs on `http://localhost:3001`.

## Testing with Postman

### 1. Register a user

```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{"name": "Test User", "email": "test@example.com", "password": "password123"}
```

Response includes `accessToken` and `refreshToken` in the body.

### 2. Login

```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{"email": "admin@example.com", "password": "password123"}
```

### 3. Access protected routes

Set `Authorization: Bearer <accessToken>` header on requests.

### 4. Refresh tokens

```
POST http://localhost:3001/api/auth/refresh
```

Requires the `refresh_token` cookie from login.

### 5. Password reset

```
POST http://localhost:3001/api/password/forgot
Content-Type: application/json

{"email": "john@example.com"}
```

Check the server console for the reset link (dev mode), then:

```
POST http://localhost:3001/api/password/reset
Content-Type: application/json

{"token": "<reset-token>", "password": "newpassword123"}
```

### Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| john@example.com | password123 | user |
| jane@example.com | password123 | user |
| bob@example.com | password123 | user |
