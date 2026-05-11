import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Badge, Spinner, Alert, Form, Row, Col, Pagination } from 'react-bootstrap';
import { FaEye, FaSync, FaCalendar, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAdminOrdersQuery } from '../../services/api';
import './OrderList.css';
import { formatPrice } from '../../utils/productHelpers';

/** RTK Query / fetchBaseQuery thường không có error.message */
function formatOrderListError(err) {
  if (!err) return 'Lỗi không xác định';
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.status === 'FETCH_ERROR') {
    return err.error || 'Không kết nối được server (kiểm tra backend và CORS).';
  }
  if (typeof err.status === 'number') {
    const msg = err.data?.message;
    if (typeof msg === 'string') return msg;
    if (msg && typeof msg === 'object') return JSON.stringify(msg);
    return `Lỗi HTTP ${err.status}`;
  }
  if (err.error) return String(err.error);
  return 'Lỗi không xác định';
}

/** Chuỗi id đơn hàng an toàn cho Link/API (tránh .slice trên ObjectId / undefined). */
function orderRecordId(order) {
  const raw = order?._id ?? order?.id;
  if (raw == null || raw === '') return '';
  return typeof raw === 'string' ? raw : String(raw);
}

/** Giá trị gửi API + nhãn hiển thị cho dropdown lọc trạng thái */
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'placed', label: 'Đã đặt' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

/** Số trang hiển thị + khoảng trống (ellipsis) khi tổng trang lớn */
function buildPageList(current, total) {
  if (total <= 1) return [1];
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total, current - 1, current, current + 1]);
  const arr = [...s].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i] - arr[i - 1] > 1) out.push('ellipsis');
    out.push(arr[i]);
  }
  return out;
}

const OrderList = () => {
  const [forceRefresh, setForceRefresh] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [listPage, setListPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Đã bỏ lọc theo trạng thái `paid` — tránh trùng ý với thanh toán; đưa về Tất cả nếu state còn sót
  useEffect(() => {
    if (statusFilter === 'paid') {
      setStatusFilter('all');
      setListPage(1);
    }
  }, [statusFilter]);

  const listQuery = useMemo(
    () => ({
      page: listPage,
      limit: pageSize,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
    [listPage, pageSize, statusFilter]
  );

  const { data: ordersData, isLoading, error, refetch } = useGetAdminOrdersQuery(listQuery, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 0,
    skip: false,
  });

  const [orders, setOrders] = useState([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [ordersPagination, setOrdersPagination] = useState(null);

  // Cập nhật state orders khi ordersData thay đổi (API: { orders, pagination })
  useEffect(() => {
    if (ordersData) {
      console.log('Orders data updated:', ordersData);
      const list = Array.isArray(ordersData)
        ? ordersData
        : ordersData.orders ?? [];
      setOrders(list);
      setOrdersPagination(
        !Array.isArray(ordersData) ? ordersData.pagination ?? null : null
      );
    }
  }, [ordersData]);

  useEffect(() => {
    if (!ordersPagination?.totalPages) return;
    const tp = ordersPagination.totalPages;
    if (listPage > tp) setListPage(tp);
  }, [ordersPagination, listPage]);

  useEffect(() => {
    refetch();
  }, [forceRefresh, refetch]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Không có';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
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
      case 'placed':
        return 'Đã đặt';
      case 'confirmed':
        return 'Đã xác nhận';
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
    let key = String(status || 'pending')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');
    if (!key || key.length > 24) key = 'unknown';
    const label = formatStatus(status);
    return (
      <span className={`order-status-pill order-status-pill--${key}`}>{label}</span>
    );
  };

  // Chỉ lọc theo ngày trên trang hiện tại (trạng thái đã lọc trên server qua tiêu đề cột)
  const getFilteredOrders = () => {
    if (!orders || !orders.length) return [];

    return orders.filter((order) => {
      let dateMatch = true;
      const orderDate = parseDate(order.createdAt || order.date);

      if (startDate && orderDate) {
        const filterStartDate = new Date(startDate);
        filterStartDate.setHours(0, 0, 0, 0);
        if (orderDate < filterStartDate) dateMatch = false;
      }

      if (endDate && orderDate) {
        const filterEndDate = new Date(endDate);
        filterEndDate.setHours(23, 59, 59, 999);
        if (orderDate > filterEndDate) dateMatch = false;
      }

      return dateMatch;
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

  const handleForceRefresh = () => {
    setForceRefresh((prev) => prev + 1);
    refetch();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const totalCount = ordersPagination?.totalCount ?? 0;
  const totalPages = Math.max(1, ordersPagination?.totalPages ?? 1);
  const rowFrom = totalCount === 0 ? 0 : (listPage - 1) * pageSize + 1;
  const rowTo = Math.min(listPage * pageSize, totalCount);

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
            disabled={isLoading}
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

          <p className="text-muted small mb-3 mb-md-0">
            Lọc trạng thái trong cột tiêu đề bảng; lọc theo ngày chỉ trên đơn của trang hiện tại. Đổi trạng thái đơn tại trang chi tiết.
          </p>
        </div>

        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải danh sách đơn hàng: {formatOrderListError(error)}</span>
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
          <>
          <div className="order-list-table-shell">
          <Table striped bordered hover responsive className="order-table order-list-main-table mb-0">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Phương thức thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
              <tr className="order-list-thead-filter-row">
                <th colSpan={6} className="order-list-thead-filter-gap" aria-hidden="true" />
                <th className="order-list-th-status-filter">
                  <Form.Select
                    size="sm"
                    className="order-list-status-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setListPage(1);
                    }}
                    aria-label="Lọc danh sách theo trạng thái"
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                </th>
                <th className="order-list-thead-filter-gap" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {getFilteredOrders().map((order, idx) => {
                const orderId = orderRecordId(order);
                const orderNumber =
                  order.orderNumber || (orderId ? `#${orderId.slice(-6)}` : '—');

                const customerName =
                  order.user?.name ||
                  order.guestInfo?.name ||
                  order.shippingAddress?.name ||
                  'Khách lẻ';

                const itemsCount = Array.isArray(order.orderItems)
                  ? order.orderItems.length
                  : Array.isArray(order.items)
                    ? order.items.length
                    : 0;
                
                // Tính tổng tiền
                const totalPrice = order.totalPrice || order.total || 0;
                
                // Trạng thái hiện tại
                const currentStatus = (order.status || 'pending').toLowerCase();
                
                return (
                  <tr key={orderId || `order-row-${idx}`} className={`status-${currentStatus}`}>
                    <td>{orderNumber}</td>
                    <td>{customerName}</td>
                    <td>{formatDate(order.createdAt || order.date)}</td>
                    <td>{itemsCount} sản phẩm</td>
                    <td>{formatPrice(totalPrice || 0)}</td>
                    <td>{formatPaymentMethod(order.paymentMethod)}</td>
                    <td>{getStatusBadge(currentStatus)}</td>
                    <td className="order-actions">
                      {orderId ? (
                        <Link to={`/admin/orders/${orderId}`} className="btn btn-info btn-sm me-1">
                          <FaEye /> Chi tiết
                        </Link>
                      ) : (
                        <span className="text-muted small">Thiếu mã</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {getFilteredOrders().length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    {orders.length === 0
                      ? 'Không có đơn hàng nào trên trang này.'
                      : 'Không có đơn nào khớp bộ lọc ngày trên trang hiện tại.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {ordersPagination && (
            <div className="order-list-table-footer">
              <div className="order-list-footer-inner">
                <div className="order-list-footer-summary text-muted small">
                  {totalCount === 0 ? (
                    <>Không có đơn hàng nào khớp bộ lọc.</>
                  ) : (
                    <>
                      Hiển thị <strong>{rowFrom}</strong>–<strong>{rowTo}</strong> trên{' '}
                      <strong>{totalCount.toLocaleString('vi-VN')}</strong> đơn
                    </>
                  )}
                </div>

                <div className="order-list-footer-pagination">
                  <Pagination size="sm" className="mb-0 flex-wrap justify-content-center">
                    <Pagination.First
                      disabled={listPage <= 1 || totalCount === 0}
                      onClick={() => setListPage(1)}
                    />
                    <Pagination.Prev
                      disabled={listPage <= 1 || totalCount === 0}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    />
                    {buildPageList(listPage, totalPages).map((item, idx) =>
                      item === 'ellipsis' ? (
                        <Pagination.Ellipsis key={`ellipsis-${idx}`} disabled />
                      ) : (
                        <Pagination.Item
                          key={item}
                          active={item === listPage}
                          onClick={() => setListPage(item)}
                        >
                          {item}
                        </Pagination.Item>
                      )
                    )}
                    <Pagination.Next
                      disabled={listPage >= totalPages || totalCount === 0}
                      onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                    />
                    <Pagination.Last
                      disabled={listPage >= totalPages || totalCount === 0}
                      onClick={() => setListPage(totalPages)}
                    />
                  </Pagination>
                </div>

                <div className="order-list-footer-controls">
                  <Form.Group className="order-list-footer-field mb-0">
                    <Form.Label className="small text-secondary mb-1">Dòng / trang</Form.Label>
                    <Form.Select
                      size="sm"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value) || 20);
                        setListPage(1);
                      }}
                      aria-label="Số đơn hàng mỗi trang"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
            </div>
          )}
          </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderList; 