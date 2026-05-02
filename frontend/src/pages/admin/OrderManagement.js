import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Badge, Table, Button, Form, 
  InputGroup, Pagination, Dropdown, Modal, Spinner, Alert,
  Tabs, Tab
} from 'react-bootstrap';
import { 
  FaSearch, FaFilter, FaSortUp, FaSortDown, FaSort,
  FaEye, FaEllipsisV, FaPrint, FaFileExport, FaShippingFast,
  FaTrashAlt, FaBoxOpen, FaClipboard, FaMoneyBill, FaCheck, FaTimes
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetAdminOrdersQuery, 
  useUpdateOrderToDeliveredMutation,
  useUpdateOrderToPaidMutation
} from '../../services/api';
import '../../styles/AdminTheme.css';
import './OrderManagement.css';

const OrderManagement = () => {
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minDate: '',
    maxDate: '',
    minTotal: '',
    maxTotal: '',
    paymentMethod: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  
  // State for order actions
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Prepare query params for API
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    status: activeTab !== 'all' ? activeTab : '',
    search: filters.search || '',
    startDate: filters.minDate || '',
    endDate: filters.maxDate || '',
    minTotal: filters.minTotal || 0,
    maxTotal: filters.maxTotal || undefined
  };
  
  // API hooks
  const { data: ordersResponse, isLoading, error, refetch } = useGetAdminOrdersQuery(queryParams);
  const [updateOrderToDelivered, { isLoading: isUpdatingDelivery }] = useUpdateOrderToDeliveredMutation();
  const [updateOrderToPaid, { isLoading: isUpdatingPayment }] = useUpdateOrderToPaidMutation();
  
  // Extract orders and pagination info from response
  const orders = ordersResponse?.orders || [];
  const pagination = ordersResponse?.pagination || {
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1
  };
  
  // Sample payment method options
  const paymentMethods = [
    { value: 'credit', label: 'Thẻ tín dụng' },
    { value: 'bank', label: 'Chuyển khoản ngân hàng' },
    { value: 'cod', label: 'Thanh toán khi giao hàng' },
    { value: 'momo', label: 'Ví MoMo' },
    { value: 'zalopay', label: 'ZaloPay' }
  ];
  
  // Order status options
  const statusOptions = [
    { value: 'placed', label: 'Đã đặt hàng', variant: 'info', index: 0 },
    { value: 'confirmed', label: 'Đã xác nhận', variant: 'primary', index: 1 },
    { value: 'processing', label: 'Đang xử lý', variant: 'secondary', index: 2 },
    { value: 'shipping', label: 'Đang giao hàng', variant: 'warning', index: 3 },
    { value: 'delivered', label: 'Đã giao hàng', variant: 'success', index: 4 },
    { value: 'cancelled', label: 'Đã hủy', variant: 'danger', index: 5 }
  ];
  
  // Format currency to GBP
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };
  
  // Handle filter submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    refetch();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      minDate: '',
      maxDate: '',
      minTotal: '',
      maxTotal: '',
      paymentMethod: ''
    });
    setCurrentPage(1);
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 when changing tabs
    // Update status in query params when tab changes
    if (tab !== 'all') {
      setFilters({...filters, status: tab});
    } else {
      setFilters({...filters, status: ''});
    }
  };
  
  // Sort orders
  const sortOrders = (orders) => {
    if (!orders) return [];
    
    const sortableOrders = [...orders];
    
    if (sortConfig.field) {
      sortableOrders.sort((a, b) => {
        if (sortConfig.field === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortConfig.direction === 'asc' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        if (a[sortConfig.field] < b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.field] > b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableOrders;
  };
  
  // Handle sort change
  const handleSort = (field) => {
    let direction = 'asc';
    
    if (sortConfig.field === field) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ field, direction });
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return <FaSort className="ms-1 text-muted" />;
    if (sortConfig.direction === 'asc') return <FaSortUp className="ms-1 text-primary" />;
    return <FaSortDown className="ms-1 text-primary" />;
  };
  
  // Get displayed orders
  const getDisplayedOrders = () => {
    if (!orders) return { orders: [], totalItems: 0 };
    
    // Apply sorting (server already handles filtering and pagination)
    const sorted = sortOrders(orders);
    
    return {
      orders: sorted,
      totalItems: pagination.totalCount
    };
  };
  
  // Handle mark as delivered
  const handleMarkAsDelivered = async (orderId) => {
    try {
      await updateOrderToDelivered(orderId).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };
  
  // Handle mark as paid
  const handleMarkAsPaid = async (orderId) => {
    try {
      await updateOrderToPaid({
        id: orderId,
        paymentResult: {
          id: 'ADMIN_MANUAL_' + Date.now(),
          status: 'COMPLETED',
          update_time: new Date().toISOString(),
          email_address: 'admin@example.com'
        }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };
  
  // Pagination controls
  const totalPages = pagination.totalPages;
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  // Handle change items per page
  const handleChangeItemsPerPage = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to page 1 when items per page changes
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(opt => opt.value === status) || 
                      { label: 'Không xác định', variant: 'secondary' };
    
    return (
      <Badge bg={statusObj.variant} className="admin-badge admin-badge-rounded">{statusObj.label}</Badge>
    );
  };
  
  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    const paymentObj = paymentMethods.find(pm => pm.value === method);
    return paymentObj ? paymentObj.label : method;
  };
  
  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-page-header admin-d-flex admin-justify-content-between admin-align-items-center admin-mb-4">
          <div>
            <h1 className="admin-page-title">Quản lý đơn hàng</h1>
            <p className="admin-text-muted">
              Quản lý tất cả đơn hàng và trạng thái giao hàng
            </p>
          </div>
          <Button variant="outline-primary" className="admin-btn">
            <FaFileExport className="admin-me-2" /> Xuất báo cáo
          </Button>
        </div>
        
        <Row>
          <Col lg={12}>
            <Card className="admin-card admin-mb-4">
              <Card.Body className="admin-p-0">
                <Tabs 
                  activeKey={activeTab} 
                  onSelect={tab => handleTabChange(tab)}
                  className="admin-tabs admin-mb-3"
                >
                  <Tab eventKey="all" title="Tất cả đơn hàng" />
                  <Tab eventKey="pending" title="Chờ xác nhận" />
                  <Tab eventKey="processing" title="Đang xử lý" />
                  <Tab eventKey="shipping" title="Đang giao hàng" />
                  <Tab eventKey="delivered" title="Đã giao hàng" />
                  <Tab eventKey="cancelled" title="Đã hủy" />
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="admin-mb-4">
          <Col md={8} xl={9}>
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, email..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="admin-form-control"
              />
              <Button variant="outline-primary" className="admin-btn" onClick={handleFilterSubmit}>
                <FaSearch />
              </Button>
              <Button 
                variant={showFilters ? "primary" : "outline-primary"}
                onClick={() => setShowFilters(!showFilters)}
                className="admin-btn"
              >
                <FaFilter /> Lọc
              </Button>
            </InputGroup>
          </Col>
          <Col md={4} xl={3} className="d-flex justify-content-md-end mt-3 mt-md-0">
            <Form.Select 
              className="admin-form-control"
              value={itemsPerPage}
              onChange={handleChangeItemsPerPage}
            >
              <option value={20}>20 đơn hàng</option>
              <option value={50}>50 đơn hàng</option>
              <option value={100}>100 đơn hàng</option>
              <option value={200}>200 đơn hàng</option>
            </Form.Select>
          </Col>
        </Row>
        
        {showFilters && (
          <Card className="admin-card admin-mb-4">
            <Card.Body>
              <h5 className="admin-mb-3">Bộ lọc nâng cao</h5>
              <Form onSubmit={handleFilterSubmit}>
              <Row>
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="admin-form-control"
                    >
                      <option value="">Tất cả trạng thái</option>
                      {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Phương thức thanh toán</Form.Label>
                    <Form.Select
                      name="paymentMethod"
                      value={filters.paymentMethod}
                      onChange={handleFilterChange}
                      className="admin-form-control"
                    >
                      <option value="">Tất cả phương thức</option>
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                      <Form.Label>Thời gian đặt hàng</Form.Label>
                    <div className="admin-d-flex">
                      <Form.Control
                        type="date"
                          placeholder="Từ ngày"
                        name="minDate"
                        value={filters.minDate}
                        onChange={handleFilterChange}
                        className="admin-form-control admin-me-2"
                      />
                      <Form.Control
                        type="date"
                          placeholder="Đến ngày"
                        name="maxDate"
                        value={filters.maxDate}
                        onChange={handleFilterChange}
                        className="admin-form-control"
                      />
                    </div>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Giá trị đơn hàng (GBP)</Form.Label>
                    <div className="admin-d-flex">
                      <Form.Control
                        type="number"
                        placeholder="Từ"
                        name="minTotal"
                        value={filters.minTotal}
                        onChange={handleFilterChange}
                        className="admin-form-control admin-me-2"
                      />
                      <Form.Control
                        type="number"
                        placeholder="Đến"
                        name="maxTotal"
                        value={filters.maxTotal}
                        onChange={handleFilterChange}
                        className="admin-form-control"
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="admin-d-flex admin-justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                  className="admin-btn admin-me-2"
                    type="button"
                >
                  Xóa bộ lọc
                </Button>
                <Button 
                  variant="primary"
                    type="submit"
                  className="admin-btn"
                >
                  Áp dụng
                </Button>
              </div>
              </Form>
            </Card.Body>
          </Card>
        )}
        
        <Card className="admin-card admin-mb-4">
          <Card.Body className="admin-p-0">
        {isLoading ? (
          <div className="text-center admin-py-5">
            <Spinner animation="border" variant="primary" />
                <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
              <Alert variant="danger" className="m-3">
                <Alert.Heading>Lỗi tải dữ liệu</Alert.Heading>
                <p>{error.message || 'Có lỗi xảy ra khi tải dữ liệu đơn hàng'}</p>
          </Alert>
        ) : (
              <div className="admin-table-responsive">
                <Table hover className="admin-table admin-mb-0">
                  <thead className="admin-thead">
                    <tr>
                      <th onClick={() => handleSort('_id')} className="admin-sortable">
                        Mã đơn hàng {getSortIcon('_id')}
                      </th>
                      <th onClick={() => handleSort('user.name')} className="admin-sortable">
                        Khách hàng {getSortIcon('user.name')}
                      </th>
                      <th onClick={() => handleSort('createdAt')} className="admin-sortable">
                        Ngày đặt {getSortIcon('createdAt')}
                      </th>
                      <th onClick={() => handleSort('totalPrice')} className="admin-sortable">
                        Tổng tiền {getSortIcon('totalPrice')}
                      </th>
                      <th onClick={() => handleSort('status')} className="admin-sortable">
                        Trạng thái {getSortIcon('status')}
                      </th>
                      <th onClick={() => handleSort('paymentMethod')} className="admin-sortable">
                        Thanh toán {getSortIcon('paymentMethod')}
                      </th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDisplayedOrders().orders.map((order, index) => (
                      <tr key={order._id}>
                        <td>
                          <span className="admin-order-id">
                            #{order.orderNumber || order._id.substring(0, 8)}
                          </span>
                        </td>
                        <td>
                          <div className="admin-customer-info">
                            <span className="admin-customer-name">
                              {order.user?.name || 'Khách vãng lai'}
                            </span>
                            {order.user?.email && (
                              <span className="admin-customer-email">{order.user.email}</span>
                            )}
                          </div>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{formatCurrency(order.totalPrice)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          {order.isPaid ? (
                            <Badge bg="success">Đã thanh toán</Badge>
                          ) : (
                            <Badge bg="warning" text="dark">Chưa thanh toán</Badge>
                          )}
                        </td>
                        <td>
                          <div className="admin-order-actions">
                            <Button 
                              variant="light"
                              className="admin-btn admin-btn-icon admin-btn-sm admin-me-1"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailsModal(true);
                              }}
                            >
                              <FaEye />
                            </Button>
                            <Link 
                              to={`/admin/orders/print/${order._id}`} 
                              className="admin-btn admin-btn-icon admin-btn-sm admin-btn-outline admin-me-1"
                              target="_blank"
                            >
                              <FaPrint />
                            </Link>
                            
                            <Dropdown>
                              <Dropdown.Toggle 
                                variant="light" 
                                id={`dropdown-${order._id}`}
                                className="admin-btn admin-btn-icon admin-btn-sm"
                              >
                                <FaEllipsisV />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                {!order.isDelivered && (
                                  <Dropdown.Item 
                                    onClick={() => handleMarkAsDelivered(order._id)}
                                    className="admin-dropdown-item"
                                  >
                                    <FaShippingFast className="admin-me-2" /> Đánh dấu đã giao
                                  </Dropdown.Item>
                                )}
                                {!order.isPaid && (
                                  <Dropdown.Item 
                                    onClick={() => handleMarkAsPaid(order._id)}
                                    className="admin-dropdown-item"
                                  >
                                    <FaMoneyBill className="admin-me-2" /> Đánh dấu đã thanh toán
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
            )}
              
            {!isLoading && getDisplayedOrders().orders.length === 0 && (
                <div className="text-center admin-py-5">
                  <FaBoxOpen className="admin-empty-icon" />
                  <h4>Không tìm thấy đơn hàng nào</h4>
                  <p className="text-muted">Hãy thử thay đổi bộ lọc để tìm kiếm đơn hàng</p>
                </div>
              )}
              
            {!isLoading && pagination.totalCount > 0 && (
              <Card.Footer className="admin-d-flex admin-justify-content-between admin-align-items-center">
                <div className="admin-text-muted">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalCount)} trên {pagination.totalCount} đơn hàng
                </div>
                <Pagination className="admin-mb-0">
                  <Pagination.Prev 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  />
                  
                  {getPageNumbers().map(page => (
                    <Pagination.Item 
                      key={page}
                      active={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Pagination.Item>
                  ))}
                  
                  <Pagination.Next 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Card.Footer>
            )}
          </Card.Body>
            </Card>
      </div>
      
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="admin-mb-4">
                <Col md={6}>
                  <div className="admin-order-detail-section">
                    <h5 className="admin-order-detail-title">Thông tin đơn hàng</h5>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Mã đơn hàng:</div>
                      <div className="admin-order-detail-value admin-fw-bold">
                        {selectedOrder._id}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Ngày đặt hàng:</div>
                      <div className="admin-order-detail-value">
                        {formatDate(selectedOrder.createdAt)}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Trạng thái:</div>
                      <div className="admin-order-detail-value">
                        {getStatusBadge(selectedOrder.status || 'placed')}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Thanh toán:</div>
                      <div className="admin-order-detail-value">
                        {selectedOrder.isPaid ? (
                          <Badge bg="success">Đã thanh toán</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">Chưa thanh toán</Badge>
                        )}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Phương thức:</div>
                      <div className="admin-order-detail-value">
                        {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="admin-order-detail-section">
                    <h5 className="admin-order-detail-title">Thông tin khách hàng</h5>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Tên:</div>
                      <div className="admin-order-detail-value">
                        {selectedOrder.user?.name || selectedOrder.shippingAddress?.fullName || 'Không có thông tin'}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Email:</div>
                      <div className="admin-order-detail-value">
                        {selectedOrder.user?.email || 'Không có thông tin'}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Địa chỉ:</div>
                      <div className="admin-order-detail-value">
                        {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <div className="admin-order-detail-label">Số điện thoại:</div>
                      <div className="admin-order-detail-value">
                        {selectedOrder.shippingAddress?.phone || 'Không có thông tin'}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="admin-order-detail-section">
                <h5 className="admin-order-detail-title">Sản phẩm</h5>
                <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-end">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                    {selectedOrder.orderItems.map((item, index) => (
                      <tr key={index}>
                          <td>
                          <div className="d-flex align-items-center">
                              {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="admin-product-image-sm" 
                              />
                            )}
                            <span>{item.name}</span>
                            </div>
                          </td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-end">{formatCurrency(item.price)}</td>
                          <td className="text-end">{formatCurrency(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                      <td colSpan={3} className="text-end admin-fw-bold">Tạm tính:</td>
                      <td className="text-end">{formatCurrency(selectedOrder.itemsPrice)}</td>
                      </tr>
                        <tr>
                      <td colSpan={3} className="text-end admin-fw-bold">Phí vận chuyển:</td>
                          <td className="text-end">{formatCurrency(selectedOrder.shippingPrice)}</td>
                        </tr>
                      {selectedOrder.taxPrice > 0 && (
                        <tr>
                        <td colSpan={3} className="text-end admin-fw-bold">Thuế:</td>
                          <td className="text-end">{formatCurrency(selectedOrder.taxPrice)}</td>
                        </tr>
                      )}
                    {selectedOrder.discountPrice > 0 && (
                      <tr>
                        <td colSpan={3} className="text-end admin-fw-bold">Giảm giá:</td>
                        <td className="text-end">-{formatCurrency(selectedOrder.discountPrice)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="text-end admin-fw-bold">Tổng cộng:</td>
                        <td className="text-end admin-fw-bold">{formatCurrency(selectedOrder.totalPrice)}</td>
                      </tr>
                    </tfoot>
                  </Table>
              </div>
              
              {selectedOrder.note && (
                <div className="admin-order-detail-section">
                  <h5 className="admin-order-detail-title">Ghi chú</h5>
                  <div className="admin-p-3 admin-bg-light">
                    {selectedOrder.note}
                </div>
              </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
            Đóng
          </Button>
          <Link 
            to={selectedOrder ? `/admin/orders/print/${selectedOrder._id}` : '#'} 
            className="btn btn-primary"
            target="_blank"
            >
            <FaPrint className="me-2" /> In đơn hàng
          </Link>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default OrderManagement; 