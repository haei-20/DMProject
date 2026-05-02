const Cart = require("../models/Cart");
const GuestCart = require("../models/GuestCart");
const Product = require("../models/Product");
const { v4: uuidv4 } = require('uuid');
const { getCartRecommendations } = require("../services/recommendationService");

// Thêm sản phẩm vào giỏ hàng (cả người dùng đã đăng nhập và khách)
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Kiểm tra sản phẩm
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    // Kiểm tra nếu đã đăng nhập
    if (req.user) {
      const userId = req.user._id;
      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({ user: userId, items: [] });
      }

      const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      return res.status(200).json(cart);
    } 
    // Người dùng là khách (chưa đăng nhập)
    else {
      // Lấy hoặc tạo sessionId
      let { sessionId } = req.body;
      
      if (!sessionId) {
        sessionId = uuidv4(); // Tạo sessionId mới nếu chưa có
      }

      let guestCart = await GuestCart.findOne({ sessionId });

      if (!guestCart) {
        guestCart = new GuestCart({ sessionId, items: [] });
      }

      const itemIndex = guestCart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex > -1) {
        guestCart.items[itemIndex].quantity += quantity;
      } else {
        guestCart.items.push({ product: productId, quantity });
      }

      await guestCart.save();
      return res.status(200).json({ 
        cart: guestCart, 
        sessionId: sessionId,
        message: "Sản phẩm đã được thêm vào giỏ hàng. Lưu ý: giỏ hàng sẽ bị xóa sau 24 giờ hoặc khi tải lại trang."
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Lỗi khi thêm vào giỏ hàng", error: error.message });
  }
};

// Lấy giỏ hàng (cả người dùng đã đăng nhập và khách)
exports.getCart = async (req, res) => {
  try {
    // Người dùng đã đăng nhập
    if (req.user) {
      const userId = req.user._id;
      const cart = await Cart.findOne({ user: userId }).populate("items.product");

      if (!cart) return res.status(200).json({ message: "Giỏ hàng trống", items: [], recommendations: [] });

      // Lấy đề xuất sản phẩm dựa trên giỏ hàng hiện tại
      const recommendations = await getCartRecommendations(cart.items);

      return res.status(200).json({
        ...cart.toObject(),
        recommendations
      });
    } 
    // Người dùng là khách
    else {
      const { sessionId } = req.query;
      
      if (!sessionId) {
        return res.status(200).json({ message: "Giỏ hàng trống", items: [], recommendations: [] });
      }

      const guestCart = await GuestCart.findOne({ sessionId }).populate("items.product");

      if (!guestCart) return res.status(200).json({ message: "Giỏ hàng trống", items: [], recommendations: [] });

      // Lấy đề xuất sản phẩm dựa trên giỏ hàng hiện tại
      const recommendations = await getCartRecommendations(guestCart.items);

      return res.status(200).json({
        ...guestCart._doc,
        sessionId: sessionId,
        recommendations
      });
    }
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: "Lỗi khi lấy giỏ hàng", error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng (cả người dùng đã đăng nhập và khách)
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Người dùng đã đăng nhập
    if (req.user) {
      const userId = req.user._id;
      let cart = await Cart.findOne({ user: userId });
      
      if (!cart) return res.status(404).json({ message: "Giỏ hàng trống" });

      cart.items = cart.items.filter((item) => item.product.toString() !== productId);
      await cart.save();
      
      return res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    } 
    // Người dùng là khách
    else {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Không tìm thấy sessionId" });
      }

      let guestCart = await GuestCart.findOne({ sessionId });
      
      if (!guestCart) return res.status(404).json({ message: "Giỏ hàng trống" });

      guestCart.items = guestCart.items.filter((item) => item.product.toString() !== productId);
      await guestCart.save();
      
      return res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng (cả người dùng đã đăng nhập và khách)
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Người dùng đã đăng nhập
    if (req.user) {
      const userId = req.user._id;
      let cart = await Cart.findOne({ user: userId });
      
      if (!cart) return res.status(404).json({ message: "Giỏ hàng trống" });

      const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        return res.status(200).json(cart);
      } else {
        return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
      }
    } 
    // Người dùng là khách
    else {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Không tìm thấy sessionId" });
      }

      let guestCart = await GuestCart.findOne({ sessionId });
      
      if (!guestCart) return res.status(404).json({ message: "Giỏ hàng trống" });

      const itemIndex = guestCart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex > -1) {
        guestCart.items[itemIndex].quantity = quantity;
        await guestCart.save();
        return res.status(200).json({
          ...guestCart._doc,
          sessionId: sessionId
        });
      } else {
        return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
      }
    }
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật giỏ hàng", error: error.message });
  }
};

// Xóa toàn bộ giỏ hàng (cả người dùng đã đăng nhập và khách)
exports.clearCart = async (req, res) => {
  try {
    // Người dùng đã đăng nhập
    if (req.user) {
      const userId = req.user._id;
      await Cart.findOneAndDelete({ user: userId });
      return res.status(200).json({ message: "Đã xóa toàn bộ giỏ hàng" });
    } 
    // Người dùng là khách
    else {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Không tìm thấy sessionId" });
      }

      await GuestCart.findOneAndDelete({ sessionId });
      return res.status(200).json({ message: "Đã xóa toàn bộ giỏ hàng" });
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Lỗi khi xóa giỏ hàng", error: error.message });
  }
};

// Chuyển giỏ hàng từ khách sang người dùng đã đăng nhập
exports.mergeGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Không tìm thấy sessionId" });
    }

    // Tìm giỏ hàng của khách
    const guestCart = await GuestCart.findOne({ sessionId });
    
    if (!guestCart || guestCart.items.length === 0) {
      return res.status(200).json({ message: "Không có sản phẩm trong giỏ hàng khách để chuyển" });
    }

    // Tìm hoặc tạo giỏ hàng của người dùng
    let userCart = await Cart.findOne({ user: userId });
    
    if (!userCart) {
      userCart = new Cart({ user: userId, items: [] });
    }

    // Thêm từng sản phẩm từ giỏ hàng khách vào giỏ hàng người dùng
    for (const guestItem of guestCart.items) {
      const itemIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString()
      );

      if (itemIndex > -1) {
        // Sản phẩm đã có trong giỏ hàng người dùng, cộng thêm số lượng
        userCart.items[itemIndex].quantity += guestItem.quantity;
      } else {
        // Thêm sản phẩm mới vào giỏ hàng người dùng
        userCart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity
        });
      }
    }

    // Lưu giỏ hàng người dùng và xóa giỏ hàng khách
    await userCart.save();
    await GuestCart.findOneAndDelete({ sessionId });

    res.status(200).json({
      message: "Đã chuyển giỏ hàng thành công",
      cart: userCart
    });
  } catch (error) {
    console.error("Error merging carts:", error);
    res.status(500).json({ message: "Lỗi khi chuyển giỏ hàng", error: error.message });
  }
};

