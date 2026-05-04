import React, { useState, useMemo } from 'react';
import { 
  Row, Col, Card, Form, InputGroup, Button, Table, 
  Badge, Pagination, Modal, Spinner, Alert, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaSearch, FaEdit, FaSort, FaSortUp, FaSortDown, FaFilter, 
  FaBoxOpen, FaExclamationTriangle, FaRegImage, FaHistory,
  FaPlus, FaMinus, FaSave, FaArrowDown, FaArrowUp 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetProductsQuery, 
  useGetCategoriesQuery,
  useUpdateProductMutation
} from '../../services/api';
import '../../styles/AdminTheme.css';
import './InventoryManagement.css';

const InventoryManagement = () => {
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minStock: '',
    maxStock: '',
    status: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: 'stock', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  
  // State for inventory actions
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: 0, reason: 'restock' });
  const [activeTab, setActiveTab] = useState('all');
  
  // API hooks
  const { data: categoriesData } = useGetCategoriesQuery();
  const inventoryQueryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      sort: `${sortConfig.field}:${sortConfig.direction}`,
      keyword: filters.search || undefined,
      category: filters.category || undefined,
      minStock: filters.minStock || undefined,
      maxStock: filters.maxStock || undefined
    };

    if (activeTab === 'lowStock') {
      params.minStock = filters.minStock || 1;
      params.maxStock = filters.maxStock || 10;
    } else if (activeTab === 'outOfStock') {
      params.maxStock = 0;
    } else if (activeTab === 'inStock') {
      params.minStock = filters.minStock || 11;
    }

    return params;
  }, [activeTab, currentPage, itemsPerPage, sortConfig, filters]);

  const { data: productsData, isLoading, error, refetch } = useGetProductsQuery(inventoryQueryParams);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  // Get categories for filtering
  const products = productsData?.products || [];
  const categories = useMemo(() => {
    const categoryNames = new Set();
    const apiCategories = Array.isArray(categoriesData) ? categoriesData : [];
    const localCategories = products
      .filter((product) => product?.category)
      .map((product) => product.category);

    apiCategories.forEach((category) => {
      if (category?.name) categoryNames.add(category.name);
    });
    localCategories.forEach((name) => categoryNames.add(name));

    return [...categoryNames]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ _id: name, name }));
  }, [categoriesData, products]);
  
  // Apply filters
  const applyFilters = (products) => {
    return products.filter(product => {
      // Các filter khác đã được xử lý ở server để đồng bộ với trang Product List.
      return !filters.status || product.status === filters.status;
    });
  };
  
  // Sort products
  const sortProducts = (products) => {
    if (!products) return [];
    
    const sortableProducts = [...products];
    
    if (sortConfig.field) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.field] < b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.field] > b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableProducts;
  };
  
  // Handle sort change
  const handleSort = (field) => {
    let direction = 'asc';
    
    if (sortConfig.field === field) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ field, direction });
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return <FaSort className="ms-1 text-muted" />;
    if (sortConfig.direction === 'asc') return <FaSortUp className="ms-1 text-primary" />;
    return <FaSortDown className="ms-1 text-primary" />;
  };
  
  // Prepare products with filtering, sorting, and pagination
  const getDisplayedProducts = () => {
    if (!products || !products.length) return { products: [], totalItems: 0 };
    
    const filtered = applyFilters(products);
    const sorted = sortProducts(filtered);
    
    return {
      products: sorted,
      totalItems: sorted.length
    };
  };
  
  // Handle stock update
  const handleStockUpdate = async () => {
    if (!selectedProduct) return;
    
    try {
      const currentStock = selectedProduct.stock || 0;
      const newStock = currentStock + parseInt(stockAdjustment.quantity);
      
      if (newStock < 0) {
        // Don't allow negative stock
        alert("Lỗi: Tồn kho không thể là số âm");
        return;
      }
      
      await updateProduct({
        id: selectedProduct._id,
        productData: {
          stock: newStock
        }
      }).unwrap();
      
      setShowStockModal(false);
      setStockAdjustment({ quantity: 0, reason: 'restock' });
      refetch();
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Determine stock status class
  const getStockStatusClass = (stock) => {
    if (stock === 0 || stock === null || stock === undefined) return 'text-danger';
    if (stock <= 10) return 'text-warning';
    return 'text-success';
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Đang hoạt động</Badge>;
      case 'draft':
        return <Badge bg="secondary">Bản nháp</Badge>;
      case 'archived':
        return <Badge bg="dark">Lưu trữ</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // Pagination logic
  const totalItemsFromServer = productsData?.totalCount ?? productsData?.total ?? 0;
  const totalItemsForPagination = filters.status ? getDisplayedProducts().totalItems : totalItemsFromServer;
  const totalPages = Math.ceil(totalItemsForPagination / itemsPerPage);
  
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    
    // Previous button
    pages.push(
      <Pagination.Prev 
        key="prev" 
        disabled={currentPage === 1}
        onClick={() => handlePaginationClick(currentPage - 1)}
      />
    );
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => handlePaginationClick(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Next button
    pages.push(
      <Pagination.Next 
        key="next" 
        disabled={currentPage === totalPages}
        onClick={() => handlePaginationClick(currentPage + 1)}
      />
    );
    
    return <Pagination className="admin-mt-4 admin-justify-content-center">{pages}</Pagination>;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-d-flex admin-justify-content-center admin-align-items-center" style={{ height: '60vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="admin-my-4">
          {error.data?.message || 'Lỗi tải sản phẩm'}
        </Alert>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-page-header admin-d-flex admin-justify-content-between admin-align-items-center admin-mb-4">
          <div>
            <h1 className="admin-page-title">Quản lý tồn kho</h1>
            <p className="admin-text-muted">
              Quản lý mức tồn kho, theo dõi hàng tồn và điều chỉnh số lượng
            </p>
          </div>
        </div>
        
        <Row>
          <Col lg={12}>
            <Card className="admin-card admin-mb-4">
              <Card.Body className="admin-p-0">
                <Tabs 
                  id="inventory-management-tabs"
                  activeKey={activeTab} 
                  onSelect={(tab) => {
                    if (tab) {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }
                  }}
                  className="admin-tabs admin-mb-3"
                >
                  <Tab eventKey="all" title="Tất cả sản phẩm" />
                  <Tab eventKey="inStock" title="Còn hàng" />
                  <Tab eventKey="lowStock" title="Sắp hết hàng" />
                  <Tab eventKey="outOfStock" title="Hết hàng" />
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Card className="admin-card admin-mb-4">
          <Card.Body>
            <div className="admin-d-flex admin-justify-content-between admin-align-items-center admin-mb-3">
              {/* Search */}
              <div className="admin-d-flex">
                <InputGroup className="admin-me-2" style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <FaSearch className="admin-text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </InputGroup>
                
                <Button 
                  variant="light"
                  className="admin-btn admin-me-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className="admin-me-1" /> Bộ lọc
                </Button>
              </div>
              
              <div>
                <Form.Select 
                  className="admin-d-inline-block admin-me-2" 
                  style={{ width: 'auto' }}
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10 mục/trang</option>
                  <option value={20}>20 mục/trang</option>
                  <option value={50}>50 mục/trang</option>
                </Form.Select>
              </div>
            </div>
            
            {/* Filter row */}
            {showFilters && (
              <div className="admin-filter-row admin-mb-3">
                <Row>
                  <Col md={4} lg={3}>
                    <Form.Group className="admin-mb-3">
                      <Form.Label>Danh mục</Form.Label>
                      <Form.Select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4} lg={3}>
                    <Form.Group className="admin-mb-3">
                      <Form.Label>Tồn kho tối thiểu</Form.Label>
                      <Form.Control 
                        type="number" 
                        min="0"
                        placeholder="Tồn kho tối thiểu"
                        value={filters.minStock}
                        onChange={(e) => setFilters(prev => ({ ...prev, minStock: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} lg={3}>
                    <Form.Group className="admin-mb-3">
                      <Form.Label>Tồn kho tối đa</Form.Label>
                      <Form.Control 
                        type="number" 
                        min="0"
                        placeholder="Tồn kho tối đa"
                        value={filters.maxStock}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxStock: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} lg={3}>
                    <Form.Group className="admin-mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="draft">Bản nháp</option>
                        <option value="archived">Lưu trữ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <div className="admin-d-flex admin-justify-content-end">
                      <Button 
                        variant="outline-secondary" 
                        className="admin-me-2"
                        onClick={() => setFilters({
                          search: '',
                          category: '',
                          minStock: '',
                          maxStock: '',
                          status: ''
                        })}
                      >
                        Xóa bộ lọc
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
            
            {/* Product Table */}
            <div className="admin-table-responsive">
              <Table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th 
                      className="admin-sortable" 
                      onClick={() => handleSort('name')}
                    >
                      Sản phẩm {getSortIcon('name')}
                    </th>
                    <th 
                      className="admin-sortable" 
                      onClick={() => handleSort('sku')}
                    >
                      SKU {getSortIcon('sku')}
                    </th>
                    <th 
                      className="admin-sortable" 
                      onClick={() => handleSort('category')}
                    >
                      Danh mục {getSortIcon('category')}
                    </th>
                    <th 
                      className="admin-sortable" 
                      onClick={() => handleSort('stock')}
                    >
                      Tồn kho {getSortIcon('stock')}
                    </th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getDisplayedProducts().products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-text-center admin-p-4">
                        Không tìm thấy sản phẩm
                      </td>
                    </tr>
                  ) : (
                    getDisplayedProducts().products.map((product, index) => (
                      <tr key={product._id}>
                        <td>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td>
                          <div className="admin-product-info">
                            <div className="admin-product-image">
                              {product.image ? (
                                <img src={product.image} alt={product.name} />
                              ) : (
                                <FaRegImage />
                              )}
                            </div>
                            <div className="admin-product-details">
                              <div className="admin-product-name">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{product.sku || product._id || 'Không có'}</td>
                        <td>
                          {categories.find(c => c._id === product.category)?.name || 'Chưa phân loại'}
                        </td>
                        <td>
                          <span className={`admin-fw-medium ${getStockStatusClass(product.stock)}`}>
                            {product.stock || 0}
                            {product.stock <= 10 && product.stock > 0 && (
                              <FaExclamationTriangle className="ms-2" />
                            )}
                            {(product.stock === 0 || product.stock === null || product.stock === undefined) && (
                              <Badge bg="danger" className="ms-2">Hết hàng</Badge>
                            )}
                          </span>
                        </td>
                        <td>{getStatusBadge(product.status || 'active')}</td>
                        <td>
                          <div className="admin-product-actions">
                            <Button 
                              variant="primary"
                              className="admin-btn admin-btn-sm admin-me-1"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowStockModal(true);
                              }}
                            >
                              Điều chỉnh tồn kho
                            </Button>
                            
                            <Link to={`/admin/products/edit/${product._id}`} className="admin-btn admin-btn-icon admin-btn-sm admin-me-1">
                              <FaEdit />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Pagination */}
            {renderPagination()}
          </Card.Body>
        </Card>
      </div>
      
      {/* Stock Adjustment Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Điều chỉnh tồn kho</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <div className="admin-mb-3">
                <strong>Sản phẩm:</strong> {selectedProduct.name}
              </div>
              <div className="admin-mb-3">
                <strong>Tồn kho hiện tại:</strong> {selectedProduct.stock || 0} sản phẩm
              </div>
              <Form.Group className="admin-mb-3">
                <Form.Label>Loại điều chỉnh</Form.Label>
                <Form.Select
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                >
                  <option value="restock">Nhập thêm hàng</option>
                  <option value="returned">Hàng hoàn trả</option>
                  <option value="correction">Điều chỉnh kiểm kho</option>
                  <option value="damaged">Hàng hỏng/thất lạc</option>
                  <option value="other">Khác</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="admin-mb-3">
                <Form.Label>Số lượng</Form.Label>
                <InputGroup>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setStockAdjustment(prev => ({ 
                      ...prev, 
                      quantity: parseInt(prev.quantity || 0) - 1 
                    }))}
                  >
                    <FaMinus />
                  </Button>
                  <Form.Control
                    type="number"
                    value={stockAdjustment.quantity}
                    onChange={(e) => setStockAdjustment(prev => ({ 
                      ...prev, 
                      quantity: e.target.value 
                    }))}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setStockAdjustment(prev => ({ 
                      ...prev, 
                      quantity: parseInt(prev.quantity || 0) + 1 
                    }))}
                  >
                    <FaPlus />
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Nhập số dương để tăng tồn kho hoặc số âm để giảm tồn kho.
                </Form.Text>
              </Form.Group>
              <div className="admin-mb-3">
                <strong>Tồn kho sau điều chỉnh:</strong> 
                <span className={getStockStatusClass((selectedProduct.stock || 0) + parseInt(stockAdjustment.quantity || 0))}>
                  {" " + ((selectedProduct.stock || 0) + parseInt(stockAdjustment.quantity || 0))} sản phẩm
                </span>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStockUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default InventoryManagement; 