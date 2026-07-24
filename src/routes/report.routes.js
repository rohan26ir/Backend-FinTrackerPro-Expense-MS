const express = require("express");
const router = express.Router();
const { getFinancialReport } = require("../controllers/report.controller");
const { protect } = require("../middleware/auth");

router.get("/summary", protect, getFinancialReport);

module.exports = router;
