const express = require("express");
const router = express.Router();
const { getTaxOverview, addDeduction, removeDeduction } = require("../controllers/tax.controller");
const { protect } = require("../middleware/auth");

router.get("/", protect, getTaxOverview);
router.post("/deductions", protect, addDeduction);
router.delete("/deductions/:id", protect, removeDeduction);

module.exports = router;
