import React, { useState } from 'react';
import { Table, Button, Spinner, Alert, Form, Modal, Row, Col, Badge, Image } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCalendarAlt, FaToggleOn, FaToggleOff, FaLink, FaEye } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation
} from '../../services/api';
import './BannerList.css';

const BannerList = () => {
  // Fetch banners
  const { data: banners, isLoading, error, refetch } = useGetBannersQuery();
  
  // Mutations
  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkTo: '',
    position: 'home_main',
    order: 0,
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  
  // Banner positions
  const positionOptions = [
    { value: 'home_main', label: 'Trang chủ - Chính' },
    { value: 'home_secondary', label: 'Trang chủ - Phụ' },
    { value: 'category_page', label: 'Trang danh mục' },
    { value: 'sidebar', label: 'Thanh bên' },
    { value: 'popup', label: 'Popup' }
  ];
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Không giới hạn';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  
  // Check if banner is active based on dates and isActive flag
  const isBannerActive = (banner) => {
    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;
    
    return banner.isActive && 
           (!startDate || startDate <= now) && 
           (!endDate || endDate >= now);
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              (name === 'order') ? 
              Number(value) : value
    });
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
    
    // Handle image preview
    if (name === 'imageUrl' && value) {
      setPreviewImage(value);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Tiêu đề không được để trống';
    if (!formData.imageUrl.trim()) errors.imageUrl = 'URL hình ảnh không được để trống';
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open modal for create/edit
  const openModal = (banner = null) => {
    if (banner) {
      setCurrentBanner(banner);
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        linkTo: banner.linkTo || '',
        position: banner.position || 'home_main',
        order: banner.order || 0,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
        isActive: banner.isActive !== undefined ? banner.isActive : true
      });
      setPreviewImage(banner.imageUrl);
    } else {
      setCurrentBanner(null);
      setFormData({
        title: '',
        imageUrl: '',
        linkTo: '',
        position: 'home_main',
        order: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
      });
      setPreviewImage(null);
    }
    setShowModal(true);
  };
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (currentBanner) {
        // Update existing banner
        await updateBanner({
          id: currentBanner._id,
          bannerData: formData
        }).unwrap();
      } else {
        // Create new banner
        await createBanner(formData).unwrap();
      }
      
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to save banner:', err);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteBanner(deleteId).unwrap();
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  // Toggle banner active status
  const toggleStatus = async (banner) => {
    try {
      await updateBanner({
        id: banner._id,
        bannerData: { ...banner, isActive: !banner.isActive }
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
    }
  };

  // Preview banner in new tab
  const previewBanner = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };
  
  return (
    <AdminLayout>
      <div className="banner-list">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Quản lý banner</h1>
          <div>
            <Button variant="primary" onClick={() => openModal()}>
              <FaPlus className="me-2" /> Thêm banner
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
              <span>Lỗi khi tải danh sách banner</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách banner...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="banner-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Hình ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Vị trí</th>
                  <th>Thứ tự</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {banners && banners.length > 0 ? (
                  banners.map((banner) => {
                    const isActive = isBannerActive(banner);
                    return (
                      <tr key={banner._id} className={isActive ? "" : "inactive-row"}>
                        <td>
                          <div className="banner-image-preview">
                            <Image 
                              src={banner.imageUrl} 
                              alt={banner.title} 
                              thumbnail 
                              onClick={() => previewBanner(banner.imageUrl)}
                              className="clickable-image"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="banner-title">{banner.title}</div>
                          {banner.linkTo && (
                            <div className="text-muted small">
                              <FaLink className="me-1" /> 
                              <a href={banner.linkTo} target="_blank" rel="noopener noreferrer">
                                {banner.linkTo}
                              </a>
                            </div>
                          )}
                        </td>
                        <td>
                          {positionOptions.find(pos => pos.value === banner.position)?.label || banner.position}
                        </td>
                        <td className="text-center">{banner.order}</td>
                        <td>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Từ: {formatDate(banner.startDate)}</span>
                          </div>
                          <div className="date-range">
                            <FaCalendarAlt className="me-1" />
                            <span>Đến: {banner.endDate ? formatDate(banner.endDate) : 'Không giới hạn'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg={isActive ? 'success' : 'secondary'}>
                            {isActive ? 'Đang hiển thị' : 'Không hiển thị'}
                          </Badge>
                          <Button 
                            variant="link" 
                            className="p-0 ms-2 status-toggle"
                            onClick={() => toggleStatus(banner)}
                            title={banner.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {banner.isActive ? 
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
                            onClick={() => openModal(banner)}
                          >
                            <FaEdit /> Sửa
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => confirmDelete(banner._id)}
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
                      Chưa có banner nào
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
              {currentBanner ? 'Cập nhật banner' : 'Thêm banner mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tiêu đề <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.title}
                      placeholder="Nhập tiêu đề banner"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.title}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL hình ảnh <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.imageUrl}
                      placeholder="Nhập URL hình ảnh (ví dụ: https://example.com/image.jpg)"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.imageUrl}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Nhập URL hình ảnh đã được tải lên máy chủ.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              {previewImage && (
                <Row className="mb-3">
                  <Col md={12}>
                    <div className="image-preview-container">
                      <p>Xem trước hình ảnh:</p>
                      <Image src={previewImage} alt="Banner preview" fluid className="image-preview" />
                    </div>
                  </Col>
                </Row>
              )}
              
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Liên kết</Form.Label>
                    <Form.Control
                      type="text"
                      name="linkTo"
                      value={formData.linkTo}
                      onChange={handleChange}
                      placeholder="Nhập URL đích khi nhấp vào banner (ví dụ: /category/sua)"
                    />
                    <Form.Text className="text-muted">
                      URL đích khi người dùng nhấp vào banner.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <div>
                      <Form.Check
                        type="switch"
                        id="banner-active"
                        name="isActive"
                        label={formData.isActive ? "Đang hiển thị" : "Không hiển thị"}
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vị trí hiển thị</Form.Label>
                    <Form.Select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                    >
                      {positionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Thứ tự hiển thị</Form.Label>
                    <Form.Control
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleChange}
                      min="0"
                      step="1"
                    />
                    <Form.Text className="text-muted">
                      Số nhỏ hơn sẽ hiển thị trước.
                    </Form.Text>
                  </Form.Group>
                </Col>
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
                {currentBanner ? 'Cập nhật' : 'Thêm mới'}
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
            Bạn có chắc chắn muốn xóa banner này không? Thao tác này không thể hoàn tác.
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

export default BannerList; 