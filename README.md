# FinTracker Backend

## Project

FinTracker Backend provides a REST API for expense tracking, authentication, and bill management.

## Endpoints

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/` | Health check | No |
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login existing user | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| POST | `/api/auth/forgot-password` | Request password reset OTP | No |
| POST | `/api/auth/reset-password` | Reset password with OTP | No |
| GET | `/api/bills` | Get all bills | Yes |
| POST | `/api/bills` | Create a new bill | Yes |
| PATCH | `/api/bills/:id` | Update a bill | Yes |
| DELETE | `/api/bills/:id` | Delete a bill | Yes |
