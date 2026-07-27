const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account.controller");
const { protect } = require("../middleware/auth");

// Protect all account routes
router.use(protect);

// GET /api/accounts - List user's accounts
router.get("/", accountController.getAll);

// POST /api/accounts - Create a new account
router.post("/", accountController.create);

// GET /api/accounts/:id - Get single account
router.get("/:id", accountController.getOne);

// PATCH /api/accounts/:id - Update account
router.patch("/:id", accountController.update);

// DELETE /api/accounts/:id - Delete account
router.delete("/:id", accountController.remove);

module.exports = router;
