import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Breadcrumb, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DealHot from '../components/DealHot';
import { useGetDealHotQuery } from '../services/api';
import Layout from '../components/Layout';

const DealHotPage = () => {
  const [sortBy, setSortBy] = useState('discount');
  const [dealProducts, setDealProducts] = useState([]);
  const [dataSource, setDataSource] = useState('loading');
  
  // Fetch products with salePrice field using the dedicated API endpoint
  const { data, isLoading, error } = useGetDealHotQuery({
    limit: 100 // Lấy nhiều sản phẩm hơn để hiển thị
  });
  
  // Process products when data is loaded
  useEffect(() => {
    if (data && data.products) {
      // Kiểm tra nguồn dữ liệu
      const isRealData = data.products.every(p => 
        p._id && typeof p._id === 'string' && p._id.length >= 12 &&
        p.name && p.price && !(p.name.includes('Mock') || p.name.includes('Mẫu'))
      );
      
      setDataSource(isRealData ? 'real' : 'mock');
      console.log(isRealData ? '✅ DealHotPage: Sử dụng dữ liệu thực' : '⚠️ DealHotPage: Có thể đang sử dụng dữ liệu mẫu');
      
      // Đảm bảo chỉ lấy sản phẩm có giảm giá
      const deals = data.products.filter(
        product => product.salePrice && product.salePrice < product.price
      );
      
      // Sort products based on selected criterion
      let sortedDeals = [...deals];
      
      switch (sortBy) {
        case 'price-low':
          sortedDeals.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
          break;
        case 'price-high':
          sortedDeals.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
          break;
        case 'discount':
          sortedDeals.sort((a, b) => {
            const discountA = a.salePrice ? (a.price - a.salePrice) / a.price : 0;
            const discountB = b.salePrice ? (b.price - b.salePrice) / b.price : 0;
            return discountB - discountA;
          });
          break;
        case 'newest':
          sortedDeals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        default: // popularity or any other
          // Assume we have a rating or sales count to sort by
          sortedDeals.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
      
      setDealProducts(sortedDeals);
    }
  }, [data, sortBy]);
  
  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  return (
    <Layout>
      <Container className="py-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item active>Deal Hot</Breadcrumb.Item>
        </Breadcrumb>
        
        {/* Page Header */}
        <div className="deal-hot-page-header mb-4">
          <h1 className="page-title">Deal Hot</h1>
          <p className="text-muted">
            Khuyến mãi đặc biệt - Giá tốt chỉ trong 24h!
          </p>
        </div>
        
        {/* Data Source Info */}
        {dataSource === 'mock' && (
          <Alert variant="warning" className="mb-4">
            <strong>Lưu ý:</strong> Đang hiển thị dữ liệu mẫu. Để hiển thị dữ liệu thực, hãy thêm sản phẩm vào danh mục "Deal hot" và đặt giá khuyến mãi (salePrice) cho chúng.
          </Alert>
        )}
        
        {/* Sorting and Filters */}
        <Row className="mb-4">
          <Col md={6} lg={4} className="ms-auto">
            <Form.Group>
              <Form.Select value={sortBy} onChange={handleSortChange}>
                <option value="discount">Giảm giá nhiều nhất</option>
                <option value="popularity">Phổ biến nhất</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="newest">Mới nhất</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        {/* Deal Hot Component */}
        <DealHot 
          products={dealProducts} 
          loading={isLoading} 
          title="Tất cả Deal Hot"
          showCountdown={true}
          maxItems={100} // Show all available deals
        />
        
        {/* If no deals are found */}
        {!isLoading && dealProducts.length === 0 && !error && (
          <div className="text-center py-5">
            <h4>Không tìm thấy deal nào</h4>
            <p className="text-muted">Để hiển thị Deal Hot, vui lòng thực hiện các bước sau:</p>
            <ol className="text-start mx-auto" style={{maxWidth: '500px'}}>
              <li>Truy cập trang quản trị Admin</li>
              <li>Tạo hoặc chỉnh sửa sản phẩm</li>
              <li>Đặt danh mục là "Deal hot"</li>
              <li>Đặt giá gốc (price) và giá khuyến mãi (salePrice)</li>
              <li>Lưu sản phẩm</li>
            </ol>
            <Button as={Link} to="/" variant="primary" className="mt-3">
              Quay lại trang chủ
            </Button>
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default DealHotPage; 