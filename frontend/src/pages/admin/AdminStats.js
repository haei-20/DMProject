import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaChartLine, FaShoppingCart, FaUsers, FaMoneyBillWave, FaChartBar, FaChartPie } from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import './AdminStats.css';
import { 
  useGetDashboardStatsQuery,
  useGetTopProductsQuery,
  useGetProductAnalyticsQuery,
  useGetUserAnalyticsQuery,
  useGetOrderAnalyticsQuery
} from '../../services/api';

const AdminStats = () => {
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery();
  const { data: topProducts = [], isLoading: topProductsLoading } = useGetTopProductsQuery({
    limit: 10,
    timeRange: 'month'
  });
  const { data: productAnalytics, isLoading: productLoading } = useGetProductAnalyticsQuery();
  const { data: userAnalytics, isLoading: userLoading } = useGetUserAnalyticsQuery();
  const { data: orderAnalytics, isLoading: orderLoading } = useGetOrderAnalyticsQuery();

  const loading = statsLoading || productLoading || userLoading || orderLoading;
  const error = statsError || (!dashboardStats && !productAnalytics && !userAnalytics && !orderAnalytics);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Get top products data
  const getTopProducts = () => {
    return topProducts || [];
  };

  // Get sales by category data
  const getSalesByCategory = () => {
    return productAnalytics?.salesByCategory || [];
  };

  // Get revenue data from order analytics
  const getRevenueData = () => {
    return orderAnalytics?.revenueByPeriod || [];
  };

  return (
    <AdminLayout>
      <div className="admin-stats">
        <h1>Statistics & Analytics</h1>
        
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading statistics...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <Alert.Heading>Error loading data</Alert.Heading>
            <p>Could not load analytics data. Using mock data instead.</p>
          </Alert>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="stats-section">
              <h2>Key Metrics</h2>
              <Row>
                <Col md={3}>
                  <Card className="stats-card">
                    <Card.Body>
                      <div className="stats-icon">
                        <FaMoneyBillWave />
                      </div>
                      <div className="stats-info">
                        <h3>{formatCurrency(dashboardStats?.totalRevenue)}</h3>
                        <p>Total Revenue</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stats-card">
                    <Card.Body>
                      <div className="stats-icon">
                        <FaShoppingCart />
                      </div>
                      <div className="stats-info">
                        <h3>{dashboardStats?.totalOrders || 0}</h3>
                        <p>Total Orders</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stats-card">
                    <Card.Body>
                      <div className="stats-icon">
                        <FaUsers />
                      </div>
                      <div className="stats-info">
                        <h3>{dashboardStats?.totalCustomers || 0}</h3>
                        <p>Total Customers</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="stats-card">
                    <Card.Body>
                      <div className="stats-icon">
                        <FaChartLine />
                      </div>
                      <div className="stats-info">
                        <h3>{dashboardStats?.newCustomers || 0}</h3>
                        <p>New Customers This Month</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
            
            {/* Revenue Chart */}
            <div className="stats-section">
              <h2>Monthly Revenue</h2>
              <Card className="chart-card">
                <Card.Body>
                  <div className="chart-placeholder">
                    <FaChartBar className="chart-icon" />
                    <p>Monthly Revenue Chart</p>
                    <div className="mock-bar-chart">
                      {getRevenueData().map((item, index) => {
                        const maxRevenue = Math.max(...getRevenueData().map(i => i.revenue));
                        return (
                          <div key={index} className="mock-bar-container">
                            <div 
                              className="mock-bar" 
                              style={{ 
                                height: `${(item.revenue / (maxRevenue || 1)) * 100}%` 
                              }}
                            />
                            <div className="mock-bar-label">{item.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
            
            {/* Top Products & Categories */}
            <Row>
              <Col md={7}>
                <div className="stats-section">
                  <h2>Top Selling Products</h2>
                  <Card className="table-card">
                    <Card.Body>
                      <table className="stats-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Sales</th>
                            <th>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProductsLoading ? (
                            <tr>
                              <td colSpan="3" className="text-center py-3">
                                <Spinner animation="border" size="sm" />
                              </td>
                            </tr>
                          ) : getTopProducts().map((product, index) => (
                            <tr key={index}>
                              <td>{product.name}</td>
                              <td>{product.totalSales || 0}</td>
                              <td>{formatCurrency(product.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
              <Col md={5}>
                <div className="stats-section">
                  <h2>Sales by Category</h2>
                  <Card className="chart-card">
                    <Card.Body>
                      <div className="chart-placeholder pie-chart-placeholder">
                        <FaChartPie className="chart-icon" />
                        <p>Category Distribution</p>
                        <div className="category-list">
                          {getSalesByCategory().map((category, index) => {
                            const totalValue = getSalesByCategory().reduce((sum, cat) => sum + cat.value, 0);
                            const percentage = totalValue ? Math.round((category.value / totalValue) * 100) : 0;
                            return (
                              <div key={index} className="category-item">
                                <div className="category-color" style={{ backgroundColor: getColorForIndex(index) }}></div>
                                <div className="category-name">{category.name}</div>
                                <div className="category-percentage">{percentage}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// Helper function to generate colors for the pie chart
const getColorForIndex = (index) => {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  return colors[index % colors.length];
};

export default AdminStats; 