// src/routes/index.js
const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./auth.routes");
const billRoutes = require("./bill.routes");
const budgetRoutes = require("./budget.routes");
const cardRoutes = require("./card.routes");
const notificationRoutes = require("./notification.routes");
const savingRoutes = require("./saving.routes");
const transactionRoutes = require("./transaction.routes");
const categoryRoutes = require("./category.routes");
const analyticsRoutes = require("./analytics.routes");
const exportRoutes = require("./export.routes");
const profileRoutes = require("./profile.routes");

// Mount routes
router.use("/api/auth", authRoutes);
router.use("/api/bills", billRoutes);
router.use("/api/budgets", budgetRoutes);
router.use("/api/cards", cardRoutes);
router.use("/api/categories", categoryRoutes);
router.use("/api/notifications", notificationRoutes);
router.use("/api/savings", savingRoutes);
router.use("/api/transactions", transactionRoutes);
router.use("/api/analytics", analyticsRoutes);
router.use("/api/export", exportRoutes);
router.use("/api/profile", profileRoutes);

module.exports = router;