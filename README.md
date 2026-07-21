# FinTracker Backend

FinTracker Backend is the REST API for the FinTracker expense management application. It handles authentication, transactions, budgets, bills, cards, savings, notifications, analytics, profile management, CSV/JSON export, and category management.

## Project Overview

- Framework: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT access token + refresh token
- API Base URL: `http://localhost:5000` or your deployed domain

## Environment Variables

Create a `.env` file in the project root with variables such as:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fintracker
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
EMAIL_FROM=FinTracker <noreply@fintracker.com>
```

## Running the Server

```bash
npm install
npm run dev
```

If you are using the production start script:

```bash
npm start
```

## Authentication

Most endpoints require a bearer token.

### Header Format

```http
Authorization: Bearer <accessToken>
```

### Common Auth Flow

1. Register or login
2. Copy `accessToken`
3. Send it in the `Authorization` header for protected routes

## API Endpoint Summary

### Health

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/` | Health check | No |

### Authentication

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login a user | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout current session | Yes |
| GET | `/api/auth/me` | Get current authenticated user | Yes |
| POST | `/api/auth/forgot-password` | Request OTP to reset password | No |
| POST | `/api/auth/reset-password` | Reset password using OTP | No |

### Bills

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/bills?filter=upcoming|overdue|paid|all` | Get bills with optional filter | Yes |
| POST | `/api/bills` | Create a bill | Yes |
| PATCH | `/api/bills/:id` | Update a bill | Yes |
| DELETE | `/api/bills/:id` | Delete a bill | Yes |

### Budgets

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/budgets` | Get all active budgets and spent totals | Yes |
| POST | `/api/budgets` | Create a budget | Yes |
| PATCH | `/api/budgets/:id` | Update a budget | Yes |
| DELETE | `/api/budgets/:id` | Delete a budget | Yes |

### Cards

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/cards` | Get all cards | Yes |
| POST | `/api/cards` | Create a card | Yes |
| PATCH | `/api/cards/:id` | Update a card | Yes |
| DELETE | `/api/cards/:id` | Delete a card | Yes |

### Categories

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/categories?type=income|expense|both` | Get categories | Yes |
| POST | `/api/categories` | Create a custom category | Yes |
| PATCH | `/api/categories/:id` | Update a category | Yes |
| DELETE | `/api/categories/:id` | Delete a category | Yes |

### Notifications

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/notifications?unread=true` | Get notifications | Yes |
| PATCH | `/api/notifications/:id/read` | Mark one notification as read | Yes |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| DELETE | `/api/notifications/:id` | Delete a notification | Yes |
| DELETE | `/api/notifications` | Clear all notifications | Yes |

### Savings

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/savings` | Get savings goals | Yes |
| POST | `/api/savings` | Create a savings goal | Yes |
| PATCH | `/api/savings/:id` | Update savings goal or contribute | Yes |
| DELETE | `/api/savings/:id` | Delete savings goal | Yes |

### Transactions

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/transactions` | List transactions with filters and pagination | Yes |
| POST | `/api/transactions` | Create a transaction | Yes |
| GET | `/api/transactions/summary` | Get income/expense summary | Yes |
| GET | `/api/transactions/:id` | Get one transaction by ID | Yes |
| PATCH | `/api/transactions/:id` | Update a transaction | Yes |
| DELETE | `/api/transactions/:id` | Soft delete a transaction | Yes |

### Analytics

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/analytics/dashboard` | Dashboard totals and balance | Yes |
| GET | `/api/analytics/chart` | Monthly income vs expense chart data | Yes |
| GET | `/api/analytics/by-category` | Expense breakdown by category | Yes |
| GET | `/api/analytics/trends` | Daily trend data for a date range | Yes |

### Export

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/export/csv` | Export transactions as CSV | Yes |
| GET | `/api/export/json` | Export transactions as JSON | Yes |

### Profile

| Method | Route | Description | Protected |
|--------|-------|-------------|-----------|
| GET | `/api/profile` | Get current profile with stats | Yes |
| PATCH | `/api/profile` | Update profile info | Yes |
| PATCH | `/api/profile/change-password` | Change password | Yes |
| DELETE | `/api/profile` | Delete account and all related data | Yes |

## Example Request Data

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Rohan",
  "email": "rohan@example.com",
  "password": "123456"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "rohan@example.com",
  "password": "123456"
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "your_refresh_token_here"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Create Transaction

```http
POST /api/transactions
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "type": "expense",
  "amount": 750,
  "currency": "BDT",
  "category": "Food",
  "account": "Cash",
  "date": "2026-07-21",
  "recurrence": "None",
  "note": "Dinner with friends",
  "tags": ["food", "weekend"]
}
```

### Get Transactions

```http
GET /api/transactions?page=1&limit=10&type=expense&category=Food&startDate=2026-07-01&endDate=2026-07-31
Authorization: Bearer <accessToken>
```

### Get Transaction Summary

```http
GET /api/transactions/summary?startDate=2026-07-01&endDate=2026-07-31
Authorization: Bearer <accessToken>
```

### Create Budget

```http
POST /api/budgets
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "category": "Food",
  "amount": 12000,
  "currency": "BDT",
  "period": "monthly",
  "month": 7,
  "year": 2026,
  "color": "#F97316",
  "icon": "Target"
}
```

### Create Bill

```http
POST /api/bills
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "name": "Internet Bill",
  "amount": 950,
  "currency": "BDT",
  "category": "Utilities",
  "dueDate": "2026-07-28",
  "recurrence": "Monthly",
  "reminderDaysBefore": 3,
  "note": "Home broadband",
  "icon": "Bell",
  "color": "#F87171"
}
```

### Create Card

```http
POST /api/cards
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "label": "City Bank Visa",
  "type": "debit",
  "last4": "4821",
  "bank": "City Bank",
  "color": "#6366F1",
  "balance": 25000,
  "currency": "BDT",
  "isDefault": true
}
```

### Create Savings Goal

```http
POST /api/savings
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "name": "Emergency Fund",
  "targetAmount": 50000,
  "currency": "BDT",
  "deadline": "2026-12-31",
  "icon": "PiggyBank",
  "color": "#4ADE80",
  "description": "Save for emergencies"
}
```

### Create Category

```http
POST /api/categories
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "name": "Gym",
  "type": "expense",
  "icon": "Dumbbell",
  "color": "#22C55E"
}
```

### Create Notification

Notifications are usually created internally by the application, but you can also seed them using the notification model or by triggering related flows.

## Example Response Shapes

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

## Postman Testing Setup

1. Open Postman.
2. Create a new request.
3. Set the request type to `GET` or `POST`.
4. Enter the endpoint URL.
5. In the `Headers` tab, add:
   - `Content-Type: application/json`
   - `Authorization: Bearer <accessToken>` for protected routes
6. In the `Body` tab, choose `raw` and send a JSON body.

## Notes

- Authenticated routes use the JWT `accessToken` returned from `/api/auth/login`.
- Refresh tokens are returned on login/register and can be used through `/api/auth/refresh`.
- Transaction deletion is soft-delete, so the record is marked deleted instead of being permanently removed.
- The backend uses `isDeleted` and `isActive` flags for soft cleanup and account state.

## Suggested Test Sequence

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. `POST /api/categories`
5. `POST /api/transactions`
6. `GET /api/transactions`
7. `GET /api/transactions/summary`
8. `POST /api/budgets`
9. `POST /api/bills`
10. `POST /api/savings`
11. `GET /api/analytics/dashboard`

