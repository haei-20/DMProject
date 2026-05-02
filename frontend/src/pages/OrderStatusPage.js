import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../services/api';
import { FaClipboardCheck, FaClock, FaShippingFast, FaBox, FaHourglassHalf } from 'react-icons/fa';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Message from '../components/Message';

const OrderStatusPage = () => {
  const { id } = useParams();
  const { data: order, error, isLoading, refetch } = useGetOrderByIdQuery(id);

  // Refetch order data every 30 seconds to update status
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // No order data available - will handle in the rendering logic
  if (isLoading || !order) {
    return (
      <Layout>
        <div className="order-status-container">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="order-status-container">
          <Message variant="error">
            {error?.data?.message || 'Không thể tải thông tin đơn hàng'}
          </Message>
        </div>
      </Layout>
    );
  }

  // Prepare status events if missing from API response
  const statusEvents = order.statusEvents || [
    { status: 'placed', time: order.createdAt, isCompleted: true },
    { status: 'confirmed', time: null, isCompleted: false },
    { status: 'shipping', time: null, isCompleted: false },
    { status: 'delivered', time: null, isCompleted: false }
  ];

  // Get current status
  const getCurrentStatus = () => {
    if (!order) return 'placed';
    
    const currentEvent = statusEvents.find(event => !event.isCompleted);
    return currentEvent ? currentEvent.status : 'delivered';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Đang chờ xử lý';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get estimated delivery time
  const getEstimatedTime = () => {
    if (order.isDelivered) return 'Đã giao hàng';
    
    const deliveryEvent = statusEvents.find(event => event.status === 'delivered');
    if (deliveryEvent && deliveryEvent.time) {
      return formatDate(deliveryEvent.time);
    }
    
    return 'Dự kiến 30 phút nữa';
  };

  // Render a status item safely
  const renderStatusItem = (index, icon, title) => {
    const event = statusEvents[index] || { time: null, isCompleted: false };
    return (
      <div className="status-item">
        <div className={`status-icon ${event.isCompleted ? 'active' : ''}`}>
          {icon}
        </div>
        {event.isCompleted && index < statusEvents.length - 1 && <div className="status-line"></div>}
        <div className="status-info">
          <h3>{title}</h3>
          <p className="status-time">{formatDate(event.time)}</p>
          {index === 0 && event.isCompleted && <p>**** **** **** 5454</p>}
          {index === 2 && (event.isCompleted || getCurrentStatus() === 'shipping') && order.shipper && (
            <>
              <p>{order.shipper.name || 'Đang giao hàng'}</p>
              <p>{order.shipper.phone || 'Đang cập nhật'}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="order-status-container">
        <div className="order-number">
          <h1>Trạng thái đơn hàng</h1>
          <p>#{order._id}</p>
        </div>
        
        <div className="status-timeline">
          {/* Order Placed Status */}
          {renderStatusItem(0, <FaClipboardCheck />, "Đã đặt hàng")}
          
          {/* Order Confirmed Status */}
          {renderStatusItem(1, <FaClock />, "Đã xác nhận")}
          
          {/* Shipping Status */}
          {renderStatusItem(2, <FaShippingFast />, "Đang giao hàng")}
          
          {/* Delivery Status */}
          {renderStatusItem(3, <FaBox />, "Giao hàng")}
          
          {/* Ready Status */}
          <div className="status-item">
            <div className={`status-icon ${order.isDelivered ? 'active' : ''}`}>
              <FaHourglassHalf />
            </div>
            <div className="status-info">
              <h3>Tình trạng</h3>
              <p className="status-time">{getEstimatedTime()}</p>
            </div>
          </div>
        </div>
        
        <div className="order-status-actions">
          <Link to="/" className="btn-primary">
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default OrderStatusPage; 