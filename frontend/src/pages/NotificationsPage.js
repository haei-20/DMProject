import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { FaBell, FaShoppingBag, FaCheckCircle, FaTimesCircle, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '../services/api';
import { formatDate } from '../utils/dateFormatter';
import Layout from '../components/Layout';
import Message from '../components/Message';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { data: notifications, isLoading, error, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();
  
  useEffect(() => {
    // Refresh notifications when the page loads
    refetch();
  }, [refetch]);
  
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Function to determine icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return <FaShoppingBag className="notification-icon order-placed" />;
      case 'order_confirmed':
        return <FaCheckCircle className="notification-icon order-confirmed" />;
      case 'order_shipped':
        return <FaTruck className="notification-icon order-shipped" />;
      case 'order_delivered':
        return <FaCheckCircle className="notification-icon order-delivered" />;
      case 'order_cancelled':
        return <FaTimesCircle className="notification-icon order-cancelled" />;
      case 'payment_failed':
        return <FaExclamationTriangle className="notification-icon payment-failed" />;
      default:
        return <FaBell className="notification-icon default" />;
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="page-title">
              <FaBell className="me-2" /> Thông báo
            </h1>
            <p className="text-muted">Tất cả thông báo liên quan đến đơn hàng của bạn</p>
          </Col>
        </Row>
        
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải thông báo...</p>
          </div>
        ) : error ? (
          <Message variant="danger">
            Đã xảy ra lỗi khi tải thông báo. Vui lòng thử lại sau.
          </Message>
        ) : notifications?.length === 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <FaBell size={48} className="text-muted mb-3" />
              <h3>Không có thông báo</h3>
              <p className="text-muted">
                Bạn chưa có thông báo nào. Các thông báo về đơn hàng sẽ xuất hiện ở đây.
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Card>
            <Card.Body className="p-0">
              <div className="notifications-list">
                {notifications?.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                  >
                    <div className="notification-icon-wrapper">
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <h5 className="notification-title">{notification.title}</h5>
                        {!notification.read && (
                          <Badge bg="primary" pill>Mới</Badge>
                        )}
                      </div>
                      <p className="notification-text">{notification.message}</p>
                      {notification.orderId && (
                        <div className="notification-order-link">
                          <a href={`/order/${notification.orderId}`}>
                            Xem đơn hàng #{notification.orderId.substring(0, 8)}...
                          </a>
                        </div>
                      )}
                      <div className="notification-time">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </Layout>
  );
};

export default NotificationsPage; 