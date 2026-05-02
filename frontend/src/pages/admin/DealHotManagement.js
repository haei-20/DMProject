import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, Modal, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCalendarAlt, FaPercentage, FaRegClock } from 'react-icons/fa';
import { useGetProductsQuery, useUpdateProductMutation } from '../../services/api';
import AdminLayout from './AdminLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatPrice } from '../../utils/productHelpers';
import './DealHotManagement.css';
import mockApiHelper from '../../utils/mockApiHelper';

const DealHotManagement = () => {
  // States for product listing and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dealHotProducts, setDealHotProducts] = useState([]);
  const [useMockData, setUseMockData] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    salePrice: '',
    discountPercentage: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default 7 days from now
  });
  
  // API queries
  const { data: productsData, isLoading, error, refetch } = useGetProductsQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  
  // Process products data
  useEffect(() => {
    if (productsData && productsData.products && productsData.products.length > 0) {
      // Use real API data
      setUseMockData(false);
      
      // Filter out products for search
      const filtered = productsData.products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      
      // Extract deal hot products
      const deals = productsData.products.filter(product => 
        product.category === 'Deal hot' || 
        (product.tags && product.tags.includes('deal-hot'))
      );
      setDealHotProducts(deals);
    } else {
      // Use mock data if API returns empty
      setUseMockData(true);
      console.log('Using mock data for products');
      
      // Get mock products
      const mockProducts = mockApiHelper.getMockProducts();
      
      // Filter for search
      const filtered = mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      
      // Get mock deal hot products
      const mockDealHot = mockApiHelper.getMockDealHotProducts();
      setDealHotProducts(mockDealHot);
    }
  }, [productsData, searchTerm]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If changing sale price, auto-calculate discount percentage
    if (name === 'salePrice' && selectedProduct) {
      const originalPrice = selectedProduct.price;
      const newSalePrice = parseFloat(value);
      
      if (newSalePrice && originalPrice) {
        const discountPercentage = Math.round(((originalPrice - newSalePrice) / originalPrice) * 100);
        setFormData({
          ...formData,
          [name]: value,
          discountPercentage: discountPercentage.toString()
        });
        return;
      }
    }
    
    // If changing discount percentage, auto-calculate sale price
    if (name === 'discountPercentage' && selectedProduct) {
      const originalPrice = selectedProduct.price;
      const newDiscountPercentage = parseFloat(value);
      
      if (newDiscountPercentage && originalPrice) {
        const salePrice = Math.round(originalPrice * (1 - newDiscountPercentage / 100));
        setFormData({
          ...formData,
          [name]: value,
          salePrice: salePrice.toString()
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  // Date change handlers
  const handleStartDateChange = (date) => {
    setFormData({ ...formData, startDate: date });
  };
  
  const handleEndDateChange = (date) => {
    setFormData({ ...formData, endDate: date });
  };
  
  // Open edit modal for a product
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      salePrice: product.salePrice?.toString() || '',
      discountPercentage: product.salePrice 
        ? Math.round(((product.price - product.salePrice) / product.price) * 100).toString()
        : '',
      startDate: product.dealStartDate ? new Date(product.dealStartDate) : new Date(),
      endDate: product.dealEndDate ? new Date(product.dealEndDate) : new Date(new Date().setDate(new Date().getDate() + 7)),
    });
    setShowEditModal(true);
  };
  
  // Open add modal
  const openAddModal = () => {
    setShowAddModal(true);
  };
  
  // Handle product selection in add modal
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({
      salePrice: '',
      discountPercentage: '',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    });
  };
  
  // Save deal hot product
  const handleSaveDeal = async () => {
    if (!selectedProduct) return;
    
    try {
      const productData = {
        salePrice: parseFloat(formData.salePrice),
        dealStartDate: formData.startDate.toISOString(),
        dealEndDate: formData.endDate.toISOString(),
        // Add "Deal hot" to category or create a tag
        category: 'Deal hot',
        tags: [...(selectedProduct.tags || []), 'deal-hot'].filter((v, i, a) => a.indexOf(v) === i),
      };
      
      // Close modals first for better UX
      setShowAddModal(false);
      setShowEditModal(false);
      
      // Create updated product with new data
      const updatedProduct = {
        ...selectedProduct,
        ...productData,
        _id: selectedProduct._id
      };
      
      // Update local state immediately
      setDealHotProducts(prevDeals => {
        const exists = prevDeals.some(p => p._id === selectedProduct._id);
        if (exists) {
          return prevDeals.map(p => p._id === selectedProduct._id ? updatedProduct : p);
        } else {
          return [...prevDeals, updatedProduct];
        }
      });
      
      if (useMockData) {
        // Save to mock storage
        mockApiHelper.addMockDealHot(
          selectedProduct, 
          parseFloat(formData.salePrice),
          formData.startDate.toISOString(),
          formData.endDate.toISOString()
        );
        console.log('Saved to mock storage');
      } else {
        // Try server update
        try {
      await updateProduct({ 
        id: selectedProduct._id, 
        productData 
      }).unwrap();
        } catch (error) {
          console.error('Server update failed, but UI is updated:', error);
          // Show notification but don't revert UI changes
          setTimeout(() => {
            alert('Sản phẩm đã được thêm vào Deal Hot trên giao diện, nhưng chưa được lưu trên server.');
          }, 500);
        }
      }
      
      // Always refetch to ensure data consistency
      refetch();
    } catch (error) {
      console.error('Failed in deal hot creation:', error);
      alert('Có lỗi xảy ra khi tạo Deal Hot. Vui lòng thử lại sau.');
    }
  };
  
  // Remove a product from deal hot
  const handleRemoveDeal = async (product) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi Deal Hot?')) {
      return;
    }
    
    try {
      // Remove deal hot category and tag
      const tags = (product.tags || []).filter(tag => tag !== 'deal-hot');
      const category = product.category === 'Deal hot' ? '' : product.category;
      
      // Update UI immediately
      setDealHotProducts(prevDeals => 
        prevDeals.filter(p => p._id !== product._id)
      );
      
      if (useMockData) {
        // Remove from mock storage
        mockApiHelper.removeMockDealHot(product._id);
        console.log('Removed from mock storage');
      } else {
        try {
          // Try server update
      await updateProduct({ 
        id: product._id, 
        productData: {
          salePrice: 0, // Remove sale price
          category,
          tags,
          dealStartDate: null,
          dealEndDate: null,
        }
      }).unwrap();
        } catch (error) {
          console.error('Server removal failed, but UI is updated:', error);
          setTimeout(() => {
            alert('Sản phẩm đã được xóa khỏi Deal Hot trên giao diện, nhưng chưa được cập nhật trên server.');
          }, 500);
        }
      }
      
      // Always refetch to ensure data consistency
      refetch();
    } catch (error) {
      console.error('Failed to remove deal:', error);
      alert('Có lỗi xảy ra khi xóa Deal Hot. Vui lòng thử lại sau.');
    }
  };
  
  // Calculate remaining time for a deal
  const calculateRemainingTime = (endDate) => {
    if (!endDate) return { days: 0, hours: 0, expired: true };
    
    try {
    const now = new Date();
    const end = new Date(endDate);
      
      // Check if date is invalid
      if (isNaN(end.getTime())) {
        console.warn('Invalid endDate:', endDate);
        return { days: 0, hours: 0, expired: true };
      }
      
    const difference = end - now;
    
    if (difference <= 0) {
      return { days: 0, hours: 0, expired: true };
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours, expired: false };
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return { days: 0, hours: 0, expired: true };
    }
  };
  
  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  return (
    <AdminLayout>
      <Container fluid className="deal-hot-management">
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản lý Deal Hot</h1>
            <p className="page-subtitle">Tạo và quản lý các khuyến mãi hot có giới hạn thời gian</p>
          </div>
          <Button 
            variant="primary" 
            className="add-deal-btn"
            onClick={openAddModal}
          >
            <FaPlus className="me-2" /> Thêm Deal Hot mới
          </Button>
        </div>
        
        {useMockData && (
          <Alert variant="warning" className="mb-3">
            <strong>Chế độ thử nghiệm:</strong> Dữ liệu đang được lưu trữ cục bộ vì API server không phản hồi. Các thay đổi sẽ được lưu trong trình duyệt của bạn.
          </Alert>
        )}
        
        {/* Deal Hot Products List */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Sản phẩm Deal Hot hiện tại</h5>
          </Card.Header>
          <Card.Body>
            {dealHotProducts.length === 0 ? (
              <Alert variant="info">
                Chưa có sản phẩm Deal Hot nào. Hãy thêm sản phẩm vào danh mục Deal Hot.
              </Alert>
            ) : (
              <Table responsive className="deal-hot-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Giá gốc</th>
                    <th>Giá khuyến mãi</th>
                    <th>Giảm giá</th>
                    <th>Thời gian còn lại</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {dealHotProducts.map(product => {
                    const remainingTime = calculateRemainingTime(product.dealEndDate);
                    const discountPercentage = product.salePrice 
                      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                      : 0;
                    
                    return (
                      <tr key={product._id}>
                        <td>
                          <div className="product-info">
                            <div className="product-image">
                              {product.image ? (
                                <img src={product.image} alt={product.name} />
                              ) : (
                                <div className="placeholder-image">
                                  {product.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="product-name">{product.name}</div>
                          </div>
                        </td>
                        <td>{formatPrice(product.price)}</td>
                        <td>
                          <span className="sale-price">{formatPrice(product.salePrice || 0)}</span>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark" className="discount-badge">
                            {discountPercentage}%
                          </Badge>
                        </td>
                        <td>
                          {remainingTime.expired ? (
                            <Badge bg="danger">Đã hết hạn</Badge>
                          ) : (
                            <div className="remaining-time">
                              <FaRegClock className="me-1" />
                              {remainingTime.days} ngày {remainingTime.hours} giờ
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="action-btn"
                              onClick={() => openEditModal(product)}
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="action-btn"
                              onClick={() => handleRemoveDeal(product)}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
        
        {/* Add Deal Hot Modal */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Thêm Deal Hot mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4">
              <h6>Bước 1: Chọn sản phẩm</h6>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-3"
                />
              </Form.Group>
              
              <div className="products-list">
                {isLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <Table className="product-select-table">
                    <thead>
                      <tr>
                        <th style={{width: '60px'}}></th>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map(product => (
                        <tr 
                          key={product._id}
                          className={selectedProduct?._id === product._id ? 'selected' : ''}
                          onClick={() => handleProductSelect(product)}
                        >
                          <td>
                            <Form.Check
                              type="radio"
                              checked={selectedProduct?._id === product._id}
                              onChange={() => {}}
                            />
                          </td>
                          <td>
                            <div className="product-info">
                              <div className="product-image">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} />
                                ) : (
                                  <div className="placeholder-image">
                                    {product.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="product-name">{product.name}</div>
                            </div>
                          </td>
                          <td>{formatPrice(product.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                
                {/* Pagination */}
                {filteredProducts.length > productsPerPage && (
                  <div className="pagination-container">
                    <ul className="pagination">
                      {Array.from({ length: Math.ceil(filteredProducts.length / productsPerPage) }).map((_, index) => (
                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                          <Button 
                            className="page-link" 
                            onClick={() => paginate(index + 1)}
                          >
                            {index + 1}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {selectedProduct && (
              <div>
                <h6>Bước 2: Thiết lập thông tin khuyến mãi</h6>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Giá gốc</Form.Label>
                        <Form.Control
                          type="text"
                          value={formatPrice(selectedProduct.price)}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Giá khuyến mãi</Form.Label>
                        <Form.Control
                          type="number"
                          name="salePrice"
                          value={formData.salePrice}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phần trăm giảm giá</Form.Label>
                        <div className="input-with-icon">
                          <Form.Control
                            type="number"
                            name="discountPercentage"
                            value={formData.discountPercentage}
                            onChange={handleInputChange}
                            required
                          />
                          <FaPercentage className="input-icon" />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ngày bắt đầu</Form.Label>
                        <div className="date-picker-container">
                          <DatePicker
                            selected={formData.startDate}
                            onChange={handleStartDateChange}
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                          />
                          <FaCalendarAlt className="date-picker-icon" />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ngày kết thúc</Form.Label>
                        <div className="date-picker-container">
                          <DatePicker
                            selected={formData.endDate}
                            onChange={handleEndDateChange}
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                            minDate={formData.startDate}
                          />
                          <FaCalendarAlt className="date-picker-icon" />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveDeal}
              disabled={!selectedProduct || !formData.salePrice || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Deal Hot'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Edit Deal Hot Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Chỉnh sửa Deal Hot</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedProduct && (
              <Form>
                <div className="selected-product-info mb-4">
                  <div className="product-image">
                    {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} />
                    ) : (
                      <div className="placeholder-image">
                        {selectedProduct.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="product-details">
                    <h5>{selectedProduct.name}</h5>
                    <p className="original-price">Giá gốc: {formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giá khuyến mãi</Form.Label>
                      <Form.Control
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phần trăm giảm giá</Form.Label>
                      <div className="input-with-icon">
                        <Form.Control
                          type="number"
                          name="discountPercentage"
                          value={formData.discountPercentage}
                          onChange={handleInputChange}
                          required
                        />
                        <FaPercentage className="input-icon" />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày bắt đầu</Form.Label>
                      <div className="date-picker-container">
                        <DatePicker
                          selected={formData.startDate}
                          onChange={handleStartDateChange}
                          className="form-control"
                          dateFormat="dd/MM/yyyy"
                        />
                        <FaCalendarAlt className="date-picker-icon" />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày kết thúc</Form.Label>
                      <div className="date-picker-container">
                        <DatePicker
                          selected={formData.endDate}
                          onChange={handleEndDateChange}
                          className="form-control"
                          dateFormat="dd/MM/yyyy"
                          minDate={formData.startDate}
                        />
                        <FaCalendarAlt className="date-picker-icon" />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveDeal}
              disabled={!selectedProduct || !formData.salePrice || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang lưu...
                </>
              ) : (
                'Cập nhật Deal Hot'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminLayout>
  );
};

export default DealHotManagement; 