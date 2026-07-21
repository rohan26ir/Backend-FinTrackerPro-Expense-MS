const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profile.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", profileController.getProfile);
router.patch("/", profileController.updateProfile);
router.patch("/change-password", profileController.changePassword);
router.delete("/", profileController.deleteAccount);

module.exports = router;
