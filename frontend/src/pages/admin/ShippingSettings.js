import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert, Tab, Nav, Table, Badge, InputGroup } from 'react-bootstrap';
import { FaSave, FaTruck, FaGlobeAmericas, FaMoneyBillWave, FaCog, FaToggleOn, FaToggleOff, FaPlus, FaTrash, FaEdit, FaBox, FaInfoCircle } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import './ShippingSettings.css';

// Mock API hooks - replace with real API hooks when available
const useGetShippingSettingsQuery = () => {
  // Simulate API call with mock data
  return {
    data: {
      shippingMethods: [
        {
          id: 1,
          name: 'Standard Shipping',
          active: true,
          processingTime: '1-3',
          flatRate: 30000,
          freeShippingThreshold: 300000
        },
        {
          id: 2,
          name: 'Express Shipping',
          active: true,
          processingTime: '1',
          flatRate: 50000,
          freeShippingThreshold: 500000
        },
        {
          id: 3, 
          name: 'Store Pickup',
          active: false,
          processingTime: '0',
          flatRate: 0,
          freeShippingThreshold: 0
        }
      ],
      shippingZones: [
        {
          id: 1,
          name: 'Hà Nội',
          regions: ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Đống Đa'],
          methods: [
            { methodId: 1, rate: 25000 },
            { methodId: 2, rate: 45000 }
          ]
        },
        {
          id: 2,
          name: 'TP Hồ Chí Minh',
          regions: ['Quận 1', 'Quận 2', 'Quận 3'],
          methods: [
            { methodId: 1, rate: 30000 },
            { methodId: 2, rate: 50000 }
          ]
        },
        {
          id: 3,
          name: 'Các tỉnh khác',
          regions: ['Tỉnh khác'],
          methods: [
            { methodId: 1, rate: 35000 },
            { methodId: 2, rate: 55000 }
          ]
        }
      ],
      packagingOptions: [
        { id: 1, name: 'Túi giấy thường', cost: 5000, active: true },
        { id: 2, name: 'Hộp carton nhỏ', cost: 10000, active: true },
        { id: 3, name: 'Hộp carton lớn', cost: 15000, active: true },
        { id: 4, name: 'Gói quà tặng', cost: 25000, active: true }
      ],
      generalSettings: {
        calculateTax: true,
        shippingAddress: true,
        billingAddress: true,
        storeAddress: 'Số 123, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh',
        enableGlobalFreeShipping: true,
        globalFreeShippingThreshold: 500000,
        storeLocation: {
          lat: 10.7769,
          lng: 106.7009
        }
      }
    },
    isLoading: false,
    error: null,
    refetch: () => console.log('Refetching shipping settings...')
  };
};

const useUpdateShippingSettingsMutation = () => {
  // Simulate API call
  return [
    (data) => {
      console.log('Updating shipping settings with data:', data);
      return {
        unwrap: () => new Promise((resolve) => {
          setTimeout(() => resolve({ success: true }), 500);
        })
      };
    },
    { 
      isLoading: false, 
      isSuccess: true, 
      error: null 
    }
  ];
};

const ShippingSettings = () => {
  // Fetch settings
  const { data: settings, isLoading, error, refetch } = useGetShippingSettingsQuery();
  
  // Mutation
  const [updateSettings, { isLoading: isUpdating, isSuccess, error: updateError }] = useUpdateShippingSettingsMutation();
  
  // State
  const [formData, setFormData] = useState({
    shippingMethods: [],
    shippingZones: [],
    packagingOptions: [],
    generalSettings: {
      calculateTax: true,
      shippingAddress: true,
      billingAddress: true,
      storeAddress: '',
      enableGlobalFreeShipping: false,
      globalFreeShippingThreshold: 0,
      storeLocation: {
        lat: 0,
        lng: 0
      }
    }
  });
  
  const [activeTab, setActiveTab] = useState('methods');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [editingPackaging, setEditingPackaging] = useState(null);
  
  // Load settings data into form when available
  useEffect(() => {
    if (settings) {
      // For backward compatibility, handle both direct settings and data property
      const settingsData = settings.data || settings;
      
      setFormData({
        shippingMethods: settingsData.shippingMethods || [],
        shippingZones: settingsData.shippingZones || [],
        packagingOptions: settingsData.packagingOptions || [],
        generalSettings: {
          calculateTax: settingsData.generalSettings?.calculateTax ?? true,
          shippingAddress: settingsData.generalSettings?.shippingAddress ?? true,
          billingAddress: settingsData.generalSettings?.billingAddress ?? true,
          storeAddress: settingsData.generalSettings?.storeAddress || '',
          enableGlobalFreeShipping: settingsData.generalSettings?.enableGlobalFreeShipping ?? false,
          globalFreeShippingThreshold: settingsData.generalSettings?.globalFreeShippingThreshold || 0,
          storeLocation: settingsData.generalSettings?.storeLocation || {
            lat: 0,
            lng: 0
          }
        }
      });
    }
  }, [settings]);
  
  // Handle success alert
  useEffect(() => {
    if (isSuccess) {
      setShowSuccessAlert(true);
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      
      if (parts.length === 2) {
        // Handle simple nested objects like generalSettings.calculateTax
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        // Handle deeper nested objects
        const [parent, middle, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [middle]: {
              ...prev[parent][middle],
              [child]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle shipping method toggle
  const handleMethodToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === id ? { ...method, active: !method.active } : method
      )
    }));
  };

  // Handle packaging option toggle
  const handlePackagingToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      packagingOptions: prev.packagingOptions.map(option => 
        option.id === id ? { ...option, active: !option.active } : option
      )
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateSettings(formData).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to update shipping settings:', err);
    }
  };

  // Handle adding new shipping method
  const handleAddMethod = () => {
    setEditingMethod({
      id: Date.now(), // Temporary ID
      name: '',
      active: true,
      processingTime: '',
      flatRate: 0,
      freeShippingThreshold: 0
    });
  };

  // Handle editing shipping method
  const handleEditMethod = (method) => {
    setEditingMethod({...method});
  };

  // Handle saving shipping method
  const handleSaveMethod = () => {
    if (editingMethod) {
      setFormData(prev => {
        const existingIndex = prev.shippingMethods.findIndex(m => m.id === editingMethod.id);
        
        if (existingIndex >= 0) {
          // Update existing method
          const updatedMethods = [...prev.shippingMethods];
          updatedMethods[existingIndex] = editingMethod;
          return { ...prev, shippingMethods: updatedMethods };
        } else {
          // Add new method
          return { ...prev, shippingMethods: [...prev.shippingMethods, editingMethod] };
        }
      });
      
      setEditingMethod(null);
    }
  };

  // Handle canceling method edit
  const handleCancelMethodEdit = () => {
    setEditingMethod(null);
  };

  // Handle deleting method
  const handleDeleteMethod = (id) => {
    setFormData(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.filter(method => method.id !== id)
    }));
  };

  // Handle method edit form changes
  const handleMethodFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setEditingMethod(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };
  
  return (
    <AdminLayout>
      <div className="shipping-settings-page">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Cài đặt vận chuyển</h1>
        </div>
        
        {showSuccessAlert && (
          <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
            Cài đặt vận chuyển đã được cập nhật thành công!
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải cài đặt vận chuyển</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {updateError && (
          <Alert variant="danger">
            Lỗi khi cập nhật cài đặt vận chuyển. Vui lòng thử lại.
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải cài đặt vận chuyển...</p>
          </div>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column settings-nav">
                  <Nav.Item>
                    <Nav.Link eventKey="methods">
                      <FaTruck className="me-2" /> Phương thức vận chuyển
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="zones">
                      <FaGlobeAmericas className="me-2" /> Vùng vận chuyển
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="packaging">
                      <FaBox className="me-2" /> Đóng gói
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="general">
                      <FaCog className="me-2" /> Cài đặt chung
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col md={9}>
                <Card>
                  <Card.Body>
                    <Form onSubmit={handleSubmit}>
                      <Tab.Content>
                        {/* Shipping Methods Tab */}
                        <Tab.Pane eventKey="methods">
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="mb-0">Phương thức vận chuyển</h4>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={handleAddMethod}
                            >
                              <FaPlus className="me-1" /> Thêm phương thức
                            </Button>
                          </div>
                          
                          {formData.generalSettings.enableGlobalFreeShipping && (
                            <Alert variant="info" className="mb-4">
                              <div className="d-flex align-items-center">
                                <FaInfoCircle className="me-2" />
                                <div>
                                  <strong>Miễn phí vận chuyển toàn cửa hàng đang được bật</strong>
                                  <p className="mb-0">
                                    Đơn hàng từ {formData.generalSettings.globalFreeShippingThreshold.toLocaleString('en-GB')}£ sẽ được miễn phí vận chuyển cho tất cả phương thức. 
                                    Cài đặt này sẽ ghi đè lên ngưỡng miễn phí của từng phương thức.
                                  </p>
                                </div>
                              </div>
                            </Alert>
                          )}
                          
                          {editingMethod && (
                            <Card className="mb-4 editing-card">
                              <Card.Header>
                                {editingMethod.id && formData.shippingMethods.some(m => m.id === editingMethod.id) 
                                  ? "Chỉnh sửa phương thức vận chuyển" 
                                  : "Thêm phương thức vận chuyển"}
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Tên phương thức</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="name"
                                        value={editingMethod.name}
                                        onChange={handleMethodFormChange}
                                        placeholder="VD: Giao hàng tiêu chuẩn"
                                        required
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Thời gian xử lý (ngày)</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="processingTime"
                                        value={editingMethod.processingTime}
                                        onChange={handleMethodFormChange}
                                        placeholder="VD: 1-3"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Giá cước mặc định (GBP)</Form.Label>
                                      <Form.Control
                                        type="number"
                                        name="flatRate"
                                        value={editingMethod.flatRate}
                                        onChange={handleMethodFormChange}
                                        min="0"
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Ngưỡng miễn phí vận chuyển (GBP)</Form.Label>
                                      <Form.Control
                                        type="number"
                                        name="freeShippingThreshold"
                                        value={editingMethod.freeShippingThreshold}
                                        onChange={handleMethodFormChange}
                                        min="0"
                                      />
                                      <Form.Text className="text-muted">
                                        Đặt 0 nếu không áp dụng miễn phí vận chuyển
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                </Row>
                                <Row>
                                  <Col>
                                    <Form.Group className="mb-3">
                                      <Form.Check
                                        type="checkbox"
                                        name="active"
                                        checked={editingMethod.active}
                                        onChange={handleMethodFormChange}
                                        label="Kích hoạt phương thức này"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                                <div className="d-flex justify-content-end">
                                  <Button 
                                    variant="light" 
                                    className="me-2" 
                                    onClick={handleCancelMethodEdit}
                                  >
                                    Hủy
                                  </Button>
                                  <Button 
                                    variant="primary" 
                                    onClick={handleSaveMethod}
                                  >
                                    Lưu phương thức
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          )}
                          
                          <Table className="shipping-methods-table">
                            <thead>
                              <tr>
                                <th>Phương thức</th>
                                <th>Giá cước</th>
                                <th>Miễn phí từ</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.shippingMethods.map(method => (
                                <tr key={method.id}>
                                  <td>
                                    <div>
                                      <h5 className="mb-0">{method.name}</h5>
                                      <small className="text-muted">
                                        {method.processingTime ? `Xử lý trong ${method.processingTime} ngày` : 'Nhận ngay'}
                                      </small>
                                    </div>
                                  </td>
                                  <td>£{method.flatRate.toLocaleString('en-GB')}</td>
                                  <td>
                                    {method.freeShippingThreshold > 0 
                                      ? `£${method.freeShippingThreshold.toLocaleString('en-GB')}` 
                                      : '—'}
                                  </td>
                                  <td>
                                    <Badge 
                                      bg={method.active ? 'success' : 'secondary'}
                                      className="status-badge"
                                      onClick={() => handleMethodToggle(method.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {method.active ? 'Đang bật' : 'Đang tắt'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="action-btn me-1"
                                      onClick={() => handleEditMethod(method)}
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      className="action-btn"
                                      onClick={() => handleDeleteMethod(method.id)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                              {formData.shippingMethods.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="text-center py-4">
                                    <p className="mb-0">Chưa có phương thức vận chuyển nào.</p>
                                    <Button 
                                      variant="link"
                                      onClick={handleAddMethod}
                                    >
                                      Thêm phương thức vận chuyển
                                    </Button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </Tab.Pane>
                        
                        {/* Shipping Zones Tab */}
                        <Tab.Pane eventKey="zones">
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="mb-0">Vùng vận chuyển</h4>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                            >
                              <FaPlus className="me-1" /> Thêm vùng
                            </Button>
                          </div>
                          
                          {formData.shippingZones.map(zone => (
                            <Card key={zone.id} className="mb-4 zone-card">
                              <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{zone.name}</h5>
                                <div>
                                  <Button variant="outline-primary" size="sm" className="me-2">
                                    <FaEdit className="me-1" /> Chỉnh sửa
                                  </Button>
                                  <Button variant="outline-danger" size="sm">
                                    <FaTrash className="me-1" /> Xóa
                                  </Button>
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <div className="mb-3">
                                  <strong>Khu vực:</strong> {zone.regions.join(', ')}
                                </div>
                                
                                <Table className="zone-rates-table">
                                  <thead>
                                    <tr>
                                      <th>Phương thức vận chuyển</th>
                                      <th>Giá cước</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {zone.methods.map(zoneMethod => {
                                      const method = formData.shippingMethods.find(m => m.id === zoneMethod.methodId);
                                      return (
                                        <tr key={zoneMethod.methodId}>
                                          <td>{method ? method.name : `Phương thức #${zoneMethod.methodId}`}</td>
                                          <td>
                                            <InputGroup size="sm">
                                              <Form.Control
                                                type="number"
                                                value={zoneMethod.rate}
                                                min="0"
                                                readOnly
                                              />
                                              <InputGroup.Text>£</InputGroup.Text>
                                            </InputGroup>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </Table>
                              </Card.Body>
                            </Card>
                          ))}
                          
                          {formData.shippingZones.length === 0 && (
                            <div className="text-center p-4 bg-light rounded">
                              <p>Chưa có vùng vận chuyển nào được cấu hình.</p>
                              <Button variant="primary">
                                <FaPlus className="me-1" /> Thêm vùng vận chuyển đầu tiên
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>
                        
                        {/* Packaging Tab */}
                        <Tab.Pane eventKey="packaging">
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="mb-0">Tùy chọn đóng gói</h4>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                            >
                              <FaPlus className="me-1" /> Thêm tùy chọn
                            </Button>
                          </div>
                          
                          <Table className="packaging-table">
                            <thead>
                              <tr>
                                <th>Kiểu đóng gói</th>
                                <th>Chi phí</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.packagingOptions.map(option => (
                                <tr key={option.id}>
                                  <td>{option.name}</td>
                                  <td>£{option.cost.toLocaleString('en-GB')}</td>
                                  <td>
                                    <Badge 
                                      bg={option.active ? 'success' : 'secondary'}
                                      className="status-badge"
                                      onClick={() => handlePackagingToggle(option.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {option.active ? 'Đang bật' : 'Đang tắt'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="action-btn me-1"
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      className="action-btn"
                                    >
                                      <FaTrash />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Tab.Pane>
                        
                        {/* General Settings Tab */}
                        <Tab.Pane eventKey="general">
                          <h4 className="mb-4">Cài đặt chung về vận chuyển</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Địa chỉ cửa hàng</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="generalSettings.storeAddress"
                              value={formData.generalSettings.storeAddress}
                              onChange={handleChange}
                              placeholder="Nhập địa chỉ cửa hàng của bạn"
                            />
                            <Form.Text className="text-muted">
                              Địa chỉ này sẽ được sử dụng làm điểm xuất phát để tính phí vận chuyển
                            </Form.Text>
                          </Form.Group>
                          
                          <Card className="mb-4 free-shipping-card">
                            <Card.Header>
                              <h5 className="mb-0">Miễn phí vận chuyển toàn cửa hàng</h5>
                            </Card.Header>
                            <Card.Body>
                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  id="global-free-shipping"
                                  name="generalSettings.enableGlobalFreeShipping"
                                  checked={formData.generalSettings.enableGlobalFreeShipping}
                                  onChange={handleChange}
                                  label="Bật miễn phí vận chuyển cho tất cả đơn hàng đủ điều kiện"
                                />
                              </Form.Group>
                              
                              <Form.Group>
                                <Form.Label>Miễn phí vận chuyển cho đơn hàng từ (VNĐ)</Form.Label>
                                <InputGroup>
                                  <Form.Control
                                    type="number"
                                    name="generalSettings.globalFreeShippingThreshold"
                                    value={formData.generalSettings.globalFreeShippingThreshold}
                                    onChange={handleChange}
                                    min="0"
                                    disabled={!formData.generalSettings.enableGlobalFreeShipping}
                                  />
                                              <InputGroup.Text>£</InputGroup.Text>
                                </InputGroup>
                                <Form.Text className="text-muted">
                                  Tất cả đơn hàng có giá trị lớn hơn hoặc bằng mức này sẽ được miễn phí vận chuyển
                                </Form.Text>
                              </Form.Group>
                            </Card.Body>
                          </Card>
                          
                          <Row className="mb-4">
                            <Col>
                              <Form.Check
                                type="checkbox"
                                id="calculate-tax"
                                name="generalSettings.calculateTax"
                                checked={formData.generalSettings.calculateTax}
                                onChange={handleChange}
                                label="Tính thuế dựa trên địa chỉ giao hàng"
                              />
                            </Col>
                          </Row>
                          
                          <Row>
                            <Col md={6}>
                              <Form.Check
                                type="checkbox"
                                id="shipping-address"
                                name="generalSettings.shippingAddress"
                                checked={formData.generalSettings.shippingAddress}
                                onChange={handleChange}
                                label="Yêu cầu địa chỉ giao hàng"
                              />
                            </Col>
                            <Col md={6}>
                              <Form.Check
                                type="checkbox"
                                id="billing-address"
                                name="generalSettings.billingAddress"
                                checked={formData.generalSettings.billingAddress}
                                onChange={handleChange}
                                label="Yêu cầu địa chỉ thanh toán"
                              />
                            </Col>
                          </Row>
                        </Tab.Pane>
                      </Tab.Content>
                      
                      <div className="mt-4 d-flex justify-content-end">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          disabled={isUpdating}
                          className="save-button"
                        >
                          {isUpdating && (
                            <Spinner 
                              as="span" 
                              animation="border" 
                              size="sm" 
                              className="me-2"
                            />
                          )}
                          <FaSave className="me-2" /> Lưu cài đặt
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Container>
        )}
      </div>
    </AdminLayout>
  );
};

export default ShippingSettings; 