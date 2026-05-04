import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Dropdown, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaEye, FaShippingFast, FaCheck, FaTimes, FaAngleDown, FaExclamationTriangle, FaSync, FaCalendar, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../../services/api';
import './OrderList.css';

const OrderList = () => {
  const [forceRefresh, setForceRefresh] = useState(0); // Force refetch
  
  const { data: ordersData, isLoading, error, refetch } = useGetAdminOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 10000, // Poll more frequently (every 10 seconds)
    skip: false,
  });
  
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  
  // State cho bộ lọc thời gian
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // State cho modal xác nhận thay đổi trạng thái
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật state orders khi ordersData thay đổi
  useEffect(() => {
    if (ordersData) {
      console.log('Orders data updated:', ordersData);
      setOrders(ordersData);
    }
  }, [ordersData]);

  // Force refresh khi cần thiết
  useEffect(() => {
    refetch();
  }, [forceRefresh]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Parse date string to Date object, handling timezone
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date;
  };

  // Định dạng tên hiển thị cho phương thức thanh toán
  const formatPaymentMethod = (method) => {
    if (!method) return 'Tiền mặt khi nhận hàng';
    
    switch(method.toLowerCase()) {
      case 'cod':
        return 'Tiền mặt khi nhận hàng';
      case 'credit card':
        return 'Thẻ tín dụng';
      case 'bank transfer':
        return 'Chuyển khoản ngân hàng';
      case 'e-wallet':
        return 'Ví điện tử';
      default:
        return method;
    }
  };

  // Định dạng tên hiển thị cho trạng thái
  const formatStatus = (status) => {
    if (!status) return 'Chờ xử lý';
    
    switch(status.toLowerCase()) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      case 'paid':
        return 'Đã thanh toán';
      default:
        return status;
    }
  };

  const getStatusBadge = (status) => {
    const formattedStatus = formatStatus(status);
    let variant;
    
    switch(status?.toLowerCase()) {
      case 'delivered':
        variant = 'success';
        break;
      case 'shipped':
        variant = 'info';
        break;
      case 'processing':
        variant = 'primary';
        break;
      case 'pending':
        variant = 'warning';
        break;
      case 'cancelled':
        variant = 'danger';
        break;
      case 'paid':
        variant = 'secondary';
        break;
      default:
        variant = 'secondary';
    }
    return <Badge bg={variant}>{formattedStatus}</Badge>;
  };

  // Filter orders based on status and date range
  const getFilteredOrders = () => {
    if (!orders || !orders.length) return [];
    
    return orders.filter(order => {
      // Filter by status
      const statusMatch = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      
      // Filter by date range
      let dateMatch = true;
      const orderDate = parseDate(order.createdAt || order.date);
      
      if (startDate && orderDate) {
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0, 0, 0, 0); // Start of day
        if (orderDate < filterStartDate) {
          dateMatch = false;
        }
      }
      
      if (endDate && orderDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999); // End of day
        if (orderDate > filterEndDate) {
          dateMatch = false;
        }
      }
      
      return statusMatch && dateMatch;
    });
  };

  // Toggle date filter visibility
  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };

  // Reset date filters
  const resetDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  // Mở modal cập nhật trạng thái
  const openStatusModal = (order, status) => {
    setSelectedOrder(order);
    setNewStatus(status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  // Làm mới dữ liệu
  const handleForceRefresh = () => {
    setForceRefresh(prev => prev + 1);
    refetch();
    // Thêm setTimeout để đảm bảo UI sẽ được làm mới sau khi API trả về kết quả
    setTimeout(() => {
      window.location.reload(); // Force refresh toàn trang nếu cần
    }, 1000);
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setIsSubmitting(true);
    try {
      // Đơn giản hóa payload theo đúng yêu cầu của API
      const payload = {
        id: selectedOrder._id || selectedOrder.id,
        status: newStatus
      };
      
      // Chỉ thêm note nếu có giá trị
      if (statusNote.trim()) {
        payload.note = statusNote.trim();
      }
      
      console.log('Sending update with payload:', payload);
      
      const result = await updateOrderStatus(payload).unwrap();
      console.log('Update status result:', result);
      
      // Cập nhật trạng thái trong state local ngay lập tức
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if ((order._id || order.id) === (selectedOrder._id || selectedOrder.id)) {
            return {...order, status: newStatus};
          }
          return order;
        })
      );
      
      // Đóng modal trước
      setShowStatusModal(false);
      
      // Thông báo thành công
      alert(`Đơn hàng #${(selectedOrder._id || selectedOrder.id).slice(-6)} đã được cập nhật thành "${formatStatus(newStatus)}"`);
      
      // Đảm bảo dữ liệu được cập nhật từ server bằng nhiều cách
      refetch().then(() => {
        console.log("Refetch completed after status update");
        setForceRefresh(prev => prev + 1); // Force another refetch
      });
      
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(`Không thể cập nhật trạng thái đơn hàng. Lỗi: ${err.data?.message || err.error || 'Lỗi không xác định'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danh sách các trạng thái đơn hàng
  const orderStatuses = [
    { value: 'pending', label: 'Chờ xử lý', variant: 'warning' },
    { value: 'processing', label: 'Đang xử lý', variant: 'primary' },
    { value: 'shipped', label: 'Đang giao', variant: 'info' },
    { value: 'delivered', label: 'Đã giao', variant: 'success' },
    { value: 'cancelled', label: 'Đã hủy', variant: 'danger' },
    { value: 'paid', label: 'Đã thanh toán', variant: 'secondary' }
  ];

  // Kiểm tra xem trạng thái mới có hợp lệ không
  const isValidStatusTransition = (currentStatus, newStatus) => {
    // Logic kiểm tra chuyển đổi trạng thái
    if (currentStatus === newStatus) return false;
    
    // Không cho phép chuyển từ đã hủy hoặc đã giao sang trạng thái khác
    if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
      return newStatus === 'pending'; // Chỉ cho phép đặt lại về chờ xử lý
    }
    
    return true;
  };

  return (
    <AdminLayout>
      <div className="order-list">
        <div className="order-list-header">
          <h1>Quản lý đơn hàng</h1>
          <div className="d-flex">
          <Button 
            variant="success" 
            className="mb-3 d-flex align-items-center" 
            onClick={handleForceRefresh}
            disabled={isLoading || isUpdating}
          >
            <FaSync className={isLoading ? "me-2 spin-animation" : "me-2"} /> 
            {isLoading ? "Đang làm mới..." : "Làm mới dữ liệu"}
          </Button>
          
          <Button 
            variant={showDateFilter ? "primary" : "outline-primary"}
            className="mb-3 ms-2 d-flex align-items-center"
            onClick={toggleDateFilter}
          >
            <FaCalendar className="me-2" /> 
            Lọc theo thời gian
          </Button>
          </div>
          
          {/* Date filter form */}
          {showDateFilter && (
            <div className="date-filter-container p-3 mb-3 border rounded">
              <Row>
                <Col md={5}>
                  <Form.Group className="mb-2">
                    <Form.Label>Từ ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-2">
                    <Form.Label>Đến ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button variant="outline-secondary" className="mb-2 me-2" onClick={resetDateFilters}>
                    Xóa
                  </Button>
                  <Button variant="primary" className="mb-2" onClick={() => refetch()}>
                    <FaSearch /> Lọc
                  </Button>
                </Col>
              </Row>
              
              {startDate && endDate && (
                <div className="mt-2">
                  <Badge bg="info">
                    Đang lọc: {startDate} đến {endDate}
                  </Badge>
                </div>
              )}
              {startDate && !endDate && (
                <div className="mt-2">
                  <Badge bg="info">
                    Đang lọc: từ {startDate}
                  </Badge>
                </div>
              )}
              {!startDate && endDate && (
                <div className="mt-2">
                  <Badge bg="info">
                    Đang lọc: đến {endDate}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          <div className="filter-buttons mb-3">
            <Button 
              variant={statusFilter === 'all' ? 'primary' : 'outline-primary'} 
              className="me-2"
              onClick={() => setStatusFilter('all')}
            >
              Tất cả
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? 'warning' : 'outline-warning'} 
              className="me-2"
              onClick={() => setStatusFilter('pending')}
            >
              Chờ xử lý
            </Button>
            <Button 
              variant={statusFilter === 'processing' ? 'info' : 'outline-info'} 
              className="me-2"
              onClick={() => setStatusFilter('processing')}
            >
              Đang xử lý
            </Button>
            <Button 
              variant={statusFilter === 'shipped' ? 'primary' : 'outline-primary'} 
              className="me-2"
              onClick={() => setStatusFilter('shipped')}
            >
              Đang giao
            </Button>
            <Button 
              variant={statusFilter === 'delivered' ? 'success' : 'outline-success'} 
              className="me-2"
              onClick={() => setStatusFilter('delivered')}
            >
              Đã giao
            </Button>
            <Button 
              variant={statusFilter === 'cancelled' ? 'danger' : 'outline-danger'} 
              className="me-2"
              onClick={() => setStatusFilter('cancelled')}
            >
              Đã hủy
            </Button>
            <Button 
              variant={statusFilter === 'paid' ? 'secondary' : 'outline-secondary'} 
              className="me-2"
              onClick={() => setStatusFilter('paid')}
            >
              Đã thanh toán
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải danh sách đơn hàng: {error.message || 'Lỗi không xác định'}</span>
              <Button variant="outline-danger" size="sm" onClick={handleForceRefresh}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Số lượng SP</th>
                <th>Tổng tiền</th>
                <th>Phương thức thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredOrders().map(order => {
                // Trích xuất dữ liệu đơn hàng từ các định dạng khác nhau
                const orderId = order._id || order.id || 'Không có';
                const orderNumber = order.orderNumber || `#${orderId.slice(-6)}`;
                
                // Lấy thông tin khách hàng từ cả định dạng API thực tế và mẫu
                const customerName = order.user?.name || order.shippingAddress?.name || 'Khách lẻ';
                
                // Lấy số lượng sản phẩm từ nhiều nơi có thể có
                const itemsCount = order.orderItems?.length || 
                                  (order.items?.length ? order.items.length :
                                   (Array.isArray(order.items) ? order.items.length : order.items || 0));
                
                // Tính tổng tiền
                const totalPrice = order.totalPrice || order.total || 0;
                
                // Trạng thái hiện tại
                const currentStatus = (order.status || 'pending').toLowerCase();
                
                return (
                  <tr key={orderId} className={`status-${currentStatus}`}>
                    <td>{orderNumber}</td>
                    <td>{customerName}</td>
                    <td>{formatDate(order.createdAt || order.date)}</td>
                    <td>{itemsCount}</td>
                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'GBP' }).format(totalPrice)}</td>
                    <td>{formatPaymentMethod(order.paymentMethod)}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle 
                          variant={currentStatus === 'cancelled' ? 'danger' : 
                                 currentStatus === 'delivered' ? 'success' : 
                                 currentStatus === 'shipped' ? 'info' : 
                                 currentStatus === 'processing' ? 'primary' :
                                 currentStatus === 'paid' ? 'secondary' : 'warning'} 
                          size="sm" 
                          id={`dropdown-status-${orderId}`} 
                          className="w-100 d-flex align-items-center justify-content-between"
                        >
                          {getStatusBadge(currentStatus)}
                          <span className="ms-1"><FaAngleDown /></span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Header>Thay đổi trạng thái</Dropdown.Header>
                          {orderStatuses.map(status => (
                            <Dropdown.Item 
                              key={status.value} 
                              onClick={() => openStatusModal(order, status.value)}
                              disabled={!isValidStatusTransition(currentStatus, status.value)}
                              className={status.value === currentStatus ? 'active' : ''}
                            >
                              <Badge bg={status.variant} className="me-2">{status.label}</Badge>
                              {status.value === currentStatus && <span className="ms-2">(Hiện tại)</span>}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                    <td className="order-actions">
                      <Link to={`/admin/orders/${orderId}`} className="btn btn-info btn-sm me-1">
                        <FaEye /> Chi tiết
                    </Link>
                    </td>
                  </tr>
                );
              })}
              {getFilteredOrders().length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Không tìm thấy đơn hàng nào {statusFilter !== 'all' ? `với trạng thái "${formatStatus(statusFilter)}"` : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal xác nhận thay đổi trạng thái */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật trạng thái đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng <strong>{selectedOrder?.orderNumber || (selectedOrder && `#${(selectedOrder._id || selectedOrder.id).slice(-6)}`)}</strong> sang <strong>{formatStatus(newStatus)}</strong>?</p>
          
          {newStatus === 'cancelled' && (
            <Alert variant="warning">
              <FaExclamationTriangle className="me-2" />
              Lưu ý: Hủy đơn hàng sẽ không thể hoàn tác. Các sản phẩm sẽ được trả lại kho.
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Ghi chú (tùy chọn)</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="Nhập ghi chú hoặc lý do thay đổi trạng thái"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Hủy bỏ
          </Button>
          <Button 
            variant={newStatus === 'cancelled' ? 'danger' : 'primary'} 
            onClick={handleUpdateStatus}
            disabled={isSubmitting}
          >
            {isSubmitting && <Spinner animation="border" size="sm" className="me-2" />}
            {newStatus === 'cancelled' ? 'Xác nhận hủy đơn' : 'Cập nhật trạng thái'}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default OrderList; 