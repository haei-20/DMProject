import React, { useMemo } from 'react';
import { Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { FaExclamationTriangle, FaShoppingBag } from 'react-icons/fa';
import './RecentOrdersTable.css';
import { formatPrice } from '../../utils/productHelpers';

const RecentOrdersTable = ({ orders = [], loading = false, error = null }) => {
  /** Đếm orderNumber trùng — seed/API lỗi có thể gán cùng một mã cho nhiều đơn. */
  const orderNumberCounts = useMemo(() => {
    const counts = {};
    for (const o of orders) {
      const n = o.orderNumber != null ? String(o.orderNumber).trim() : '';
      if (n) counts[n] = (counts[n] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const formatOrderDisplayId = (order) => {
    const idStr = order._id != null ? String(order._id) : '';
    const tail =
      idStr.length >= 8 ? idStr.slice(-8).toUpperCase() : (idStr || '—').toUpperCase();
    const n = order.orderNumber != null ? String(order.orderNumber).trim() : '';
    const dup = Boolean(n && (orderNumberCounts[n] || 0) > 1);
    // Seed/API có thể gán cùng orderNumber → chỉ hiển thị hậu tố ObjectId (luôn khác nhau), tránh ellipsis che phần `· tail`
    if (!idStr) return n ? `#${n}` : '#—';
    if (!n || dup) return `#ORD-${tail}`;
    return `#${n}`;
  };

  /** Trạng thái xử lý đơn (không trùng nghĩa với cột thanh toán). `paid` trong DB = đã nhận tiền, hiển thị như bước xác nhận đơn. */
  const getFulfillmentLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'placed': return 'Đã đặt';
      case 'confirmed': return 'Đã xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      case 'paid': return 'Đã xác nhận';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      case 'paid': return 'dark';
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
  
  const formatCurrency = (amount) => formatPrice(amount || 0);
  
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

  const rowKey = (order, index) =>
    order._id != null ? String(order._id) : `recent-order-${index}`;

  return (
    <div className="recent-orders-table">
      <Table hover>
        <thead>
          <tr>
            <th className="roc-th-id">Mã đơn hàng</th>
            <th className="roc-th-customer">Khách hàng</th>
            <th className="roc-th-date">Ngày</th>
            <th className="roc-th-total">Tổng tiền</th>
            <th className="roc-th-status">Trạng thái</th>
            <th className="roc-th-pay">Thanh toán</th>
            <th className="roc-th-action text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const status = order.status || 'pending';
            return (
            <tr key={rowKey(order, index)}>
              <td className="roc-td-id">
                <span
                  className="order-id"
                  title={
                    order._id != null
                      ? `${order.orderNumber ? `${order.orderNumber} · ` : ''}${String(order._id)}`
                      : ''
                  }
                >
                  {formatOrderDisplayId(order)}
                </span>
              </td>
              <td className="roc-td-customer">
                <div className="customer-info">
                  <span className="customer-name">{order.user?.name || 'Khách hàng không xác định'}</span>
                  <span className="customer-email">{order.user?.email || 'Không có email'}</span>
                </div>
              </td>
              <td className="roc-td-date">{formatDateTime(order.createdAt)}</td>
              <td className="roc-td-total">{formatCurrency(order.totalPrice)}</td>
              <td className="roc-td-status">
                <Badge bg={getStatusColor(status)} className="status-badge">
                  {getFulfillmentLabel(status)}
                </Badge>
              </td>
              <td className="roc-td-pay">
                <Badge bg={order.isPaid ? 'success' : 'warning'} pill className="status-badge">
                  {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </td>
              <td className="roc-td-action text-end">
                <Link to={`/admin/order/${order._id}`}>
                  <Button size="sm" variant="outline-primary">
                    Xem
                  </Button>
                </Link>
              </td>
            </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default RecentOrdersTable; 