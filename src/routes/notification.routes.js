const express = require("express");
const router = express.Router();

// Import controller functions
const {
  getAll,
  markRead,
  markAllRead,
  remove,
  clearAll,
} = require("../controllers/notification.controller");

// Import auth middleware
const { protect } = require("../middleware/auth");
// Notification Routes
router.route("/")
  .get(protect, getAll)      // GET /api/notifications?unread=true
  .delete(protect, clearAll); // DELETE /api/notifications (clear all)

router.route("/:id/read")
  .patch(protect, markRead); // PATCH /api/notifications/:id/read

router.route("/read-all")
  .patch(protect, markAllRead); // PATCH /api/notifications/read-all

router.route("/:id")
  .delete(protect, remove);   // DELETE /api/notifications/:id

module.exports = router;