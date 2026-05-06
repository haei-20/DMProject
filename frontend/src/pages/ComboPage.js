import React, { useState, useMemo } from 'react';
import { 
  Container, Row, Col, Card, Badge, 
  Button, Alert, Spinner, Toast
} from 'react-bootstrap';
import { 
  FaShoppingCart, FaPercent, FaBoxOpen, 
  FaCheckCircle, FaFire, FaClock, FaTags
} from 'react-icons/fa';
import { formatPrice } from '../utils/productHelpers';
import { useAddToCartMutation, useGetCombosQuery } from '../services/api';
import Layout from '../components/Layout';
import './ComboPage.css';
import { useDispatch } from 'react-redux';
import { addToCart as addToCartAction } from '../redux/slices/cartSlice';
import { resolveComboProductImage } from '../utils/comboDisplay';

const ComboPage = () => {
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Fetch combos from API using the RTK Query hook
  const {
    data: combos = [],
    isLoading,
    error
  } = useGetCombosQuery();

  const activeCombos = useMemo(() => {
    return combos
      .filter((c) => c && c.isActive !== false)
      .sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
  }, [combos]);
  
  const [addToCart] = useAddToCartMutation();
  const dispatch = useDispatch();
  /** Chỉ combo đang gọi API mới disabled — RTK isLoading của mutation là chung cho mọi lần gọi */
  const [addingComboKey, setAddingComboKey] = useState(null);
  
  // Calculate combo price and savings
  const calculateComboDetails = (combo) => {
    const originalPrice = combo.products.reduce(
      (sum, product) => sum + (product.price * product.quantity), 0
    );
    const discountedPrice = originalPrice * (1 - (combo.discount / 100));
    const savedAmount = originalPrice - discountedPrice;
    
    return { originalPrice, discountedPrice, savedAmount };
  };

  const renderComboCard = (combo, idx) => {
    const { originalPrice, discountedPrice, savedAmount } = calculateComboDetails(combo);
    const desc = combo.description && String(combo.description).trim();
    const cardKey = combo._id || combo.id || `combo-card-${idx}`;
    const isThisComboAdding = addingComboKey === cardKey;

    return (
      <Col key={cardKey} xs={12} md={6} xl={4}>
        <Card className="combo-grid-card h-100 shadow-sm">
          <div className="combo-grid-card-discount">-{combo.discount}%</div>
          <Card.Body className="d-flex flex-column">
            <div className="combo-grid-thumbs">
              {combo.products.map((product) => (
                <div key={product._id} className="combo-grid-thumb" title={product.name}>
                  <img
                    src={resolveComboProductImage(product.image)}
                    alt=""
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.png';
                    }}
                  />
                  <span className="combo-grid-thumb-qty">×{product.quantity || 1}</span>
                </div>
              ))}
            </div>
            <Card.Title as="h3" className="combo-grid-title h5 mt-3 mb-2">
              {combo.name}
            </Card.Title>
            {desc ? (
              <Card.Text className="combo-grid-desc small text-muted flex-grow-1">{desc}</Card.Text>
            ) : (
              <Card.Text className="combo-grid-desc small text-muted flex-grow-1">
                Gồm <strong>{combo.products.length}</strong> sản phẩm — giảm{' '}
                <strong>{combo.discount}%</strong> so với mua lẻ.
              </Card.Text>
            )}
            <div className="combo-grid-prices mb-3">
              <div className="combo-grid-price-old text-muted text-decoration-line-through small">
                {formatPrice(originalPrice)}
              </div>
              <div className="combo-grid-price-new fw-bold text-danger fs-5">
                {formatPrice(discountedPrice)}
              </div>
              <div className="mt-1 d-flex flex-wrap gap-1">
                <Badge bg="success">Tiết kiệm {formatPrice(savedAmount)}</Badge>
                <Badge bg="secondary">{combo.products.length} sản phẩm</Badge>
              </div>
            </div>
            <Button
              variant="primary"
              className="mt-auto combo-grid-add-btn"
              onClick={() => handleAddComboToCart(combo, cardKey)}
              disabled={isThisComboAdding}
            >
              <FaShoppingCart className="me-2" />
              {isThisComboAdding ? 'Đang thêm...' : 'Thêm cả combo vào giỏ'}
            </Button>
          </Card.Body>
        </Card>
      </Col>
    );
  };
  
  // Handle adding the entire combo to cart
  const handleAddComboToCart = async (combo, cardKey) => {
    try {
      setAddingComboKey(cardKey);
      console.log("Adding combo to cart:", combo);
      
      // Add each product in the combo to cart with its quantity
      for (const product of combo.products) {
        // Create cart item for Redux store
        const cartItem = {
          _id: product._id,
          name: product.name,
          image: resolveComboProductImage(product.image),
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
    } finally {
      setAddingComboKey(null);
    }
  };
  
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
            <p>Mua combo để giảm giá so với mua lẻ từng sản phẩm — gói được cập nhật thường xuyên.</p>
            <p className="combo-banner-note mb-0">
              <FaClock className="me-2" aria-hidden />
              Giá và danh sách combo theo thời điểm hiển thị trên trang.
            </p>
          </div>
        </Container>
      </div>
      
      {/* Danh sách combo: mỗi combo một thẻ — không dùng slider */}
      {activeCombos.length > 0 ? (
        <div className="combo-list-section">
          <Container>
            <div className="combo-list-header d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div className="d-flex align-items-center gap-2">
                <FaTags className="text-danger" aria-hidden />
                <h2 className="combo-list-heading h4 mb-0">Combo đang mở bán</h2>
              </div>
              <Badge bg="danger" className="align-self-center">
                <FaFire className="me-1" aria-hidden />
                {activeCombos.length} gói
              </Badge>
            </div>
            <Row className="g-4">
              {activeCombos.map((combo, idx) => renderComboCard(combo, idx))}
            </Row>
          </Container>
        </div>
      ) : combos.length > 0 ? (
        <Container className="py-5">
          <Alert variant="info" className="text-center mb-0">
            Hiện không có combo nào đang mở bán. Vui lòng quay lại sau.
          </Alert>
        </Container>
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