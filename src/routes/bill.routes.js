// src/routes/bill.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const billController = require("../controllers/bill.controller");

// Public routes would go here (if any)

// Protected routes
router.use(protect);

router.route("/")
  .get(billController.getAll)
  .post(billController.create);

router.route("/:id")
  .patch(billController.update)
  .delete(billController.remove);

module.exports = router;