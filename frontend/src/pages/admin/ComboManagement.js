import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Table, Badge, Alert, InputGroup, Spinner,
  Modal, Tabs, Tab, ListGroup, Toast
} from 'react-bootstrap';
import { 
  FaPlus, FaTrash, FaSave, FaSearch, 
  FaBoxOpen, FaShoppingCart, FaTags, 
  FaPercentage, FaEdit, FaEye, FaLink,
  FaCheckCircle, FaExclamationCircle, FaInfoCircle
} from 'react-icons/fa';
import { 
  useGetProductsQuery, 
  useGetFrequentlyBoughtTogetherQuery,
  useGetCombosQuery,
  useCreateComboMutation,
  useUpdateComboMutation,
  useDeleteComboMutation
} from '../../services/api';
import { formatPrice } from '../../utils/productHelpers';
import AdminLayout from '../../components/admin/AdminLayout';
import FrequentlyBoughtTogetherTable from '../../components/admin/FrequentlyBoughtTogetherTable';
import './ComboManagement.css';

const ComboManagement = () => {
  // State for combo properties
  const [currentCombo, setCurrentCombo] = useState({
    name: '',
    description: '',
    products: [],
    discount: 10,
    isActive: true,
    startDate: '',
    endDate: ''
  });
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
  // Get product data from API
  const { 
    data: productsData, 
    isLoading: isLoadingProducts, 
    error: productsError 
  } = useGetProductsQuery({
    limit: 1000 // Tăng giới hạn số lượng sản phẩm lấy về
  });
  
  // Get frequently bought together data
  const {
    data: frequentlyBoughtData,
    isLoading: isLoadingFrequently,
    error: frequentlyError
  } = useGetFrequentlyBoughtTogetherQuery({ minSupport: 0.001 });
  
  // Get existing combos
  const {
    data: combos = [],
    isLoading: isLoadingCombos,
    error: combosError
  } = useGetCombosQuery();
  
  // Mutations for CRUD operations
  const [createCombo, { isLoading: isCreating }] = useCreateComboMutation();
  const [updateCombo, { isLoading: isUpdating }] = useUpdateComboMutation();
  const [deleteCombo, { isLoading: isDeleting }] = useDeleteComboMutation();
  
  // Show toast message
  const showMessage = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // Hàm chuẩn hóa text tiếng Việt (bỏ dấu) để tìm kiếm dễ dàng hơn
  const normalizeVietnameseText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };
  
  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    // Lấy danh sách sản phẩm từ API
    const allProducts = productsData?.products || [];
    
    // Nếu không có từ khóa tìm kiếm, trả về tất cả sản phẩm
    if (!searchTerm.trim()) {
      return allProducts;
    }
    
    // Chuẩn hóa từ khóa tìm kiếm
    const normalizedSearchTerm = normalizeVietnameseText(searchTerm.trim());
    
    console.log(`Tìm kiếm với từ khóa: "${searchTerm}" (đã chuẩn hóa: "${normalizedSearchTerm}")`);
    
    // Lọc sản phẩm theo từ khóa
    return allProducts.filter(product => {
      // Chuẩn hóa các trường dữ liệu từ sản phẩm
      const normalizedName = normalizeVietnameseText(product.name);
      const normalizedCategory = normalizeVietnameseText(product.category || '');
      const normalizedId = normalizeVietnameseText(product._id || '');
      
      // So khớp cả chữ có dấu và không dấu
      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedCategory.includes(normalizedSearchTerm) ||
        normalizedId.includes(normalizedSearchTerm) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [productsData?.products, searchTerm]);
  
  // Log thông tin debug
  useEffect(() => {
    if (productsData) {
      console.log(`Tổng số sản phẩm có sẵn: ${productsData?.products?.length || 0}`);
      console.log(`Số sản phẩm hiển thị sau khi lọc: ${filteredProducts.length}`);
    }
  }, [productsData, filteredProducts.length]);
  
  // Calculate combo price and discounted price
  const calculateComboDetails = (products) => {
    if (!products || products.length === 0) {
      return { originalPrice: 0, discountedPrice: 0, savedAmount: 0 };
    }
    
    const originalPrice = products.reduce((sum, product) => sum + (product.price * (product.quantity || 1)), 0);
    const discountedPrice = originalPrice * (1 - (currentCombo.discount / 100));
    const savedAmount = originalPrice - discountedPrice;
    
    return { originalPrice, discountedPrice, savedAmount };
  };
  
  // Combo details for the current combo
  const comboDetails = calculateComboDetails(currentCombo.products);
  
  // Add product to combo
  const handleAddProductToCombo = (product) => {
    // Check if product already exists in combo
    const existingProductIndex = currentCombo.products.findIndex(p => p._id === product._id);
    
    if (existingProductIndex >= 0) {
      // Update quantity of existing product
      const updatedProducts = [...currentCombo.products];
      updatedProducts[existingProductIndex] = {
        ...updatedProducts[existingProductIndex],
        quantity: (updatedProducts[existingProductIndex].quantity || 1) + 1
      };
      setCurrentCombo({ ...currentCombo, products: updatedProducts });
    } else {
      // Add new product with quantity 1
      const productToAdd = { ...product, quantity: 1 };
      setCurrentCombo({
        ...currentCombo,
        products: [...currentCombo.products, productToAdd]
      });
    }
  };
  
  // Remove product from combo
  const handleRemoveProductFromCombo = (productId) => {
    const updatedProducts = currentCombo.products.filter(product => product._id !== productId);
    setCurrentCombo({ ...currentCombo, products: updatedProducts });
  };
  
  // Update product quantity in combo
  const handleProductQuantityChange = (productId, quantity) => {
    const updatedProducts = currentCombo.products.map(product => {
      if (product._id === productId) {
        return { ...product, quantity: parseInt(quantity) || 1 };
      }
      return product;
    });
    setCurrentCombo({ ...currentCombo, products: updatedProducts });
  };
  
  // Add a new combo or update existing one
  const handleSaveCombo = async () => {
    if (currentCombo.name && currentCombo.products.length > 0) {
      try {
        console.log('Saving combo:', currentCombo); // Debug log
        if (editMode) {
          // Update existing combo - use _id instead of id
          console.log('Updating combo with ID:', currentCombo._id); // Debug log
          await updateCombo({
            id: currentCombo._id,
            comboData: currentCombo
          }).unwrap();
          showMessage('Combo đã được cập nhật thành công');
        } else {
          // Add new combo
          await createCombo(currentCombo).unwrap();
          showMessage('Combo mới đã được thêm thành công');
        }
        
        // Reset current combo and exit edit mode
        setCurrentCombo({
          name: '',
          description: '',
          products: [],
          discount: 10,
          isActive: true,
          startDate: '',
          endDate: ''
        });
        setEditMode(false);
        setActiveTab('combos');
      } catch (error) {
        console.error('Failed to save combo:', error);
        showMessage(`Lỗi khi lưu combo: ${error.message || 'Unknown error'}`, 'danger');
      }
    }
  };
  
  // Edit an existing combo
  const handleEditCombo = (combo) => {
    console.log('Editing combo:', combo); // Debug log
    setCurrentCombo(combo);
    setEditMode(true);
    setActiveTab('builder');
  };
  
  // Delete a combo
  const handleDeleteCombo = async (id) => {
    try {
      // Kiểm tra xem id có đúng định dạng không
      const comboId = combo => combo._id || combo.id;
      
      if (!id) {
        console.error('Không thể xóa: ID combo không tồn tại', { combo: id });
        showMessage('Lỗi khi xóa combo: ID không hợp lệ', 'danger');
        return;
      }
      
      console.log('Đang xóa combo với ID:', id);
      await deleteCombo(id).unwrap();
      showMessage('Combo đã được xóa thành công');
    } catch (error) {
      console.error('Failed to delete combo:', error);
      showMessage(`Lỗi khi xóa combo: ${error.message || 'Unknown error'}`, 'danger');
    }
  };
  
  // Add a group of products from frequently bought together
  const handleAddProductGroup = (productGroup) => {
    // Add all products in the group to the current combo
    const updatedProducts = [...currentCombo.products];
    
    productGroup.forEach(product => {
      const existingIndex = updatedProducts.findIndex(p => p._id === product._id);
      if (existingIndex >= 0) {
        // Update quantity of existing product
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          quantity: (updatedProducts[existingIndex].quantity || 1) + 1
        };
      } else {
        // Add new product
        updatedProducts.push({ ...product, quantity: 1 });
      }
    });
    
    setCurrentCombo({ ...currentCombo, products: updatedProducts });
  };
  
  return (
    <AdminLayout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="mb-0">Quản lý Combo Sản phẩm</h1>
            <p className="text-muted">Tạo và quản lý các combo sản phẩm với giá ưu đãi</p>
          </Col>
        </Row>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
        >
          <Tab eventKey="combos" title="Danh sách Combo">
            <Card className="combo-list-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Danh sách Combo hiện có</h5>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setCurrentCombo({
                      name: '',
                      description: '',
                      products: [],
                      discount: 10,
                      isActive: true,
                      startDate: '',
                      endDate: ''
                    });
                    setEditMode(false);
                    setActiveTab('builder');
                  }}
                >
                  <FaPlus className="me-1" /> Tạo Combo mới
                </Button>
              </Card.Header>
              <Card.Body>
                {combos.length === 0 ? (
                  <Alert variant="info">
                    Chưa có combo sản phẩm nào. Hãy tạo combo mới để thu hút khách hàng!
                  </Alert>
                ) : (
                  <Table responsive hover className="combo-table">
                    <thead>
                      <tr>
                        <th>Tên Combo</th>
                        <th>Số sản phẩm</th>
                        <th>Giá gốc</th>
                        <th>Giá combo</th>
                        <th>Tiết kiệm</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combos.map(combo => {
                        const details = calculateComboDetails(combo.products);
                        return (
                          <tr key={combo._id || combo.id}>
                            <td>
                              <div className="combo-name-cell">
                                <h6 className="mb-0">{combo.name}</h6>
                                <small className="text-muted">
                                  {combo.products.map(p => p.name).join(', ').substring(0, 50)}
                                  {combo.products.map(p => p.name).join(', ').length > 50 ? '...' : ''}
                                </small>
                              </div>
                            </td>
                            <td>{combo.products.length}</td>
                            <td>{formatPrice(details.originalPrice)}</td>
                            <td>{formatPrice(details.discountedPrice)}</td>
                            <td>
                              <Badge bg="success">
                                {formatPrice(details.savedAmount)} ({combo.discount}%)
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={combo.isActive ? 'success' : 'secondary'}>
                                {combo.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditCombo(combo)}
                              >
                                <FaEdit /> Sửa
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteCombo(combo._id || combo.id)}
                              >
                                <FaTrash /> Xóa
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="builder" title="Tạo Combo">
            <Row>
              <Col lg={8}>
                <Card className="combo-builder-card mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      {editMode ? 'Chỉnh sửa Combo' : 'Tạo Combo mới'}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Tên Combo</Form.Label>
                            <Form.Control 
                              type="text" 
                              placeholder="Nhập tên combo"
                              value={currentCombo.name}
                              onChange={(e) => setCurrentCombo({...currentCombo, name: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mức giảm giá (%)</Form.Label>
                            <InputGroup>
                              <Form.Control 
                                type="number" 
                                placeholder="% giảm giá"
                                value={currentCombo.discount}
                                onChange={(e) => setCurrentCombo({
                                  ...currentCombo, 
                                  discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                })}
                              />
                              <InputGroup.Text><FaPercentage /></InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Mô tả Combo</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={2}
                          placeholder="Nhập mô tả về combo này"
                          value={currentCombo.description}
                          onChange={(e) => setCurrentCombo({...currentCombo, description: e.target.value})}
                        />
                      </Form.Group>
                      
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Ngày bắt đầu</Form.Label>
                            <Form.Control 
                              type="date"
                              value={currentCombo.startDate}
                              onChange={(e) => setCurrentCombo({...currentCombo, startDate: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Ngày kết thúc</Form.Label>
                            <Form.Control 
                              type="date"
                              value={currentCombo.endDate}
                              onChange={(e) => setCurrentCombo({...currentCombo, endDate: e.target.value})}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="checkbox" 
                          label="Kích hoạt combo này"
                          checked={currentCombo.isActive}
                          onChange={(e) => setCurrentCombo({...currentCombo, isActive: e.target.checked})}
                        />
                      </Form.Group>
                    </Form>
                    
                    <div className="combo-products-section">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Sản phẩm trong Combo</h5>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => setShowAddProductModal(true)}
                        >
                          <FaPlus className="me-1" /> Thêm sản phẩm
                        </Button>
                      </div>
                      
                      {currentCombo.products.length === 0 ? (
                        <Alert variant="light" className="text-center">
                          <FaBoxOpen className="mb-3" size={24} />
                          <p>Chưa có sản phẩm nào trong combo.</p>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowAddProductModal(true)}
                          >
                            <FaPlus className="me-1" /> Thêm sản phẩm
                          </Button>
                        </Alert>
                      ) : (
                        <Table responsive className="combo-products-table">
                          <thead>
                            <tr>
                              <th style={{ width: '60px' }}></th>
                              <th>Sản phẩm</th>
                              <th>Đơn giá</th>
                              <th style={{ width: '100px' }}>Số lượng</th>
                              <th>Thành tiền</th>
                              <th style={{ width: '80px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCombo.products.map((product) => (
                              <tr key={product._id}>
                                <td>
                                  <div className="product-image">
                                    <img src={product.image} alt={product.name} />
                                  </div>
                                </td>
                                <td>{product.name}</td>
                                <td>{formatPrice(product.price)}</td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    min="1"
                                    value={product.quantity || 1}
                                    onChange={(e) => handleProductQuantityChange(
                                      product._id, 
                                      e.target.value
                                    )}
                                    size="sm"
                                  />
                                </td>
                                <td>
                                  {formatPrice(product.price * (product.quantity || 1))}
                                </td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveProductFromCombo(product._id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </div>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between align-items-center">
                    <div>
                      <Button 
                        variant="secondary" 
                        className="me-2"
                        onClick={() => {
                          setCurrentCombo({
                            name: '',
                            description: '',
                            products: [],
                            discount: 10,
                            isActive: true,
                            startDate: '',
                            endDate: ''
                          });
                          setEditMode(false);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={handleSaveCombo}
                        disabled={!currentCombo.name || currentCombo.products.length === 0}
                      >
                        <FaSave className="me-1" /> {editMode ? 'Cập nhật Combo' : 'Lưu Combo'}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
              
              <Col lg={4}>
                <Card className="combo-summary-card">
                  <Card.Header>
                    <h5 className="mb-0">Thông tin Combo</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="combo-summary">
                      <div className="combo-summary-item">
                        <span>Số lượng sản phẩm:</span>
                        <Badge bg="primary" pill>
                          {currentCombo.products.length}
                        </Badge>
                      </div>
                      
                      <div className="combo-summary-item">
                        <span>Tổng giá gốc:</span>
                        <span className="price original-price">
                          {formatPrice(comboDetails.originalPrice)}
                        </span>
                      </div>
                      
                      <div className="combo-summary-item">
                        <span>Mức giảm giá:</span>
                        <Badge bg="warning" text="dark">
                          {currentCombo.discount}%
                        </Badge>
                      </div>
                      
                      <div className="combo-summary-item highlight">
                        <span>Giá combo:</span>
                        <span className="price discounted-price">
                          {formatPrice(comboDetails.discountedPrice)}
                        </span>
                      </div>
                      
                      <div className="combo-summary-item">
                        <span>Tiết kiệm:</span>
                        <span className="price saved-amount">
                          {formatPrice(comboDetails.savedAmount)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="combo-preview">
                      <h6>Xem trước Combo</h6>
                      <div className="combo-preview-card">
                        <div className="combo-preview-header">
                          <h5>{currentCombo.name || 'Tên Combo'}</h5>
                          {currentCombo.isActive && (
                            <Badge bg="success">Đang hoạt động</Badge>
                          )}
                        </div>
                        
                        <div className="combo-preview-description">
                          {currentCombo.description || 'Mô tả về combo sẽ hiển thị ở đây.'}
                        </div>
                        
                        <div className="combo-preview-products">
                          {currentCombo.products.map((product, index) => (
                            <div key={product._id} className="combo-preview-product">
                              <img src={product.image} alt={product.name} />
                              <span>{product.name} x{product.quantity || 1}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="combo-preview-footer">
                          <div className="combo-preview-prices">
                            <span className="original-price">
                              {formatPrice(comboDetails.originalPrice)}
                            </span>
                            <span className="discounted-price">
                              {formatPrice(comboDetails.discountedPrice)}
                            </span>
                          </div>
                          <Badge bg="danger">
                            Tiết kiệm {currentCombo.discount}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
          
          <Tab eventKey="suggestions" title="Gợi ý Combo">
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Gợi ý Combo dựa trên dữ liệu mua hàng</h5>
              </Card.Header>
              <Card.Body>
                <FrequentlyBoughtTogetherTable 
                  data={frequentlyBoughtData}
                  loading={isLoadingFrequently}
                  error={frequentlyError}
                />
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
        
        {/* Add Product Modal */}
        <Modal
          show={showAddProductModal}
          onHide={() => setShowAddProductModal(false)}
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Thêm sản phẩm vào Combo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <InputGroup className="mb-3">
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <div className="product-selection-grid">
              {isLoadingProducts ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Đang tải sản phẩm...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  Không tìm thấy sản phẩm phù hợp. Vui lòng thử từ khóa khác.
                </Alert>
              ) : (
                <>
                  <Alert variant="info" className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <FaInfoCircle className="me-2" />
                        Đang hiển thị {filteredProducts.length} sản phẩm
                        {searchTerm.trim() && ` với từ khóa "${searchTerm}"`}
                      </div>
                      {searchTerm.trim() && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setSearchTerm('')}
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  </Alert>
                  
                  <Row className="g-3">
                    {filteredProducts.map((product) => (
                      <Col key={product._id} lg={3} md={4} sm={6} xs={6} className="mb-2">
                        <Card 
                          className={`product-select-card ${
                            currentCombo.products.some(p => p._id === product._id) ? 'selected' : ''
                          }`}
                          onClick={() => handleAddProductToCombo(product)}
                        >
                          <div className="product-image">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Không+có+ảnh';
                                }} 
                              />
                            ) : (
                              <div className="placeholder-image">
                                {product.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <Card.Body className="p-2">
                            <h6 className="product-title">{product.name}</h6>
                            <div className="product-price">
                              {formatPrice(product.price)}
                            </div>
                            {currentCombo.products.some(p => p._id === product._id) && (
                              <Badge bg="success" pill className="mt-1">
                                Đã thêm
                              </Badge>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Toast Notification */}
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">{toastMessage}</strong>
          </Toast.Header>
        </Toast>
      </Container>
    </AdminLayout>
  );
};

export default ComboManagement; 