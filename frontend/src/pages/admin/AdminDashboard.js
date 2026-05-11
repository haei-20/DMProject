import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { 
  FaUsers, FaShoppingBag, FaMoneyBillWave, FaShoppingCart, 
  FaRegCalendarAlt, FaSyncAlt
} from 'react-icons/fa';
import { 
  useGetDashboardStatsQuery,
  useGetOrderAnalyticsQuery,
  useGetFrequentlyBoughtTogetherQuery,
  useGetTopProductsQuery,
  useGetDealHotQuery
} from '../../services/api';
import AdminLayout from './AdminLayout';
import RecentOrdersTable from '../../components/admin/RecentOrdersTable';
import TopProductsTable from '../../components/admin/TopProductsTable';
import FrequentlyBoughtTogetherTable from '../../components/admin/FrequentlyBoughtTogetherTable';
import './AdminDashboard.css';
import { useSelector } from 'react-redux';
import { getUserData } from '../../utils/tokenHelper';
import { formatPrice } from '../../utils/productHelpers';

/** Thông báo lỗi từ RTK Query (FETCH_ERROR để message trong `error`, không phải `data.message`). */
const getRtkQueryErrorMessage = (err) => {
  if (!err) return '';
  const data = err.data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
  }
  if (typeof err.error === 'string') return err.error;
  if (typeof err.status === 'number') return `Lỗi máy chủ (HTTP ${err.status})`;
  return '';
};

const AdminDashboard = () => {
  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(currentYear - 4);
  const [toYear, setToYear] = useState(currentYear);
  const [isYearRangeAutoInitialized, setIsYearRangeAutoInitialized] = useState(false);
  const [fbtFilters, setFbtFilters] = useState({
    minSupport: 0.01,
    orderLimit: 500,
    minConfidence: 0.1,
    minLift: 1,
    minConviction: 1
  });
  const [debouncedFbtFilters, setDebouncedFbtFilters] = useState({
    minSupport: 0.01,
    orderLimit: 500,
    minConfidence: 0.1,
    minLift: 1,
    minConviction: 1
  });

  const normalizedFromYear = Math.min(fromYear, toYear);
  const normalizedToYear = Math.max(fromYear, toYear);

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchDashboardStats,
  } = useGetDashboardStatsQuery(undefined, { refetchOnReconnect: true });
  const {
    data: orderAnalytics,
    isLoading: orderLoading,
    isFetched: orderAnalyticsFetched,
  } = useGetOrderAnalyticsQuery({
    fromYear: normalizedFromYear,
    toYear: normalizedToYear
  });

  /** Top bán chạy: toàn thời gian (không lọc theo năm/khoảng ngày). */
  const { data: topProducts = [], isLoading: topProductsLoading, error: topProductsError } = useGetTopProductsQuery({
    limit: 10,
    timeRange: 'all',
  });

  const { data: dealHotData, isLoading: dealHotLoading } = useGetDealHotQuery({ limit: 3 });
  const {
    data: frequentlyBoughtFpData,
    isLoading: frequentlyBoughtFpLoading,
    isFetching: frequentlyBoughtFpFetching,
  } = useGetFrequentlyBoughtTogetherQuery({
    // Refetch backend khi đổi các bộ lọc FBT
    minSupport: debouncedFbtFilters.minSupport,
    orderLimit: debouncedFbtFilters.orderLimit,
    minConfidence: debouncedFbtFilters.minConfidence,
    minLift: debouncedFbtFilters.minLift,
    minConviction: debouncedFbtFilters.minConviction
  });

  // Debug user authentication
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const localStorageUser = getUserData();
  
  useEffect(() => {
    console.log('🏁 AdminDashboard mounted');
    console.log('Authentication state:', {
      reduxUser: user,
      localStorageUser,
      isAuthenticated,
      isAdminInRedux: user && (user.role === 'admin' || user.isAdmin === true),
      isAdminInLocalStorage: localStorageUser && 
        (localStorageUser.role === 'admin' || localStorageUser.isAdmin === true)
    });
  }, [user, isAuthenticated]);

  // Sau khi analytics đơn hàng tải xong: đồng bộ khoảng năm với DB (nếu có), rồi mới cho phép gọi top-products
  useEffect(() => {
    if (isYearRangeAutoInitialized || !orderAnalyticsFetched) return;
    const minDataYear = Number(orderAnalytics?.info?.minDataYear);
    const maxDataYear = Number(orderAnalytics?.info?.maxDataYear);
    if (Number.isFinite(minDataYear) && Number.isFinite(maxDataYear)) {
      setFromYear(minDataYear);
      setToYear(maxDataYear);
    }
    setIsYearRangeAutoInitialized(true);
  }, [orderAnalytics, orderAnalyticsFetched, isYearRangeAutoInitialized]);

  // Debounce filter để tránh gọi API liên tục khi người dùng đổi nhanh
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFbtFilters(fbtFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [fbtFilters]);

  const isFbtFilterDebouncing =
    fbtFilters.minSupport !== debouncedFbtFilters.minSupport ||
    fbtFilters.orderLimit !== debouncedFbtFilters.orderLimit ||
    fbtFilters.minConfidence !== debouncedFbtFilters.minConfidence ||
    fbtFilters.minLift !== debouncedFbtFilters.minLift ||
    fbtFilters.minConviction !== debouncedFbtFilters.minConviction;
  const isFbtFpRecomputing = isFbtFilterDebouncing || frequentlyBoughtFpFetching;

  // Modern, elegant color palette
  const THEME_COLORS = {
    primary: '#4361ee',
    secondary: '#3f37c9',
    success: '#4cc9f0',
    warning: '#f72585',
    info: '#4895ef',
    accent1: '#560bad',
    accent2: '#480ca8',
    accent3: '#3a0ca3',
    light: '#f8f9fa',
    dark: '#212529',
    gray: '#6c757d'
  };
  
  const formatCurrency = (amount) => formatPrice(amount || 0);
  
  // Redesigned stat card with elegant styling
  const StatCard = ({ title, value, icon, color, isLoading, suffix = '', description = '', trend = null }) => (
    <Card className="modern-stat-card">
      <Card.Body>
        <div className="stat-card-header">
          <div className="stat-card-icon" style={{ backgroundColor: color }}>
            {icon}
          </div>
          {trend && (
            <div className={`stat-trend ${trend.direction === 'up' ? 'trend-up' : 'trend-down'}`}>
              <span>{trend.value}%</span>
              <i className={`fas fa-arrow-${trend.direction}`}></i>
            </div>
          )}
        </div>
        <div className="stat-card-content">
          <h6 className="stat-card-title">{title}</h6>
          {isLoading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <h3 className="stat-card-value">{value}{suffix}</h3>
          )}
          {description && <p className="stat-card-description">{description}</p>}
        </div>
      </Card.Body>
    </Card>
  );
  
  // Get top products data
  const getTopProducts = () => {
    return topProducts || [];
  };
  
  // Get recent orders
  const getRecentOrders = () => {
    return orderAnalytics?.recentOrders || [];
  };
  
  return (
    <AdminLayout>
      <div className="modern-admin-dashboard">
        {statsError && (
          <Alert variant="warning" className="modern-alert mb-3 d-flex flex-wrap align-items-center gap-2">
            <span>
              <i className="fas fa-exclamation-triangle me-2" />
              Không tải được thống kê tổng quan:{' '}
              <strong>{getRtkQueryErrorMessage(statsError) || 'Đã xảy ra lỗi'}</strong>
              {statsError?.status === 'FETCH_ERROR' &&
                ' — Kiểm tra backend đang chạy và REACT_APP_API_URL đúng với URL API (ví dụ http://localhost:5000/api).'}
            </span>
            <Button variant="outline-dark" size="sm" onClick={() => refetchDashboardStats()}>
              <FaSyncAlt className="me-1" />
              Thử lại
            </Button>
          </Alert>
        )}
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">Bảng điều khiển</h2>
            <p className="dashboard-subtitle">Chào mừng quay lại, {user?.name || 'Quản trị viên'}</p>
          </div>
          <div className="dashboard-actions">
            {/* Buttons removed as requested */}
          </div>
        </div>
        
        {/* Stats Cards */}
        <Row className="stats-row g-4">
          <Col md={6} xl={3}>
            <StatCard
              title="Tổng doanh thu"
              value={formatCurrency(dashboardStats?.totalRevenue || 0)}
              icon={<FaMoneyBillWave />}
              color={THEME_COLORS.primary}
              isLoading={statsLoading}
              description="Doanh thu toàn thời gian"
              trend={{ direction: 'up', value: 12 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Đơn hàng"
              value={dashboardStats?.totalOrders || 0}
              icon={<FaShoppingBag />}
              color={THEME_COLORS.warning}
              isLoading={statsLoading}
              description={`${dashboardStats?.pendingOrders || 0} đang chờ`}
              trend={{ direction: 'up', value: 8 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Khách hàng"
              value={dashboardStats?.totalCustomers || 0}
              icon={<FaUsers />}
              color={THEME_COLORS.success}
              isLoading={statsLoading}
              description={`${dashboardStats?.newCustomers || 0} mới trong tháng`}
              trend={{ direction: 'up', value: 24 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Sản phẩm"
              value={dashboardStats?.totalProducts || 0}
              icon={<FaShoppingCart />}
              color={THEME_COLORS.info}
              isLoading={statsLoading}
              description={`${dashboardStats?.lowStockProducts || 0} sắp hết hàng`}
              trend={{ direction: 'down', value: 3 }}
            />
          </Col>
        </Row>
        
        {/* Deal Hot — full width + lưới ngang để không còn khoảng trống sau khi gỡ biểu đồ */}
        <Row className="g-4 mt-1">
          <Col xs={12}>
            <Card className="modern-chart-card h-100 deal-hot-dashboard-card">
              <Card.Header className="chart-card-header">
                <h5 className="mb-0">Deal Hot</h5>
              </Card.Header>
              <Card.Body>
                {dealHotLoading ? (
                  <div className="chart-loader">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="deal-hot-container">
                    <div className="deal-hot-header">
                      <Badge bg="danger" className="deal-timer">
                        <FaRegCalendarAlt className="me-1" /> Còn hiệu lực 24h
                      </Badge>
                    </div>
                    <div className="deal-products">
                      {(dealHotData?.products || [])
                        .slice(0, 3)
                        .map((product, index) => (
                          <div key={index} className="deal-product-item">
                            <div className="deal-product-image">
                              {product.image?.trim() ? (
                                <img src={product.image} alt={product.name} />
                              ) : (
                                <div className="placeholder-image">
                                  {product.name?.substring(0, 2).toUpperCase() || 'PR'}
                                </div>
                              )}
                            </div>
                            <div className="deal-product-info">
                              <h6 className="deal-product-name">{product.name}</h6>
                              <div className="deal-product-price">
                                <span className="current-price">
                                  {formatCurrency(product.salePrice || product.price)}
                                </span>
                                {product.salePrice && (
                                  <span className="original-price">
                                    {formatCurrency(product.price)}
                                  </span>
                                )}
                              </div>
                              <div className="deal-product-discount">
                                <Badge bg="warning" text="dark">
                                  Giảm {((1 - (product.salePrice || product.price) / product.price) * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      {(dealHotData?.products || []).length === 0 && (
                        <div className="no-deals-message">
                          <Alert variant="info">
                            Không có sản phẩm Deal Hot hợp lệ. Hãy kiểm tra giá giảm và thời gian hiệu lực.
                          </Alert>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Tables */}
        <Row className="g-4 mt-1">
          <Col xs={12}>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Sản phẩm bán chạy <small className="text-muted fw-normal">(top 10, toàn thời gian)</small></h5>
              </Card.Header>
              <Card.Body className="p-0 dashboard-table-body">
                <TopProductsTable 
                  products={getTopProducts()} 
                  loading={topProductsLoading} 
                  error={topProductsError ? { message: getRtkQueryErrorMessage(topProductsError) || 'Không thể tải sản phẩm bán chạy' } : null} 
                />
              </Card.Body>
            </Card>
          </Col>
          
          <Col xs={12}>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Đơn hàng gần đây</h5>
              </Card.Header>
              <Card.Body className="p-0 dashboard-table-body">
                <RecentOrdersTable 
                  orders={getRecentOrders()} 
                  loading={orderLoading}
                  error={orderAnalytics === undefined && !orderLoading ? { message: 'Không thể tải phân tích đơn hàng' } : null}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Frequently Bought Together Table */}
        <Row className="g-4 mt-1 mb-4">
          <Col lg={12}>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Sản phẩm thường mua cùng nhau</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <FrequentlyBoughtTogetherTable 
                  data={frequentlyBoughtFpData}
                  loading={frequentlyBoughtFpLoading}
                  isRecomputing={isFbtFpRecomputing}
                  minSupport={fbtFilters.minSupport}
                  orderLimit={fbtFilters.orderLimit}
                  minConfidence={fbtFilters.minConfidence}
                  minLift={fbtFilters.minLift}
                  minConviction={fbtFilters.minConviction}
                  onMinSupportChange={(value) => setFbtFilters((prev) => ({ ...prev, minSupport: value }))}
                  onOrderLimitChange={(value) => setFbtFilters((prev) => ({ ...prev, orderLimit: value }))}
                  onMinConfidenceChange={(value) => setFbtFilters((prev) => ({ ...prev, minConfidence: value }))}
                  onMinLiftChange={(value) => setFbtFilters((prev) => ({ ...prev, minLift: value }))}
                  onMinConvictionChange={(value) => setFbtFilters((prev) => ({ ...prev, minConviction: value }))}
                  error={frequentlyBoughtFpData === undefined && !frequentlyBoughtFpLoading ? { message: 'Không thể tải dữ liệu FBT' } : null}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 