# FinTracker Pro — Backend API 🚀

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Vercel-Deployed-black.svg)](https://api-fintrackerpro.vercel.app)

**FinTracker Pro Backend** is a feature-rich, secure, and production-ready RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. It serves as the core engine for the FinTracker expense management application, powering user authentication, transaction handling, budget tracking, bill management, credit/debit card tracking, savings goal management, custom category organization, analytics, notifications, and data exports.

---

## 🌟 Key Features

- **🔐 Robust Authentication & Security**:
  - Secure JWT authentication using dual token architecture (Short-lived Access Token + Long-lived Refresh Token).
  - Password hashing with `bcryptjs`.
  - Password reset via Email & 6-digit OTP powered by `nodemailer`.
  - Security headers via `helmet` and IP rate-limiting with `express-rate-limit`.
  - CORS security configured for frontend development and production environments.

- **💸 Transaction Management**:
  - Full CRUD for income and expense transactions.
  - Advanced filtering (type, category, date range), search, and pagination.
  - Soft deletion support (`isDeleted` flag) to preserve historic integrity.
  - Instant transaction summaries and aggregations.

- **🎯 Budgets & Savings Goals**:
  - Category-based budget creation (monthly/yearly) with target spending limits and auto-calculated spent progress.
  - Savings goals with target deadlines, progress tracking, and contributions.

- **🔔 Bills & Reminders**:
  - Track upcoming, overdue, and paid bills with customizable reminder days.
  - Real-time notification creation for bill alerts and activity updates.

- **💳 Cards & Accounts Management**:
  - Manage multiple bank cards, credit cards, and debit accounts with balances and currency preference.

- **📊 Comprehensive Analytics**:
  - Dashboard analytics overview (total balance, total income, total expenses, net savings rate).
  - Monthly income vs. expense chart data.
  - Expense breakdown by category.
  - Daily trend calculations over custom date ranges.

- **📁 Data Export**:
  - One-click export of transaction history to CSV and JSON formats.

- **👥 Public Directory & Profiles**:
  - User profiles with total activity statistics.
  - Public directory listing for user discoverability.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5.x)
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation**: `express-validator`
- **Email Service**: `nodemailer` (SMTP / Gmail)
- **Security**: `helmet`, `express-rate-limit`, `cors`
- **Deployment**: Vercel Serverless Functions / Node.js Host

---

## 📂 Directory Structure

```text
FinTracker-backend/
├── .env                  # Local environment configuration
├── .gitignore            # Git ignore rules
├── LICENSE               # ISC License
├── README.md             # Project documentation
├── package.json          # Node.js dependencies and scripts
├── server.js             # Server entry point & DB connection initialization
├── vercel.json           # Vercel deployment configuration
└── src/
    ├── app.js            # Express application setup, security, and middleware
    ├── config/
    │   └── db.js         # MongoDB connection configuration
    ├── controllers/      # Route handler logic (auth, transactions, budgets, etc.)
    ├── middleware/       # Custom middleware (auth, validate, errorHandler)
    ├── models/           # Mongoose database schemas (User, Transaction, Budget, etc.)
    └── routes/           # Express router endpoints
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on the following template:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/fintracker

# JWT Authentication Secrets & Expirations
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email SMTP Settings (for Password Reset & OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=FinTracker <noreply@fintracker.com>
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **MongoDB** (Local instance or MongoDB Atlas connection string)
- **npm** or **yarn**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/FinTracker-backend.git
   cd FinTracker-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env` file in the project root and populate it as shown in the [Environment Variables](#️-environment-variables) section.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production execution:
   ```bash
   npm start
   ```

The API server will run at `http://localhost:5000` by default.

---

## 🔒 Authentication Flow

Most endpoints are protected and require a Bearer token in the `Authorization` header.

### Header Format

```http
Authorization: Bearer <accessToken>
```

### Flow Checklist:
1. Register (`POST /api/auth/register`) or Login (`POST /api/auth/login`).
2. Receive `accessToken` and `refreshToken` in the response.
3. Attach `Bearer <accessToken>` to headers for subsequent protected requests.
4. When `accessToken` expires, call `POST /api/auth/refresh` with your `refreshToken` to acquire a new access token without requiring re-login.

---

## 📑 API Endpoint Summary

### Base & Health Check
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/` | API Health & status check | No |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Login user & issue access/refresh tokens | No |
| `POST` | `/api/auth/refresh` | Obtain a new access token using refresh token | No |
| `POST` | `/api/auth/logout` | Invalidate/logout current user session | Yes |
| `GET`  | `/api/auth/me` | Fetch authenticated user profile details | Yes |
| `POST` | `/api/auth/forgot-password` | Send 6-digit OTP for password reset | No |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | No |

### Users Directory (`/api/users`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/users` | List all public user profiles | No |
| `GET` | `/api/users/:username` | Fetch specific user public profile by username | No |

### User Profile (`/api/profile`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/profile` | Get logged-in user profile & account stats | Yes |
| `PATCH`  | `/api/profile` | Update profile information (name, avatar, currency) | Yes |
| `PATCH`  | `/api/profile/change-password` | Change current password | Yes |
| `DELETE` | `/api/profile` | Permanently delete account and all associated data | Yes |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/transactions` | List transactions (filtering, search, pagination) | Yes |
| `POST`   | `/api/transactions` | Create a new income or expense transaction | Yes |
| `GET`    | `/api/transactions/summary` | Get income/expense total summary | Yes |
| `GET`    | `/api/transactions/:id` | Fetch single transaction details by ID | Yes |
| `PATCH`  | `/api/transactions/:id` | Update transaction record | Yes |
| `DELETE` | `/api/transactions/:id` | Soft delete a transaction | Yes |

### Budgets (`/api/budgets`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/budgets` | Fetch active budgets with spent total calculations | Yes |
| `POST`   | `/api/budgets` | Set a category budget limit | Yes |
| `PATCH`  | `/api/budgets/:id` | Update budget details or limit | Yes |
| `DELETE` | `/api/budgets/:id` | Delete budget | Yes |

### Bills (`/api/bills`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/bills` | Fetch bills (filter: `upcoming`, `overdue`, `paid`, `all`) | Yes |
| `POST`   | `/api/bills` | Create a bill reminder | Yes |
| `PATCH`  | `/api/bills/:id` | Update bill status or details | Yes |
| `DELETE` | `/api/bills/:id` | Delete a bill | Yes |

### Cards & Accounts (`/api/cards`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/cards` | List all saved cards/accounts | Yes |
| `POST`   | `/api/cards` | Add new debit/credit card or bank account | Yes |
| `PATCH`  | `/api/cards/:id` | Update card information | Yes |
| `DELETE` | `/api/cards/:id` | Delete card record | Yes |

### Savings Goals (`/api/savings`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/savings` | Get all savings goals | Yes |
| `POST`   | `/api/savings` | Create a new savings goal | Yes |
| `PATCH`  | `/api/savings/:id` | Update savings goal or contribute funds | Yes |
| `DELETE` | `/api/savings/:id` | Delete savings goal | Yes |

### Categories (`/api/categories`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/categories` | Get custom & default categories (`type=income\|expense\|both`) | Yes |
| `POST`   | `/api/categories` | Create custom category | Yes |
| `PATCH`  | `/api/categories/:id` | Edit custom category | Yes |
| `DELETE` | `/api/categories/:id` | Remove custom category | Yes |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET`    | `/api/notifications` | Get notifications (`?unread=true` filter optional) | Yes |
| `PATCH`  | `/api/notifications/:id/read` | Mark single notification as read | Yes |
| `PATCH`  | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| `DELETE` | `/api/notifications/:id` | Remove specific notification | Yes |
| `DELETE` | `/api/notifications` | Clear all notifications | Yes |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Dashboard totals, net balance, and savings overview | Yes |
| `GET` | `/api/analytics/chart` | Monthly income vs. expense chart series | Yes |
| `GET` | `/api/analytics/by-category` | Category-wise expense breakdown statistics | Yes |
| `GET` | `/api/analytics/trends` | Daily cash flow trend data over custom range | Yes |

### Data Export (`/api/export`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/export/csv` | Download transaction records as `.csv` file | Yes |
| `GET` | `/api/export/json` | Download transaction records as structured JSON | Yes |

---

## 📝 Example Request & Response Payloads

### 1. User Registration (`POST /api/auth/register`)

**Request Payload**:
```json
{
  "name": "Rohan",
  "email": "rohan@example.com",
  "password": "SecurePassword123"
}
```

**Response Payload**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "66a01b2c3d4e5f6a7b8c9d0e",
      "name": "Rohan",
      "email": "rohan@example.com",
      "currency": "BDT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

### 2. Create Transaction (`POST /api/transactions`)

**Request Payload**:
```json
{
  "type": "expense",
  "amount": 750,
  "currency": "BDT",
  "category": "Food",
  "account": "Cash",
  "date": "2026-07-25",
  "recurrence": "None",
  "note": "Weekend dinner with friends",
  "tags": ["food", "weekend"]
}
```

**Response Payload**:
```json
{
  "success": true,
  "data": {
    "_id": "66a02c3d4e5f6a7b8c9d0e1f",
    "user": "66a01b2c3d4e5f6a7b8c9d0e",
    "type": "expense",
    "amount": 750,
    "currency": "BDT",
    "category": "Food",
    "account": "Cash",
    "date": "2026-07-25T00:00:00.000Z",
    "recurrence": "None",
    "note": "Weekend dinner with friends",
    "tags": ["food", "weekend"],
    "isDeleted": false,
    "createdAt": "2026-07-25T02:59:30.000Z",
    "updatedAt": "2026-07-25T02:59:30.000Z"
  }
}
```

---

### 3. Create Budget (`POST /api/budgets`)

**Request Payload**:
```json
{
  "category": "Food",
  "amount": 12000,
  "currency": "BDT",
  "period": "monthly",
  "month": 7,
  "year": 2026,
  "color": "#F97316",
  "icon": "Utensils"
}
```

---

### 4. Response Conventions

All API endpoints strictly adhere to uniform JSON responses:

**Success Standard**:
```json
{
  "success": true,
  "message": "Optional descriptive success message",
  "data": {}
}
```

**Error Standard**:
```json
{
  "success": false,
  "message": "Error description or validation message",
  "errors": []
}
```

---

## 🌐 Deployment (Vercel)

This repository is configured for serverless deployment on **Vercel** via `vercel.json`.

1. Install Vercel CLI or connect your Git repository to Vercel.
2. Configure Environment Variables in the Vercel project settings matching `.env`.
3. Deploy:
   ```bash
   vercel --prod
   ```

Live API Base URL: `https://api-fintrackerpro.vercel.app`

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

