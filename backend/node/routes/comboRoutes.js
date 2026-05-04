const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const comboController = require('../controllers/comboController');

/**
 * @swagger
 * /api/combos:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách combo
 *   post:
 *     tags: [Admin]
 *     summary: Tạo combo mới
 *     security:
 *       - BearerAuth: []
 * /api/combos/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy chi tiết combo
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật combo
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa combo
 *     security:
 *       - BearerAuth: []
 */

// Public routes - available to all users
router.get('/', comboController.getCombos);
router.get('/:id', comboController.getComboById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, isAdmin, comboController.createCombo);
router.put('/:id', protect, isAdmin, comboController.updateCombo);
router.delete('/:id', protect, isAdmin, comboController.deleteCombo);

module.exports = router; 