const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getZakatRecords,
  createZakatRecord,
  updateZakatRecord,
  deleteZakatRecord,
} = require("../controllers/zakat.controller");

router.use(protect);

router.route("/")
  .get(getZakatRecords)
  .post(createZakatRecord);

router.route("/:id")
  .put(updateZakatRecord)
  .delete(deleteZakatRecord);

module.exports = router;
