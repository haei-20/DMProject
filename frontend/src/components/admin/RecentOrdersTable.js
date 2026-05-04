import React from 'react';
import { Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { FaExclamationTriangle, FaShoppingBag } from 'react-icons/fa';
import './RecentOrdersTable.css';

const RecentOrdersTable = ({ orders = [], loading = false, error = null }) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'placed': return 'Đã đặt';
      case 'confirmed': return 'Đã xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      case 'paid': return 'Đã thanh toán';
      default: return 'Không xác định';
    }
  };

  // Get order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };
  
  // Format date
  const formatDateTime = (date) => {
    try {
      return formatDate(date, { includeTime: true });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Show loading spinner
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải dữ liệu đơn hàng...</p>
      </div>
    );
  }
  
  // Show error
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <strong>Lỗi tải dữ liệu đơn hàng</strong>
        </div>
        <p className="mb-0 mt-2">{error.message || 'Đã xảy ra lỗi không xác định'}</p>
      </Alert>
    );
  }
  
  // Show empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center p-4">
        <FaShoppingBag size={32} className="text-muted mb-3" />
        <p className="mb-0">Không có đơn hàng gần đây.</p>
      </div>
    );
  }
  
  return (
    <div className="recent-orders-table">
      <Table hover>
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Khách hàng</th>
            <th>Ngày</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thanh toán</th>
            <th className="text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>
                <span className="order-id">#{order.orderNumber || order._id.substring(0, 8)}</span>
              </td>
              <td>
                <div className="customer-info">
                  <span className="customer-name">{order.user?.name || 'Khách hàng không xác định'}</span>
                  <span className="customer-email">{order.user?.email || 'Không có email'}</span>
                </div>
              </td>
              <td>{formatDateTime(order.createdAt)}</td>
              <td>{formatCurrency(order.totalPrice)}</td>
              <td>
                <Badge bg={getStatusColor(order.status)} className="status-badge">
                  {getStatusLabel(order.status || 'pending')}
                </Badge>
              </td>
              <td>
                <Badge bg={order.isPaid ? 'success' : 'warning'} pill>
                  {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </td>
              <td className="text-end">
                <Link to={`/admin/order/${order._id}`}>
                  <Button size="sm" variant="outline-primary">
                    Xem
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default RecentOrdersTable; 