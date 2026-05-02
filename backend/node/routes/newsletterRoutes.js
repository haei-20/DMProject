const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletterController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// Public routes
router.post("/subscribe", newsletterController.subscribe);
router.get("/unsubscribe/:token", newsletterController.unsubscribe);
router.post("/preferences/:token", newsletterController.updatePreferences);

// Admin routes
router.get("/", protect, isAdmin, newsletterController.getAllSubscribers);
router.get("/active", protect, isAdmin, newsletterController.getActiveSubscribers);
router.delete("/:id", protect, isAdmin, newsletterController.deleteSubscriber);

module.exports = router; 