import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Badge, 
  Button, Alert, Spinner, Toast, Carousel
} from 'react-bootstrap';
import { 
  FaShoppingCart, FaPercent, FaBoxOpen, FaAngleRight, 
  FaCheckCircle, FaFire, FaClock, FaStar, FaTags
} from 'react-icons/fa';
import { formatPrice } from '../utils/productHelpers';
import { useAddToCartMutation, useGetCombosQuery } from '../services/api';
import Layout from '../components/Layout';
import './ComboPage.css';
import { useDispatch } from 'react-redux';
import { addToCart as addToCartAction } from '../redux/slices/cartSlice';

const ComboPage = () => {
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Countdown state for featured combos
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 12,
    minutes: 30,
    seconds: 0
  });
  
  // Fetch combos from API using the RTK Query hook
  const {
    data: combos = [],
    isLoading,
    error
  } = useGetCombosQuery();
  
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const dispatch = useDispatch();
  
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
      console.log("Adding combo to cart:", combo);
      
      // Add each product in the combo to cart with its quantity
      for (const product of combo.products) {
        // Create cart item for Redux store
        const cartItem = {
          _id: product._id,
          name: product.name,
          image: product.image || "/logo192.png",
          price: product.salePrice || product.price,
          originalPrice: product.price,
          countInStock: product.countInStock || 10,
          quantity: product.quantity || 1
        };
        
        // Add to Redux store first (this works immediately for UI)
        dispatch(addToCartAction(cartItem));
        
        // Then sync with backend API
        const apiCartItem = {
          productId: product._id,
          quantity: product.quantity || 1
        };
        
        console.log("Adding product to cart:", apiCartItem);
        await addToCart(apiCartItem).unwrap();
      }
      
      // Show success toast
      setToastMessage(`Đã thêm combo "${combo.name}" vào giỏ hàng!`);
      setShowToast(true);
    } catch (error) {
      console.error('Failed to add combo to cart:', error);
      // Show error message
      setToastMessage('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      setShowToast(true);
    }
  };
  
  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        let { days, hours, minutes, seconds } = prevTime;
        
        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            } else {
              hours = 23;
              if (days > 0) {
                days -= 1;
              } else {
                // Reset to 3 days when countdown ends
                days = 3;
              }
            }
          }
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  if (isLoading) {
    return (
      <Layout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải combo sản phẩm...</p>
        </Container>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Container className="py-5">
          <Alert variant="danger">
            Không thể tải combo sản phẩm. Vui lòng thử lại sau.
          </Alert>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="combo-page-banner">
        <Container>
          <div className="banner-content">
            <h1><FaFire className="me-2" />Combo Tiết Kiệm</h1>
            <p>Mua combo để tiết kiệm đến 20% so với mua lẻ từng sản phẩm.</p>
            <div className="combo-countdown">
              <div className="countdown-title">
                <FaClock className="me-2" /> Combo đặc biệt sẽ kết thúc sau:
              </div>
              <div className="countdown-timer">
                <div className="countdown-box">
                  <div className="countdown-value">{timeLeft.days}</div>
                  <div className="countdown-label">Ngày</div>
                </div>
                <div className="countdown-separator">:</div>
                <div className="countdown-box">
                  <div className="countdown-value">{timeLeft.hours}</div>
                  <div className="countdown-label">Giờ</div>
                </div>
                <div className="countdown-separator">:</div>
                <div className="countdown-box">
                  <div className="countdown-value">{timeLeft.minutes}</div>
                  <div className="countdown-label">Phút</div>
                </div>
                <div className="countdown-separator">:</div>
                <div className="countdown-box">
                  <div className="countdown-value">{timeLeft.seconds}</div>
                  <div className="countdown-label">Giây</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Featured Combos Carousel */}
      {combos.length > 0 ? (
        <div className="featured-combos-section">
          <Container>
            <div className="section-header featured">
              <div className="section-title-wrapper">
                <FaStar className="section-icon" />
                <h2>Combo Nổi Bật</h2>
              </div>
              <Badge bg="danger" className="featured-badge">
                <FaFire className="me-1" /> Hot
              </Badge>
            </div>
            
            <Carousel className="featured-combos-carousel">
              {combos.map((combo) => {
                const { originalPrice, discountedPrice, savedAmount } = calculateComboDetails(combo);
                
                return (
                  <Carousel.Item key={combo.id}>
                    <div className="featured-combo-slide">
                      <Row>
                        <Col md={6} className="featured-combo-products">
                          <div className="featured-products-grid">
                            {combo.products.map((product, index) => (
                              <div key={product._id} className="featured-product-item">
                                <div className="product-image">
                                  <img src={product.image} alt={product.name} />
                                  <div className="product-quantity">x{product.quantity}</div>
                                </div>
                                <div className="product-name">{product.name}</div>
                              </div>
                            ))}
                          </div>
                        </Col>
                        <Col md={6} className="featured-combo-details">
                          <div className="combo-badge">
                            <FaTags className="me-1" /> Super Combo
                          </div>
                          <h3 className="featured-combo-name">{combo.name}</h3>
                          <p className="featured-combo-description">{combo.description}</p>
                          
                          <div className="featured-combo-pricing">
                            <div className="price-details">
                              <div className="original-price">
                                {formatPrice(originalPrice)}
                              </div>
                              <div className="discounted-price">
                                {formatPrice(discountedPrice)}
                              </div>
                            </div>
                            <div className="savings">
                              <Badge bg="success" className="savings-badge">
                                Tiết kiệm {formatPrice(savedAmount)}
                              </Badge>
                              <Badge bg="danger" className="discount-badge">
                                -{combo.discount}%
                              </Badge>
                            </div>
                          </div>
                          
                          <Button 
                            variant="primary" 
                            size="lg"
                            className="add-featured-combo-btn"
                            onClick={() => handleAddComboToCart(combo)}
                            disabled={isAddingToCart}
                          >
                            <FaShoppingCart className="me-2" />
                            {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  </Carousel.Item>
                );
              })}
            </Carousel>
          </Container>
        </div>
      ) : (
        <Container className="py-5">
          <div className="text-center py-5">
            <FaBoxOpen size={48} className="text-muted mb-3" />
            <h3>Hiện tại chưa có combo nào</h3>
            <p>Vui lòng quay lại sau, chúng tôi sẽ cập nhật sớm!</p>
          </div>
        </Container>
      )}
      
      <Container className="py-5">
        {/* Benefits section */}
        <div className="combo-benefits-section mt-5">
          <div className="section-header mb-4">
            <h3>Tại sao nên mua Combo?</h3>
          </div>
          
          <Row>
            <Col md={4}>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaPercent />
                </div>
                <h4>Tiết kiệm hơn</h4>
                <p>Tiết kiệm đến 20% so với mua lẻ từng sản phẩm. Càng mua nhiều càng tiết kiệm.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaBoxOpen />
                </div>
                <h4>Đầy đủ sản phẩm</h4>
                <p>Sản phẩm trong combo được lựa chọn kỹ lưỡng, đảm bảo phù hợp nhu cầu sử dụng.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <FaShoppingCart />
                </div>
                <h4>Tiện lợi</h4>
                <p>Một lần mua nhiều sản phẩm, tiết kiệm thời gian chọn lựa và chi phí vận chuyển.</p>
              </div>
            </Col>
          </Row>
        </div>
        
        {/* Toast notification */}
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          <Toast 
            onClose={() => setShowToast(false)} 
            show={showToast} 
            delay={3000} 
            autohide
            bg="success"
            text="white"
          >
            <Toast.Header closeButton>
              <FaCheckCircle className="me-2" />
              <strong className="me-auto">Thông báo</strong>
            </Toast.Header>
            <Toast.Body>{toastMessage}</Toast.Body>
          </Toast>
        </div>
      </Container>
    </Layout>
  );
};

export default ComboPage; 