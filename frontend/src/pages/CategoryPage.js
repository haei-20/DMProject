import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Form } from 'react-bootstrap';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useGetProductsQuery } from '../services/api';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginator from '../components/Paginator';
import { getCategoryDisplayEn, resolveCategoryForQuery } from '../constants/productCategoryTagMap';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const apiCategory = resolveCategoryForQuery(categoryName || '');

  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1');
  
  // Sorting options
  const sortOption = searchParams.get('sort') || 'newest';
  
  // Possible filter options
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  
  const categoryTitle = getCategoryDisplayEn(apiCategory);

const queryParams = {
  category: apiCategory,
  page,
  sortBy: sortOption,
  limit: 12
};

  
  // Add filters if they exist
  if (priceRange.min) queryParams.minPrice = priceRange.min;
  if (priceRange.max) queryParams.maxPrice = priceRange.max;
  if (rating) queryParams.minRating = rating;
  
  // Fetch products based on category and filters
  const { data, error, isLoading } = useGetProductsQuery(queryParams);
  
  // Get products and pagination details
  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;
  
  // Handle sort change
  const handleSortChange = (e) => {
    const sort = e.target.value;
    setSearchParams(prev => {
      prev.set('sort', sort);
      return prev;
    });
  };
  
  // Handle filter changes
  const applyFilters = () => {
    setSearchParams(prev => {
      // Update price filters
      if (priceRange.min) prev.set('minPrice', priceRange.min);
      else prev.delete('minPrice');
      
      if (priceRange.max) prev.set('maxPrice', priceRange.max);
      else prev.delete('maxPrice');
      
      // Update rating filter
      if (rating) prev.set('rating', rating);
      else prev.delete('rating');
      
      // Reset to page 1 when filters change
      prev.set('page', '1');
      
      return prev;
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setRating('');
    setSearchParams(prev => {
      prev.delete('minPrice');
      prev.delete('maxPrice');
      prev.delete('rating');
      prev.set('page', '1');
      return prev;
    });
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  };
  
  return (
    <Layout>
      <Container className="py-4">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/categories' }}>
            Categories
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{categoryTitle}</Breadcrumb.Item>
        </Breadcrumb>
        
        <h1 className="mb-4">{categoryTitle}</h1>
        
        <Row>
          {/* Filters sidebar */}
          <Col md={3}>
            <div className="filters-section p-3 border rounded mb-4">
              <h4>Lọc</h4>
              <hr />
              
              {/* Price range filter */}
              <Form.Group className="mb-3">
                <Form.Label>Mức giá</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="number"
                    placeholder="Nhỏ nhất"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    min="0"
                    className="me-2"
                  />
                  <Form.Control
                    type="number"
                    placeholder="Thấp nhất"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    min="0"
                  />
                </div>
              </Form.Group>
              
              {/* Rating filter */}
              <Form.Group className="mb-3">
                <Form.Label>Đánh giá tối thiểu</Form.Label>
                <Form.Select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="">Tất cả các đánh giá</option>
                  <option value="4">4+ sao</option>
                  <option value="3">3+ sao</option>
                  <option value="2">2+ sao</option>
                  <option value="1">1+ sao</option>
                </Form.Select>
              </Form.Group>
              
              {/* Filter action buttons */}
              <div className="d-flex mt-4">
                <button
                  className="btn btn-primary me-2"
                  onClick={applyFilters}
                >
                  Áp dụng bộ lọc
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetFilters}
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </Col>
          
          {/* Products display */}
          <Col md={9}>
            {/* Sort options */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                {products.length > 0 && (
                  <p className="mb-0">
                    Hiển thị {products.length} sản phẩm
                  </p>
                )}
              </div>
              
              <Form.Group>
                <Form.Select 
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá: Thấp tới cao</option>
                  <option value="price-desc">Giá: Cao tới thấp</option>
                  <option value="rating">Đánh giá tốt nhất</option>
                  <option value="popular">Phổ biến nhất</option>
                </Form.Select>
              </Form.Group>
            </div>
            
            {/* Loading, error or products */}
            {isLoading ? (
              <Loader />
            ) : error ? (
              <Message variant="danger">
                {error.data?.message || 'Error loading products'}
              </Message>
            ) : products.length === 0 ? (
              <Message variant="info">
                Không tìm thấy sản phẩm nào trong danh mục này với các bộ lọc đã chọn.
              </Message>
            ) : (
              <>
                <Row>
                  {products.map((product) => (
                    <Col key={product._id} sm={12} md={6} lg={4} className="mb-4">
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Paginator
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

export default CategoryPage; 