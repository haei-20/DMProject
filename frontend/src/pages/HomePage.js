import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Carousel } from 'react-bootstrap';
import { useGetProductsQuery, useGetRecommendedProductsQuery, useGetDealHotQuery, useGetCombosQuery } from '../services/api';
import Layout from '../components/Layout';
import CategoryList from '../components/CategoryList';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import AccountDrawer from '../components/AccountDrawer';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ApiErrorBoundary from '../components/ApiErrorBoundary';
import DealHot from '../components/DealHot';
import ComboSection from '../components/ComboSection';
import { FaArrowRight, FaRegClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
};

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get('category');
  const searchFilter = queryParams.get('search');
  const drawerParam = queryParams.get('drawer');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [filters, setFilters] = useState({
    keyword: searchFilter || '',
    category: categoryFilter || '',
    page: 1,
  });
  document.addEventListener("DOMContentLoaded", function () {
  const dropdowns = document.querySelectorAll(".categories-nav .dropdown");

  dropdowns.forEach(function (dropdown) {
    dropdown.addEventListener("mouseenter", function () {
      const toggle = this.querySelector(".dropdown-toggle");
      const menu = this.querySelector(".dropdown-menu");

      toggle.classList.add("show");
      menu.classList.add("show");
    });

    dropdown.addEventListener("mouseleave", function () {
      const toggle = this.querySelector(".dropdown-toggle");
      const menu = this.querySelector(".dropdown-menu");

      toggle.classList.remove("show");
      menu.classList.remove("show");
    });
  });
});


  // Check if we need to open any drawers based on URL params
  useEffect(() => {
    if (drawerParam === 'cart') {
      setIsCartOpen(true);
      // Remove the drawer param from URL after opening
      navigate('/', { replace: true });
    } else if (drawerParam === 'account') {
      setIsAccountOpen(true);
      // Remove the drawer param from URL after opening
      navigate('/', { replace: true });
    }
  }, [drawerParam, navigate]);

  // Update filters when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      keyword: searchFilter || '',
      category: categoryFilter || '',
    }));
  }, [searchFilter, categoryFilter]);

  // Fetch products based on filters
  const { data: productsData, error: productsError, isLoading: productsLoading } = useGetProductsQuery(filters);
  
  // Fetch recommended products
  const { data: recommendationsData } = useGetRecommendedProductsQuery(undefined, {
    // Skip recommendation API call if we're using search or category filters
    skip: !!filters.keyword || !!filters.category,
  });
  
  // Fetch deal hot products
  const { data: dealHotData } = useGetDealHotQuery(undefined, {
    // Skip deal hot API call if we're using search or category filters
    skip: !!filters.keyword || !!filters.category,
  });
  
  // Fetch combos
  const { data: combosData } = useGetCombosQuery(undefined, {
    // Skip combo API call if we're using search or category filters
    skip: !!filters.keyword || !!filters.category,
  });
  
  // Debug info
  useEffect(() => {
    console.log('Products data from API:', productsData);
    console.log('Recommendations data from API:', recommendationsData);
    console.log('Deal hot data from API:', dealHotData);
    console.log('Combos data from API:', combosData);
  }, [productsData, recommendationsData, dealHotData, combosData]);
  
  // Extract products array from API response or use empty array as fallback
  const products = productsData?.products || [];
  
  // Get recommended products if available, otherwise use regular products
  const recommendedProducts = recommendationsData?.products || [];
  const displayProducts = filters.keyword || filters.category ? products : 
                         (recommendedProducts.length > 0 ? recommendedProducts : products);

  // Hero banners data
  const heroBanners = [
      {
    id: 1,
    title: "Lợi ích khi mua theo combo",
    subtitle: "Tiết kiệm & tiện lợi",
    description: "Mua combo sản phẩm được đề xuất giúp bạn tiết kiệm lên đến 25% so với mua lẻ từng món.",
    buttonText: "Xem combo ngay",
    image: "/banner.png",
    link: "/combo"
  },
  {
    id: 2,
    title: "Các deal hot độc quyền",
    subtitle: "Siêu tiết kiệm",
    description: "Khám phá các deal hot độc quyền chỉ có tại cửa hàng chúng tôi.",
    buttonText: "Khám phá ngay",
    image: "/banner2.png",
    link: "/?category=deal%20hot"
  },
  {
    id: 3,
    title: "Ưu đãi hấp dẫn",
    subtitle: "Chương trình khuyến mãi đặc biệt",
    description: "Nhận ngay ưu đãi lên đến 40% cho đơn hàng đầu tiên khi đăng ký thành viên của chúng tôi.",
    buttonText: "Đăng ký nhận ưu đãi",
    image: "/banner3.png",
    link: "/"
  }
  ];

  return (
    <Layout>
      {/* Cart and Account Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AccountDrawer isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
      
      {/* Hero Banner Carousel */}
      {!filters.keyword && !filters.category && (
        <div className="hero-section">
          <Carousel 
  fade 
  interval={1000} 
  pause="hover" 
  ride="carousel" 
  wrap={true} 
  controls={true}
>

            {heroBanners.map(banner => (
  <Carousel.Item key={banner.id}>
    <div 
      className="hero-banner" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${banner.image})`,
      }}
    >
      <Container>
        <Row className="hero-content">
          <Col md={7} lg={6}>
            <div className="banner-content">
              <p className="banner-subtitle">{banner.subtitle}</p>
              <h1 className="banner-title">{banner.title}</h1>
              <p className="banner-description">{banner.description}</p>
              {banner.id === 3 ? (
                <Button 
                  variant="light" 
                  size="lg" 
                  className="banner-button"
                  onClick={scrollToBottom}
                >
                  {banner.buttonText} <FaArrowRight className="ms-2" />
                </Button>
              ) : (
                <Link to={banner.link}>
  <Button 
    variant="light" 
    size="lg" 
    className="banner-button"
  >
    {banner.buttonText} <FaArrowRight className="ms-2" />
  </Button>
</Link>

              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  </Carousel.Item>
))}
          </Carousel>
        </div>
      )}
      
      <Container>
        {/* Categories Section */}
        {!filters.keyword && !filters.category && (
          <>
            <CategoryList />
          </>
        )}
        
        {/* Deal Hot Section */}
        {!filters.keyword && !filters.category && (
          <div className="deal-hot-section py-4 mt-4">
            <DealHot 
              products={dealHotData?.products || []} 
              loading={!dealHotData && !productsLoading} 
              maxItems={4} 
              showCountdown={true}
            />
          </div>
        )}
        
        {/* Combo Section */}
        {!filters.keyword && !filters.category && (
          <div className="combo-section-container py-4 mt-4">
            <ComboSection 
              combos={Array.isArray(combosData) ? combosData : []} 
              loading={!combosData && !productsLoading}
              maxItems={4}
              showViewAll={true}
              title="Combo tiết kiệm"
            />
          </div>
        )}
        
        {/* Search Results Header */}
        {(filters.keyword || filters.category) && (
          <div className="search-results-header">
            <h2>
              {filters.keyword ? `Kết quả tìm kiếm cho "${filters.keyword}"` : ''}
              {filters.category ? `Category: ${filters.category}` : ''}
            </h2>
          </div>
        )}
        
        {/* Products Section */}
        <div className="products-section py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
  <h2 className="section-title">Các sản phẩm phổ biến</h2>
</div>

        
 <ApiErrorBoundary
  isLoading={productsLoading}
  error={productsError}
  loadingComponent={<Loader />}
>
  <>
    {productsError && (
      <Message variant="error">
        Lỗi tải dữ liệu sản phẩm: {JSON.stringify(productsError)}
      </Message>
    )}

    <Row className="g-3">
  {displayProducts.map((product) => (
    <Col
      key={product._id}
      xs={6}     // Hiển thị 2 cột trên màn hình điện thoại
      sm={6}     // Hiển thị 2 cột trên màn hình máy tính bảng nhỏ 
      md={4}     // Hiển thị 3 cột trên màn hình máy tính bảng lớn
      lg={3}     // Hiển thị 4 cột trên màn hình desktop
      className="mb-4"
    >
      <ProductCard product={product} />
    </Col>
  ))}
</Row>


    {displayProducts.length === 0 && (
      <Message>
        Không có sản phẩm phù hợp. Vui lòng thử thay đổi bộ lọc.
      </Message>
    )}

    {/* CHỈ HIỆN NÚT KHI CÒN SẢN PHẨM */}
    {displayProducts.length < products.length && (
      <div className="d-flex justify-content-center mt-4">
        <Button
          variant="outline-primary"
          href="/products"
          className="view-all-btn"
        >
          Xem thêm
        </Button>
      </div>
    )}
  </>
</ApiErrorBoundary>


      </div>

        {/* Featured Section */}
        {!filters.keyword && !filters.category && (
          <div className="featured-section py-5">
            <Row>
              <Col md={6} className="mb-4">
                <div className="featured-card" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop')" }}>
                  <div className="featured-content">
                    <h3>Sản phẩm mới</h3>
                    <p>Khám phá những sản phẩm mới nhất của chúng tôi</p>
                    
                  </div>
                </div>
              </Col>
              <Col md={6} className="mb-4">
                <div className="featured-card" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop')" }}>
                  <div className="featured-content">
                    <h3>Ưu đãi đặc biệt</h3>
                    <p>Giảm giá lên đến 50% cho các mặt hàng được chọn</p>
                    
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Recommendations Section - show only if available and not filtering */}
        {recommendedProducts.length > 0 && !filters.keyword && !filters.category && (
          <div className="recommendations-section py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title">Gợi ý cho bạn</h2>
              <Button variant="outline-primary" href="/recommendations" className="view-all-btn">Xem tất cả</Button>
            </div>
            {/* <Row className="product-grid g-3">
              {recommendedProducts.slice(0, 5).map((product) => (
                <div key={product._id} className="col-5-products">
                  <ProductCard product={product} />
                </div>
              ))}
            </Row> */}
             <Row className={`g-3 ${displayProducts.length === 1 ? 'justify-content-center' : ''}`}>
  {displayProducts.map((product) => (
    <Col key={product._id} xs={12} sm={6} md={4} lg={3}>
      <div className="col-12 col-sm-6 col-md-4 col-lg-3">
  <ProductCard product={product} />
</div>

    </Col>
  ))}
</Row>
          </div>
        )}
        
        {/* Newsletter Subscription */}
        {!filters.keyword && !filters.category && (
          <div className="newsletter-section py-5 my-5 text-center">
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <h3>Đăng ký hội viên</h3>
                <p className="mb-4">Đăng ký để nhận ưu đãi đặc biệt, quà tặng miễn phí và các chương trình khuyến mãi có một không hai.</p>
                <div className="d-flex">
                  <input type="email" className="form-control me-2" placeholder="Địa chỉ email của bạn" />
                  <Button variant="primary">Đăng ký</Button>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default HomePage; 