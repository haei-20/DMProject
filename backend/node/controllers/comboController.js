const Combo = require('../models/Combo');
const Product = require('../models/Product');

// @desc    Get all combos
// @route   GET /api/combos
// @access  Public
exports.getCombos = async (req, res) => {
  try {
    const combos = await Combo.find({}).sort({ createdAt: -1 });
    res.status(200).json({ combos });
  } catch (error) {
    console.error('Error fetching combos:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách combo', 
      error: error.message 
    });
  }
};

// @desc    Get combo by ID
// @route   GET /api/combos/:id
// @access  Public
exports.getComboById = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (combo) {
      res.status(200).json(combo);
    } else {
      res.status(404).json({ message: 'Không tìm thấy combo' });
    }
  } catch (error) {
    console.error('Error fetching combo:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin combo', 
      error: error.message 
    });
  }
};

// @desc    Create a new combo
// @route   POST /api/combos
// @access  Admin
exports.createCombo = async (req, res) => {
  try {
    const { name, description, products, discount, isActive, startDate, endDate } = req.body;
    
    // Validate required fields
    if (!name || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        message: 'Thông tin không hợp lệ. Yêu cầu tên và danh sách sản phẩm.' 
      });
    }
    
    // Ensure all product IDs exist in the database
    const productIds = products.map(product => product._id);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ 
        message: 'Một hoặc nhiều sản phẩm không tồn tại trong hệ thống' 
      });
    }
    
    const combo = new Combo({
      name,
      description,
      products,
      discount: discount || 10,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate
    });
    
    const createdCombo = await combo.save();
    res.status(201).json(createdCombo);
  } catch (error) {
    console.error('Error creating combo:', error);
    res.status(500).json({ 
      message: 'Lỗi khi tạo combo', 
      error: error.message 
    });
  }
};

// @desc    Update a combo
// @route   PUT /api/combos/:id
// @access  Admin
exports.updateCombo = async (req, res) => {
  try {
    console.log('Updating combo with ID:', req.params.id); // Debug log
    console.log('Update data:', req.body); // Debug log
    
    const { name, description, products, discount, isActive, startDate, endDate } = req.body;
    
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      console.log('Combo not found with ID:', req.params.id); // Debug log
      return res.status(404).json({ message: 'Không tìm thấy combo' });
    }
    
    // If products are being updated, validate them
    if (products && Array.isArray(products) && products.length > 0) {
      // Ensure all product IDs exist in the database
      const productIds = products.map(product => product._id);
      console.log('Validating product IDs:', productIds); // Debug log
      
      const existingProducts = await Product.find({ _id: { $in: productIds } });
      
      if (existingProducts.length !== productIds.length) {
        console.log('Some products not found. Found:', existingProducts.length, 'Expected:', productIds.length); // Debug log
        return res.status(400).json({ 
          message: 'Một hoặc nhiều sản phẩm không tồn tại trong hệ thống' 
        });
      }
      
      combo.products = products;
    }
    
    // Update other fields if provided
    if (name) combo.name = name;
    if (description !== undefined) combo.description = description;
    if (discount !== undefined) combo.discount = discount;
    if (isActive !== undefined) combo.isActive = isActive;
    if (startDate) combo.startDate = startDate;
    if (endDate) combo.endDate = endDate;
    
    const updatedCombo = await combo.save();
    console.log('Combo updated successfully:', updatedCombo); // Debug log
    res.status(200).json(updatedCombo);
  } catch (error) {
    console.error('Error updating combo:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật combo', 
      error: error.message 
    });
  }
};

// @desc    Delete a combo
// @route   DELETE /api/combos/:id
// @access  Admin
exports.deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (combo) {
      await combo.deleteOne();
      res.status(200).json({ message: 'Combo đã được xóa thành công' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy combo' });
    }
  } catch (error) {
    console.error('Error deleting combo:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xóa combo', 
      error: error.message 
    });
  }
}; 