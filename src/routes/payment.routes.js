const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/checkout", paymentController.processCheckout);
router.get("/status", paymentController.getSubscriptionStatus);
router.get("/my-payments", paymentController.getMyPayments);
router.get("/all-payments", paymentController.getAllPayments);

module.exports = router;
