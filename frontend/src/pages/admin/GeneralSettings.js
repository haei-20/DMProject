import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert, Image, Tab, Nav, InputGroup } from 'react-bootstrap';
import { FaSave, FaStore, FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaMoneyBillWave } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetGeneralSettingsQuery, useUpdateGeneralSettingsMutation } from '../../services/api';
import './GeneralSettings.css';

const GeneralSettings = () => {
  // Fetch settings
  const { data: settings, isLoading, error, refetch } = useGetGeneralSettingsQuery();
  
  // Mutation
  const [updateSettings, { isLoading: isUpdating, isSuccess, error: updateError }] = useUpdateGeneralSettingsMutation();
  
  // State
  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    logo: '',
    favicon: '',
    email: '',
    phone: '',
    address: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: ''
    },
    metaTags: {
      title: '',
      description: '',
      keywords: ''
    },
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyPosition: 'after',
    thousandSeparator: '.',
    decimalSeparator: ',',
    numberOfDecimals: 0
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  
  // Load settings data into form when available
  useEffect(() => {
    if (settings) {
      // For backward compatibility, handle both direct settings and data property
      const settingsData = settings.data || settings;
      
      setFormData({
        siteName: settingsData.siteName || '',
        siteDescription: settingsData.siteDescription || '',
        logo: settingsData.logo || '',
        favicon: settingsData.favicon || '',
        email: settingsData.email || '',
        phone: settingsData.phone || '',
        address: settingsData.address || '',
        socialLinks: {
          facebook: settingsData.socialLinks?.facebook || '',
          twitter: settingsData.socialLinks?.twitter || '',
          instagram: settingsData.socialLinks?.instagram || ''
        },
        metaTags: {
          title: settingsData.metaTags?.title || '',
          description: settingsData.metaTags?.description || '',
          keywords: settingsData.metaTags?.keywords || ''
        },
        currencyCode: settingsData.currencyCode || 'GBP',
        currencySymbol: settingsData.currencySymbol || '£',
        currencyPosition: settingsData.currencyPosition || 'after',
        thousandSeparator: settingsData.thousandSeparator || '.',
        decimalSeparator: settingsData.decimalSeparator || ',',
        numberOfDecimals: settingsData.numberOfDecimals !== undefined ? settingsData.numberOfDecimals : 0
      });
      
      setLogoPreview(settingsData.logo || null);
      setFaviconPreview(settingsData.favicon || null);
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
    const { name, value } = e.target;
    
    // Handle nested fields (socialLinks, metaTags)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Update previews for image fields
    if (name === 'logo') {
      setLogoPreview(value);
    } else if (name === 'favicon') {
      setFaviconPreview(value);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateSettings(formData).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };
  
  return (
    <AdminLayout>
      <div className="general-settings-page">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Cài đặt chung</h1>
        </div>
        
        {showSuccessAlert && (
          <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
            Cài đặt đã được cập nhật thành công!
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải cài đặt</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {updateError && (
          <Alert variant="danger">
            Lỗi khi cập nhật cài đặt. Vui lòng thử lại.
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải cài đặt...</p>
          </div>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column settings-nav">
                  <Nav.Item>
                    <Nav.Link eventKey="general">
                      <FaStore className="me-2" /> Thông tin chung
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="contact">
                      <FaEnvelope className="me-2" /> Thông tin liên hệ
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="social">
                      <FaGlobe className="me-2" /> Mạng xã hội
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="seo">
                      <FaGlobe className="me-2" /> SEO
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="currency">
                      <FaMoneyBillWave className="me-2" /> Tiền tệ
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col md={9}>
                <Card>
                  <Card.Body>
                    <Form onSubmit={handleSubmit}>
                      <Tab.Content>
                        {/* General Settings Tab */}
                        <Tab.Pane eventKey="general">
                          <h4 className="mb-4">Thông tin chung</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Tên cửa hàng</Form.Label>
                            <Form.Control
                              type="text"
                              name="siteName"
                              value={formData.siteName}
                              onChange={handleChange}
                              placeholder="2NADH"
                              required
                            />
                            <Form.Text className="text-muted">
                              Tên cửa hàng của bạn hiển thị trên website và email
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="siteDescription"
                              value={formData.siteDescription}
                              onChange={handleChange}
                              placeholder="Mô tả ngắn về cửa hàng của bạn"
                            />
                          </Form.Group>
                          
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label>Logo</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="logo"
                                  value={formData.logo}
                                  onChange={handleChange}
                                  placeholder="URL của logo (ví dụ: https://example.com/logo.png)"
                                />
                                <Form.Text className="text-muted">
                                  Nhập URL của logo từ máy chủ của bạn
                                </Form.Text>
                                
                                {logoPreview && (
                                  <div className="image-preview mt-3">
                                    <Image src={logoPreview} alt="Logo preview" height="50" />
                                  </div>
                                )}
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label>Favicon</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="favicon"
                                  value={formData.favicon}
                                  onChange={handleChange}
                                  placeholder="URL của favicon (ví dụ: https://example.com/favicon.ico)"
                                />
                                <Form.Text className="text-muted">
                                  Favicon hiển thị trên tab trình duyệt
                                </Form.Text>
                                
                                {faviconPreview && (
                                  <div className="image-preview mt-3">
                                    <Image src={faviconPreview} alt="Favicon preview" height="32" width="32" />
                                  </div>
                                )}
                              </Form.Group>
                            </Col>
                          </Row>
                        </Tab.Pane>
                        
                        {/* Contact Information Tab */}
                        <Tab.Pane eventKey="contact">
                          <h4 className="mb-4">Thông tin liên hệ</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Email</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                              <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contact@2NADH.com"
                              />
                            </InputGroup>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Số điện thoại</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaPhone /></InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(+84) 28 1234 5678"
                              />
                            </InputGroup>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Địa chỉ</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaMapMarkerAlt /></InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Tab.Pane>
                        
                        {/* Social Media Tab */}
                        <Tab.Pane eventKey="social">
                          <h4 className="mb-4">Mạng xã hội</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Facebook</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaFacebook /></InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="socialLinks.facebook"
                                value={formData.socialLinks.facebook}
                                onChange={handleChange}
                                placeholder="https://facebook.com/2NADH"
                              />
                            </InputGroup>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Twitter</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaTwitter /></InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="socialLinks.twitter"
                                value={formData.socialLinks.twitter}
                                onChange={handleChange}
                                placeholder="https://twitter.com/2NADH"
                              />
                            </InputGroup>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Instagram</Form.Label>
                            <InputGroup>
                              <InputGroup.Text><FaInstagram /></InputGroup.Text>
                              <Form.Control
                                type="text"
                                name="socialLinks.instagram"
                                value={formData.socialLinks.instagram}
                                onChange={handleChange}
                                placeholder="https://instagram.com/2NADH"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Tab.Pane>
                        
                        {/* SEO Settings Tab */}
                        <Tab.Pane eventKey="seo">
                          <h4 className="mb-4">SEO</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Meta Title</Form.Label>
                            <Form.Control
                              type="text"
                              name="metaTags.title"
                              value={formData.metaTags.title}
                              onChange={handleChange}
                              placeholder="2NADH - Premium Sữa Store"
                            />
                            <Form.Text className="text-muted">
                              Tiêu đề hiển thị trên kết quả tìm kiếm và tab trình duyệt
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Meta Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="metaTags.description"
                              value={formData.metaTags.description}
                              onChange={handleChange}
                              placeholder="Shop the latest Sữa, gadgets, and tech accessories"
                            />
                            <Form.Text className="text-muted">
                              Mô tả hiển thị dưới tiêu đề trong kết quả tìm kiếm
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Meta Keywords</Form.Label>
                            <Form.Control
                              type="text"
                              name="metaTags.keywords"
                              value={formData.metaTags.keywords}
                              onChange={handleChange}
                              placeholder="Sữa, gadgets, smartphones, laptops, Vietnam"
                            />
                            <Form.Text className="text-muted">
                              Các từ khóa ngăn cách bởi dấu phẩy
                            </Form.Text>
                          </Form.Group>
                        </Tab.Pane>
                        
                        {/* Currency Settings Tab */}
                        <Tab.Pane eventKey="currency">
                          <h4 className="mb-4">Cài đặt tiền tệ</h4>
                          
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label>Mã tiền tệ</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="currencyCode"
                                  value={formData.currencyCode}
                                  onChange={handleChange}
                                  placeholder="GBP"
                                />
                                <Form.Text className="text-muted">
                                  Mã tiền tệ chuẩn (GBP, USD, v.v.)
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label>Ký hiệu tiền tệ</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="currencySymbol"
                                  value={formData.currencySymbol}
                                  onChange={handleChange}
                                  placeholder="£"
                                />
                                <Form.Text className="text-muted">
                                  Ký hiệu tiền tệ (£, $, v.v.)
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Vị trí ký hiệu tiền tệ</Form.Label>
                            <Form.Select
                              name="currencyPosition"
                              value={formData.currencyPosition}
                              onChange={handleChange}
                            >
                              <option value="before">Trước số tiền ($100)</option>
                              <option value="after">Sau số tiền (100£)</option>
                            </Form.Select>
                          </Form.Group>
                          
                          <Row>
                            <Col md={4}>
                              <Form.Group className="mb-4">
                                <Form.Label>Dấu phân cách hàng nghìn</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="thousandSeparator"
                                  value={formData.thousandSeparator}
                                  onChange={handleChange}
                                  maxLength={1}
                                />
                                <Form.Text className="text-muted">
                                  Ví dụ: "." trong 1.000.000
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-4">
                                <Form.Label>Dấu phân cách thập phân</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="decimalSeparator"
                                  value={formData.decimalSeparator}
                                  onChange={handleChange}
                                  maxLength={1}
                                />
                                <Form.Text className="text-muted">
                                  Ví dụ: "," trong 1.000,50
                                </Form.Text>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-4">
                                <Form.Label>Số chữ số thập phân</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  max="4"
                                  name="numberOfDecimals"
                                  value={formData.numberOfDecimals}
                                  onChange={handleChange}
                                />
                              </Form.Group>
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

export default GeneralSettings; 