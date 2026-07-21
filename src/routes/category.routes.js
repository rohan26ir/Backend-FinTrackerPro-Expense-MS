const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/")
  .get(categoryController.getAll)
  .post(categoryController.create);

router.route("/:id")
  .patch(categoryController.update)
  .delete(categoryController.remove);

module.exports = router;
