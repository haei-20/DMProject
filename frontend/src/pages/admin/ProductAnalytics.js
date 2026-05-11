import React, { useState } from 'react';
import { Row, Col, Card, Spinner, Alert, Tab, Tabs, Form, Button } from 'react-bootstrap';
import { 
  useGetProductAnalyticsQuery,
  useGetFrequentlyBoughtTogetherQuery 
} from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import FrequentlyBoughtTogetherTable from '../../components/admin/FrequentlyBoughtTogetherTable';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatPrice } from '../../utils/productHelpers';

const ProductAnalytics = () => {
  const [activeTab, setActiveTab] = useState('frequentlyBought');
  // Use extremely low minSupport to capture any patterns in the data
  const [minSupport, setMinSupport] = useState(0.00001);
  const [orderLimit, setOrderLimit] = useState(3000);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [minLift, setMinLift] = useState(1);
  const [minConviction, setMinConviction] = useState(1);
  
  // Log parameters being used for debugging
  console.log(`Fetching frequently bought data with: minSupport=${minSupport}, minConfidence=${minConfidence}, minLift=${minLift}, minConviction=${minConviction}, orderLimit=${orderLimit}`);
  
  const { data: productAnalytics, isLoading: productLoading } = useGetProductAnalyticsQuery();
  const { data: frequentlyBoughtData, isLoading: frequentlyBoughtLoading, refetch } = useGetFrequentlyBoughtTogetherQuery(
    {
      minSupport,
      orderLimit,
      minConfidence,
      minLift,
      minConviction
    },
    {
      // Chỉ tải dữ liệu FBT khi mở đúng tab để tránh làm chậm trang analytics.
      skip: activeTab !== 'frequentlyBought'
    }
  );
  
  // Log received data for debugging
  React.useEffect(() => {
    if (frequentlyBoughtData) {
      console.log("Received frequently bought data:", frequentlyBoughtData);
    }
  }, [frequentlyBoughtData]);
  
  const COLORS = ['#4a6cf7', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  const handleApplyFrequentlyBoughtFilters = (e) => {
    e.preventDefault();
    const formMinSupport = parseFloat(e.target.minSupport.value);
    const formOrderLimit = parseInt(e.target.orderLimit?.value) || 10000;
    const formMinConfidence = parseFloat(e.target.minConfidence?.value) || 0.1;
    const formMinLift = parseFloat(e.target.minLift?.value) || 1;
    const formMinConviction = parseFloat(e.target.minConviction?.value) || 1;
    
    console.log(`Applying new filters: minSupport=${formMinSupport}, minConfidence=${formMinConfidence}, minLift=${formMinLift}, minConviction=${formMinConviction}, orderLimit=${formOrderLimit}`);
    
    setMinSupport(formMinSupport);
    setOrderLimit(formOrderLimit);
    setMinConfidence(formMinConfidence);
    setMinLift(formMinLift);
    setMinConviction(formMinConviction);
    
    // Force refetch data with new parameters
    setTimeout(() => {
      refetch();
    }, 100);
  };
  
  const renderSalesByCategoryChart = () => {
    if (!productAnalytics || !productAnalytics.salesByCategory) {
      return (
        <Alert variant="info">
          Không có dữ liệu doanh số theo danh mục
        </Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={productAnalytics.salesByCategory}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={140}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {productAnalytics.salesByCategory.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatPrice(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <AdminLayout>
      <div className="container-fluid px-4 py-4">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Phân tích sản phẩm</h1>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onSelect={handleTabChange}
          className="mb-4"
        >
          <Tab eventKey="frequentlyBought" title="Sản phẩm thường mua cùng nhau">
            <Card>
              <Card.Header>
                <h5 className="mb-0">Tùy chọn phân tích</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleApplyFrequentlyBoughtFilters}>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Support (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="minSupport"
                          step="0.00001"
                          min="0.00001"
                          max="1"
                          defaultValue={minSupport}
                        />
                        <Form.Text className="text-muted">
                          Tỷ lệ tối thiểu xuất hiện (0.00001 = 0.001%)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Số đơn hàng phân tích</Form.Label>
                        <Form.Control
                          type="number"
                          name="orderLimit"
                          min="100"
                          step="1000"
                          defaultValue={orderLimit}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Confidence</Form.Label>
                        <Form.Control type="number" name="minConfidence" step="0.01" min="0.00001" max="1" defaultValue={minConfidence} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Lift</Form.Label>
                        <Form.Control type="number" name="minLift" step="0.01" min="0.00001" defaultValue={minLift} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Conviction</Form.Label>
                        <Form.Control type="number" name="minConviction" step="0.01" min="0.00001" defaultValue={minConviction} />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button type="submit" variant="primary" className="mb-3">
                        Áp dụng & Tải lại
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
            
            <div className="mt-4">
              <FrequentlyBoughtTogetherTable 
                data={frequentlyBoughtData} 
                loading={frequentlyBoughtLoading}
                minConfidence={minConfidence}
                minLift={minLift}
                minConviction={minConviction}
                onMinConfidenceChange={setMinConfidence}
                onMinLiftChange={setMinLift}
                onMinConvictionChange={setMinConviction}
                error={frequentlyBoughtData?.error}
              />
            </div>
          </Tab>
          
          <Tab eventKey="sales" title="Doanh số bán hàng">
            {productLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : productAnalytics?.topProducts ? (
              <Row>
                <Col lg={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Top sản phẩm bán chạy</h5>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={productAnalytics.topProducts.map(p => ({
                            name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                            sales: p.totalSales
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="sales" fill="#4a6cf7" name="Số lượng bán" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Doanh số theo danh mục</h5>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={productAnalytics.salesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {productAnalytics.salesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatPrice(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Alert variant="info">
                Không có dữ liệu phân tích doanh số
              </Alert>
            )}
          </Tab>
          
          <Tab eventKey="productViews" title="Lượt xem sản phẩm">
            {productLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : productAnalytics?.productViews ? (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Sản phẩm có nhiều lượt xem nhất</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={productAnalytics.productViews}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#4a6cf7" name="Lượt xem" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            ) : (
              <Alert variant="info">
                Không có dữ liệu về lượt xem sản phẩm
              </Alert>
            )}
          </Tab>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ProductAnalytics; 