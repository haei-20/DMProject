import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Pagination } from 'react-bootstrap';
import { 
  FaSearch, 
  FaSort, 
  FaFilter, 
  FaFileInvoice, 
  FaCalendarAlt, 
  FaIdCard,
  FaBox,
  FaShoppingBag,
  FaCheckCircle,
  FaHourglassHalf,
  FaShippingFast,
  FaTimesCircle
} from 'react-icons/fa';
import { useGetOrdersQuery } from '../services/api';
import { formatPrice, formatDate } from '../utils/productHelpers';
import Layout from '../components/Layout';
import EmptyOrderPage from './EmptyOrderPage';
import './OrdersPage.css';

const OrdersPage = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  
  // Fetch orders data
  const { data, error: fetchError, isLoading, refetch } = useGetOrdersQuery();
  
  // Make sure we properly extract orders from the API response
  // It could be either data directly as array, or data.orders as array
  const ordersArray = Array.isArray(data) ? data : data?.orders || [];
  
  // Filter orders based on status and search term
  const filteredOrders = ordersArray.filter(order => {
    // Status filter
    const statusMatch = 
      filterStatus === 'all' ? true : (order?.status?.toLowerCase() === filterStatus);
    
    // Search filter
    const searchMatch = searchTerm.trim() === '' ? true : 
      (order?._id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (order?.orderItems || []).some(item => item?.name?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    return statusMatch && searchMatch;
  });
  
  // Sort orders based on user selection
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortOrder === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortOrder === 'highest') {
      return (b.totalPrice || 0) - (a.totalPrice || 0);
    } else {
      return (a.totalPrice || 0) - (b.totalPrice || 0);
    }
  });
  
  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);
  
  // Calculate order stats
  const orderStats = {
    total: ordersArray.length || 0,
    pending: ordersArray.filter(order => order?.status === 'pending')?.length || 0,
    delivered: ordersArray.filter(order => order?.status === 'delivered')?.length || 0,
    processing: ordersArray.filter(order => 
      order?.status === 'processing' || order?.status === 'shipped'
    )?.length || 0
  };
  
  // Get badge class based on order status
  const getStatusClass = (status) => {
    if (!status) return 'status-unknown';
    
    switch(status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  };
  
  // Get status indicator class for timeline
  const getStatusIndicatorClass = (status) => {
    if (!status) return 'status-indicator-unknown';
    
    switch(status?.toLowerCase()) {
      case 'pending': return 'status-indicator-pending';
      case 'processing': return 'status-indicator-processing';
      case 'shipped': return 'status-indicator-shipped';
      case 'delivered': return 'status-indicator-delivered';
      case 'cancelled': return 'status-indicator-cancelled';
      default: return 'status-indicator-unknown';
    }
  };
  
  // Format order status display text
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Return the current step in order process
  const getOrderStep = (status) => {
    if (!status) return 0;
    
    switch(status.toLowerCase()) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 0;
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <Container className="py-5 text-center">
          <div className="spinner-container">
            <div className="fancy-spinner">
              <div></div>
              <div></div>
            </div>
            <p className="loading-text">Loading your order history...</p>
          </div>
        </Container>
      </Layout>
    );
  }
  
  if (fetchError) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="error-container">
            <h2 className="error-title">Không thể tải dữ liệu các đơn hàng</h2>
            <p className="error-message">Đã xảy ra sự cố khi truy xuất lịch sử đơn hàng của bạn. Vui lòng thử lại sau.</p>
            <button className="btn btn-primary retry-btn" onClick={refetch}>
              Tải lại
            </button>
          </div>
        </Container>
      </Layout>
    );
  }
  
  if (!ordersArray || ordersArray.length === 0) {
    return <EmptyOrderPage />;
  }
  
  return (
    <Layout>
      <Container className="py-4 orders-container">
        {/* Page Header */}
        <div className="page-header text-center">
          <h1 className="orders-title">Đơn hàng của tôi</h1>
          <p className="orders-subtitle">Xem và kiểm tra đơn hàng của bạn</p>
          
          <div className="orders-stats">
            <div className="stat-item">
              <span className="stat-number">{orderStats.total}</span>
              <span className="stat-label">Tổng</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{orderStats.pending}</span>
              <span className="stat-label">Chờ xử lý</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{orderStats.processing}</span>
              <span className="stat-label">Đang xử lý</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{orderStats.delivered}</span>
              <span className="stat-label">Đã giao</span>
            </div>
          </div>
        </div>
        
        {/* Filter section */}
        <div className="filter-section">
          <Card className="filter-card">
            <Card.Body>
              <Row>
                <Col md={5} className="mb-3 mb-md-0">
                  <div className="position-relative">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text"
                      className="form-control search-input"
                      placeholder="Search orders by ID or product name..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                    />
                  </div>
                </Col>
                
                <Col md={7}>
                  <div className="d-flex justify-content-md-end">
                    <div className="me-3 select-wrapper">
                      <FaSort className="filter-icon" />
                      <select 
                        className="select-control"
                        value={sortOrder}
                        onChange={(e) => {
                          setSortOrder(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="highest">Giá (Cao tới thấp)</option>
                        <option value="lowest">Price (Thấp tới cao)</option>
                      </select>
                    </div>
                    
                    <div className="select-wrapper">
                      <FaFilter className="filter-icon" />
                      <select 
                        className="select-control"
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">Tất cả đơn hàng</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã gửi hàng</option>
                        <option value="delivered">Đã giao</option>
                        <option value="cancelled">Đã hủy</option>

                      </select>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
        
        {/* Orders List */}
        <div className="orders-list">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-4">
              <p>Không tìm thấy đơn hàng phù hợp với tìm kiếm.</p>
            </div>
          ) : (
            currentOrders.map((order) => (
              <Card key={order._id || `order-${Math.random()}`} className="order-card">
                <div className={`status-indicator ${getStatusIndicatorClass(order.status)}`}></div>
                
                <Card.Header>
                  <Row>
                    <Col>
                      <div className="order-id">
                        <FaIdCard size={16} className="me-2" />
                        ID đơn hàng: <strong>{order._id || 'N/A'}</strong>
                      </div>
                    </Col>
                    <Col className="text-md-center">
                      <div className="order-date">
                        <FaCalendarAlt size={16} className="me-2" />
                        Thời gian: <strong>{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</strong>
                      </div>
                    </Col>
                    <Col className="text-md-end">
                      <Badge className={`status-badge ${getStatusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </Badge>
                    </Col>
                  </Row>
                </Card.Header>
                
                <Card.Body>
                  <div className="order-content">
                    {/* Order Items */}
                    <div className="order-items-container">
                      <div className="items-header">
                        <FaBox size={18} className="me-2" />
                        <h6 className="items-title">Các sản phẩm</h6>
                        <div className="item-count-badge">
                          {(order.orderItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0)}
                        </div>
                      </div>
                      
                      <div className="d-flex">
                        <div className="order-items-preview">
                          {(order.orderItems || []).slice(0, 3).map((item, index) => (
                            <div key={index} className="order-item-image">
                              <img src={item.image || '/images/product-placeholder.png'} alt={item.name || 'Product'} />
                            </div>
                          ))}
                          {(order.orderItems || []).length > 3 && (
                            <div className="order-item-more">
                              +{order.orderItems.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="item-details">
                        <ul className="item-products-list">
                          {(order.orderItems || []).slice(0, 3).map((item, index) => (
                            <li key={index} className="item-product">
                              <span className="item-product-name">{item.name || 'Product'}</span>
                              <span className="item-product-qty">x{item.quantity || 1}</span>
                            </li>
                          ))}
                          {(order.orderItems || []).length > 3 && (
                            <li className="item-product">
                              <span className="item-product-name">và {order.orderItems.length - 3} xem thêm ...</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      {/* Order Timeline */}
                      <div className="order-timeline">
                        <div className={`timeline-step ${getOrderStep(order.status) >= 1 ? 'timeline-step-active' : ''}`}>
                          <div className="timeline-step-icon">
                            <FaShoppingBag size={12} />
                          </div>
                          <div className="timeline-step-label">Đã đặt hàng</div>
                        </div>
                        <div className={`timeline-step ${getOrderStep(order.status) >= 2 ? 'timeline-step-active' : ''}`}>
                          <div className="timeline-step-icon">
                            <FaHourglassHalf size={12} />
                          </div>
                          <div className="timeline-step-label">Đang xử lý</div>
                        </div>
                        <div className={`timeline-step ${getOrderStep(order.status) >= 3 ? 'timeline-step-active' : ''}`}>
                          <div className="timeline-step-icon">
                            <FaShippingFast size={12} />
                          </div>
                          <div className="timeline-step-label">Đã vận chuyển</div>
                        </div>
                        <div className={`timeline-step ${getOrderStep(order.status) >= 4 ? 'timeline-step-active' : ''}`}>
                          <div className="timeline-step-icon">
                            <FaCheckCircle size={12} />
                          </div>
                          <div className="timeline-step-label">Đã giao</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Summary */}
                    <div className="order-summary">
                      <div className="price-container">
                        <h5 className="order-price">{formatPrice(order.totalPrice || 0)}</h5>
                        <div className="order-price-label">Tổng số tiền</div>
                      </div>
                      
                      <div className="summary-details">
                        <div className="summary-item">
                          <span className="summary-item-label">Giá các sản phẩm</span>
                          <span className="summary-item-value">{formatPrice(order.itemsPrice || 0)}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-item-label">Đang vận chuyển</span>
                          <span className="summary-item-value">{formatPrice(order.shippingPrice || 0)}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-total-label">Tổng cộng</span>
                          <span className="summary-total-value">{formatPrice(order.totalPrice || 0)}</span>
                        </div>
                      </div>
                      
                      <div className="buttons-container">
                        <Link 
                          to={`/order-status/${order._id || ''}`} 
                          className="btn btn-outline-primary view-details-btn"
                        >
                          Xem chi tiết
                        </Link>
                        
                        {order.status === 'delivered' && (
                          <button className="invoice-btn">
                            <FaFileInvoice className="invoice-icon" />
                            Hóa đơn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="orders-pagination">
            <Pagination>
              <Pagination.First 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Display current page, and pages +/- 1 from current
                if (
                  pageNum === 1 || 
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <Pagination.Item 
                      key={pageNum} 
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} />;
                }
                return null;
              })}
              
              <Pagination.Next 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default OrdersPage; 