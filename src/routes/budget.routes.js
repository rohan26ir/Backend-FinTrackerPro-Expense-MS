// src/routes/budget.routes.js
const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budget.controller");
const { protect } = require("../middleware/auth");

// Protect all budget routes 
router.use(protect);

router.route("/")
  .get(budgetController.getAll)
  .post(budgetController.create);

router.route("/:id")
  .patch(budgetController.update)
  .delete(budgetController.remove);

module.exports = router;