const express = require("express");
const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    mergeGuestCart
} = require("../controllers/cartController");
const { protect, optionalAuth } = require("../middlewares/authMiddleware");

const router = express.Router();
  
router.post("/add", optionalAuth, addToCart);
router.get("/", optionalAuth, getCart);
router.delete("/remove", optionalAuth, removeFromCart);
router.put("/update", optionalAuth, updateCartItem);
router.delete("/clear", optionalAuth, clearCart);
router.post("/merge", protect, mergeGuestCart);
  
module.exports = router;