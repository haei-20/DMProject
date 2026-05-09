import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Form, Alert, Card } from 'react-bootstrap';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaStore, 
  FaMoneyBillWave, 
  FaShoppingBag, 
  FaTruckMoving, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaSave,
  FaArrowLeft,
  FaSpinner,
  FaBox,
  FaTruck,
  FaCheck
} from 'react-icons/fa';
import { useCreateOrderMutation } from '../services/api';
import { clearCart } from '../redux/slices/cartSlice';
import Layout from '../components/Layout';
import { formatPrice, formatImageUrl } from '../utils/productHelpers';
import './OrderPage.css';

// Import cho thông báo mới
import { v4 as uuidv4 } from 'uuid';

// Provinces/districts will be fetched from the Open API (v2) at
// https://provinces.open-api.vn/ (depth=2) which includes districts.
// We keep a small fallback list in case the remote service is unavailable.
const fallbackProvinces = [
  { code: "HNO", name: "Hà Nội", districts: ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng"] },
  { code: "SGN", name: "TP. Hồ Chí Minh", districts: ["Quận 1", "Quận 3", "Quận 4"] }
];

// Mock data function để tạo thông báo
const createOrderNotification = (orderId) => {
  const mockNotification = {
    _id: uuidv4(),
    title: 'Đơn hàng mới',
    message: `Đơn hàng #${orderId} của bạn đã được tạo thành công và đang chờ xác nhận.`,
    type: 'order_placed',
    read: false,
    orderId: orderId,
    createdAt: new Date().toISOString(),
  };
  
  // Thêm vào mảng thông báo mock
  const existingNotifications = JSON.parse(localStorage.getItem('mockNotifications') || '[]');
  existingNotifications.unshift(mockNotification);  // Thêm vào đầu mảng
  localStorage.setItem('mockNotifications', JSON.stringify(existingNotifications));
  
  return mockNotification;
};

const OrderPage = () => {
  const [address, setAddress] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [district, setDistrict] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [note, setNote] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Danh sách quận/huyện dựa trên tỉnh/thành phố được chọn
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items, itemsPrice, shippingPrice, totalPrice, paymentMethod } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  // Prefill name if user is logged in
  useEffect(() => {
    if (user && user.name) {
      setFullName(user.name);
    }
  }, [user]);

  // Cập nhật danh sách quận/huyện khi thay đổi tỉnh/thành phố
  useEffect(() => {
    if (provinceCode) {
      // provinceCode comes from either Open API (numeric) or fallback (string)
      const selected = provinces.find(p => String(p.code) === String(provinceCode));
      setAvailableDistricts(selected?.districts?.map(d => (typeof d === 'string' ? d : d.name)) || []);
      setDistrict(''); // Reset quận/huyện khi thay đổi tỉnh/thành
    } else {
      setAvailableDistricts([]);
    }
  }, [provinceCode]);

  // Fetch provinces/districts from open-api (v2) with depth=2
  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      setLocationsError(null);
      try {
        // Use depth=2 to include districts. This URL targets the public v2 API.
        const res = await fetch('https://provinces.open-api.vn/api/?depth=2');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // normalize: API returns provinces with `code`, `name`, and `districts` (each district has `name`)
        setProvinces(Array.isArray(data) && data.length ? data : fallbackProvinces);
      } catch (err) {
        console.error('Failed to load provinces from open-api:', err);
        // fall back to built-in list
        setProvinces(fallbackProvinces);
        setLocationsError(err.message || 'Fetch error');
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    // Redirect if cart is empty or payment method not set
    if (items.length === 0) {
      navigate('/cart');
    } else if (!paymentMethod) {
      navigate('/payment');
    }
  }, [items, paymentMethod, navigate]);

  const validateForm = () => {
    const errors = {};
    
    if (!fullName.trim()) errors.fullName = 'Tên người nhận không được để trống';
    if (!address.trim()) errors.address = 'Địa chỉ không được để trống';
    if (!provinceCode) errors.province = 'Vui lòng chọn tỉnh/thành phố';
    if (!district) errors.district = 'Vui lòng chọn quận/huyện';
    if (!phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^\d{10,11}$/.test(phone.trim())) errors.phone = 'Số điện thoại không hợp lệ';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;

    setOrderError('');

    try {
      // Lấy tên tỉnh/thành phố từ mã (từ dữ liệu fetch hoặc fallback)
      const selectedProvince = provinces.find(p => String(p.code) === String(provinceCode))?.name || '';
      
      // Tạo chuỗi địa chỉ đầy đủ
      const fullAddress = `${address}, ${district}, ${selectedProvince}`;

      // Prepare order data with complete shipping information
      const orderData = {
        cartItems: items.map(item => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          address: fullAddress,
          city: selectedProvince,
          postalCode: "10000", // Mã bưu điện mặc định
          country: "Vietnam"
        },
        paymentMethod: paymentMethod || "cash",
        itemsPrice: itemsPrice,
        shippingPrice: shippingPrice,
        totalPrice: totalPrice
      };

      // Thêm thông tin khách hàng nếu chưa đăng nhập
      if (!isAuthenticated) {
        orderData.guestInfo = {
          name: fullName,
          email: "guest@example.com", // Thêm email giả
          phone: phone
        };
        orderData.sessionId = localStorage.getItem('sessionId') || Date.now().toString();
      }
      
      const response = await createOrder(orderData).unwrap();
      dispatch(clearCart());
      setOrderSuccess(true);
      
      // Redirect to order status page after successful order
      setTimeout(() => {
        navigate(`/order-status/${response.order._id}`);
      }, 2000);

      // Tạo thông báo mới
      const notification = createOrderNotification(response.order._id);
    } catch (err) {
      console.error('Order error:', err);
      setOrderError(
        err.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.'
      );
    }
  };
  
  const getPaymentMethodDisplay = () => {
    switch(paymentMethod) {
      case 'cash': return 'Thanh toán khi nhận hàng (COD)';
      case 'card': return 'Thanh toán bằng thẻ tín dụng/ghi nợ';
      case 'bank': return 'Chuyển khoản ngân hàng';
      default: return 'Chưa chọn phương thức thanh toán';
    }
  };
  
  const getEstimatedDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3); // Estimated 3 days for delivery
    
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return deliveryDate.toLocaleDateString('vi-VN', options);
  };

  return (
    <Layout>
      <Container className="order-container">
        <h1>Xác Nhận Đơn Hàng</h1>
        
        {orderSuccess ? (
          <Alert variant="success">
            <FaInfoCircle className="me-2" />
            Đặt hàng thành công! Đang chuyển hướng đến trang trạng thái đơn hàng...
          </Alert>
        ) : (
          <div className="order-details">
            {orderError && (
              <Alert variant="danger" className="mb-4">
                <FaExclamationCircle className="me-2" />
                {orderError}
              </Alert>
            )}
            
            <Form onSubmit={handlePlaceOrder}>
              <Row>
                <Col md={7}>
              <div className="order-section">
                <h2>
                      <FaMapMarkerAlt /> Thông Tin Giao Hàng
                </h2>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label>Họ tên người nhận</Form.Label>
                          <Form.Control 
                            type="text"
                            className={formErrors.fullName ? 'is-invalid' : ''}
                            placeholder="Nhập họ tên người nhận hàng"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                          {formErrors.fullName && (
                            <div className="invalid-feedback">{formErrors.fullName}</div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Tỉnh/Thành phố</Form.Label>
                          <Form.Select
                            className={formErrors.province ? 'is-invalid' : ''}
                            value={provinceCode}
                            onChange={(e) => setProvinceCode(e.target.value)}
                          >
                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                            {provinces.map(province => (
                                  <option key={province.code} value={province.code}>
                                    {province.name}
                                  </option>
                                ))}
                          </Form.Select>
                          {formErrors.province && (
                            <div className="invalid-feedback">{formErrors.province}</div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Quận/Huyện</Form.Label>
                          <Form.Select
                            className={formErrors.district ? 'is-invalid' : ''}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled={!provinceCode}
                          >
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {availableDistricts.map(dist => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                          </Form.Select>
                          {formErrors.district && (
                            <div className="invalid-feedback">{formErrors.district}</div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label>Địa chỉ cụ thể</Form.Label>
                          <Form.Control
                            type="text"
                            className={formErrors.address ? 'is-invalid' : ''}
                            placeholder="Nhập số nhà, đường, phường/xã"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                          {formErrors.address && (
                            <div className="invalid-feedback">{formErrors.address}</div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Số điện thoại</Form.Label>
                          <Form.Control
                            type="text"
                            className={formErrors.phone ? 'is-invalid' : ''}
                            placeholder="Nhập số điện thoại liên hệ"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                          {formErrors.phone && (
                            <div className="invalid-feedback">{formErrors.phone}</div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Ghi chú (tùy chọn)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Thêm ghi chú về đơn hàng hoặc giao hàng"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    {/* Xem trước địa chỉ giao hàng */}
                    {address && provinceCode && district && (
                      <div className="address-preview">
                        <div className="address-preview-title">
                          <FaMapMarkerAlt /> Địa chỉ giao hàng đã chọn:
                        </div>
                        <p>
                          {fullName}, {phone}<br />
                          {address}, {district}, {provinces.find(p => String(p.code) === String(provinceCode))?.name || ''}
                        </p>
                      </div>
                    )}
              </div>
              
              <div className="order-section">
                <h2>
                      <FaClock /> Thời Gian Giao Hàng
                </h2>
                    <Card className="delivery-card">
                      <Card.Body>
                        <Row>
                          <Col xs={2} className="text-center">
                            <FaTruckMoving className="delivery-icon" />
                          </Col>
                          <Col xs={10}>
                            <p className="delivery-estimate">Dự kiến giao hàng vào:</p>
                            <p className="delivery-date">{getEstimatedDeliveryDate()}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
              </div>
              
              <div className="order-section">
                <h2>
                      <FaMoneyBillWave /> Phương Thức Thanh Toán
                </h2>
                    <div className="payment-method-display">
                      <div className="payment-icon">
                        {paymentMethod === 'cash' && <FaMoneyBillWave />}
                        {paymentMethod === 'card' && <FaStore />}
                        {paymentMethod === 'bank' && <FaStore />}
                      </div>
                      <div className="payment-details">
                        <p className="payment-name">{getPaymentMethodDisplay()}</p>
                      </div>
                    </div>
              </div>
                </Col>
                
                <Col md={5}>
                  <div className="order-summary-card">
                    <div className="summary-header">
                      <h2>
                        <FaShoppingBag /> Thông Tin Đơn Hàng
                      </h2>
                      <span className="item-count">{items.length} sản phẩm</span>
              </div>
              
              <div className="order-items">
                {items.map((item) => (
                  <div key={item._id} className="order-item">
                          <div className="order-item-image">
                    <img 
                      src={formatImageUrl(item.image)} 
                      alt={item.name} 
                    />
                          </div>
                    <div className="order-item-details">
                      <h3>{item.name}</h3>
                            <p>Số lượng: {item.quantity}</p>
                            <p className="item-price">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-summary">
                <div className="summary-item">
                        <span>Tổng tiền hàng:</span>
                        <span>{formatPrice(itemsPrice)}</span>
                </div>
                
                <div className="summary-item">
                        <span>Phí vận chuyển:</span>
                        <span>{shippingPrice > 0 ? formatPrice(shippingPrice) : 'Miễn phí'}</span>
                </div>
                
                <div className="summary-item summary-total">
                        <span>Tổng thanh toán:</span>
                        <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
              
                    <div className="action-buttons">
              <button 
                        type="submit"
                className="purchase-btn"
                disabled={isLoading}
              >
                        {isLoading ? (
                          <>
                            <div className="spinner-container">
                              <FaSpinner className="spinner" />
                            </div>
                            ĐANG XỬ LÝ...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" /> XÁC NHẬN ĐẶT HÀNG
                          </>
                        )}
              </button>
              
              <button 
                        type="button"
                className="btn-secondary"
                onClick={() => navigate('/payment')}
              >
                        <FaArrowLeft className="me-2" /> QUAY LẠI
              </button>
            </div>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default OrderPage; 