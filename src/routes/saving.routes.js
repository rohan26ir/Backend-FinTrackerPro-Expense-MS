const express = require("express");
const router = express.Router();

// Import controller functions
const {
  getAll,
  create,
  update,
  remove,
} = require("../controllers/saving.controller");

// Import auth middleware
const { protect } = require("../middleware/auth");


// Savings Routes
router.route("/")
  .get(protect, getAll)     // GET /api/savings
  .post(protect, create);   // POST /api/savings

router.route("/:id")
  .patch(protect, update)   // PATCH /api/savings/:id
  .delete(protect, remove); // DELETE /api/savings/:id

module.exports = router;