import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Spinner, Alert, Container, Row, Col, Carousel, Toast } from 'react-bootstrap';
import { FaShoppingCart, FaEye, FaChevronLeft, FaChevronRight, FaBoxOpen, FaGift, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/productHelpers';
import { resolveComboProductImage } from '../utils/comboDisplay';
import { DEFAULT_PRODUCT_IMAGE_URL } from '../constants/defaultProductImageUrl';
import { useAddToCartMutation } from '../services/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import '../styles/ComboSection.css';

/**
 * ComboSection component displays combo products with discount information
 */
const ComboSection = ({ combos = [], loading = false, title = "Combo Tiết Kiệm", showViewAll = true, maxItems = 4 }) => {
  const [index, setIndex] = useState(0);
  const [addToCartApi, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const visibleCombos = useMemo(() => {
    return (combos || [])
      .filter((c) => c && c.isActive !== false)
      .slice(0, maxItems);
  }, [combos, maxItems]);
  
  // Calculate combo price and savings
  const calculateComboDetails = (combo) => {
    const originalPrice = combo.products.reduce(
      (sum, product) => sum + (product.price * product.quantity), 0
    );
    const discountedPrice = originalPrice * (1 - (combo.discount / 100));
    const savedAmount = originalPrice - discountedPrice;
    
    return { originalPrice, discountedPrice, savedAmount };
  };
  
  // Handle adding the entire combo to cart
  const handleAddComboToCart = async (combo) => {
    try {
      // Add each product in the combo to cart with its quantity
      for (const product of combo.products) {
        // Create cart item for Redux
        const cartItem = {
          _id: product._id,
          name: product.name,
          image: product.image,
          price: product.salePrice || product.price,
          originalPrice: product.price,
          countInStock: product.stock || product.countInStock,
          quantity: product.quantity || 1
        };
        
        // Add to Redux store first (this works immediately)
        dispatch(addToCart(cartItem));
        
        // Then try to sync with backend
        await addToCartApi({
          productId: product._id,
          name: product.name,
          price: product.salePrice || product.price,
          originalPrice: product.price,
          quantity: product.quantity || 1
        }).unwrap();
      }
      
      // Show success toast
      setToastMessage(`Đã thêm combo "${combo.name}" vào giỏ hàng!`);
      setToastVariant('success');
      setShowToast(true);
      
      console.log(`Added combo "${combo.name}" to cart`);
    } catch (error) {
      console.error('Failed to add combo to cart:', error);
      
      // Show error toast
      setToastMessage('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      setToastVariant('danger');
      setShowToast(true);
    }
  };
  
  // If loading
  if (loading) {
    return (
      <div className="combo-section">
        <div className="combo-header d-flex justify-content-between align-items-center">
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="combo-body-loading text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải combo sản phẩm...</p>
        </div>
      </div>
    );
  }
  
  // If no combos
  if (!combos || combos.length === 0 || visibleCombos.length === 0) {
    return (
      <div className="combo-section">
        <div className="combo-header d-flex justify-content-between align-items-center">
          <h3 className="section-title">{title}</h3>
        </div>
        <Alert variant="info">
          {combos && combos.length > 0
            ? 'Hiện không có combo đang mở bán. Vui lòng quay lại sau.'
            : 'Hiện không có combo nào. Vui lòng quay lại sau.'}
        </Alert>
      </div>
    );
  }
  
  // Render a single combo card
  const renderCombo = (combo) => {
    const { originalPrice, discountedPrice, savedAmount } = calculateComboDetails(combo);
    const desc = combo.description && String(combo.description).trim();
    
    return (
      <div className="combo-product-card">
        <div className="combo-discount-badge">-{combo.discount}%</div>
        
        <div className="combo-product-content">
          <div className="combo-products-grid">
            {combo.products.slice(0, 4).map((product) => (
              <div key={product._id} className="combo-product-preview">
                <div className="product-image">
                  <img
                    src={resolveComboProductImage(product.image)}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PRODUCT_IMAGE_URL;
                    }}
                  />
                  <div className="product-quantity">x{product.quantity || 1}</div>
                </div>
              </div>
            ))}
            {combo.products.length > 4 && (
              <div className="more-products-badge">
                +{combo.products.length - 4} sản phẩm
              </div>
            )}
          </div>
          
          <div className="combo-details">
            <div className="combo-badge">
              <FaGift className="me-1" /> Combo tiết kiệm
            </div>
            <h4 className="combo-title">{combo.name}</h4>
            {desc ? (
              <p className="combo-description">{desc}</p>
            ) : (
              <p className="combo-description combo-description-fallback text-muted">
                Gồm {combo.products.length} sản phẩm — giảm thêm {combo.discount}% khi mua combo.
              </p>
            )}
            
            <div className="product-count">
              <FaBoxOpen className="me-1" /> {combo.products.length} sản phẩm
            </div>
            
            <div className="combo-pricing">
              <div className="price-details">
                <div className="current-price">{formatPrice(discountedPrice)}</div>
                <div className="original-price">{formatPrice(originalPrice)}</div>
              </div>
              <div className="savings-amount">
                <Badge bg="success">
                  Tiết kiệm: {formatPrice(savedAmount)}
                </Badge>
              </div>
            </div>
            
            <div className="combo-actions">
              <Button 
                variant="outline-primary" 
                className="view-details-btn"
                as={Link}
                to={`/combo`}
              >
                <FaEye className="me-1" /> XEM CHI TIẾT
              </Button>
              
              <Button 
                variant="primary" 
                className="add-to-cart-btn"
                onClick={() => handleAddComboToCart(combo)}
                disabled={isAddingToCart}
              >
                <FaShoppingCart className="me-1" /> {isAddingToCart ? 'ĐANG THÊM...' : 'THÊM VÀO GIỎ'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Display combos as carousel
  return (
    <div className="combo-section">
      <div className="combo-header d-flex justify-content-between align-items-center">
        <h3 className="section-title">{title}</h3>
        {showViewAll && (
          <Link to="/combo" className="view-all-link">
            Xem tất cả <FaChevronRight className="ms-1" />
          </Link>
        )}
      </div>
      
      {/* Success toast */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)}
        delay={3000} 
        autohide
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          zIndex: 9999
        }}
        bg={toastVariant}
      >
        <Toast.Header closeButton>
          <strong className="me-auto">Thông báo</strong>
        </Toast.Header>
        <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>
          {toastVariant === 'success' && <FaCheckCircle className="me-2" />}
          {toastMessage}
        </Toast.Body>
      </Toast>
      
      <div className="combo-carousel">
        <Carousel
          activeIndex={index}
          onSelect={handleSelect}
          indicators={false}
          interval={null}
          prevIcon={<div className="carousel-control-icon"><FaChevronLeft /></div>}
          nextIcon={<div className="carousel-control-icon"><FaChevronRight /></div>}
        >
          {visibleCombos.map((combo, idx) => (
            <Carousel.Item key={combo._id || combo.id || `home-combo-${idx}`}>
              {renderCombo(combo)}
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default ComboSection; 