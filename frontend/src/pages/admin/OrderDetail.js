import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useGetOrderByIdQuery } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency } from '../../utils/formatters';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const { data: order, isLoading, error, refetch } = useGetOrderByIdQuery(id, {
    refetchOnMountOrArgChange: true
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('Order detail for ID:', id);
    refetch();
  }, [id, refreshKey]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

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
    return <Badge bg={variant}>{formatStatus(status)}</Badge>;
  };

  // Format payment method
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger">
          <Alert.Heading>Lỗi khi tải thông tin đơn hàng</Alert.Heading>
          <p>{error.message || JSON.stringify(error)}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={handleRefresh} variant="outline-danger">
              Thử lại
            </Button>
          </div>
        </Alert>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <Alert variant="warning">
          <Alert.Heading>Không tìm thấy đơn hàng</Alert.Heading>
          <p>Không thể tìm thấy đơn hàng với ID: {id}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={handleRefresh} variant="outline-warning">
              Thử lại
            </Button>
          </div>
        </Alert>
      </AdminLayout>
    );
  }

  // Extract data - handle different possible formats
  const orderItems = order.orderItems || order.items || [];
  const shippingAddress = order.shippingAddress || {};
  const totalPrice = order.totalPrice || order.total || 0;

  return (
    <AdminLayout>
      <div className="order-detail-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Chi tiết đơn hàng {order.orderNumber || `#${(order._id || order.id).slice(-6)}`}</h1>
          <Button variant="outline-primary" onClick={handleRefresh}>
            Làm mới
          </Button>
        </div>

        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Thông tin đơn hàng</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Mã đơn hàng:</strong> {order.orderNumber || `#${(order._id || order.id).slice(-6)}`}</p>
                    <p><strong>Ngày đặt:</strong> {formatDate(order.createdAt || order.date)}</p>
                    <p>
                      <strong>Trạng thái:</strong> {getStatusBadge(order.status)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Phương thức thanh toán:</strong> {formatPaymentMethod(order.paymentMethod)}</p>
                    <p><strong>Đã thanh toán:</strong> {order.isPaid ? formatDate(order.paidAt) : 'Chưa thanh toán'}</p>
                    <p><strong>Đã giao hàng:</strong> {order.isDelivered ? formatDate(order.deliveredAt) : 'Chưa giao hàng'}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header>
                <h5>Thông tin khách hàng</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>Tên khách hàng:</strong> {order.user?.name || shippingAddress.name || 'N/A'}</p>
                <p><strong>Email:</strong> {order.user?.email || shippingAddress.email || 'N/A'}</p>
                <p><strong>Số điện thoại:</strong> {shippingAddress.phone || 'N/A'}</p>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header>
                <h5>Địa chỉ giao hàng</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>Địa chỉ:</strong> {shippingAddress.address || 'N/A'}</p>
                <p><strong>Thành phố:</strong> {shippingAddress.city || 'N/A'}</p>
                <p><strong>Quận/Huyện:</strong> {shippingAddress.district || 'N/A'}</p>
                <p><strong>Phường/Xã:</strong> {shippingAddress.ward || 'N/A'}</p>
                <p><strong>Mã bưu điện:</strong> {shippingAddress.postalCode || 'N/A'}</p>
                <p><strong>Ghi chú:</strong> {order.note || 'Không có'}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Tóm tắt đơn hàng</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>Tổng tiền sản phẩm:</strong> {formatCurrency(order.itemsPrice || totalPrice)}</p>
                <p><strong>Phí vận chuyển:</strong> {formatCurrency(order.shippingPrice || 0)}</p>
                <p><strong>Thuế:</strong> {formatCurrency(order.taxPrice || 0)}</p>
                <p><strong>Giảm giá:</strong> {formatCurrency(order.discountAmount || 0)}</p>
                <h5 className="mt-3">Tổng thanh toán: {formatCurrency(totalPrice)}</h5>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card>
          <Card.Header>
            <h5>Danh sách sản phẩm</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>Hình ảnh</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.name || (item.product && (typeof item.product === 'string' ? item.product : item.product.name)) || 'Sản phẩm không xác định'}</td>
                    <td>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                        />
                      )}
                    </td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.qty || item.quantity || 1}</td>
                    <td>{formatCurrency((item.price) * (item.qty || item.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default OrderDetail; 