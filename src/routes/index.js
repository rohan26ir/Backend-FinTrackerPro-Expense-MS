// src/routes/index.js
const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
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
const investmentRoutes = require("./investment.routes");
const taxRoutes = require("./tax.routes");
const reportRoutes = require("./report.routes");
const paymentRoutes = require("./payment.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes); 
router.use("/bills", billRoutes);
router.use("/budgets", budgetRoutes);
router.use("/cards", cardRoutes);
router.use("/categories", categoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/savings", savingRoutes);
router.use("/transactions", transactionRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/export", exportRoutes);
router.use("/profile", profileRoutes);
router.use("/investments", investmentRoutes);
router.use("/tax", taxRoutes);
router.use("/reports", reportRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;