import React, { useState } from 'react';
import { Table, Button, Spinner, Alert, Form, Modal, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCalendarAlt, FaToggleOn, FaToggleOff, FaCopy } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation
} from '../../services/api';
import './CouponList.css';
import { formatPrice } from '../../utils/productHelpers';

const CouponList = () => {
  // Fetch coupons
  const { data: coupons, isLoading, error, refetch } = useGetCouponsQuery();
  
  // Mutations
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    maxUsage: 0,
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);
  
  const formatCurrency = (value) => formatPrice(value || 0);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  
  // Check if coupon is active based on dates, usage, and isActive flag
  const isCouponActive = (coupon) => {
    const now = new Date();
    const startDate = coupon.startDate ? new Date(coupon.startDate) : null;
    const endDate = coupon.endDate ? new Date(coupon.endDate) : null;
    
    // Check if maxUsage is defined and if usageCount exceeds it
    const usageExceeded = coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;
    
    return coupon.isActive && 
           (!startDate || startDate <= now) && 
           (!endDate || endDate >= now) &&
           !usageExceeded;
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              (name === 'discountValue' || name === 'minPurchase' || name === 'maxDiscount' || name === 'maxUsage') ? 
              Number(value) : value
    });
    
    // Convert coupon code to uppercase if it's being changed
    if (name === 'code') {
      setFormData(prev => ({
        ...prev,
        code: value.toUpperCase()
      }));
    }
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  // Generate random coupon code
  const generateCouponCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed similar-looking chars
    let result = '';
    const length = 8;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setFormData({
      ...formData,
      code: result
    });
  };
  
  // Copy coupon code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã giảm giá không được để trống';
    
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
    
    if (formData.maxUsage < 0) {
      errors.maxUsage = 'Số lần sử dụng tối đa không được âm';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open modal for create/edit
  const openModal = (coupon = null) => {
    if (coupon) {
      setCurrentCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || 0,
        minPurchase: coupon.minPurchase || 0,
        maxDiscount: coupon.maxDiscount || 0,
        maxUsage: coupon.maxUsage || 0,
        usageCount: coupon.usageCount || 0,
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
        isActive: coupon.isActive !== undefined ? coupon.isActive : true
      });
    } else {
      setCurrentCoupon(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        maxUsage: 0,
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
      if (currentCoupon) {
        // Update existing coupon
        await updateCoupon({
          id: currentCoupon._id,
          couponData: formData
        }).unwrap();
      } else {
        // Create new coupon
        await createCoupon(formData).unwrap();
      }
      
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to save coupon:', err);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteCoupon(deleteId).unwrap();
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  // Toggle coupon active status
  const toggleStatus = async (coupon) => {
    try {
      await updateCoupon({
        id: coupon._id,
        couponData: { ...coupon, isActive: !coupon.isActive }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };
  
  // Get usage status text
  const getUsageStatus = (coupon) => {
    if (!coupon.maxUsage) return 'Không giới hạn';
    return `${coupon.usageCount || 0} / ${coupon.maxUsage}`;
  };
  
  return (
    <AdminLayout>
      <div className="coupon-list">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Quản lý mã giảm giá</h1>
          <div>
            <Button variant="primary" onClick={() => openModal()}>
              <FaPlus className="me-2" /> Thêm mã giảm giá
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
              <span>Lỗi khi tải danh sách mã giảm giá</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách mã giảm giá...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="coupon-table">
              <thead>
                <tr>
                  <th>Mã giảm giá</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Đơn hàng tối thiểu</th>
                  <th>Thời hạn</th>
                  <th>Lượt sử dụng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {coupons && coupons.length > 0 ? (
                  coupons.map((coupon) => {
                    const isActive = isCouponActive(coupon);
                    return (
                      <tr key={coupon._id} className={isActive ? "" : "inactive-row"}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="coupon-code">{coupon.code}</span>
                            <Button 
                              variant="link" 
                              className="p-0 ms-2 copy-button"
                              onClick={() => copyToClipboard(coupon.code)}
                              title="Sao chép mã"
                            >
                              <FaCopy />
                            </Button>
                            {copiedCode === coupon.code && (
                              <span className="copied-badge">Đã sao chép!</span>
                            )}
                          </div>
                          <div className="text-muted small">{coupon.description}</div>
                        </td>
                        <td>{coupon.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</td>
                        <td>
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}%` 
                            : formatCurrency(coupon.discountValue)
                          }
                          {coupon.maxDiscount > 0 && coupon.discountType === 'percentage' && (
                            <div className="small text-muted">
                              Tối đa: {formatCurrency(coupon.maxDiscount)}
                            </div>
                          )}
                        </td>
                        <td>{formatCurrency(coupon.minPurchase)}</td>
                        <td>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Từ: {formatDate(coupon.startDate)}</span>
                          </div>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Đến: {coupon.endDate ? formatDate(coupon.endDate) : 'Không giới hạn'}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="usage-count">{getUsageStatus(coupon)}</span>
                        </td>
                        <td>
                          <Badge bg={isActive ? 'success' : 'secondary'}>
                            {isActive ? 'Đang kích hoạt' : 'Không kích hoạt'}
                          </Badge>
                          <Button 
                            variant="link" 
                            className="p-0 ms-2 status-toggle"
                            onClick={() => toggleStatus(coupon)}
                            title={coupon.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {coupon.isActive ? 
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
                            onClick={() => openModal(coupon)}
                          >
                            <FaEdit /> Sửa
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => confirmDelete(coupon._id)}
                          >
                            <FaTrash /> Xóa
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-3">
                      Chưa có mã giảm giá nào
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
              {currentCoupon ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã giảm giá <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.code}
                        placeholder="Mã giảm giá (ví dụ: SUMMER2023)"
                        autoCapitalize="characters"
                        disabled={!!currentCoupon} // Disable editing for existing coupons
                      />
                      {!currentCoupon && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={generateCouponCode}
                          title="Tạo mã ngẫu nhiên"
                        >
                          Tạo mã
                        </Button>
                      )}
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.code}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Mã không thể thay đổi sau khi tạo.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <div>
                      <Form.Check
                        type="switch"
                        id="coupon-active"
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
                  placeholder="Mô tả ngắn về mã giảm giá này"
                />
              </Form.Group>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại giảm giá</Form.Label>
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
                      {formData.discountType === 'percentage' ? 'Áp dụng cho mã giảm theo phần trăm' : 'Không áp dụng cho mã giảm cố định'}
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
                    <Form.Label>Số lượt sử dụng tối đa</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxUsage"
                      value={formData.maxUsage}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.maxUsage}
                      min="0"
                      step="1"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.maxUsage}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Để 0 nếu không giới hạn số lần sử dụng
                    </Form.Text>
                  </Form.Group>
                </Col>
                {currentCoupon && (
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Đã sử dụng</Form.Label>
                      <Form.Control
                        type="number"
                        name="usageCount"
                        value={formData.usageCount}
                        onChange={handleChange}
                        min="0"
                      />
                      <Form.Text className="text-muted">
                        Số lần mã đã được sử dụng
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
              </Row>
              
              <Row>
                <Col md={6}>
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
                <Col md={6}>
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
                {currentCoupon ? 'Cập nhật' : 'Thêm mới'}
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
            Bạn có chắc chắn muốn xóa mã giảm giá này không? Thao tác này không thể hoàn tác.
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

export default CouponList; 