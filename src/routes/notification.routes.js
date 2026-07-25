const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", notificationController.getAll);
router.get("/unread-count", notificationController.getUnreadCount);
router.post("/broadcast", notificationController.broadcastNotification);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);
router.delete("/", notificationController.clearAll);

module.exports = router;