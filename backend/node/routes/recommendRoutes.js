const express = require("express");
const { getAprioriRecommendations, getFPGrowthRecommendations } = require("../services/recommendationService");
const router = express.Router();

/**
 * @swagger
 * /api/recommend/user:
 *   get:
 *     tags: [Recommendations]
 *     summary: Lấy gợi ý cho người dùng (Apriori)
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi hệ thống khi tạo gợi ý
 *
 * /api/recommend/admin:
 *   get:
 *     tags: [Recommendations, Admin]
 *     summary: Lấy gợi ý cho admin (FP-Growth)
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi hệ thống khi tạo gợi ý
 */

// API gợi ý sản phẩm cho người dùng
router.get("/user", async (req, res) => {
  try {
    const recommendations = await getAprioriRecommendations();
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gợi ý sản phẩm", error });
  }
});

// API gợi ý sản phẩm cho Admin
router.get("/admin", async (req, res) => {
  try {
    const recommendations = await getFPGrowthRecommendations();
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gợi ý sản phẩm", error });
  }
});

module.exports = router;
