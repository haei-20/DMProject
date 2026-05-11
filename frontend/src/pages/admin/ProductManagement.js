import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Form, InputGroup, Button, Table, 
  Badge, Pagination, Modal, Spinner, Alert, Tabs, Tab, Dropdown
} from 'react-bootstrap';
import { 
  FaSearch, FaPlus, FaEdit, FaTrashAlt, FaCopy, FaEllipsisV,
  FaSortUp, FaSortDown, FaSort, FaFilter, FaEye, FaBoxOpen,
  FaExclamationTriangle, FaChartLine, FaTags, FaRegImage
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetProductsQuery, 
  useDeleteProductMutation,
  useUpdateProductMutation 
} from '../../services/api';
import '../../styles/AdminTheme.css';
import './ProductManagement.css';
import { formatPrice } from '../../utils/productHelpers';
import {
  getAdminCategorySelectOptions,
  getCategoryDisplayEn,
} from '../../constants/productCategoryTagMap';

const ProductManagement = () => {
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: '',
    status: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  
  // State for product actions
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // API hooks
  const { data: productsData, isLoading, error, refetch } = useGetProductsQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  
  const categorySelectOptions = getAdminCategorySelectOptions();

  // Sample status options
  const statusOptions = [
    { value: 'active', label: 'Đang bán', variant: 'success' },
    { value: 'draft', label: 'Nháp', variant: 'secondary' },
    { value: 'outOfStock', label: 'Hết hàng', variant: 'danger' },
    { value: 'discontinued', label: 'Ngừng bán', variant: 'warning' }
  ];
  
  const formatCurrency = (amount) => formatPrice(amount || 0);
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minStock: '',
      maxStock: '',
      status: ''
    });
  };
  
  // Apply filters to products
  const applyFilters = (products) => {
    if (!products) return [];
    
    return products.filter(product => {
      // Search filter
      const searchMatch = !filters.search || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Category filter
      const categoryMatch = !filters.category || product.category === filters.category;
      
      // Price filters
      const priceMatch = 
        (!filters.minPrice || product.price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || product.price <= parseFloat(filters.maxPrice));
      
      // Stock filters
      const stockMatch = 
        (!filters.minStock || product.stock >= parseInt(filters.minStock)) &&
        (!filters.maxStock || product.stock <= parseInt(filters.maxStock));
      
      // Status filter
      const statusMatch = !filters.status || product.status === filters.status;
      
      return searchMatch && categoryMatch && priceMatch && stockMatch && statusMatch;
    });
  };
  
  // Filter products by tab
  const filterByTab = (products) => {
    if (!products) return [];
    
    switch (activeTab) {
      case 'lowStock':
        return products.filter(product => product.stock <= 10);
      case 'outOfStock':
        return products.filter(product => product.stock <= 0);
      case 'featured':
        return products.filter(product => product.featured);
      case 'draft':
        return products.filter(product => product.status === 'draft');
      default:
        return products;
    }
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
    if (!productsData) return [];
    
    const filteredByTab = filterByTab(productsData);
    const filtered = applyFilters(filteredByTab);
    const sorted = sortProducts(filtered);
    
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    return {
      products: sorted.slice(indexOfFirstItem, indexOfLastItem),
      totalItems: sorted.length
    };
  };
  
  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct(selectedProduct._id).unwrap();
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };
  
  // Handle toggle featured status
  const handleToggleFeatured = async (product) => {
    try {
      await updateProduct({
        id: product._id,
        productData: {
          ...product,
          featured: !product.featured
        }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update product:", err);
    }
  };
  
  // Handle change product status
  const handleStatusChange = async (product, status) => {
    try {
      await updateProduct({
        id: product._id,
        productData: {
          ...product,
          status
        }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update product status:", err);
    }
  };
  
  // Pagination controls
  const totalPages = Math.ceil(getDisplayedProducts().totalItems / itemsPerPage);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(opt => opt.value === status) || 
                     { label: 'Không xác định', variant: 'secondary' };
    
    return (
      <Badge bg={statusObj.variant} className="admin-badge admin-badge-rounded">{statusObj.label}</Badge>
    );
  };
  
  // Determine stock status class
  const getStockStatusClass = (stock) => {
    if (stock === 0 || stock === null || stock === undefined) return 'text-danger';
    if (stock <= 10) return 'text-warning';
    return 'text-success';
  };
  
  return (
    <AdminLayout>
      <div className="admin-container">
        <div className="admin-page-header admin-d-flex admin-justify-content-between admin-align-items-center admin-mb-4">
          <div>
            <h1 className="admin-page-title">Quản lý sản phẩm</h1>
            <p className="admin-text-muted">
              Quản lý tất cả sản phẩm trong hệ thống, cập nhật thông tin và giá cả
            </p>
          </div>
          <Link to="/admin/products/add" className="admin-btn admin-btn-primary">
            <FaPlus /> Thêm sản phẩm
          </Link>
        </div>
        
        <Row>
          <Col lg={12}>
            <Card className="admin-card admin-mb-4">
              <Card.Body className="admin-p-0">
                <Tabs 
                  activeKey={activeTab} 
                  onSelect={tab => setActiveTab(tab)}
                  className="admin-tabs admin-mb-3"
                >
                  <Tab eventKey="all" title="Tất cả sản phẩm" />
                  <Tab eventKey="featured" title="Sản phẩm nổi bật" />
                  <Tab eventKey="lowStock" title="Tồn kho thấp" />
                  <Tab eventKey="outOfStock" title="Hết hàng" />
                  <Tab eventKey="draft" title="Nháp" />
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="admin-mb-4">
          <Col md={8} xl={9}>
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm sản phẩm theo tên, mã SKU..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="admin-form-control"
              />
              <Button variant="outline-primary" className="admin-btn">
                <FaSearch />
              </Button>
              <Button 
                variant={showFilters ? "primary" : "outline-secondary"} 
                onClick={() => setShowFilters(!showFilters)}
                className="admin-btn"
              >
                <FaFilter /> Lọc
              </Button>
            </InputGroup>
          </Col>
          <Col md={4} xl={3} className="d-flex justify-content-md-end mt-3 mt-md-0">
            <Form.Select 
              className="admin-form-control"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
            >
              <option value={10}>10 sản phẩm</option>
              <option value={25}>25 sản phẩm</option>
              <option value={50}>50 sản phẩm</option>
              <option value={100}>100 sản phẩm</option>
            </Form.Select>
          </Col>
        </Row>
        
        {showFilters && (
          <Card className="admin-card admin-mb-4">
            <Card.Body>
              <h5 className="admin-mb-3">Bộ lọc nâng cao</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="admin-form-control"
                    >
                      <option value="">Tất cả danh mục</option>
                      {categorySelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="admin-form-control"
                    >
                      <option value="">Tất cả trạng thái</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Giá (GBP)</Form.Label>
                    <div className="admin-d-flex">
                      <Form.Control
                        type="number"
                        placeholder="Từ"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="admin-form-control admin-me-2"
                      />
                      <Form.Control
                        type="number"
                        placeholder="Đến"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="admin-form-control"
                      />
                    </div>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group className="admin-mb-3">
                    <Form.Label>Tồn kho</Form.Label>
                    <div className="admin-d-flex">
                      <Form.Control
                        type="number"
                        placeholder="Từ"
                        name="minStock"
                        value={filters.minStock}
                        onChange={handleFilterChange}
                        className="admin-form-control admin-me-2"
                      />
                      <Form.Control
                        type="number"
                        placeholder="Đến"
                        name="maxStock"
                        value={filters.maxStock}
                        onChange={handleFilterChange}
                        className="admin-form-control"
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="admin-d-flex admin-justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                  className="admin-btn admin-me-2"
                >
                  Xóa bộ lọc
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => refetch()}
                  className="admin-btn"
                >
                  Áp dụng
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
        
        {isLoading ? (
          <div className="text-center admin-py-5">
            <Spinner animation="border" variant="primary" />
            <p className="admin-mt-3">Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Có lỗi xảy ra khi tải dữ liệu sản phẩm. Vui lòng thử lại sau.
          </Alert>
        ) : (
          <>
            <Card className="admin-card">
              <div className="admin-table-responsive">
                <Table className="admin-table admin-table-hover admin-mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th 
                        style={{ width: '300px', cursor: 'pointer' }} 
                        onClick={() => handleSort('name')}
                      >
                        Sản phẩm {getSortIcon('name')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => handleSort('category')}
                      >
                        Danh mục {getSortIcon('category')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => handleSort('price')}
                      >
                        Giá {getSortIcon('price')}
                      </th>
                      <th 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => handleSort('stock')}
                      >
                        Tồn kho {getSortIcon('stock')}
                      </th>
                      <th>Trạng thái</th>
                      <th style={{ width: '150px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDisplayedProducts().products.map((product, index) => (
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
                                {product.featured && (
                                  <Badge bg="info" className="ms-2 admin-badge-sm">Nổi bật</Badge>
                                )}
                              </div>
                              <div className="admin-product-sku text-muted">
                                SKU: {product.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {product.category ? getCategoryDisplayEn(product.category) : 'Uncategorized'}
                        </td>
                        <td className="admin-fw-medium">{formatCurrency(product.price || 0)}</td>
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
                            <Link to={`/admin/products/edit/${product._id}`} className="admin-btn admin-btn-icon admin-btn-sm admin-me-1">
                              <FaEdit />
                            </Link>
                            <Button 
                              variant="light"
                              className="admin-btn admin-btn-icon admin-btn-sm admin-me-1"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDetailsModal(true);
                              }}
                            >
                              <FaEye />
                            </Button>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="light" size="sm" className="admin-btn admin-btn-icon admin-btn-sm">
                                <FaEllipsisV />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item 
                                  onClick={() => handleToggleFeatured(product)}
                                  className="admin-dropdown-item"
                                >
                                  {product.featured ? 'Hủy nổi bật' : 'Đánh dấu nổi bật'}
                                </Dropdown.Item>
                                <Dropdown.Item 
                                  as={Link} 
                                  to={`/admin/products/duplicate/${product._id}`}
                                  className="admin-dropdown-item"
                                >
                                  <FaCopy className="admin-me-2" /> Nhân bản
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-danger admin-dropdown-item"
                                >
                                  <FaTrashAlt className="admin-me-2" /> Xóa
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {getDisplayedProducts().products.length === 0 && (
                <div className="text-center admin-py-5">
                  <FaBoxOpen className="admin-empty-icon" />
                  <h4>Không tìm thấy sản phẩm nào</h4>
                  <p className="text-muted">Hãy thử thay đổi bộ lọc hoặc tạo sản phẩm mới</p>
                </div>
              )}
              
              <Card.Footer className="admin-d-flex admin-justify-content-between admin-align-items-center">
                <div className="admin-pagination-info">
                  Hiển thị {getDisplayedProducts().products.length} / {getDisplayedProducts().totalItems} sản phẩm
                </div>
                
                <Pagination className="admin-pagination admin-mb-0">
                  <Pagination.Prev 
                    disabled={currentPage === 1}
                    onClick={handlePreviousPage}
                  />
                  
                  {currentPage > 2 && (
                    <>
                      <Pagination.Item onClick={() => setCurrentPage(1)}>1</Pagination.Item>
                      {currentPage > 3 && <Pagination.Ellipsis disabled />}
                    </>
                  )}
                  
                  {getPageNumbers().map(number => (
                    <Pagination.Item 
                      key={number} 
                      active={number === currentPage}
                      onClick={() => setCurrentPage(number)}
                    >
                      {number}
                    </Pagination.Item>
                  ))}
                  
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <Pagination.Ellipsis disabled />}
                      <Pagination.Item onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </Pagination.Item>
                    </>
                  )}
                  
                  <Pagination.Next 
                    disabled={currentPage === totalPages}
                    onClick={handleNextPage}
                  />
                </Pagination>
              </Card.Footer>
            </Card>
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="admin-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Xóa sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="admin-text-center admin-mb-4">
            <div className="admin-modal-icon admin-modal-icon-danger">
              <FaTrashAlt />
            </div>
            <h4 className="admin-mt-4">Bạn chắc chắn muốn xóa sản phẩm này?</h4>
            <p className="text-muted">
              Sản phẩm "{selectedProduct?.name}" sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteModal(false)}
            className="admin-btn"
          >
            Hủy bỏ
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="admin-btn admin-btn-danger"
          >
            {isDeleting ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  role="status" 
                  aria-hidden="true"
                  className="admin-me-2"
                />
                Đang xóa...
              </>
            ) : (
              'Xác nhận xóa'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Product Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        centered
        size="lg"
        className="admin-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Row>
              <Col md={4}>
                <div className="admin-product-detail-image">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} />
                  ) : (
                    <div className="admin-product-placeholder">
                      <FaRegImage />
                      <span>Không có ảnh</span>
                    </div>
                  )}
                </div>
              </Col>
              <Col md={8}>
                <h3 className="admin-mb-2">{selectedProduct.name}</h3>
                <p className="admin-text-muted admin-mb-3">
                  SKU: {selectedProduct.sku || 'N/A'}
                </p>
                
                <div className="admin-product-detail-row">
                  <div className="admin-product-detail-label">Giá:</div>
                  <div className="admin-product-detail-value admin-fw-bold">
                    {formatCurrency(selectedProduct.price || 0)}
                  </div>
                </div>
                
                <div className="admin-product-detail-row">
                  <div className="admin-product-detail-label">Danh mục:</div>
                  <div className="admin-product-detail-value">
                    {selectedProduct.category ? getCategoryDisplayEn(selectedProduct.category) : 'Uncategorized'}
                  </div>
                </div>
                
                <div className="admin-product-detail-row">
                  <div className="admin-product-detail-label">Tồn kho:</div>
                  <div className="admin-product-detail-value">
                    <span className={getStockStatusClass(selectedProduct.stock)}>
                      {selectedProduct.stock || 0} đơn vị
                    </span>
                  </div>
                </div>
                
                <div className="admin-product-detail-row">
                  <div className="admin-product-detail-label">Trạng thái:</div>
                  <div className="admin-product-detail-value">
                    {getStatusBadge(selectedProduct.status || 'active')}
                  </div>
                </div>
                
                <div className="admin-product-detail-row">
                  <div className="admin-product-detail-label">Sản phẩm nổi bật:</div>
                  <div className="admin-product-detail-value">
                    {selectedProduct.featured ? (
                      <Badge bg="info">Có</Badge>
                    ) : (
                      <Badge bg="light" text="dark">Không</Badge>
                    )}
                  </div>
                </div>
                
                <hr className="admin-my-3" />
                
                <h5 className="admin-mb-3">Mô tả sản phẩm</h5>
                <p className="admin-product-description">
                  {selectedProduct.description || 'Không có mô tả cho sản phẩm này.'}
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDetailsModal(false)}
            className="admin-btn"
          >
            Đóng
          </Button>
          {selectedProduct && (
            <Link 
              to={`/admin/products/edit/${selectedProduct._id}`} 
              className="admin-btn admin-btn-primary"
            >
              <FaEdit className="admin-me-1" /> Chỉnh sửa
            </Link>
          )}
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default ProductManagement; 