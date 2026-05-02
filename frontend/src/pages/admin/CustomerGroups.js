import React, { useState } from 'react';
import { Table, Button, Spinner, Alert, Form, Modal, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  useGetCustomerGroupsQuery,
  useCreateCustomerGroupMutation,
  useUpdateCustomerGroupMutation,
  useDeleteCustomerGroupMutation
} from '../../services/api';
import './CustomerGroups.css';

const CustomerGroups = () => {
  // Fetch customer groups
  const { data: groups, isLoading, error, refetch } = useGetCustomerGroupsQuery();
  
  // Mutations
  const [createGroup, { isLoading: isCreating }] = useCreateCustomerGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateCustomerGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteCustomerGroupMutation();
  
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 0,
    minimumOrder: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'discountPercentage' || name === 'minimumOrder' ? Number(value) : value
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
    if (!formData.name.trim()) errors.name = 'Tên nhóm không được để trống';
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      errors.discountPercentage = 'Phần trăm giảm giá phải từ 0 đến 100';
    }
    if (formData.minimumOrder < 0) {
      errors.minimumOrder = 'Giá trị đơn hàng tối thiểu không được âm';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open modal for create/edit
  const openModal = (group = null) => {
    if (group) {
      setCurrentGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        discountPercentage: group.discountPercentage || 0,
        minimumOrder: group.minimumOrder || 0
      });
    } else {
      setCurrentGroup(null);
      setFormData({
        name: '',
        description: '',
        discountPercentage: 0,
        minimumOrder: 0
      });
    }
    setShowModal(true);
  };
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (currentGroup) {
        // Update existing group
        await updateGroup({
          id: currentGroup._id,
          groupData: formData
        }).unwrap();
      } else {
        // Create new group
        await createGroup(formData).unwrap();
      }
      
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to save customer group:', err);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteGroup(deleteId).unwrap();
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      console.error('Failed to delete customer group:', err);
    }
  };
  
  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  return (
    <AdminLayout>
      <div className="customer-groups">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Quản lý nhóm khách hàng</h1>
          <div>
            <Button variant="primary" onClick={() => openModal()}>
              <FaPlus className="me-2" /> Thêm nhóm mới
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
              <span>Lỗi khi tải danh sách nhóm khách hàng</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                <FaSync /> Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách nhóm khách hàng...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="customer-group-table">
              <thead>
                <tr>
                  <th>Tên nhóm</th>
                  <th>Mô tả</th>
                  <th>Giảm giá (%)</th>
                  <th>Giá trị đơn hàng tối thiểu</th>
                  <th>Số lượng thành viên</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups && groups.length > 0 ? (
                  groups.map((group) => (
                    <tr key={group._id}>
                      <td>{group.name}</td>
                      <td>{group.description}</td>
                      <td>{group.discountPercentage}%</td>
                      <td>{formatCurrency(group.minimumOrder)}</td>
                      <td>{group.memberCount || 0}</td>
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => openModal(group)}
                        >
                          <FaEdit /> Sửa
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => confirmDelete(group._id)}
                        >
                          <FaTrash /> Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-3">
                      Chưa có nhóm khách hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
        
        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>
              {currentGroup ? 'Cập nhật nhóm khách hàng' : 'Thêm nhóm khách hàng mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Tên nhóm <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.name}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phần trăm giảm giá (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.discountPercentage}
                      min="0"
                      max="100"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.discountPercentage}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giá trị đơn hàng tối thiểu (VNĐ)</Form.Label>
                    <Form.Control
                      type="number"
                      name="minimumOrder"
                      value={formData.minimumOrder}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.minimumOrder}
                      min="0"
                      step="1000"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.minimumOrder}
                    </Form.Control.Feedback>
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
                {currentGroup ? 'Cập nhật' : 'Thêm mới'}
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
            Bạn có chắc chắn muốn xóa nhóm khách hàng này không? Thao tác này không thể hoàn tác.
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

export default CustomerGroups; 