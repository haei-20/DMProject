import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FaUsers, FaShoppingBag, FaMoneyBillWave, FaShoppingCart, 
  FaChartLine, FaRegCalendarAlt, FaRegBell
} from 'react-icons/fa';
import { 
  useGetDashboardStatsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetFrequentlyBoughtTogetherQuery,
  useGetSalesReportQuery,
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
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [period, setPeriod] = useState('monthly');
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery();
  const { data: topProducts = [], isLoading: topProductsLoading, error: topProductsError } = useGetTopProductsQuery({
    limit: 5,
    timeRange: 'month'
  });
  const { data: userAnalytics, isLoading: userLoading } = useGetUserAnalyticsQuery();
  const { data: orderAnalytics, isLoading: orderLoading } = useGetOrderAnalyticsQuery();
  const { data: dealHotData, isLoading: dealHotLoading } = useGetDealHotQuery({ limit: 3 });
  const { data: frequentlyBoughtTogetherData, isLoading: frequentlyBoughtTogetherLoading } = useGetFrequentlyBoughtTogetherQuery({
    // Dùng ngưỡng an toàn để tránh query quá nặng khiến API trả rỗng/timeout
    minSupport: 0.01,
    limit: 20,
    orderLimit: 500
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
  
  // Chart colors - elegant palette
  const COLORS = [THEME_COLORS.primary, THEME_COLORS.warning, THEME_COLORS.success, 
                  THEME_COLORS.info, THEME_COLORS.accent1, THEME_COLORS.accent2];
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };
  
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
  
  // Handle period change
  const handlePeriodChange = (key) => {
    setPeriod(key);
  };
  
  if (statsError) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="modern-alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          Error loading dashboard data: {statsError.data?.message || 'An error occurred'}
        </Alert>
      </AdminLayout>
    );
  }
  
  // Get the appropriate analytics data based on period
  const getRevenueData = () => {
    if (!orderAnalytics) return [];
    
    // Return filtered analytics data based on period
    const revenueData = orderAnalytics.revenueByPeriod || [];
    
    const filteredData = revenueData.filter(item => {
      if (period === 'weekly') return item.period === 'week';
      if (period === 'monthly') return item.period === 'month';
      if (period === 'yearly') return item.period === 'year';
      return true;
    });
    
    // Make sure we have data for the selected period
    if (filteredData.length === 0) {
      return [];
    }
    
    return filteredData;
  };
  
  // Get top products data
  const getTopProducts = () => {
    return topProducts || [];
  };
  
  // Get recent orders
  const getRecentOrders = () => {
    return orderAnalytics?.recentOrders || [];
  };
  
  // Get customer stats
  const getCustomerStats = () => {
    return userAnalytics?.customersByPeriod || [];
  };
  
  return (
    <AdminLayout>
      <div className="modern-admin-dashboard">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">Dashboard</h2>
            <p className="dashboard-subtitle">Welcome back, {user?.name || 'Admin'}</p>
          </div>
          <div className="dashboard-actions">
            {/* Buttons removed as requested */}
          </div>
        </div>
        
        {/* Stats Cards */}
        <Row className="stats-row g-4">
          <Col md={6} xl={3}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(dashboardStats?.totalRevenue || 0)}
              icon={<FaMoneyBillWave />}
              color={THEME_COLORS.primary}
              isLoading={statsLoading}
              description="All-time revenue"
              trend={{ direction: 'up', value: 12 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Orders"
              value={dashboardStats?.totalOrders || 0}
              icon={<FaShoppingBag />}
              color={THEME_COLORS.warning}
              isLoading={statsLoading}
              description={`${dashboardStats?.pendingOrders || 0} pending`}
              trend={{ direction: 'up', value: 8 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Customers"
              value={dashboardStats?.totalCustomers || 0}
              icon={<FaUsers />}
              color={THEME_COLORS.success}
              isLoading={statsLoading}
              description={`${dashboardStats?.newCustomers || 0} new this month`}
              trend={{ direction: 'up', value: 24 }}
            />
          </Col>
          <Col md={6} xl={3}>
            <StatCard
              title="Products"
              value={dashboardStats?.totalProducts || 0}
              icon={<FaShoppingCart />}
              color={THEME_COLORS.info}
              isLoading={statsLoading}
              description={`${dashboardStats?.lowStockProducts || 0} low in stock`}
              trend={{ direction: 'down', value: 3 }}
            />
          </Col>
        </Row>
        
        {/* Charts */}
        <Row className="g-4 mt-1">
          <Col lg={8}>
            <Card className="modern-chart-card">
              <Card.Header className="chart-card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Revenue Overview</h5>
                  <Tabs
                    activeKey={period}
                    onSelect={handlePeriodChange}
                    className="modern-chart-tabs"
                  >
                    <Tab eventKey="weekly" title="Weekly" />
                    <Tab eventKey="monthly" title="Monthly" />
                    <Tab eventKey="yearly" title="Yearly" />
                  </Tabs>
                </div>
              </Card.Header>
              <Card.Body>
                {orderLoading ? (
                  <div className="chart-loader">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : getRevenueData().length === 0 ? (
                  <div className="text-center p-4">
                    <Alert variant="warning">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      Không có dữ liệu cho giai đoạn đã chọn. Vui lòng chọn giai đoạn khác.
                    </Alert>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart
                      data={getRevenueData()}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={THEME_COLORS.warning} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={THEME_COLORS.warning} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke={THEME_COLORS.gray} />
                      <YAxis stroke={THEME_COLORS.gray} />
                      <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke={THEME_COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke={THEME_COLORS.warning}
                        fillOpacity={1}
                        fill="url(#colorOrders)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="modern-chart-card h-100">
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
                                  {((1 - (product.salePrice || product.price) / product.price) * 100).toFixed(0)}% OFF
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      {(dealHotData?.products || []).length === 0 && (
                        <div className="no-deals-message">
                          <Alert variant="info">
                            Không có sản phẩm Deal Hot hợp lệ. Hãy kiểm tra giá sale và thời gian hiệu lực.
                          </Alert>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
              <style jsx="true">{`
                .deal-hot-container {
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                }
                .deal-hot-header {
                  display: flex;
                  justify-content: center;
                  margin-bottom: 15px;
                }
                .deal-timer {
                  font-size: 0.9rem;
                  padding: 6px 12px;
                }
                .deal-products {
                  flex: 1;
                  overflow-y: auto;
                }
                .deal-product-item {
                  display: flex;
                  align-items: center;
                  margin-bottom: 15px;
                  padding: 10px;
                  border-radius: 8px;
                  background-color: #f8f9fa;
                  transition: all 0.3s ease;
                }
                .deal-product-item:hover {
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                  transform: translateY(-2px);
                }
                .deal-product-image {
                  width: 60px;
                  height: 60px;
                  border-radius: 6px;
                  overflow: hidden;
                  margin-right: 12px;
                  background-color: #fff;
                }
                .deal-product-image img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
                .placeholder-image {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background-color: #4a6cf7;
                  color: white;
                  font-weight: bold;
                }
                .deal-product-info {
                  flex: 1;
                }
                .deal-product-name {
                  font-size: 0.95rem;
                  margin-bottom: 4px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .deal-product-price {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  margin-bottom: 4px;
                }
                .current-price {
                  font-weight: bold;
                  color: #f72585;
                  font-size: 0.9rem;
                }
                .original-price {
                  text-decoration: line-through;
                  color: #6c757d;
                  font-size: 0.8rem;
                }
                .no-deals-message {
                  padding: 20px 10px;
                }
              `}</style>
            </Card>
          </Col>
        </Row>
        
        {/* Tables */}
        <Row className="g-4 mt-1">
          <Col xs={12}>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Top Selling Products</h5>
              </Card.Header>
              <Card.Body className="p-0 dashboard-table-body">
                <TopProductsTable 
                  products={getTopProducts()} 
                  loading={topProductsLoading} 
                  error={topProductsError ? { message: topProductsError?.data?.message || 'Could not load top products' } : null} 
                />
              </Card.Body>
            </Card>
          </Col>
          
          <Col xs={12}>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
              </Card.Header>
              <Card.Body className="p-0 dashboard-table-body">
                <RecentOrdersTable 
                  orders={getRecentOrders()} 
                  loading={orderLoading}
                  error={orderAnalytics === undefined && !orderLoading ? { message: 'Could not load order analytics' } : null}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Customer Growth Chart */}
        <Row className="g-4 mt-1 mb-4">
          <Col>
            <Card className="modern-chart-card">
              <Card.Header className="chart-card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Customer Growth</h5>
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: THEME_COLORS.success }}></span>
                      New Customers
                    </span>
                    <span className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: THEME_COLORS.info }}></span>
                      Active Customers
                    </span>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {userLoading ? (
                  <div className="chart-loader">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : userAnalytics === undefined ? (
                  <div className="text-center p-4">
                    <Alert variant="warning">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      Customer data could not be loaded. Using mock data instead.
                    </Alert>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={getCustomerStats()}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke={THEME_COLORS.gray} />
                      <YAxis stroke={THEME_COLORS.gray} />
                      <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Bar 
                        dataKey="newUsers" 
                        name="New Customers"
                        fill={THEME_COLORS.success}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="activeUsers" 
                        name="Active Customers" 
                        fill={THEME_COLORS.info}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Frequently Bought Together Table */}
        <Row className="g-4 mt-1 mb-4">
          <Col>
            <Card className="modern-table-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Frequently Bought Together</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <FrequentlyBoughtTogetherTable 
                  data={frequentlyBoughtTogetherData}
                  loading={frequentlyBoughtTogetherLoading}
                  error={frequentlyBoughtTogetherData === undefined && !frequentlyBoughtTogetherLoading ? { message: 'Could not load frequently bought together data' } : null}
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