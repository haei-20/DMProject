import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Nav } from 'react-bootstrap';
import { useCreateProductMutation, useUpdateProductMutation } from '../../services/api';
import './ProductForm.css';

const ProductForm = ({ product, onSuccess, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    featured: false,
    discount: '',
    image: '',
    status: 'active'
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [validated, setValidated] = useState(false);
  const [imageInputType, setImageInputType] = useState('file'); // 'file' hoặc 'url'
  
  // Get API hooks
  const [createProduct, { isLoading: isCreating, isSuccess: isCreateSuccess }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating, isSuccess: isUpdateSuccess }] = useUpdateProductMutation();
  
  // Mock categories since the API endpoint is not available
  const categories = [
    { _id: 'milk', name: 'Sữa các loại' },
    { _id: 'produce', name: 'Rau - Củ - Trái Cây' },
    { _id: 'cleaning', name: 'Hóa Phẩm - Tẩy rửa' },
    { _id: 'personal-care', name: 'Chăm Sóc Cá Nhân' },
    { _id: 'office-toys', name: 'Văn phòng phẩm - Đồ chơi' },
    { _id: 'candy', name: 'Bánh Kẹo' },
    { _id: 'beverages', name: 'Đồ uống - Giải khát' },
    { _id: 'instant-food', name: 'Mì - Thực Phẩm Ăn Liền' }
  ];
  
  // Set initial form data if editing
  useEffect(() => {
    if (product && mode === 'edit') {
      const productData = { ...product };
      // Convert numeric values to string for form inputs
      productData.price = productData.price?.toString() || '';
      productData.stock = productData.stock?.toString() || '';
      productData.discount = productData.discount?.toString() || '';
      
      setFormData(productData);
      setImagePreview(product.image);
      
      // Nếu đã có URL ảnh, chuyển sang chế độ nhập URL
      if (product.image && product.image.startsWith('http')) {
        setImageInputType('url');
      }
    } else {
      // Reset form khi ở chế độ tạo mới
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        featured: false,
        discount: '',
        image: '',
        status: 'active'
      });
    }
  }, [product, mode]);
  
  // Handle success response
  useEffect(() => {
    if (isCreateSuccess || isUpdateSuccess) {
      resetForm();
      if (onSuccess) onSuccess();
    }
  }, [isCreateSuccess, isUpdateSuccess, onSuccess]);
  
  const resetForm = () => {
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        featured: false,
        discount: '',
        image: '',
        status: 'active'
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setValidated(false);
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.price) newErrors.price = 'Product price is required';
    else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formData.stock) newErrors.stock = 'Stock quantity is required';
    else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a non-negative number';
    }
    
    if (formData.discount) {
      if (isNaN(formData.discount) || Number(formData.discount) < 0 || Number(formData.discount) > 100) {
        newErrors.discount = 'Discount must be between 0 and 100';
      }
    }
    
    if (mode === 'create' && !imageFile && !formData.image) {
      newErrors.image = 'Product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({
        ...formData,
        image: 'pending_upload' // This will be replaced with actual URL after upload
      });
    }
  };

  // Xử lý khi nhập URL ảnh trực tiếp
  const handleImageUrlChange = (e) => {
    const imageUrl = e.target.value;
    setFormData({
      ...formData,
      image: imageUrl
    });
    setImagePreview(imageUrl);
  };
  
  // Xác nhận URL ảnh hợp lệ
  const validateImageUrl = () => {
    if (formData.image) {
      setImagePreview(formData.image);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setValidated(true);
      return;
    }
    
    try {
      // Upload ảnh nếu có
      let imageUrl = formData.image;
      
      // Chỉ upload file khi người dùng chọn chế độ tải file
      if (imageInputType === 'file' && imageFile) {
        console.log("Uploading image to Cloudinary...");
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
          // Lấy token từ localStorage (tùy thuộc vào cách bạn lưu token)
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!uploadResponse.ok) {
            console.error("Upload failed with status:", uploadResponse.status);
            // Sử dụng ảnh mặc định nếu upload thất bại
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log("Image upload result:", uploadResult);
          
          if (uploadResult.success) {
            imageUrl = uploadResult.imageUrl;
            console.log("Image uploaded successfully:", imageUrl);
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          // Tiếp tục với ảnh mặc định thay vì dừng luồng
        }
      }
      
      // Chuẩn bị dữ liệu sản phẩm
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        stock: Number(formData.stock),
        featured: formData.featured,
        discount: formData.discount ? Number(formData.discount) : 0,
        image: imageUrl,
        status: formData.status
      };
      
      console.log("Sending product data:", productData);
      
      let result;
      if (mode === 'edit') {
        result = await updateProduct({ 
          id: product._id, 
          productData 
        }).unwrap();
      } else {
        result = await createProduct(productData).unwrap();
      }
      
      console.log("Product saved successfully:", result);
      
      // Reset form if creating product
      if (mode === 'create') {
        resetForm();
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Failed to save product:', error);
      setErrors({ submit: error.data?.message || 'Failed to save product' });
    }
  };
  
  return (
    <div className="product-form-wrapper">
      {errors.submit && <Alert variant="danger">{errors.submit}</Alert>}
      
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name*</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    isInvalid={!!errors.price}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.price}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    isInvalid={!!errors.discount}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.discount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category*</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    isInvalid={!!errors.category}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.category}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
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
                  <Form.Label>Stock*</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    isInvalid={!!errors.stock}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.stock}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Row>
                <Col xs={6}>
                  <Form.Check
                    type="checkbox"
                    id="featuredCheck"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    label="Featured Product"
                  />
                </Col>
              </Row>
            </Form.Group>
          </Col>
          
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Product Image*</Form.Label>
              
              {/* Thêm tab để chọn giữa tải ảnh và nhập URL */}
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link 
                    active={imageInputType === 'file'} 
                    onClick={() => setImageInputType('file')}
                  >
                    Upload File
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={imageInputType === 'url'} 
                    onClick={() => setImageInputType('url')}
                  >
                    Image URL
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="img-fluid mb-2"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setFormData({
                          ...formData,
                          image: ''
                        });
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : imageInputType === 'file' ? (
                  <div className="image-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="d-none"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="upload-label">
                      <div className="upload-icon">
                        <i className="bi bi-cloud-arrow-up"></i>
                      </div>
                      <span>Click to upload image</span>
                    </label>
                  </div>
                ) : (
                  <div className="image-url-input">
                    <Form.Control
                      type="text"
                      placeholder="Enter image URL"
                      name="image"
                      value={formData.image || ''}
                      onChange={handleImageUrlChange}
                      className="mb-2"
                    />
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={validateImageUrl}
                    >
                      Preview Image
                    </Button>
                  </div>
                )}
                {errors.image && (
                  <div className="text-danger mt-2 small">
                    {errors.image}
                  </div>
                )}
              </div>
            </Form.Group>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-end mt-4">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              mode === 'edit' ? 'Update Product' : 'Create Product'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProductForm; 