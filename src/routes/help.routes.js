const express = require("express");
const router = express.Router();
const helpController = require("../controllers/help.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/tickets", helpController.createTicket);
router.get("/tickets", helpController.getTickets);
router.post("/tickets/:id/reply", helpController.addReply);
router.delete("/tickets/:id", helpController.deleteTicket);
router.get("/unread-count", helpController.getUnreadHelpCount);

module.exports = router;
