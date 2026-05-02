import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaClock, FaShoppingCart } from 'react-icons/fa';
import { useGetProductByIdQuery } from '../services/api';
import { addToCart } from '../redux/slices/cartSlice';

const DealOfTheDay = ({ products = [] }) => {
  // bây giờ nếu không truyền products thì products mặc định là mảng rỗng, tránh lỗi
  const dispatch = useDispatch();
  const { id } = useParams();

  // Lấy sản phẩm chi tiết theo id (nếu cần)
  const { data: product, error, isLoading, refetch } = useGetProductByIdQuery(id, {
    pollingInterval: 30000,
  });

  const sampleProduct = {
    _id: id || 'sample1',
    name: 'Lốc 4 hộp sữa tươi tiệt trùng Nutimilk có đường 180ml',
    description: 'Sữa tươi tiệt trùng Nutimilk có đường cung cấp protein, calcium, vitamin và nhiều chất dinh dưỡng, giúp tăng sức đề kháng, phát triển chiều cao và trí tuệ.',
    price: 25.50,
    originalPrice: 32.00,
    image: 'https://images.unsplash.com/photo-1568901839119-631418679758?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    countInStock: 10,
    sku: '10405274',
    category: 'Đồ uống',
    brand: 'Nutimilk',
  };

  const productData = product || sampleProduct;

  // Lọc ra sản phẩm thuộc category "Deal hot"
  const dealHotProducts = products.filter(p => p.category === 'Deal hot');

  // Chọn ngẫu nhiên một deal hot hoặc defaultDeal
  const defaultDeal = {
    _id: 'deal123',
    name: 'Premium Headphones - Limited Offer',
    description: 'Top quality noise-cancelling headphones with exceptional sound clarity. Ergonomic design for maximum comfort during extended use.',
    price: 129.99,
    originalPrice: 199.99,
    discount: 35,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    countInStock: 5,
  };

  const dealToShow = dealHotProducts.length > 0
    ? dealHotProducts[Math.floor(Math.random() * dealHotProducts.length)]
    : defaultDeal;

  // Tính phần trăm giảm giá
  const discountPercentage = dealToShow
    ? Math.round(((dealToShow.originalPrice - dealToShow.price) / dealToShow.originalPrice) * 100)
    : 0;

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours:0, minutes:0, seconds:0 });
  const expirationTimeRef = useRef(new Date(dealToShow.expiresAt).getTime());

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const difference = expirationTimeRef.current - now;

    if (difference > 0) {
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(prev => {
        if (prev.hours !== hours || prev.minutes !== minutes || prev.seconds !== seconds) {
          return { hours, minutes, seconds };
        }
        return prev;
      });
    } else {
      setTimeLeft(prev => {
        if (prev.hours !== 0 || prev.minutes !== 0 || prev.seconds !== 0) {
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    if (!dealToShow || !dealToShow.expiresAt) return;

    expirationTimeRef.current = new Date(dealToShow.expiresAt).getTime();
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [dealToShow, calculateTimeLeft]);

  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    setAddedToCart(true);

    // Dispatch thêm đúng sản phẩm dealToShow
    dispatch(addToCart({
      _id: dealToShow._id,
      name: dealToShow.name,
      image: dealToShow.image,
      price: dealToShow.price,
      countInStock: dealToShow.countInStock || 10,
      quantity,
    }));

    setTimeout(() => {
      setAddedToCart(false);
      // Nếu muốn bạn có thể gọi refetch() hoặc làm gì đó ở đây
    }, 1500);
  };

  const formatTimeUnit = (unit) => (unit < 10 ? `0${unit}` : unit);

  return (
    <div className="deals-section py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title">Deal hot hôm nay</h2>
        <div className="countdown-timer">
          <FaClock className="me-2" />
          <span className="countdown-text">
            Kết thúc trong: {formatTimeUnit(timeLeft.hours)}:{formatTimeUnit(timeLeft.minutes)}:{formatTimeUnit(timeLeft.seconds)}
          </span>
        </div>
      </div>

      <Card className="deal-of-day-card">
        <Row className="g-0">
          <Col md={5} className="deal-image-col">
            <div className="deal-image-container">
              <img 
                src={dealToShow.image} 
                alt={dealToShow.name} 
                className="deal-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/deal-placeholder.png';
                }}
              />
              <Badge bg="danger" className="deal-discount-badge">
                -{discountPercentage}%
              </Badge>
            </div>
          </Col>
          <Col md={7}>
            <Card.Body className="deal-content">
              <Badge bg="warning" text="dark" className="limited-offer-badge mb-3">
                Ưu đãi giới hạn
              </Badge>
              <h3 className="deal-title">{dealToShow.name}</h3>
              <p className="deal-description">{dealToShow.description}</p>
              <div className="deal-price mb-4">
                <span className="current-price">${dealToShow.price.toFixed(2)}</span>
                <span className="original-price">${dealToShow.originalPrice.toFixed(2)}</span>
                <span className="saving-amount">
                  Tiết kiệm: ${(dealToShow.originalPrice - dealToShow.price).toFixed(2)}
                </span>
              </div>
              <div className="deal-actions">
                <Button 
                  as={Link} 
                  to={`/product/${dealToShow._id}`} 
                  variant="primary" 
                  className="me-3"
                >
                  Xem chi tiết
                </Button>
                <Button
                  variant={addedToCart ? 'success' : 'outline-primary'}
                  disabled={dealToShow.countInStock === 0 || addedToCart}
                  onClick={handleAddToCart}
                >
                  {addedToCart ? 'Đã thêm vào giỏ hàng' : (
                    <>
                      <FaShoppingCart className="me-1" /> Thêm vào giỏ hàng
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DealOfTheDay;
