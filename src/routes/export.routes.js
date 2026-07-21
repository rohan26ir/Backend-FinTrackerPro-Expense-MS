const express = require("express");
const router = express.Router();

const exportController = require("../controllers/export.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/csv", exportController.exportCSV);
router.get("/json", exportController.exportJSON);

module.exports = router;
