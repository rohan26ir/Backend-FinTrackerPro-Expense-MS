const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/dashboard", analyticsController.dashboard);
router.get("/chart", analyticsController.chart);
router.get("/by-category", analyticsController.byCategory);
router.get("/trends", analyticsController.trends);

module.exports = router;
