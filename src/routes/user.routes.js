const { Router } = require("express");
const { getAllUsers, getPublicUser, updateUser } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");

const router = Router();

// GET /api/users – list all users
router.get("/", getAllUsers);

// PATCH /api/users/:id – update user role/plan (protected)
router.patch("/:id", protect, updateUser);

// GET /api/users/:username – get a specific user
router.get("/:username", getPublicUser);

module.exports = router;