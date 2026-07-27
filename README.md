# FinTracker Pro — Backend API 🚀

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-v22.x-purple.svg)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Vercel-Deployed-black.svg)](https://api-fintrackerpro.vercel.app)

**FinTracker Pro Backend** is a feature-rich, high-performance, secure RESTful API built using **Node.js**, **Express.js (v5)**, and **MongoDB (Mongoose)**. It serves as the enterprise backend engine powering the FinTracker Pro financial ecosystem — including multi-currency transaction management, budget control, savings goals, investment portfolio tracking, tax deduction management, Stripe subscriptions, 2FA security, support tickets, and analytics.

---

## 🌟 Key Features

- **🔐 Dual-Token Auth & 2-Factor Security**:
  - Short-lived JWT Access Tokens + Long-lived Refresh Tokens.
  - Password hashing with `bcryptjs`.
  - 2FA (Two-Factor Authentication) OTP verification flow.
  - Password reset via 6-digit OTP email powered by `nodemailer`.
  - Security headers via `helmet` and IP rate-limiting (`express-rate-limit`).

- **💸 Transaction Engine**:
  - Full CRUD operations for income and expense transactions.
  - Advanced search, date range filtering, category/type filtering, and pagination.
  - Soft deletion support (`isDeleted` flag) for transactional history auditability.
  - Real-time financial summary aggregations.

- **🎯 Budgets & Savings Goals**:
  - Category-based monthly and yearly budget planning with active expense tracking.
  - Savings goals with target limits, contribution deposits, and deadline tracking.

- **📊 Investment Portfolio & Asset Tracking**:
  - Track stocks, crypto, mutual funds, real estate, and bonds.
  - Total portfolio valuation, purchase price tracking, and return on investment (ROI) metrics.

- **🧾 Tax Management & Deductions**:
  - Dedicated tax deduction tracking and financial year tax expense estimates.

- **💳 Stripe Payments & Subscriptions**:
  - Integrated Stripe checkout sessions for premium plan billing.
  - Subscription status tracking and transaction receipt histories.

- **🔔 Bills & Intelligent Notifications**:
  - Upcoming, overdue, and paid bill tracker with customizable reminders.
  - In-app real-time notifications for system alerts, payments, and bill due dates.

- **🎧 Support Tickets & Public Contact Form**:
  - Help Desk tickethub with threaded replies between members and support admins.
  - Public contact message ingestion and administrative reply system.

- **📈 Analytics & Financial Reporting**:
  - Dashboard analytics (net cashflow, monthly trends, category spending distribution).
  - Downloadable financial summary reports.
  - Instant raw data exports to **CSV** and **JSON** formats.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: [Node.js](https://nodejs.org/) (v18+ recommended)
- **Framework**: [Express.js](https://express.js.org/) (v5.x)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ORM
- **Authentication**: `jsonwebtoken`, `bcryptjs`
- **Validation**: `express-validator`
- **Email Delivery**: `nodemailer` (SMTP / Gmail Integration)
- **Payment Processing**: `stripe` SDK
- **Security & Middleware**: `helmet`, `express-rate-limit`, `cors`, `dotenv`
- **Deployment Platform**: Vercel Serverless Functions / Node.js Server Environment

---

## 📂 Directory Structure

```text
FinTracker-backend/
├── .env                  # Local environment configuration (git-ignored)
├── .env.example          # Template for environment configuration
├── .gitignore            # Git exclusion rules
├── LICENSE               # ISC License file
├── README.md             # Project documentation
├── package.json          # Node.js dependencies and script definitions
├── server.js             # Entry point & MongoDB connection setup
├── vercel.json           # Vercel serverless build & route rules
└── src/
    ├── app.js            # Express app init, middleware, CORS & security
    ├── config/
    │   └── db.js         # Mongoose connection logic
    ├── controllers/      # Route controllers (auth, transactions, budgets, etc.)
    ├── middleware/       # Custom middleware (auth guard, validation, error handler)
    ├── models/           # Mongoose schemas (User, Transaction, Investment, etc.)
    └── routes/           # Express router endpoints
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the project using the template below:

```env
# Server Port
PORT=5000

# Frontend URL (For CORS whitelist)
CLIENT_URL=http://localhost:3000

# MongoDB Database Connection String
MONGO_URI=mongodb://127.0.0.1:27017/fintrackerpro

# JWT Authentication Configuration
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_REFRESH_EXPIRES=7d

# Stripe Payment Gateway Credentials
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email SMTP Settings (For 2FA, OTP & Password Reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=FinTracker Pro <noreply@fintracker.com>
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **MongoDB** (Local database or MongoDB Atlas cluster connection)
- **npm** (or `yarn` / `pnpm`)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/FinTracker-backend.git
   cd FinTracker-backend
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment settings**:
   Copy `.env.example` to `.env` and fill in your database credentials and secret keys.
   ```bash
   cp .env.example .env
   ```

4. **Launch development server** (with auto-reload via `nodemon`):
   ```bash
   npm run dev
   ```

5. **Launch production server**:
   ```bash
   npm start
   ```

The backend server will run on `http://localhost:5000` by default.

---

## 🔒 Authentication Flow

Most endpoints require a valid JSON Web Token sent via the `Authorization` header.

### Request Header Format
```http
Authorization: Bearer <accessToken>
```

### Auth Lifecycle:
1. **Login/Register**: Request `/api/auth/login` or `/api/auth/register`.
2. **2FA Verification**: If 2FA is enabled on the account, complete `/api/auth/login/2fa-verify` using the temporary token and OTP code.
3. **Token Storage**: Save `accessToken` and `refreshToken`.
4. **Token Refreshing**: When requests fail with `401 Unauthorized`, request a new access token via `POST /api/auth/refresh` passing `{ refreshToken }`.

---

## 📑 Complete API Endpoint Reference

### 🌐 Base & System Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | API status health check | ❌ Public |

---

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ Public |
| `POST` | `/api/auth/login` | Login user & issue tokens | ❌ Public |
| `POST` | `/api/auth/login/2fa-verify` | Verify 2FA code during login | ❌ Public |
| `POST` | `/api/auth/refresh` | Issue new access token using refresh token | ❌ Public |
| `POST` | `/api/auth/logout` | Logout and invalidate session | 🔒 Auth |
| `GET`  | `/api/auth/me` | Fetch authenticated user data | 🔒 Auth |
| `POST` | `/api/auth/change-password` | Update account password | 🔒 Auth |
| `POST` | `/api/auth/2fa/enable` | Enable 2FA authentication | 🔒 Auth |
| `POST` | `/api/auth/2fa/disable` | Disable 2FA authentication | 🔒 Auth |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP email | ❌ Public |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | ❌ Public |

---

### 👤 Profile & User Directory (`/api/profile` & `/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/profile` | Get full user profile and account statistics | 🔒 Auth |
| `PATCH`  | `/api/profile` | Update profile information | 🔒 Auth |
| `DELETE` | `/api/profile` | Delete user account and linked data | 🔒 Auth |
| `GET`    | `/api/users` | List public user profiles | ❌ Public |
| `GET`    | `/api/users/:username` | View specific user public profile | ❌ Public |

---

### 💸 Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/transactions` | Query transactions (filters, search, pagination) | 🔒 Auth |
| `POST`   | `/api/transactions` | Create income or expense record | 🔒 Auth |
| `GET`    | `/api/transactions/summary` | Get aggregated financial summary | 🔒 Auth |
| `GET`    | `/api/transactions/:id` | Fetch details of a transaction | 🔒 Auth |
| `PATCH`  | `/api/transactions/:id` | Update transaction record | 🔒 Auth |
| `DELETE` | `/api/transactions/:id` | Soft-delete a transaction | 🔒 Auth |

---

### 📊 Budgets & Savings (`/api/budgets` & `/api/savings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/budgets` | Get category budgets and auto-calculated spent totals | 🔒 Auth |
| `POST`   | `/api/budgets` | Set category budget limit | 🔒 Auth |
| `PATCH`  | `/api/budgets/:id` | Modify budget limit or period | 🔒 Auth |
| `DELETE` | `/api/budgets/:id` | Remove budget | 🔒 Auth |
| `GET`    | `/api/savings` | Get active savings goals | 🔒 Auth |
| `POST`   | `/api/savings` | Create a new savings goal | 🔒 Auth |
| `PATCH`  | `/api/savings/:id` | Contribute funds or update goal | 🔒 Auth |
| `DELETE` | `/api/savings/:id` | Remove savings goal | 🔒 Auth |

---

### 📈 Investments & Tax (`/api/investments` & `/api/tax`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/investments` | Retrieve investment portfolio | 🔒 Auth |
| `POST`   | `/api/investments` | Add new investment asset | 🔒 Auth |
| `PATCH`  | `/api/investments/:id` | Update asset valuation or quantity | 🔒 Auth |
| `DELETE` | `/api/investments/:id` | Remove asset from portfolio | 🔒 Auth |
| `GET`    | `/api/tax` | Get tax overview and summary estimates | 🔒 Auth |
| `POST`   | `/api/tax/deductions` | Record a tax deduction | 🔒 Auth |
| `DELETE` | `/api/tax/deductions/:id` | Delete tax deduction record | 🔒 Auth |

---

### 📅 Bills & Payments (`/api/bills` & `/api/payments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/bills` | List bills (filter by `upcoming`, `overdue`, `paid`) | 🔒 Auth |
| `POST`   | `/api/bills` | Schedule a new bill reminder | 🔒 Auth |
| `PATCH`  | `/api/bills/:id` | Update bill status or deadline | 🔒 Auth |
| `DELETE` | `/api/bills/:id` | Delete a bill reminder | 🔒 Auth |
| `POST`   | `/api/payments/checkout` | Create a Stripe checkout session | 🔒 Auth |
| `GET`    | `/api/payments/status` | Check subscription status | 🔒 Auth |
| `GET`    | `/api/payments/my-payments` | View personal payment history | 🔒 Auth |
| `GET`    | `/api/payments/all-payments` | Admin view of all payment records | 🔒 Auth |

---

### 🎧 Help Desk & Contact Form (`/api/help` & `/api/contact`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST`   | `/api/help/tickets` | Open a new support ticket | 🔒 Auth |
| `GET`    | `/api/help/tickets` | List user support tickets | 🔒 Auth |
| `POST`   | `/api/help/tickets/:id/reply` | Reply to a support ticket thread | 🔒 Auth |
| `DELETE` | `/api/help/tickets/:id` | Close/Delete support ticket | 🔒 Auth |
| `GET`    | `/api/help/unread-count` | Fetch unread ticket response count | 🔒 Auth |
| `POST`   | `/api/contact` | Submit public contact message | ❌ Public |
| `GET`    | `/api/contact` | Fetch all contact messages (Admin/Mod) | 🔒 Auth |
| `POST`   | `/api/contact/:id/reply` | Reply to a contact submission | 🔒 Auth |
| `DELETE` | `/api/contact/:id` | Delete contact message | 🔒 Auth |

---

### 🔔 Notifications & Analytics (`/api/notifications`, `/api/analytics`, `/api/reports`, `/api/export`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`    | `/api/notifications` | Get in-app notifications (`?unread=true`) | 🔒 Auth |
| `PATCH`  | `/api/notifications/:id/read` | Mark single notification read | 🔒 Auth |
| `PATCH`  | `/api/notifications/read-all` | Mark all notifications read | 🔒 Auth |
| `DELETE` | `/api/notifications/:id` | Delete specific notification | 🔒 Auth |
| `DELETE` | `/api/notifications` | Clear all user notifications | 🔒 Auth |
| `GET`    | `/api/analytics/dashboard` | Key performance indicators & totals | 🔒 Auth |
| `GET`    | `/api/analytics/chart` | Monthly income vs expense chart series | 🔒 Auth |
| `GET`    | `/api/analytics/by-category` | Expense breakdown by category | 🔒 Auth |
| `GET`    | `/api/analytics/trends` | Cash flow trends over custom timeframes | 🔒 Auth |
| `GET`    | `/api/reports/summary` | Comprehensive financial report | 🔒 Auth |
| `GET`    | `/api/export/csv` | Export transactions as `.csv` file | 🔒 Auth |
| `GET`    | `/api/export/json` | Export transactions as `.json` file | 🔒 Auth |

---

## 🌐 Production Deployment (Vercel)

This application is ready for Vercel Serverless deployment using the included `vercel.json` file.

1. **Deploy using Vercel CLI**:
   ```bash
   vercel --prod
   ```
2. **Environment Configuration**: Set all required variables from `.env` in your Vercel Dashboard under **Project Settings > Environment Variables**.

---

## 📄 License

This repository is licensed under the [ISC License](LICENSE).
