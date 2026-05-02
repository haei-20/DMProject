const Product = require("../models/Product");
const { getHomepageRecommendations, getRelatedProductRecommendations } = require("../services/recommendationService");

// Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
  try {
    // Extract query params for filtering
    const {
      keyword,
      category,
      minPrice: minPriceRaw,
      maxPrice: maxPriceRaw,
      min,
      max,
      rating,
      sortBy,
      sort: sortParam,
      inStock,
      minStock,
      maxStock,
      limit = 10,
      page = 1
    } = req.query;

    const minPrice = minPriceRaw ?? min;
    const maxPrice = maxPriceRaw ?? max;

    // Build query
    const query = {};

    // Search by keyword
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by rating
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Filter by stock
    if (typeof inStock !== "undefined") {
      const inStockNormalized = String(inStock).toLowerCase();
      if (inStockNormalized === "true" || inStockNormalized === "1") {
        query.stock = { $gt: 0 };
      } else if (inStockNormalized === "false" || inStockNormalized === "0") {
        query.stock = { $lte: 0 };
      }
    }

    const hasMinStock = minStock !== undefined && minStock !== null && minStock !== '';
    const hasMaxStock = maxStock !== undefined && maxStock !== null && maxStock !== '';

    if (hasMinStock || hasMaxStock) {
      query.stock = query.stock || {};
      if (hasMinStock) query.stock.$gte = Number(minStock);
      if (hasMaxStock) query.stock.$lte = Number(maxStock);
    }

    // Out-of-stock tab compatibility:
    // include products with stock <= 0 OR stock missing/null.
    if (!hasMinStock && hasMaxStock && Number(maxStock) === 0) {
      delete query.stock;
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { stock: { $lte: 0 } },
          { stock: null },
          { stock: { $exists: false } }
        ]
      });
    }

    // Build sort object
    let sort = {};
    if (sortParam) {
      const [sortField, sortDirection = "desc"] = String(sortParam).split(":");
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortField) {
        sort = { [sortField]: direction };
      }
    } else if (sortBy) {
      switch (sortBy) {
        case 'price-asc':
          sort = { price: 1 };
          break;
        case 'price-desc':
          sort = { price: -1 };
          break;
        case 'rating':
          sort = { rating: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    } else {
      sort = { createdAt: -1 }; // Default sort by newest
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .limit(limitNum)
      .skip(skip);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(totalProducts / limitNum),
      total: totalProducts,
      totalCount: totalProducts
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message
    });
  }
};

// Lấy chi tiết sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
};

// Thêm đánh giá sản phẩm
exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp đánh giá và bình luận", 
        success: false 
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        message: "Sản phẩm không tồn tại", 
        success: false 
      });
    }

    // Check if user already reviewed this product
    if (req.user) {
      const alreadyReviewed = product.reviews.find(
        (review) => review.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({
          message: "Bạn đã đánh giá sản phẩm này rồi",
          success: false
        });
      }
    }

    // Create new review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    };

    // Add review to product
    product.reviews.push(review);

    // Update product rating
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    // Save product
    await product.save();

    res.status(201).json({
      message: "Đánh giá đã được thêm thành công",
      review,
      success: true
    });
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá sản phẩm:", error);
    res.status(500).json({ 
      message: "Lỗi khi thêm đánh giá sản phẩm", 
      error: error.message,
      success: false 
    });
  }
};

// Lấy tất cả đánh giá của một sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        message: "Sản phẩm không tồn tại", 
        success: false 
      });
    }
    
    res.json({
      reviews: product.reviews,
      success: true
    });
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá sản phẩm:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy đánh giá sản phẩm", 
      error: error.message,
      success: false 
    });
  }
};

// Xóa đánh giá sản phẩm (User hoặc Admin)
exports.deleteProductReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const reviewId = req.params.reviewId;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        message: "Sản phẩm không tồn tại", 
        success: false 
      });
    }
    
    // Tìm review cần xóa
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ 
        message: "Đánh giá không tồn tại", 
        success: false 
      });
    }
    
    // Kiểm tra nếu người dùng là chủ review hoặc admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Bạn không có quyền xóa đánh giá này", 
        success: false 
      });
    }
    
    // Xóa review
    review.deleteOne();
    
    // Cập nhật rating và numReviews
    if (product.reviews.length > 0) {
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    } else {
      product.rating = 0;
    }
    product.numReviews = product.reviews.length;
    
    // Lưu sản phẩm
    await product.save();
    
    res.json({
      message: "Đánh giá đã được xóa thành công",
      success: true
    });
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá sản phẩm:", error);
    res.status(500).json({ 
      message: "Lỗi khi xóa đánh giá sản phẩm", 
      error: error.message,
      success: false 
    });
  }
};

// Lấy sản phẩm nổi bật cho trang chủ với đề xuất
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const userId = req.user ? req.user._id : null;

    // Lấy sản phẩm nổi bật
    const featuredProducts = await Product.find({ isFeatured: true })
      .limit(limit)
      .select('_id name price images rating numReviews description');

    // Lấy sản phẩm đề xuất cho trang chủ (cá nhân hóa nếu có userId)
    const recommendedProducts = await getHomepageRecommendations(userId, limit);

    res.json({
      featuredProducts,
      recommendedProducts,
      success: true
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy sản phẩm nổi bật",
      error: error.message,
      success: false
    });
  }
};

// Lấy sản phẩm liên quan cho trang chi tiết sản phẩm
exports.getRelatedProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const limit = parseInt(req.query.limit) || 4;

    const relatedProducts = await getRelatedProductRecommendations(productId, limit);

    res.json({
      relatedProducts,
      success: true
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy sản phẩm liên quan",
      error: error.message,
      success: false
    });
  }
};

// Tạo sản phẩm mới (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock, image } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên và giá sản phẩm" });
    }

    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      price,
      description: description || "",
      category: category || "Uncategorized",
      stock: stock || 0,
      image: image || ""
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Sản phẩm đã được tạo thành công",
      product: savedProduct
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Lỗi khi tạo sản phẩm", error: error.message });
  }
};

// Tìm hàm updateProduct và cập nhật để hỗ trợ tốt hơn các trường Deal Hot
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    // Log thông tin cho debug
    console.log("Updating product:", productId);
    console.log("Product data:", JSON.stringify(req.body, null, 2));
    
    // Handle deal hot specific fields
    const updateData = { ...req.body };
    
    // Convert salePrice to Number if it exists
    if (updateData.salePrice !== undefined) {
      updateData.salePrice = Number(updateData.salePrice);
      console.log(`Converting salePrice to number: ${updateData.salePrice}`);
    }
    
    // Handle dates
    if (updateData.dealStartDate) {
      try {
        updateData.dealStartDate = new Date(updateData.dealStartDate);
        console.log(`Setting dealStartDate: ${updateData.dealStartDate}`);
      } catch (e) {
        console.error("Invalid dealStartDate format:", updateData.dealStartDate);
      }
    }
    
    if (updateData.dealEndDate) {
      try {
        updateData.dealEndDate = new Date(updateData.dealEndDate);
        console.log(`Setting dealEndDate: ${updateData.dealEndDate}`);
      } catch (e) {
        console.error("Invalid dealEndDate format:", updateData.dealEndDate);
      }
    }
    
    // Handle dealStartDate and dealEndDate correctly
    if (updateData.dealStartDate === null) {
      updateData.dealStartDate = undefined; // MongoDB sẽ xóa trường này
      console.log("Removing dealStartDate field");
    }
    
    if (updateData.dealEndDate === null) {
      updateData.dealEndDate = undefined; // MongoDB sẽ xóa trường này
      console.log("Removing dealEndDate field");
    }
    
    // Cập nhật sản phẩm với dữ liệu mới
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    console.log("Product updated successfully:");
    console.log("Updated fields:", JSON.stringify(updateData, null, 2));
    console.log("Result:", JSON.stringify(updatedProduct, null, 2));
    
    res.status(200).json({ 
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct 
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm", error: error.toString() });
  }
};

// Xóa sản phẩm (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Xóa sản phẩm ID ${id}`);
    
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        message: "Không tìm thấy sản phẩm", 
        success: false 
      });
    }
    
    // Lưu thông tin sản phẩm trước khi xóa để trả về
    const deletedProductInfo = {
      id: product._id,
      name: product.name
    };
    
    // Xóa sản phẩm
    await product.deleteOne();
    
    console.log("Đã xóa sản phẩm:", deletedProductInfo);
    
    res.json({
      message: "Sản phẩm đã được xóa thành công",
      product: deletedProductInfo,
      success: true
    });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ 
      message: "Lỗi khi xóa sản phẩm", 
      error: error.message,
      success: false
    });
  }
};

// Lấy số lượng sản phẩm theo danh mục
exports.getProductCountsByCategory = async (req, res) => {
  try {
    // Aggregate products by category and count
    const categoryCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { categoryId: "$_id", count: 1, _id: 0 } }
    ]);
    
    console.log('Product counts by category:', categoryCounts);
    
    res.json({
      success: true,
      categoryCounts
    });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng sản phẩm theo danh mục:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy số lượng sản phẩm theo danh mục", 
      error: error.message,
      success: false
    });
  }
};

// Thêm endpoint mới để lấy danh sách Deal Hot
exports.getDealHot = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const now = new Date();
    
    // Cập nhật query để kiểm tra ngày hợp lệ
    const query = {
      $or: [
        { category: 'Deal hot' },
        { tags: 'deal-hot' }
      ],
      salePrice: { $exists: true, $gt: 0 },
      $and: [
        // Deal chưa kết thúc hoặc không có ngày kết thúc
        { $or: [
          { dealEndDate: { $exists: false } },
          { dealEndDate: null },
          { dealEndDate: { $gt: now } }
        ]},
        // Deal đã bắt đầu hoặc không có ngày bắt đầu
        { $or: [
          { dealStartDate: { $exists: false } },
          { dealStartDate: null },
          { dealStartDate: { $lte: now } }
        ]}
      ]
    };
    
    // Log query để debug
    console.log('Deal Hot query:', JSON.stringify(query, null, 2));
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    if (!products || products.length === 0) {
      console.log('Không tìm thấy sản phẩm Deal Hot');
      return res.status(200).json({ products: [] });
    }
    
    console.log(`Tìm thấy ${products.length} sản phẩm Deal Hot`);
    res.status(200).json({ products });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm Deal Hot:', error);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm Deal Hot' });
  }
};
