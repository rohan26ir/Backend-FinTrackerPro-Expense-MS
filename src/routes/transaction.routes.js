const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");

// Protect all routes (assuming you have auth middleware)
const { protect } = require("../middleware/auth"); // adjust path as needed

// All routes are protected
router.use(protect);

/**
 * Transaction Routes
 */

// GET /api/transactions - Get all transactions with filters & pagination
router.get("/", transactionController.getAll);

// POST /api/transactions - Create new transaction
router.post("/", transactionController.create);

// GET /api/transactions/summary - Get income/expense summary
router.get("/summary", transactionController.summary);

// GET /api/transactions/:id - Get single transaction
router.get("/:id", transactionController.getOne);

// PATCH /api/transactions/:id - Update transaction
router.patch("/:id", transactionController.update);

// DELETE /api/transactions/:id - Soft delete transaction
router.delete("/:id", transactionController.remove);

module.exports = router;