import React, { useState } from 'react';
import { Table, Button, Spinner, Alert, Form, Modal, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCalendarAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation
} from '../../services/api';
import './DiscountList.css';
import { formatPrice } from '../../utils/productHelpers';

const DiscountList = () => {
  // Fetch discounts
  const { data: discounts, isLoading, error, refetch } = useGetDiscountsQuery();
  
  // Mutations
  const [createDiscount, { isLoading: isCreating }] = useCreateDiscountMutation();
  const [updateDiscount, { isLoading: isUpdating }] = useUpdateDiscountMutation();
  const [deleteDiscount, { isLoading: isDeleting }] = useDeleteDiscountMutation();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const formatCurrency = (value) => formatPrice(value || 0);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  
  // Check if discount is active based on dates and isActive flag
  const isDiscountActive = (discount) => {
    const now = new Date();
    const startDate = discount.startDate ? new Date(discount.startDate) : null;
    const endDate = discount.endDate ? new Date(discount.endDate) : null;
    
    return discount.isActive && 
           (!startDate || startDate <= now) && 
           (!endDate || endDate >= now);
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              (name === 'discountValue' || name === 'minPurchase' || name === 'maxDiscount') ? 
              Number(value) : value
    });
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên khuyến mãi không được để trống';
    
    if (formData.discountType === 'percentage') {
      if (formData.discountValue < 0 || formData.discountValue > 100) {
        errors.discountValue = 'Phần trăm giảm giá phải từ 0 đến 100';
      }
    } else { // fixed amount
      if (formData.discountValue < 0) {
        errors.discountValue = 'Giá trị giảm giá không được âm';
      }
    }
    
    if (formData.minPurchase < 0) {
      errors.minPurchase = 'Giá trị đơn hàng tối thiểu không được âm';
    }
    
    if (formData.maxDiscount < 0) {
      errors.maxDiscount = 'Giá trị giảm tối đa không được âm';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open modal for create/edit
  const openModal = (discount = null) => {
    if (discount) {
      setCurrentDiscount(discount);
      setFormData({
        name: discount.name,
        description: discount.description || '',
        discountType: discount.discountType || 'percentage',
        discountValue: discount.discountValue || 0,
        minPurchase: discount.minPurchase || 0,
        maxDiscount: discount.maxDiscount || 0,
        startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
        endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
        isActive: discount.isActive !== undefined ? discount.isActive : true
      });
    } else {
      setCurrentDiscount(null);
      setFormData({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
      });
    }
    setShowModal(true);
  };
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (currentDiscount) {
        // Update existing discount
        await updateDiscount({
          id: currentDiscount._id,
          discountData: formData
        }).unwrap();
      } else {
        // Create new discount
        await createDiscount(formData).unwrap();
      }
      
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to save discount:', err);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteDiscount(deleteId).unwrap();
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to delete discount:', err);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  // Toggle discount active status
  const toggleStatus = async (discount) => {
    try {
      await updateDiscount({
        id: discount._id,
        discountData: { ...discount, isActive: !discount.isActive }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to toggle discount status:', err);
    }
  };
  
  return (
    <AdminLayout>
      <div className="discount-list">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Quản lý khuyến mãi</h1>
          <div>
            <Button variant="primary" onClick={() => openModal()}>
              <FaPlus className="me-2" /> Thêm khuyến mãi
            </Button>
            <Button 
              variant="outline-secondary" 
              className="ms-2"
              onClick={refetch}
              disabled={isLoading}
            >
              <FaSync className={isLoading ? "spin-animation" : ""} /> Làm mới
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải danh sách khuyến mãi</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách khuyến mãi...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="discount-table">
              <thead>
                <tr>
                  <th>Tên khuyến mãi</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Đơn hàng tối thiểu</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {discounts && discounts.length > 0 ? (
                  discounts.map((discount) => {
                    const isActive = isDiscountActive(discount);
                    return (
                      <tr key={discount._id} className={isActive ? "" : "inactive-row"}>
                        <td>
                          <div className="fw-bold">{discount.name}</div>
                          <div className="text-muted small">{discount.description}</div>
                        </td>
                        <td>{discount.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</td>
                        <td>
                          {discount.discountType === 'percentage' 
                            ? `${discount.discountValue}%` 
                            : formatCurrency(discount.discountValue)
                          }
                          {discount.maxDiscount > 0 && discount.discountType === 'percentage' && (
                            <div className="small text-muted">
                              Tối đa: {formatCurrency(discount.maxDiscount)}
                            </div>
                          )}
                        </td>
                        <td>{formatCurrency(discount.minPurchase)}</td>
                        <td>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Từ: {formatDate(discount.startDate)}</span>
                          </div>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Đến: {discount.endDate ? formatDate(discount.endDate) : 'Không giới hạn'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg={isActive ? 'success' : 'secondary'}>
                            {isActive ? 'Đang kích hoạt' : 'Không kích hoạt'}
                          </Badge>
                          <Button 
                            variant="link" 
                            className="p-0 ms-2 status-toggle"
                            onClick={() => toggleStatus(discount)}
                            title={discount.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {discount.isActive ? 
                              <FaToggleOn className="text-success" /> : 
                              <FaToggleOff className="text-secondary" />
                            }
                          </Button>
                        </td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="me-2 mb-1"
                            onClick={() => openModal(discount)}
                          >
                            <FaEdit /> Sửa
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => confirmDelete(discount._id)}
                          >
                            <FaTrash /> Xóa
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-3">
                      Chưa có khuyến mãi nào
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
        
        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {currentDiscount ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên khuyến mãi <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.name}
                      placeholder="Nhập tên khuyến mãi"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <div>
                      <Form.Check
                        type="switch"
                        id="discount-active"
                        name="isActive"
                        label={formData.isActive ? "Đang kích hoạt" : "Không kích hoạt"}
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả về khuyến mãi"
                />
              </Form.Group>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại khuyến mãi</Form.Label>
                    <Form.Select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {formData.discountType === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.discountValue}
                      min="0"
                      max={formData.discountType === 'percentage' ? "100" : undefined}
                      step={formData.discountType === 'percentage' ? "1" : "1000"}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.discountValue}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giảm tối đa (VNĐ)</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.maxDiscount}
                      min="0"
                      step="1000"
                      placeholder={formData.discountType === 'percentage' ? "Giới hạn số tiền giảm" : "Để 0 nếu không giới hạn"}
                      disabled={formData.discountType === 'fixed'}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.maxDiscount}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      {formData.discountType === 'percentage' ? 'Áp dụng cho khuyến mãi theo phần trăm' : 'Không áp dụng cho khuyến mãi cố định'}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Đơn hàng tối thiểu (VNĐ)</Form.Label>
                    <Form.Control
                      type="number"
                      name="minPurchase"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.minPurchase}
                      min="0"
                      step="1000"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.minPurchase}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Để 0 nếu không yêu cầu giá trị tối thiểu
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày bắt đầu</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày kết thúc</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.endDate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.endDate}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Để trống nếu không giới hạn thời gian
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && (
                  <Spinner 
                    as="span" 
                    animation="border" 
                    size="sm" 
                    className="me-2"
                  />
                )}
                {currentDiscount ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
        
        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa khuyến mãi này không? Thao tác này không thể hoàn tác.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  className="me-2"
                />
              )}
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default DiscountList; 