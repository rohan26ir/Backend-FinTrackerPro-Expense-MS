const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const billRoutes = require("./bill.routes");

router.use("/auth", authRoutes);
router.use("/bills", billRoutes);

module.exports = router;
