import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert, Container, Row, Col, Carousel, Toast } from 'react-bootstrap';
import { FaRegClock, FaShoppingCart, FaEye, FaChevronLeft, FaChevronRight, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/productHelpers';
import '../styles/DealHot.css';
import { useAddToCartMutation } from '../services/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';

/**
 * DealHot component displays hot deals with countdown timer
 * Uses data from API endpoint '/products?category=Deal hot'
 */
const DealHot = ({ products = [], loading = false, title = "Deal hot hôm nay", showCountdown = true, maxItems = 4 }) => {
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [addToCartApi, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [index, setIndex] = useState(0);
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };
  
  // Check if we're using real data
  useEffect(() => {
    if (products && products.length > 0) {
      console.log("DealHot products loaded:", products);
      const isRealData = products.every(p => 
        p._id && typeof p._id === 'string' && p._id.length >= 12 &&
        p.name && p.price && !(p.name.includes('Mock') || p.name.includes('Mẫu'))
      );
      
      if (isRealData) {
        console.log('✅ DealHot: Đang sử dụng dữ liệu thực từ database');
      } else {
        console.warn('⚠️ DealHot: Có thể đang sử dụng dữ liệu mẫu! Hãy kiểm tra lại API.');
      }
    }
  }, [products]);
  
  // Đếm ngược thời gian - trong ứng dụng thực, thời gian này sẽ dựa trên dữ liệu thực của khuyến mãi
  useEffect(() => {
    // Lấy thời gian kết thúc từ localStorage nếu có, hoặc tạo mới
    let endTime = localStorage.getItem('dealHotEndTime');
    if (!endTime) {
      // Tạo thời gian kết thúc mới (24h kể từ bây giờ)
      const end = new Date();
      end.setHours(end.getHours() + 24);
      endTime = end.getTime();
      localStorage.setItem('dealHotEndTime', endTime);
    }
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;
      
      if (distance <= 0) {
        // Đặt lại thời gian nếu đã hết hạn
        const newEnd = new Date();
        newEnd.setHours(newEnd.getHours() + 24);
        localStorage.setItem('dealHotEndTime', newEnd.getTime());
        setCountdown({ hours: 23, minutes: 59, seconds: 59 });
      } else {
        // Tính toán thời gian còn lại
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format countdown display
  const formatCountdown = () => {
    return `${countdown.hours.toString().padStart(2, '0')}:${countdown.minutes.toString().padStart(2, '0')}:${countdown.seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate percentage discount
  const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  // Calculate savings amount
  const calculateSavings = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
    return originalPrice - salePrice;
  };
  
  // Handle add to cart
  const handleAddToCart = async (product) => {
    if (!product._id) {
      console.error('Product ID is missing');
      return;
    }
    
    try {
      // Create cart item
      const cartItem = {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.salePrice || product.price,
        originalPrice: product.price,
        countInStock: product.stock || product.countInStock,
        quantity: 1
      };
      
      // Add to Redux store first (this works immediately)
      dispatch(addToCart(cartItem));
      
      // Then try to sync with backend
      await addToCartApi({ 
        productId: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        originalPrice: product.price,
        quantity: 1
      });
      
      // Show success indicator
      setToastMessage(`Đã thêm ${product.name} vào giỏ hàng!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };
  
  // If loading
  if (loading) {
    return (
      <div className="deal-hot-section">
        <div className="deal-hot-header-new d-flex justify-content-between align-items-center">
          <h3 className="section-title">{title}</h3>
            {showCountdown && (
            <div className="countdown-badge-new">
                <FaRegClock className="me-1" /> Đang tải...
            </div>
            )}
          </div>
        <div className="deal-hot-body-loading text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải các ưu đãi hot...</p>
        </div>
      </div>
    );
  }
  
  // If no products
  if (!products || products.length === 0) {
    return (
      <div className="deal-hot-section">
        <div className="deal-hot-header-new d-flex justify-content-between align-items-center">
          <h3 className="section-title">{title}</h3>
        </div>
          <Alert variant="info">
          Hiện không có deal hot nào. Vui lòng quay lại sau.
          </Alert>
      </div>
    );
  }
  
  // Render a single product card
  const renderProduct = (product) => {
    const discount = calculateDiscount(product.price, product.salePrice);
    const savings = calculateSavings(product.price, product.salePrice);
    
  return (
      <div className="deal-hot-product-card-new">
        <div className="product-discount-badge">-{discount}%</div>
        
        <div className="deal-product-content">
          <div className="deal-product-image-new">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="placeholder-image">
                      {product.name?.substring(0, 2).toUpperCase() || 'PR'}
                    </div>
                  )}
                </div>
          
          <div className="deal-product-details">
            <div className="limited-offer-tag">Ưu đãi giới hạn</div>
            <h4 className="product-title">{product.name}</h4>
            <p className="product-description">{product.description || "Top quality product with exceptional features. Ergonomic design for maximum comfort."}</p>
            
            <div className="product-pricing">
              <div className="current-price-new">{formatPrice(product.salePrice || product.price)}</div>
                    {product.salePrice && (
                <div className="original-price-new">{formatPrice(product.price)}</div>
              )}
              {savings > 0 && (
                <div className="savings-amount">Tiết kiệm: {formatPrice(savings)}</div>
                    )}
                  </div>
            
            <div className="deal-product-actions">
              <Button 
                variant="primary" 
                className="view-details-btn"
                as={Link}
                to={`/product/${product._id}`}
              >
                <FaEye className="me-1" /> XEM CHI TIẾT
              </Button>
              
              <Button 
                variant="outline-primary" 
                className="add-to-cart-btn-new"
                onClick={() => handleAddToCart(product)}
                disabled={isAddingToCart || !(product.stock || product.countInStock)}
              >
                <FaShoppingCart className="me-1" /> THÊM VÀO GIỎ HÀNG
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Display deal hot products as carousel
  return (
    <div className="deal-hot-section">
      <div className="deal-hot-header-new d-flex justify-content-between align-items-center">
        <h3 className="section-title">{title}</h3>
        {showCountdown && (
          <div className="countdown-badge-new">
            <FaRegClock className="me-1" /> Kết thúc trong: {formatCountdown()}
          </div>
        )}
      </div>
      
      {/* Success toast */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)}
        delay={2000} 
        autohide
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          zIndex: 9999
        }}
        bg="success"
      >
        <Toast.Header closeButton>
          <strong className="me-auto">Thông báo</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          <FaCheckCircle className="me-2" />
          {toastMessage}
        </Toast.Body>
      </Toast>
      
      <div className="deal-hot-carousel">
        <Carousel
          activeIndex={index}
          onSelect={handleSelect}
          indicators={false}
          interval={null}
          prevIcon={<div className="carousel-control-icon"><FaChevronLeft /></div>}
          nextIcon={<div className="carousel-control-icon"><FaChevronRight /></div>}
        >
          {products.slice(0, maxItems).map((product, idx) => (
            <Carousel.Item key={product._id || idx}>
              {renderProduct(product)}
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default DealHot; 