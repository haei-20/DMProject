const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, isAdmin, optionalAuth, isUser } = require("../middlewares/authMiddleware");

// Public routes
router.get("/", productController.getProducts);
router.get("/featured", optionalAuth, productController.getFeaturedProducts);
router.get("/counts-by-category", productController.getProductCountsByCategory);
router.get("/deal-hot", productController.getDealHot);
router.get("/:id", productController.getProductById);
router.get("/:id/reviews", productController.getProductReviews);
router.get("/:id/related", productController.getRelatedProducts);

// Protected routes - Authentication required
router.post("/:id/reviews", protect, productController.addProductReview);
router.delete("/:productId/reviews/:reviewId", protect, productController.deleteProductReview);

// Admin routes
router.post("/", protect, isAdmin, productController.createProduct);
router.put("/:id", protect, isAdmin, productController.updateProduct);
router.delete("/:id", protect, isAdmin, productController.deleteProduct);

module.exports = router;
