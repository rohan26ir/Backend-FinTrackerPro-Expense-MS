const express = require("express");
const router = express.Router();

const {
  getAll,
  create,
  update,
  remove
} = require("../controllers/card.controller");

const {protect} = require('../middleware/auth')


// Card Routes
router.route("/")
  .get(protect, getAll)      // GET /api/cards
  .post(protect, create);    // POST /api/cards

router.route("/:id")
  .patch(protect, update)    // PATCH /api/cards/:id
  .delete(protect, remove);  // DELETE /api/cards/:id

module.exports = router;