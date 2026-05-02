import React, { useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FaShoppingBag, FaShoppingCart, FaMoneyBillWave, FaStar
} from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import './VietnameseAdminDashboard.css';

const VietnameseAdminDashboard = () => {
  const [dateRange, setDateRange] = useState({ start: '26/03/2024', end: '26/03/2025' });
  
  // Theme colors
  const THEME_COLORS = {
    primary: '#E4728C',
    secondary: '#E98597',
    background: '#F8CDD8',
    light: '#FFEFF4',
    dark: '#333333',
    green: '#6EBF8B',
    blue: '#5DADE2',
    yellow: '#F7DC6F',
    purple: '#C39BD3'
  };

  // Format functions
  const formatCurrency = (amount) => {
    return amount + ' tỷ';
  };

  const formatNumber = (num) => {
    return num + ' nghìn';
  };

  // Basic stat card component
  const StatCard = ({ title, value, icon, color }) => (
    <Card className="stat-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-2">{title}</h6>
            <h3 className="mb-0">{value}</h3>
          </div>
          <div className="stat-icon">
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Revenue by product data
  const revenueByProductData = [
    { name: "Rocher sp...", value: 37 },
    { name: "Kẹo Socol...", value: 33 },
    { name: "Nước Giặt...", value: 29 },
    { name: "Mì ăn liền...", value: 26 },
  ];

  // Products sold data
  const productsSoldData = [
    { name: "Sữa chua...", value: 18 },
    { name: "Sữa tiệt tr...", value: 18 },
    { name: "CLOSEUP", value: 18 },
    { name: "Bột lạt tự n...", value: 17 },
  ];

  // Monthly sales data
  const monthlySalesData = [
    { month: 2, quantity: 71, revenue: 71, growthQuantity: 0, growthRevenue: 0 },
    { month: 4, quantity: 48, revenue: 48, growthQuantity: -23, growthRevenue: -23 },
    { month: 6, quantity: 58, revenue: 58, growthQuantity: 10, growthRevenue: 10 },
    { month: 8, quantity: 70, revenue: 70, growthQuantity: 12, growthRevenue: 12 },
    { month: 10, quantity: 47, revenue: 47, growthQuantity: -23, growthRevenue: -23 },
    { month: 12, quantity: 46, revenue: 46, growthQuantity: -1, growthRevenue: -1 },
  ];

  // Associated products
  const associatedProducts = [
    { id: 1, name: "Bánh gạo tteokbokki trộn", class: "pink-gradient" },
    { id: 2, name: "Bánh gạo tteokbokki nóng", class: "pink-gradient-light" },
    { id: 3, name: "Mì ăn liền khoai tây", class: "yellow-gradient" },
    { id: 4, name: "Mì gói ăn liền nước tương", class: "purple-gradient" },
    { id: 5, name: "Bánh gạo tteokbokki trộn", class: "pink-gradient" },
    { id: 6, name: "Mì ăn liền khoai tây sốt cay", class: "purple-gradient" },
    { id: 7, name: "Bánh gạo tteokbokki trộn", class: "pink-gradient" },
    { id: 8, name: "Mì ăn liền khoai tây", class: "yellow-gradient" },
    { id: 9, name: "Mỳ ăn liền OTTOGI Tteokbokki", class: "yellow-gradient" },
  ];

  // Category sales data
  const categoryMatrixData = [
    { 
      category: 'Bánh Kẹo', 
      values: [16773, 6753, 5257, 5482, 7885, 12737, 12888, 6933] 
    },
    { 
      category: 'Chăm Sóc Cá Nhân', 
      values: [6753, 18407, 5686, 6009, 8588, 13957, 15299, 7618] 
    },
    { 
      category: 'Đồ uống - Giải khát', 
      values: [5257, 5686, 14141, 4676, 6683, 10846, 11682, 5847] 
    },
    { 
      category: 'Hóa Phẩm - Tẩy rửa', 
      values: [5482, 6009, 4676, 14824, 7022, 11197, 12341, 6154] 
    },
    { 
      category: 'Mì - Thực Phẩm Ăn Liền', 
      values: [7885, 8588, 6683, 7022, 22996, 16082, 17717, 8818] 
    },
    { 
      category: 'Rau - Củ - Trái Cây', 
      values: [12737, 13957, 10846, 11197, 16082, 23957, 28607, 14242] 
    },
    { 
      category: 'Sữa các loại', 
      values: [12888, 15299, 11682, 12341, 17717, 28607, 30115, 15599] 
    },
    { 
      category: 'Văn phòng phẩm - Đồ chơi', 
      values: [6933, 7618, 5847, 6154, 8818, 14242, 15599, 18849] 
    },
  ];

  const categories = [
    "Bánh Kẹo", "Chăm Sóc Cá Nhân", "Đồ uống - Giải khát", "Hóa Phẩm - Tẩy rửa",
    "Mì - Thực Phẩm Ăn Liền", "Rau - Củ - Trái Cây", "Sữa các loại", "Văn phòng phẩm - Đồ chơi"
  ];
  
  return (
    <AdminLayout>
      <div className="vietnamese-admin-dashboard">
        {/* Logo Header */}
        <div className="dashboard-header">
          <div className="dashboard-logo">
            <div className="logo-wrapper">
              <h2>2NADH</h2>
              <FaStar className="star-icon" />
              <FaStar className="small-star-icon" />
            </div>
            <p className="logo-subtitle">MUA SẮM THÔNG MINH</p>
          </div>
          
          {/* Date Range Slider */}
          <div className="date-range-container">
            <div className="date-range-label">Thời gian</div>
            <div className="date-range-dates">
              <span>{dateRange.start}</span>
              <span>{dateRange.end}</span>
            </div>
            <input 
              type="range" 
              className="form-range"
              min="0" 
              max="100" 
              value="50"
              onChange={() => {}}
            />
          </div>
        </div>
        
        {/* Stats Cards */}
        <Row className="stats-row g-4">
          <Col md={4}>
            <StatCard
              title="Tổng số hóa đơn"
              value="50 nghìn"
              icon={<FaShoppingBag />}
            />
          </Col>
          <Col md={4}>
            <StatCard
              title="Sản phẩm bán ra"
              value="821 nghìn"
              icon={<FaShoppingCart />}
            />
          </Col>
          <Col md={4}>
            <StatCard
              title="Tổng doanh thu"
              value="557 tỷ"
              icon={<FaMoneyBillWave />}
            />
          </Col>
        </Row>

        <Row className="mt-4 g-4">
          {/* Revenue by Product */}
          <Col lg={6}>
            <Card className="chart-card">
              <Card.Header>
                <h6>Tổng doanh thu theo sản phẩm</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={revenueByProductData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 40]} tickFormatter={(value) => `${value} tỷ`} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value} tỷ`, "Doanh thu"]} />
                    <Bar dataKey="value" fill={THEME_COLORS.primary} barSize={15} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Products Sold */}
          <Col lg={6}>
            <Card className="chart-card">
              <Card.Header>
                <h6>Số lượng sản phẩm bán ra</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={productsSoldData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 20]} tickFormatter={(value) => `${value} nghìn`} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value} nghìn`, "Số lượng"]} />
                    <Bar dataKey="value" fill={THEME_COLORS.primary} barSize={15} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mt-4">
          {/* Monthly Revenue and Product Sales */}
          <Col lg={8}>
            <Card className="chart-card">
              <Card.Header>
                <h6>Doanh thu và số lượng sản phẩm bán ra theo tháng</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={monthlySalesData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME_COLORS.primary} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={THEME_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tickFormatter={(value) => `${value}`} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'quantity') return [`${value} nghìn`, 'Số lượng sản phẩm bán ra'];
                      if (name === 'revenue') return [`${value} tỷ`, 'Tổng doanh thu'];
                    }} />
                    <Area 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke={THEME_COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorQuantity)" 
                      yAxisId="left"
                      name="quantity"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={THEME_COLORS.primary} 
                      fillOpacity={1}
                      fill="url(#colorRevenue)" 
                      yAxisId="right"
                      name="revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: THEME_COLORS.primary }}></div>
                    <span>Số lượng sản phẩm bán ra</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: THEME_COLORS.primary }}></div>
                    <span>Tổng doanh thu</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ borderColor: THEME_COLORS.primary, borderStyle: 'dashed' }}></div>
                    <span>Tăng trưởng doanh thu</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ borderColor: THEME_COLORS.primary, borderStyle: 'dashed' }}></div>
                    <span>Tăng trưởng số lượng bán ra</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          {/* Associated Products */}
          <Col lg={4}>
            <Card className="chart-card">
              <Card.Header>
                <h6>Top các sản phẩm thường được mua cùng nhau</h6>
              </Card.Header>
              <Card.Body>
                <div className="product-associations">
                  {associatedProducts.map((product) => (
                    <div key={product.id} className={`associated-product ${product.class}`}>
                      <span>{product.name}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Category Matrix */}
        <Row className="mt-4">
          <Col>
            <Card className="chart-card">
              <Card.Header>
                <h6>Danh mục</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="category-table">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Danh mục</th>
                        {categories.map((category, index) => (
                          <th key={index}>{category}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryMatrixData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex === 0 ? "highlighted-row" : ""}>
                          <td>{row.category}</td>
                          {row.values.map((value, colIndex) => (
                            <td key={colIndex}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

export default VietnameseAdminDashboard; 