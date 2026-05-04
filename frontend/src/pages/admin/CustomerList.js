import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaSearch, FaUserEdit, FaEye, FaSync, FaFilter, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetCustomersQuery } from '../../services/api';
import './CustomerList.css';
import { formatPrice } from '../../utils/productHelpers';

const CustomerList = () => {
  // Fetch customers
  const { data: customersData, isLoading, error, refetch } = useGetCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    registrationDateFrom: '',
    registrationDateTo: '',
    orderCountMin: '',
    orderCountMax: '',
    totalSpentMin: '',
    totalSpentMax: ''
  });

  useEffect(() => {
    if (customersData) {
      setCustomers(customersData);
    }
  }, [customersData]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Filter customers based on search and filters
  const getFilteredCustomers = () => {
    if (!customers || !customers.length) return [];
    
    return customers.filter(customer => {
      // Search filter
      const search = searchTerm.toLowerCase();
      const searchMatch = searchTerm === '' || 
        (customer.name && customer.name.toLowerCase().includes(search)) ||
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        (customer.phone && customer.phone.toLowerCase().includes(search));
      
      if (!searchMatch) return false;
      
      // Registration date filter
      if (filters.registrationDateFrom) {
        const fromDate = new Date(filters.registrationDateFrom);
        const customerDate = new Date(customer.createdAt || customer.registrationDate);
        if (customerDate < fromDate) return false;
      }
      
      if (filters.registrationDateTo) {
        const toDate = new Date(filters.registrationDateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        const customerDate = new Date(customer.createdAt || customer.registrationDate);
        if (customerDate > toDate) return false;
      }
      
      // Order count filter
      const orderCount = customer.orderCount || customer.orders?.length || 0;
      if (filters.orderCountMin && orderCount < parseInt(filters.orderCountMin)) return false;
      if (filters.orderCountMax && orderCount > parseInt(filters.orderCountMax)) return false;
      
      // Total spent filter
      const totalSpent = customer.totalSpent || 0;
      if (filters.totalSpentMin && totalSpent < parseInt(filters.totalSpentMin)) return false;
      if (filters.totalSpentMax && totalSpent > parseInt(filters.totalSpentMax)) return false;
      
      return true;
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      registrationDateFrom: '',
      registrationDateTo: '',
      orderCountMin: '',
      orderCountMax: '',
      totalSpentMin: '',
      totalSpentMax: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Get current customers for pagination
  const filteredCustomers = getFilteredCustomers();
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Change page
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <AdminLayout>
      <div className="customer-list">
        <div className="customer-list-header">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Quản lý khách hàng</h1>
            <div>
              <Button 
                variant="outline-primary"
                className="me-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              </Button>
              <Button 
                variant="success" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <FaSync className={isLoading ? "spin-animation me-1" : "me-1"} />
                {isLoading ? "Đang tải..." : "Làm mới"}
              </Button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="mb-4">
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </Button>
              <Button variant="primary">
                <FaSearch /> Tìm kiếm
              </Button>
            </InputGroup>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="filter-container p-3 mb-4">
              <h5>Lọc khách hàng</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày đăng ký từ:</Form.Label>
                    <Form.Control
                      type="date"
                      name="registrationDateFrom"
                      value={filters.registrationDateFrom}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Đến ngày:</Form.Label>
                    <Form.Control
                      type="date"
                      name="registrationDateTo"
                      value={filters.registrationDateTo}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số đơn hàng:</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Từ"
                          name="orderCountMin"
                          value={filters.orderCountMin}
                          onChange={handleFilterChange}
                          min="0"
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Đến"
                          name="orderCountMax"
                          value={filters.orderCountMax}
                          onChange={handleFilterChange}
                          min="0"
                        />
                      </Col>
                    </Row>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tổng chi tiêu (VNĐ):</Form.Label>
                    <Row>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Từ"
                          name="totalSpentMin"
                          value={filters.totalSpentMin}
                          onChange={handleFilterChange}
                          min="0"
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="number"
                          placeholder="Đến"
                          name="totalSpentMax"
                          value={filters.totalSpentMax}
                          onChange={handleFilterChange}
                          min="0"
                        />
                      </Col>
                    </Row>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end">
                <Button variant="outline-secondary" onClick={handleResetFilters} className="me-2">
                  Xóa bộ lọc
                </Button>
                <Button variant="primary" onClick={() => setCurrentPage(1)}>
                  Áp dụng
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải danh sách khách hàng: {error.message || 'Lỗi không xác định'}</span>
              <Button variant="outline-danger" size="sm" onClick={handleRefresh}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách khách hàng...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover className="customer-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Ngày đăng ký</th>
                    <th>Đơn hàng</th>
                    <th>Chi tiêu</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.length > 0 ? (
                    currentCustomers.map(customer => (
                      <tr key={customer._id}>
                        <td>{customer._id?.substring(0, 8) || 'N/A'}</td>
                        <td>{customer.name || 'N/A'}</td>
                        <td>{customer.email || 'N/A'}</td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td>{formatDate(customer.createdAt || customer.registrationDate)}</td>
                        <td>{customer.orderCount || customer.orders?.length || 0}</td>
                        <td>{formatPrice(customer.totalSpent || 0)}</td>
                        <td>
                          <Badge bg={customer.isVerified ? "success" : "warning"}>
                            {customer.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                          </Badge>
                        </td>
                        <td className="action-column">
                          <Link to={`/admin/customers/${customer._id}`} className="btn btn-info btn-sm me-1">
                            <FaEye /> Chi tiết
                          </Link>
                          <Button variant="primary" size="sm">
                            <FaUserEdit /> Sửa
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        Không tìm thấy khách hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredCustomers.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div>
                  Hiển thị {indexOfFirstCustomer + 1} - {Math.min(indexOfLastCustomer, filteredCustomers.length)} của {filteredCustomers.length} khách hàng
                </div>
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(1)}>
                      Đầu
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                      Trước
                    </button>
                  </li>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNumber;
                    
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    return (
                      <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                      Sau
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                      Cuối
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CustomerList; 