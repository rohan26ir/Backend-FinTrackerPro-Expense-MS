const express = require("express");
const router = express.Router();
const { getAll, create, update, remove } = require("../controllers/investment.controller");
const { protect } = require("../middleware/auth");

router.route("/")
  .get(protect, getAll)
  .post(protect, create);

router.route("/:id")
  .patch(protect, update)
  .delete(protect, remove);

module.exports = router;
