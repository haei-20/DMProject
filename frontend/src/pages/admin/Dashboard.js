import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { FaUsers, FaBoxOpen, FaMoneyBillAlt, FaShoppingCart, FaArrowUp, FaArrowDown, FaEye, FaDownload } from 'react-icons/fa';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminFooter from '../../components/admin/AdminFooter';
import { 
  useGetDashboardStatsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery
} from '../../services/api';
import '../../styles/AdminTheme.css';
import './Dashboard.css';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [activeSalesTab, setActiveSalesTab] = useState('revenue');
  
  // API queries
  const { data: dashboardStats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: productAnalytics, isLoading: productLoading } = useGetProductAnalyticsQuery();
  const { data: userAnalytics, isLoading: userLoading } = useGetUserAnalyticsQuery();
  const { data: orderAnalytics, isLoading: orderLoading } = useGetOrderAnalyticsQuery();
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Format number with comma separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };
  
  // Get percent change and style
  const getPercentChange = (current, previous) => {
    if (!previous) return { value: 0, color: 'text-muted', icon: null };
    
    const percentChange = ((current - previous) / previous) * 100;
    
    if (percentChange > 0) {
      return {
        value: percentChange.toFixed(1),
        color: 'admin-text-success',
        icon: <FaArrowUp />
      };
    } else if (percentChange < 0) {
      return {
        value: Math.abs(percentChange).toFixed(1),
        color: 'admin-text-danger',
        icon: <FaArrowDown />
      };
    }
    
    return { value: 0, color: 'text-muted', icon: null };
  };
  
  // Chart colors
  const COLORS = ['#4361ee', '#3bc9db', '#fa5252', '#fab005', '#12b886', '#7950f2'];
  
  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'processing': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };
  
  // Get sales data based on time range
  const getSalesData = () => {
    if (!orderAnalytics || !orderAnalytics.salesByPeriod) {
      return [];
    }
    
    // Filter by timeRange
    return orderAnalytics.salesByPeriod.filter(item => {
      if (timeRange === 'week') return item.period === 'day' && item.recent;
      if (timeRange === 'month') return item.period === 'day';
      if (timeRange === 'year') return item.period === 'month';
      return true;
    });
  };
  
  // Get category distribution data
  const getCategoryData = () => {
    if (!productAnalytics || !productAnalytics.salesByCategory) {
      return [];
    }
    
    return productAnalytics.salesByCategory;
  };
  
  // Stats cards
  const statCards = [
    {
      title: 'Doanh thu tháng này',
      value: dashboardStats?.monthlyRevenue || 325470000,
      prevValue: dashboardStats?.prevMonthRevenue || 298560000,
      icon: <FaMoneyBillAlt />,
      color: 'admin-stat-card-primary',
      format: 'currency'
    },
    {
      title: 'Đơn hàng tháng này',
      value: dashboardStats?.monthlyOrders || 1247,
      prevValue: dashboardStats?.prevMonthOrders || 1105,
      icon: <FaShoppingCart />,
      color: 'admin-stat-card-info',
      format: 'number'
    },
    {
      title: 'Khách hàng mới',
      value: dashboardStats?.newCustomers || 587,
      prevValue: dashboardStats?.prevMonthNewCustomers || 432,
      icon: <FaUsers />,
      color: 'admin-stat-card-success',
      format: 'number'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: dashboardStats?.conversionRate || 3.8,
      prevValue: dashboardStats?.prevMonthConversionRate || 3.2,
      icon: <FaShoppingCart />,
      color: 'admin-stat-card-warning',
      format: 'percent',
      decimals: 1
    }
  ];
  
  return (
    <AdminLayout>
      <div className="admin-container admin-dashboard">
        <div className="admin-page-header admin-d-flex admin-justify-content-between admin-align-items-center admin-mb-4">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-text-muted">
              Tổng quan hoạt động kinh doanh của cửa hàng
            </p>
          </div>
          <div className="admin-d-flex">
            <Button variant="outline-primary" className="admin-btn admin-me-2">
              <FaDownload className="admin-me-1" /> Xuất báo cáo
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="primary" className="admin-btn">
                <FaCalendarAlt className="admin-me-1" /> {timeRange === 'week' ? '7 ngày qua' : timeRange === 'month' ? '30 ngày qua' : '12 tháng qua'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setTimeRange('week')}>7 ngày qua</Dropdown.Item>
                <Dropdown.Item onClick={() => setTimeRange('month')}>30 ngày qua</Dropdown.Item>
                <Dropdown.Item onClick={() => setTimeRange('year')}>12 tháng qua</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        
        {/* Stats Cards */}
        <Row>
          {statCards.map((stat, index) => {
            const percentChange = getPercentChange(stat.value, stat.prevValue);
            
            let displayValue;
            if (stat.format === 'currency') {
              displayValue = formatCurrency(stat.value);
            } else if (stat.format === 'percent') {
              displayValue = `${stat.value.toFixed(stat.decimals || 0)}%`;
            } else {
              displayValue = formatNumber(stat.value);
            }
            
            return (
              <Col lg={3} md={6} className="admin-mb-4" key={index}>
                <Card className={`admin-stat-card ${stat.color}`}>
                  <Card.Body>
                    <div className="admin-stat-card-content">
                      <div className="admin-stat-card-info">
                        <p className="admin-stat-card-title">{stat.title}</p>
                        <h3 className="admin-stat-card-value">{displayValue}</h3>
                        <p className={`admin-stat-card-change ${percentChange.color}`}>
                          {percentChange.icon} {percentChange.value}% {percentChange.value > 0 ? 'tăng' : 'giảm'} so với tháng trước
                        </p>
                      </div>
                      <div className="admin-stat-card-icon">
                        {stat.icon}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        {/* Main Charts */}
        <Row>
          <Col lg={8} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <div className="admin-card-header-content">
                  <h5 className="admin-card-title">Doanh thu & Đơn hàng</h5>
                  <Tabs
                    activeKey={activeSalesTab}
                    onSelect={(k) => setActiveSalesTab(k)}
                    className="admin-chart-tabs"
                  >
                    <Tab eventKey="revenue" title="Doanh thu" />
                    <Tab eventKey="orders" title="Đơn hàng" />
                  </Tabs>
                </div>
              </Card.Header>
              <Card.Body>
                {statsLoading || orderLoading ? (
                  <div className="admin-loader-container">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    {activeSalesTab === 'revenue' ? (
                      <AreaChart data={getSalesData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4361ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={value => formatCurrency(value)} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#4361ee" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                          activeDot={{ r: 6 }}
                          name="Doanh thu"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={getSalesData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Bar 
                          dataKey="orders" 
                          fill="#3bc9db" 
                          radius={[4, 4, 0, 0]} 
                          name="Đơn hàng"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <h5 className="admin-card-title">Doanh thu theo danh mục</h5>
              </Card.Header>
              <Card.Body>
                {productLoading ? (
                  <div className="admin-loader-container">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="admin-chart-container">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Pie
                          data={getCategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="admin-chart-legend">
                      {getCategoryData().map((entry, index) => (
                        <div key={index} className="admin-chart-legend-item">
                          <span 
                            className="admin-chart-legend-color" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="admin-chart-legend-label">{entry.name}</span>
                          <span className="admin-chart-legend-value">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Recent Orders & Top Products */}
        <Row>
          <Col lg={7} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <div className="admin-d-flex admin-justify-content-between admin-align-items-center">
                  <h5 className="admin-card-title">Đơn hàng gần đây</h5>
                  <Link to="/admin/orders" className="admin-link">Xem tất cả</Link>
                </div>
              </Card.Header>
              <div className="admin-table-responsive">
                <Table className="admin-table admin-table-hover admin-mb-0">
                  <thead>
                    <tr>
                      <th>Mã ĐH</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRecentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="admin-order-id">#{order.id}</span>
                        </td>
                        <td>{order.customer}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>
                          <span className={`admin-badge admin-badge-${getStatusBadgeVariant(order.status)}`}>
                            {order.status === 'delivered' && 'Đã giao hàng'}
                            {order.status === 'shipped' && 'Đang giao hàng'}
                            {order.status === 'processing' && 'Đang xử lý'}
                            {order.status === 'pending' && 'Chờ xác nhận'}
                            {order.status === 'cancelled' && 'Đã hủy'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Col>
          
          <Col lg={5} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <div className="admin-d-flex admin-justify-content-between admin-align-items-center">
                  <h5 className="admin-card-title">Top sản phẩm bán chạy</h5>
                  <Link to="/admin/products" className="admin-link">Xem tất cả</Link>
                </div>
              </Card.Header>
              <div className="admin-table-responsive">
                <Table className="admin-table admin-table-hover admin-mb-0">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Đã bán</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleTopProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="admin-product-name">
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>{formatNumber(product.sold)}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Col>
        </Row>
        
        {/* Bottom Row */}
        <Row>
          <Col lg={4} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <h5 className="admin-card-title">Tổng quan tồn kho</h5>
              </Card.Header>
              <Card.Body>
                <div className="admin-inventory-summary">
                  <div className="admin-inventory-stat">
                    <div className="admin-inventory-stat-icon admin-inventory-total">
                      <FaBoxOpen />
                    </div>
                    <div className="admin-inventory-stat-info">
                      <h3>{formatNumber(dashboardStats?.totalProducts || 1284)}</h3>
                      <p>Tổng sản phẩm</p>
                    </div>
                  </div>
                  
                  <div className="admin-inventory-stat">
                    <div className="admin-inventory-stat-icon admin-inventory-low">
                      <FaExclamationTriangle />
                    </div>
                    <div className="admin-inventory-stat-info">
                      <h3>{formatNumber(dashboardStats?.lowStockProducts || 28)}</h3>
                      <p>Sắp hết hàng</p>
                    </div>
                  </div>
                  
                  <div className="admin-inventory-stat">
                    <div className="admin-inventory-stat-icon admin-inventory-out">
                      <FaTimes />
                    </div>
                    <div className="admin-inventory-stat-info">
                      <h3>{formatNumber(dashboardStats?.outOfStockProducts || 12)}</h3>
                      <p>Hết hàng</p>
                    </div>
                  </div>
                </div>
                
                <div className="admin-mt-3">
                  <h6 className="admin-mb-2">Mức tồn kho theo danh mục</h6>
                  
                  <div className="admin-inventory-category">
                    <div className="admin-d-flex admin-justify-content-between admin-mb-1">
                      <span>Điện thoại</span>
                      <span>78%</span>
                    </div>
                    <ProgressBar now={78} variant="info" className="admin-mb-3" />
                  </div>
                  
                  <div className="admin-inventory-category">
                    <div className="admin-d-flex admin-justify-content-between admin-mb-1">
                      <span>Laptop</span>
                      <span>45%</span>
                    </div>
                    <ProgressBar now={45} variant="info" className="admin-mb-3" />
                  </div>
                  
                  <div className="admin-inventory-category">
                    <div className="admin-d-flex admin-justify-content-between admin-mb-1">
                      <span>Thời trang</span>
                      <span>92%</span>
                    </div>
                    <ProgressBar now={92} variant="info" className="admin-mb-3" />
                  </div>
                  
                  <div className="admin-inventory-category">
                    <div className="admin-d-flex admin-justify-content-between admin-mb-1">
                      <span>Đồ gia dụng</span>
                      <span>65%</span>
                    </div>
                    <ProgressBar now={65} variant="info" className="admin-mb-3" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <h5 className="admin-card-title">Đánh giá mới nhất</h5>
              </Card.Header>
              <Card.Body className="admin-p-0">
                <div className="admin-reviews-list">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="admin-review-item">
                      <div className="admin-review-header">
                        <div className="admin-review-user">
                          <div className="admin-review-avatar">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="admin-review-user-info">
                            <h6>Khách hàng {index + 1}</h6>
                            <div className="admin-review-rating">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={i < 5 - (index % 2) ? 'admin-star-filled' : 'admin-star-empty'} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="admin-review-date">
                          {formatDate(new Date(Date.now() - index * 86400000).toISOString())}
                        </div>
                      </div>
                      <div className="admin-review-product">
                        Sản phẩm: {sampleTopProducts[index % sampleTopProducts.length].name}
                      </div>
                      <p className="admin-review-content">
                        {index % 2 === 0 
                          ? 'Sản phẩm rất tốt, đúng với mô tả. Giao hàng nhanh, đóng gói cẩn thận. Tôi rất hài lòng với trải nghiệm mua sắm.' 
                          : 'Chất lượng sản phẩm tạm ổn. Giao hàng khá nhanh nhưng đóng gói hơi sơ sài. Sẽ mua lại nếu có cải thiện.'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4} className="admin-mb-4">
            <Card className="admin-card">
              <Card.Header className="admin-card-header">
                <h5 className="admin-card-title">Thông báo hệ thống</h5>
              </Card.Header>
              <Card.Body className="admin-p-0">
                <div className="admin-notifications-list">
                  <div className="admin-notification-item admin-notification-warning">
                    <div className="admin-notification-icon">
                      <FaExclamationTriangle />
                    </div>
                    <div className="admin-notification-content">
                      <h6>Cảnh báo tồn kho thấp</h6>
                      <p>5 sản phẩm sắp hết hàng. Vui lòng kiểm tra và nhập thêm hàng.</p>
                      <span className="admin-notification-time">1 giờ trước</span>
                    </div>
                  </div>
                  
                  <div className="admin-notification-item admin-notification-success">
                    <div className="admin-notification-icon">
                      <FaShoppingBag />
                    </div>
                    <div className="admin-notification-content">
                      <h6>Đơn hàng mới #1006</h6>
                      <p>Đơn hàng mới từ khách hàng Lê Thị Hoa.</p>
                      <span className="admin-notification-time">3 giờ trước</span>
                    </div>
                  </div>
                  
                  <div className="admin-notification-item admin-notification-primary">
                    <div className="admin-notification-icon">
                      <FaUsers />
                    </div>
                    <div className="admin-notification-content">
                      <h6>Người dùng mới đăng ký</h6>
                      <p>10 khách hàng mới đã đăng ký trong 24 giờ qua.</p>
                      <span className="admin-notification-time">5 giờ trước</span>
                    </div>
                  </div>
                  
                  <div className="admin-notification-item admin-notification-info">
                    <div className="admin-notification-icon">
                      <FaStore />
                    </div>
                    <div className="admin-notification-content">
                      <h6>Cập nhật hệ thống</h6>
                      <p>Hệ thống sẽ bảo trì vào 23:00 tối nay.</p>
                      <span className="admin-notification-time">1 ngày trước</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

// Add Link component since it's referenced in the code
const Link = ({ to, children, className }) => (
  <a href={to} className={className}>{children}</a>
);

export default Dashboard; 