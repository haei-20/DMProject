import React from 'react';
import { Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { FaExclamationTriangle, FaShoppingBag } from 'react-icons/fa';
import './RecentOrdersTable.css';

const RecentOrdersTable = ({ orders = [], loading = false, error = null }) => {
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
      return 'Invalid date';
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
        <p className="mt-2">Loading order data...</p>
      </div>
    );
  }
  
  // Show error
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <strong>Error loading order data</strong>
        </div>
        <p className="mb-0 mt-2">{error.message || 'An unknown error occurred'}</p>
      </Alert>
    );
  }
  
  // Show empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center p-4">
        <FaShoppingBag size={32} className="text-muted mb-3" />
        <p className="mb-0">No recent orders found.</p>
      </div>
    );
  }
  
  return (
    <div className="recent-orders-table">
      <Table hover>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th className="text-end">Actions</th>
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
                  <span className="customer-name">{order.user?.name || 'Unknown Customer'}</span>
                  <span className="customer-email">{order.user?.email || 'No email provided'}</span>
                </div>
              </td>
              <td>{formatDateTime(order.createdAt)}</td>
              <td>{formatCurrency(order.totalPrice)}</td>
              <td>
                <Badge bg={getStatusColor(order.status)} className="status-badge">
                  {(order.status || 'pending').toUpperCase()}
                </Badge>
              </td>
              <td>
                <Badge bg={order.isPaid ? 'success' : 'warning'} pill>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </Badge>
              </td>
              <td className="text-end">
                <Link to={`/admin/orders/${order._id}`}>
                  <Button size="sm" variant="outline-primary">
                    View
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