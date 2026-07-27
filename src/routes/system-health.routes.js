const express = require("express");
const router = express.Router();
const systemHealthController = require("../controllers/system-health.controller");
const { protect } = require("../middleware/auth");

// Protect health metrics route
router.use(protect);

// GET /api/system-health
router.get("/", systemHealthController.getHealthStatus);

module.exports = router;
