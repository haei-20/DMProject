const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const comboController = require('../controllers/comboController');

// Public routes - available to all users
router.get('/', comboController.getCombos);
router.get('/:id', comboController.getComboById);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, isAdmin, comboController.createCombo);
router.put('/:id', protect, isAdmin, comboController.updateCombo);
router.delete('/:id', protect, isAdmin, comboController.deleteCombo);

module.exports = router; 