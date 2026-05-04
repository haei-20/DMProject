import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaEye, FaShippingFast } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetProcessingOrdersQuery, useUpdateOrderStatusMutation } from '../../services/api';

const ProcessingOrders = () => {
  const { data: processingOrders, isLoading, error, refetch } = useGetProcessingOrdersQuery(undefined, {
    pollingInterval: 30000 // Tự động refresh mỗi 30 giây
  });
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [orders, setOrders] = useState([]);

  // Cập nhật state khi dữ liệu thay đổi
  useEffect(() => {
    if (processingOrders) {
      console.log('Processing orders data:', processingOrders);
      setOrders(processingOrders);
    }
  }, [processingOrders]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
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

  // Xử lý chuyển đơn hàng sang trạng thái giao hàng
  const handleShipOrder = async (orderId) => {
    try {
      await updateOrderStatus({ id: orderId, status: 'shipped' }).unwrap();
      alert('Đơn hàng đã chuyển sang trạng thái đang giao hàng');
      refetch();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(`Lỗi: ${err.data?.message || err.error || 'Không thể cập nhật trạng thái'}`);
    }
  };

  return (
    <AdminLayout>
      <div className="processing-orders">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Đơn hàng đang xử lý</h1>
          <Button 
            variant="outline-primary" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Đang làm mới...' : 'Làm mới'}
          </Button>
        </div>

        {error && (
          <Alert variant="danger">
            Lỗi khi tải danh sách đơn hàng: {error.message || 'Lỗi không xác định'}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải đơn hàng đang xử lý...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="processing-orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Phương thức thanh toán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? (
                orders.map(order => {
                  const orderId = order._id || order.id;
                  const orderNumber = order.orderNumber || `#${orderId.slice(-6)}`;
                  const customerName = order.user?.name || order.shippingAddress?.name || order.guestInfo?.name || 'Khách lẻ';
                  const itemsCount = order.orderItems?.length || 0;
                  const totalPrice = order.totalPrice || 0;
                  
                  return (
                    <tr key={orderId}>
                      <td>{orderNumber}</td>
                      <td>{customerName}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{itemsCount} sản phẩm</td>
                      <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'GBP' }).format(totalPrice)}</td>
                      <td>{formatPaymentMethod(order.paymentMethod)}</td>
                      <td className="actions">
                        <Link to={`/admin/order/${orderId}`} className="btn btn-info btn-sm me-2">
                          <FaEye /> Chi tiết
                        </Link>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleShipOrder(orderId)}
                          disabled={isUpdating}
                        >
                          <FaShippingFast /> Giao hàng
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Không có đơn hàng nào đang xử lý
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProcessingOrders; 