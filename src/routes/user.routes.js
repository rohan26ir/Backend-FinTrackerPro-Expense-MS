const { Router } = require("express");
const { getAllUsers, getPublicUser } = require("../controllers/user.controller");

const router = Router();

// GET /api/users – list all public users
router.get("/", getAllUsers);

// GET /api/users/:username – get a specific user
router.get("/:username", getPublicUser);

module.exports = router;