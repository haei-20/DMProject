import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Form } from 'react-bootstrap';
import { FaChartLine, FaShoppingCart, FaUsers, FaMoneyBillWave, FaChartBar, FaChartPie } from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import './AdminStats.css';
import {
  useGetDashboardStatsQuery,
  useGetTopProductsQuery,
  useGetProductAnalyticsQuery,
  useGetOrderAnalyticsQuery
} from '../../services/api';
import { formatPrice } from '../../utils/productHelpers';
import {
  extractMonthlyRowsFromRevenueByPeriod,
  coerceNonNegativeNumber,
} from '../../utils/orderAnalyticsChart';

/** Chiều cao tối đa cột (px) trong vùng track — dùng px để cột luôn bám đáy, tránh lỗi % trong flex. */
const BAR_TRACK_MAX_PX = 176;

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

const AdminStats = () => {
  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(currentYear - 4);
  const [toYear, setToYear] = useState(currentYear);
  const [didClampRange, setDidClampRange] = useState(false);

  const normalizedFromYear = Math.min(fromYear, toYear);
  const normalizedToYear = Math.max(fromYear, toYear);

  const statsQueryArg = { fromYear: normalizedFromYear, toYear: normalizedToYear };

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError
  } = useGetDashboardStatsQuery(statsQueryArg);
  const {
    data: topProducts = [],
    isLoading: topProductsLoading,
    isError: topProductsIsError,
    error: topProductsError
  } = useGetTopProductsQuery({
    limit: 10,
    timeRange: 'all',
  });
  const {
    data: productAnalytics,
    isLoading: productLoading,
    isError: productIsError,
    error: productError
  } = useGetProductAnalyticsQuery(statsQueryArg);
  const {
    data: orderAnalytics,
    isLoading: orderLoading,
    isError: orderIsError,
    error: orderError
  } = useGetOrderAnalyticsQuery(statsQueryArg);

  useEffect(() => {
    if (didClampRange || !orderAnalytics?.info) return;
    const maxY = Number(orderAnalytics.info.maxDataYear);
    const minY = Number(orderAnalytics.info.minDataYear);
    if (!Number.isFinite(maxY)) return;
    const lo = Number.isFinite(minY) ? minY : 2000;
    const hi = Math.min(currentYear, maxY);
    setFromYear((f) => Math.min(Math.max(f, lo), hi));
    setToYear((t) => Math.min(Math.max(t, lo), hi));
    setDidClampRange(true);
  }, [orderAnalytics, didClampRange, currentYear]);

  const yearOptions = useMemo(() => {
    const min = Number(orderAnalytics?.info?.minDataYear);
    const maxY = Number(orderAnalytics?.info?.maxDataYear);
    const start = Number.isFinite(min) ? min : currentYear - 5;
    const end = Number.isFinite(maxY) ? maxY : currentYear;
    const lo = Math.max(2000, Math.min(start, end));
    const hi = Math.min(currentYear, Math.max(lo, end));
    const arr = [];
    for (let y = hi; y >= lo; y -= 1) arr.push(y);
    return arr.length ? arr : [currentYear];
  }, [orderAnalytics, currentYear]);

  const waitingForStats = statsLoading && !dashboardStats && !statsIsError;

  const formatCurrency = (amount) => formatPrice(amount || 0);

  const rangeLabel =
    normalizedFromYear === normalizedToYear
      ? String(normalizedFromYear)
      : `${normalizedFromYear}–${normalizedToYear}`;

  const isMonthlyChart = normalizedFromYear === normalizedToYear;

  const monthlyRevenue = useMemo(() => {
    const rows = extractMonthlyRowsFromRevenueByPeriod(orderAnalytics?.revenueByPeriod || []);
    return rows.map(({ name, revenue }) => ({ name, revenue }));
  }, [orderAnalytics]);

  const yearlyRevenue = useMemo(() => {
    const rows = orderAnalytics?.revenueByPeriod || [];
    return rows
      .filter((item) => String(item?.period ?? '').trim().toLowerCase() === 'year')
      .map((item) => ({
        name: item.name != null ? String(item.name) : '',
        revenue: coerceNonNegativeNumber(item.revenue),
      }))
      .filter((item) => {
        const y = parseInt(item.name, 10);
        return (
          Number.isFinite(y) &&
          y >= normalizedFromYear &&
          y <= normalizedToYear
        );
      })
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));
  }, [orderAnalytics, normalizedFromYear, normalizedToYear]);

  const revenueChartRows = isMonthlyChart ? monthlyRevenue : yearlyRevenue;

  const maxChartRevenue = useMemo(() => {
    if (!revenueChartRows.length) return 1;
    return Math.max(1, ...revenueChartRows.map((r) => r.revenue));
  }, [revenueChartRows]);

  const getTopProducts = () => topProducts || [];

  const salesByCategoryRows = useMemo(() => {
    const rows = productAnalytics?.salesByCategory || [];
    return rows.map((c) => ({
      name: c.name != null ? String(c.name) : 'Khác',
      value: Math.max(0, Number(c.value) || 0)
    }));
  }, [productAnalytics]);

  const categoryTotalValue = useMemo(
    () => salesByCategoryRows.reduce((sum, cat) => sum + cat.value, 0),
    [salesByCategoryRows]
  );

  return (
    <AdminLayout>
      <div className="admin-stats">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
          <h1 className="mb-0">Thống kê và phân tích</h1>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Form.Label className="mb-0 small text-muted">Từ năm</Form.Label>
            <Form.Select
              size="sm"
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              style={{ width: 110 }}
              aria-label="Từ năm"
            >
              {yearOptions.map((y) => (
                <option key={`f-${y}`} value={y}>
                  {y}
                </option>
              ))}
            </Form.Select>
            <Form.Label className="mb-0 small text-muted">Đến năm</Form.Label>
            <Form.Select
              size="sm"
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              style={{ width: 110 }}
              aria-label="Đến năm"
            >
              {yearOptions.map((y) => (
                <option key={`t-${y}`} value={y}>
                  {y}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
        <p className="text-muted small mb-4">
          Số liệu đang lọc theo khoảng <strong>{rangeLabel}</strong>
          {fromYear !== toYear && fromYear > toYear && (
            <span> (áp dụng {normalizedFromYear}–{normalizedToYear})</span>
          )}
          .
        </p>

        {waitingForStats ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải thống kê...</p>
          </div>
        ) : (
          <>
            {statsIsError && (
              <Alert variant="warning" className="mb-3">
                Không tải được chỉ số tổng quan:{' '}
                <strong>{getRtkQueryErrorMessage(statsError) || 'Đã xảy ra lỗi'}</strong>
              </Alert>
            )}

            <div className="stats-section">
              <h2>Chỉ số chính</h2>
              <Row>
                <Col md={3}>
                  <Card className="stats-card">
                    <Card.Body>
                      <div className="stats-icon">
                        <FaMoneyBillWave />
                      </div>
                      <div className="stats-info">
                        <h3>{formatCurrency(dashboardStats?.totalRevenue)}</h3>
                        <p>Tổng doanh thu ({rangeLabel})</p>
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
                        <p>Tổng đơn hàng ({rangeLabel})</p>
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
                        <p>Tổng khách hàng</p>
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
                        <p>Khách hàng mới ({rangeLabel})</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="stats-section">
              <h2>
                {isMonthlyChart
                  ? `Doanh thu theo tháng (${rangeLabel})`
                  : `Doanh thu theo năm (${rangeLabel})`}
              </h2>
              <Card className="chart-card">
                <Card.Body>
                  {orderLoading && !orderAnalytics ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" />
                      <p className="mt-2 mb-0">Đang tải dữ liệu doanh thu...</p>
                    </div>
                  ) : orderIsError ? (
                    <Alert variant="danger" className="mb-0">
                      Không tải được dữ liệu doanh thu:{' '}
                      <strong>{getRtkQueryErrorMessage(orderError) || 'Đã xảy ra lỗi'}</strong>
                    </Alert>
                  ) : revenueChartRows.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      Không có dữ liệu doanh thu trong khoảng năm đã chọn.
                    </Alert>
                  ) : (
                    <div className="chart-placeholder">
                      <FaChartBar className="chart-icon" />
                      <p>
                        {isMonthlyChart
                          ? 'Biểu đồ doanh thu theo tháng'
                          : 'Biểu đồ doanh thu gộp theo năm'}
                      </p>
                      <div className="mock-bar-chart">
                        {revenueChartRows.map((item, index) => {
                          const barPx =
                            (item.revenue / maxChartRevenue) * BAR_TRACK_MAX_PX;
                          return (
                            <div key={`${item.name}-${index}`} className="mock-bar-container">
                              <div className="mock-bar-track">
                                <div
                                  className="mock-bar"
                                  style={{
                                    height: `${Math.max(2, barPx)}px`
                                  }}
                                />
                              </div>
                              <div className="mock-bar-label">{item.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            <Row>
              <Col md={7}>
                <div className="stats-section">
                  <h2>Sản phẩm bán chạy (toàn thời gian)</h2>
                  <Card className="table-card">
                    <Card.Body>
                      {topProductsIsError ? (
                        <Alert variant="danger" className="mb-0">
                          Không tải được sản phẩm bán chạy:{' '}
                          <strong>{getRtkQueryErrorMessage(topProductsError) || 'Đã xảy ra lỗi'}</strong>
                        </Alert>
                      ) : (
                        <table className="stats-table">
                          <thead>
                            <tr>
                              <th>Sản phẩm</th>
                              <th>Đã bán</th>
                              <th>Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProductsLoading ? (
                              <tr>
                                <td colSpan="3" className="text-center py-3">
                                  <Spinner animation="border" size="sm" />
                                </td>
                              </tr>
                            ) : getTopProducts().length === 0 ? (
                              <tr>
                                <td colSpan="3" className="text-center text-muted py-3">
                                  Không có đơn hàng trong khoảng thời gian đã chọn.
                                </td>
                              </tr>
                            ) : (
                              getTopProducts().map((product, index) => (
                                <tr key={product._id || index}>
                                  <td>{product.name}</td>
                                  <td>{product.totalSales ?? 0}</td>
                                  <td>{formatCurrency(product.price)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </Col>
              <Col md={5}>
                <div className="stats-section">
                  <h2>Doanh số theo danh mục ({rangeLabel})</h2>
                  <Card className="chart-card">
                    <Card.Body>
                      {productLoading && !productAnalytics ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" size="sm" />
                          <p className="mt-2 mb-0">Đang tải dữ liệu danh mục...</p>
                        </div>
                      ) : productIsError ? (
                        <Alert variant="danger" className="mb-0">
                          Không tải được doanh số theo danh mục:{' '}
                          <strong>{getRtkQueryErrorMessage(productError) || 'Đã xảy ra lỗi'}</strong>
                        </Alert>
                      ) : salesByCategoryRows.length === 0 ? (
                        <Alert variant="info" className="mb-0">
                          Không có dữ liệu doanh số theo danh mục
                        </Alert>
                      ) : (
                        <div className="chart-placeholder pie-chart-placeholder">
                          <FaChartPie className="chart-icon" />
                          <p>Phân bố danh mục</p>
                          <div className="category-list">
                            {salesByCategoryRows.map((category, index) => {
                              const percentage = categoryTotalValue
                                ? Math.round((category.value / categoryTotalValue) * 100)
                                : 0;
                              return (
                                <div key={`${category.name}-${index}`} className="category-item">
                                  <div
                                    className="category-color"
                                    style={{ backgroundColor: getColorForIndex(index) }}
                                  />
                                  <div className="category-name">{category.name}</div>
                                  <div className="category-percentage">{percentage}%</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

const getColorForIndex = (index) => {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  return colors[index % colors.length];
};

export default AdminStats;
