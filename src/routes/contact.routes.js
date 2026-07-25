const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { protect } = require("../middleware/auth");

// Public endpoint for submitting contact form
router.post("/", contactController.submitContact);

// Protected endpoints for Admins & Moderators to view & reply
router.get("/", protect, contactController.getAllContactMessages);
router.post("/:id/reply", protect, contactController.replyContactMessage);
router.delete("/:id", protect, contactController.deleteContactMessage);

module.exports = router;
