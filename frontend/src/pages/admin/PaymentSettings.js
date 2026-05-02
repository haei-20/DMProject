import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert, Tab, Nav, InputGroup, Badge, Table } from 'react-bootstrap';
import { FaSave, FaMoneyBillWave, FaCreditCard, FaUniversity, FaMoneyBill, FaStripeS, FaPaypal, FaMobile, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetPaymentSettingsQuery, useUpdatePaymentSettingsMutation } from '../../services/api';
import './PaymentSettings.css';

const PaymentSettings = () => {
  // Fetch settings
  const { data: settings, isLoading, error, refetch } = useGetPaymentSettingsQuery();
  
  // Mutation
  const [updateSettings, { isLoading: isUpdating, isSuccess, error: updateError }] = useUpdatePaymentSettingsMutation();
  
  // State
  const [formData, setFormData] = useState({
    enabledPaymentMethods: {
      cod: true,
      bankTransfer: true,
      creditCard: false,
      ewallet: false
    },
    bankTransferInstructions: '',
    codInstructions: '',
    paymentGateways: {
      stripe: {
        enabled: false,
        testMode: true,
        publishableKey: '',
        secretKey: ''
      },
      paypal: {
        enabled: false,
        testMode: true,
        clientId: '',
        clientSecret: ''
      },
      momo: {
        enabled: false,
        testMode: true,
        partnerCode: '',
        accessKey: '',
        secretKey: ''
      }
    }
  });
  
  const [activeTab, setActiveTab] = useState('methods');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  // Load settings data into form when available
  useEffect(() => {
    if (settings) {
      // For backward compatibility, handle both direct settings and data property
      const settingsData = settings.data || settings;
      
      setFormData({
        enabledPaymentMethods: {
          cod: settingsData.enabledPaymentMethods?.cod ?? true,
          bankTransfer: settingsData.enabledPaymentMethods?.bankTransfer ?? true,
          creditCard: settingsData.enabledPaymentMethods?.creditCard ?? false,
          ewallet: settingsData.enabledPaymentMethods?.ewallet ?? false
        },
        bankTransferInstructions: settingsData.bankTransferInstructions || '',
        codInstructions: settingsData.codInstructions || '',
        paymentGateways: {
          stripe: {
            enabled: settingsData.paymentGateways?.stripe?.enabled ?? false,
            testMode: settingsData.paymentGateways?.stripe?.testMode ?? true,
            publishableKey: settingsData.paymentGateways?.stripe?.publishableKey || '',
            secretKey: settingsData.paymentGateways?.stripe?.secretKey || ''
          },
          paypal: {
            enabled: settingsData.paymentGateways?.paypal?.enabled ?? false,
            testMode: settingsData.paymentGateways?.paypal?.testMode ?? true,
            clientId: settingsData.paymentGateways?.paypal?.clientId || '',
            clientSecret: settingsData.paymentGateways?.paypal?.clientSecret || ''
          },
          momo: {
            enabled: settingsData.paymentGateways?.momo?.enabled ?? false,
            testMode: settingsData.paymentGateways?.momo?.testMode ?? true,
            partnerCode: settingsData.paymentGateways?.momo?.partnerCode || '',
            accessKey: settingsData.paymentGateways?.momo?.accessKey || '',
            secretKey: settingsData.paymentGateways?.momo?.secretKey || ''
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
        // Handle simple nested objects like enabledPaymentMethods.cod
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        // Handle deeper nested objects like paymentGateways.stripe.enabled
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateSettings(formData).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to update payment settings:', err);
    }
  };
  
  return (
    <AdminLayout>
      <div className="payment-settings-page">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Cài đặt thanh toán</h1>
        </div>
        
        {showSuccessAlert && (
          <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
            Cài đặt thanh toán đã được cập nhật thành công!
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger">
            <div className="d-flex justify-content-between align-items-center">
              <span>Lỗi khi tải cài đặt thanh toán</span>
              <Button variant="outline-danger" size="sm" onClick={refetch}>
                Thử lại
              </Button>
            </div>
          </Alert>
        )}
        
        {updateError && (
          <Alert variant="danger">
            Lỗi khi cập nhật cài đặt thanh toán. Vui lòng thử lại.
          </Alert>
        )}
        
        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải cài đặt thanh toán...</p>
          </div>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column settings-nav">
                  <Nav.Item>
                    <Nav.Link eventKey="methods">
                      <FaMoneyBillWave className="me-2" /> Phương thức thanh toán
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="gateways">
                      <FaCreditCard className="me-2" /> Cổng thanh toán
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="instructions">
                      <FaMoneyBill className="me-2" /> Hướng dẫn thanh toán
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col md={9}>
                <Card>
                  <Card.Body>
                    <Form onSubmit={handleSubmit}>
                      <Tab.Content>
                        {/* Payment Methods Tab */}
                        <Tab.Pane eventKey="methods">
                          <h4 className="mb-4">Phương thức thanh toán</h4>
                          
                          <Table className="payment-methods-table">
                            <thead>
                              <tr>
                                <th>Phương thức</th>
                                <th style={{ width: '100px' }}>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="payment-icon cod-icon">
                                      <FaMoneyBill />
                                    </div>
                                    <div className="ms-3">
                                      <h5 className="mb-0">Thanh toán khi nhận hàng (COD)</h5>
                                      <p className="text-muted mb-0">Khách hàng thanh toán khi nhận được hàng</p>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Form.Check
                                    type="switch"
                                    id="cod-enabled"
                                    name="enabledPaymentMethods.cod"
                                    checked={formData.enabledPaymentMethods.cod}
                                    onChange={handleChange}
                                    label={formData.enabledPaymentMethods.cod ? 
                                      <Badge bg="success">Đang bật</Badge> : 
                                      <Badge bg="secondary">Đang tắt</Badge>}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="payment-icon bank-icon">
                                      <FaUniversity />
                                    </div>
                                    <div className="ms-3">
                                      <h5 className="mb-0">Chuyển khoản ngân hàng</h5>
                                      <p className="text-muted mb-0">Thanh toán bằng chuyển khoản ngân hàng</p>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Form.Check
                                    type="switch"
                                    id="bank-transfer-enabled"
                                    name="enabledPaymentMethods.bankTransfer"
                                    checked={formData.enabledPaymentMethods.bankTransfer}
                                    onChange={handleChange}
                                    label={formData.enabledPaymentMethods.bankTransfer ? 
                                      <Badge bg="success">Đang bật</Badge> : 
                                      <Badge bg="secondary">Đang tắt</Badge>}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="payment-icon credit-card-icon">
                                      <FaCreditCard />
                                    </div>
                                    <div className="ms-3">
                                      <h5 className="mb-0">Thẻ tín dụng/Ghi nợ</h5>
                                      <p className="text-muted mb-0">Thanh toán bằng thẻ tín dụng hoặc thẻ ghi nợ</p>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Form.Check
                                    type="switch"
                                    id="credit-card-enabled"
                                    name="enabledPaymentMethods.creditCard"
                                    checked={formData.enabledPaymentMethods.creditCard}
                                    onChange={handleChange}
                                    label={formData.enabledPaymentMethods.creditCard ? 
                                      <Badge bg="success">Đang bật</Badge> : 
                                      <Badge bg="secondary">Đang tắt</Badge>}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="payment-icon ewallet-icon">
                                      <FaMobile />
                                    </div>
                                    <div className="ms-3">
                                      <h5 className="mb-0">Ví điện tử</h5>
                                      <p className="text-muted mb-0">Thanh toán bằng các ví điện tử như MoMo, ZaloPay, v.v.</p>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <Form.Check
                                    type="switch"
                                    id="ewallet-enabled"
                                    name="enabledPaymentMethods.ewallet"
                                    checked={formData.enabledPaymentMethods.ewallet}
                                    onChange={handleChange}
                                    label={formData.enabledPaymentMethods.ewallet ? 
                                      <Badge bg="success">Đang bật</Badge> : 
                                      <Badge bg="secondary">Đang tắt</Badge>}
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </Tab.Pane>
                        
                        {/* Payment Gateways Tab */}
                        <Tab.Pane eventKey="gateways">
                          <h4 className="mb-4">Cổng thanh toán</h4>
                          
                          <Card className="mb-4 gateway-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <FaStripeS className="me-2 gateway-logo" />
                                <h5 className="mb-0">Stripe</h5>
                              </div>
                              <Form.Check
                                type="switch"
                                id="stripe-enabled"
                                name="paymentGateways.stripe.enabled"
                                checked={formData.paymentGateways.stripe.enabled}
                                onChange={handleChange}
                                label=""
                              />
                            </Card.Header>
                            <Card.Body>
                              <div className={formData.paymentGateways.stripe.enabled ? "" : "disabled-gateway"}>
                                <Row className="mb-3">
                                  <Col md={12}>
                                    <Form.Check
                                      type="checkbox"
                                      id="stripe-test-mode"
                                      name="paymentGateways.stripe.testMode"
                                      label="Chế độ thử nghiệm"
                                      checked={formData.paymentGateways.stripe.testMode}
                                      onChange={handleChange}
                                      disabled={!formData.paymentGateways.stripe.enabled}
                                    />
                                    <Form.Text className="text-muted">
                                      Khi bật chế độ thử nghiệm, các giao dịch không thực sự được xử lý
                                    </Form.Text>
                                  </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                  <Form.Label>Publishable Key</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="paymentGateways.stripe.publishableKey"
                                    value={formData.paymentGateways.stripe.publishableKey}
                                    onChange={handleChange}
                                    placeholder="pk_test_..."
                                    disabled={!formData.paymentGateways.stripe.enabled}
                                  />
                                </Form.Group>
                                <Form.Group>
                                  <Form.Label>Secret Key</Form.Label>
                                  <Form.Control
                                    type="password"
                                    name="paymentGateways.stripe.secretKey"
                                    value={formData.paymentGateways.stripe.secretKey}
                                    onChange={handleChange}
                                    placeholder="sk_test_..."
                                    disabled={!formData.paymentGateways.stripe.enabled}
                                  />
                                </Form.Group>
                              </div>
                            </Card.Body>
                          </Card>
                          
                          <Card className="mb-4 gateway-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <FaPaypal className="me-2 gateway-logo" />
                                <h5 className="mb-0">PayPal</h5>
                              </div>
                              <Form.Check
                                type="switch"
                                id="paypal-enabled"
                                name="paymentGateways.paypal.enabled"
                                checked={formData.paymentGateways.paypal.enabled}
                                onChange={handleChange}
                                label=""
                              />
                            </Card.Header>
                            <Card.Body>
                              <div className={formData.paymentGateways.paypal.enabled ? "" : "disabled-gateway"}>
                                <Row className="mb-3">
                                  <Col md={12}>
                                    <Form.Check
                                      type="checkbox"
                                      id="paypal-test-mode"
                                      name="paymentGateways.paypal.testMode"
                                      label="Chế độ thử nghiệm"
                                      checked={formData.paymentGateways.paypal.testMode}
                                      onChange={handleChange}
                                      disabled={!formData.paymentGateways.paypal.enabled}
                                    />
                                    <Form.Text className="text-muted">
                                      Khi bật chế độ thử nghiệm, các giao dịch không thực sự được xử lý
                                    </Form.Text>
                                  </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                  <Form.Label>Client ID</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="paymentGateways.paypal.clientId"
                                    value={formData.paymentGateways.paypal.clientId}
                                    onChange={handleChange}
                                    placeholder="Client ID..."
                                    disabled={!formData.paymentGateways.paypal.enabled}
                                  />
                                </Form.Group>
                                <Form.Group>
                                  <Form.Label>Client Secret</Form.Label>
                                  <Form.Control
                                    type="password"
                                    name="paymentGateways.paypal.clientSecret"
                                    value={formData.paymentGateways.paypal.clientSecret}
                                    onChange={handleChange}
                                    placeholder="Client Secret..."
                                    disabled={!formData.paymentGateways.paypal.enabled}
                                  />
                                </Form.Group>
                              </div>
                            </Card.Body>
                          </Card>
                          
                          <Card className="gateway-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <div className="me-2 gateway-logo momo-icon">M</div>
                                <h5 className="mb-0">MoMo</h5>
                              </div>
                              <Form.Check
                                type="switch"
                                id="momo-enabled"
                                name="paymentGateways.momo.enabled"
                                checked={formData.paymentGateways.momo.enabled}
                                onChange={handleChange}
                                label=""
                              />
                            </Card.Header>
                            <Card.Body>
                              <div className={formData.paymentGateways.momo.enabled ? "" : "disabled-gateway"}>
                                <Row className="mb-3">
                                  <Col md={12}>
                                    <Form.Check
                                      type="checkbox"
                                      id="momo-test-mode"
                                      name="paymentGateways.momo.testMode"
                                      label="Chế độ thử nghiệm"
                                      checked={formData.paymentGateways.momo.testMode}
                                      onChange={handleChange}
                                      disabled={!formData.paymentGateways.momo.enabled}
                                    />
                                    <Form.Text className="text-muted">
                                      Khi bật chế độ thử nghiệm, các giao dịch không thực sự được xử lý
                                    </Form.Text>
                                  </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                  <Form.Label>Partner Code</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="paymentGateways.momo.partnerCode"
                                    value={formData.paymentGateways.momo.partnerCode}
                                    onChange={handleChange}
                                    placeholder="Partner Code..."
                                    disabled={!formData.paymentGateways.momo.enabled}
                                  />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                  <Form.Label>Access Key</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="paymentGateways.momo.accessKey"
                                    value={formData.paymentGateways.momo.accessKey}
                                    onChange={handleChange}
                                    placeholder="Access Key..."
                                    disabled={!formData.paymentGateways.momo.enabled}
                                  />
                                </Form.Group>
                                <Form.Group>
                                  <Form.Label>Secret Key</Form.Label>
                                  <Form.Control
                                    type="password"
                                    name="paymentGateways.momo.secretKey"
                                    value={formData.paymentGateways.momo.secretKey}
                                    onChange={handleChange}
                                    placeholder="Secret Key..."
                                    disabled={!formData.paymentGateways.momo.enabled}
                                  />
                                </Form.Group>
                              </div>
                            </Card.Body>
                          </Card>
                        </Tab.Pane>
                        
                        {/* Payment Instructions Tab */}
                        <Tab.Pane eventKey="instructions">
                          <h4 className="mb-4">Hướng dẫn thanh toán</h4>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Hướng dẫn thanh toán khi nhận hàng (COD)</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              name="codInstructions"
                              value={formData.codInstructions}
                              onChange={handleChange}
                              placeholder="Nhập hướng dẫn thanh toán khi nhận hàng..."
                            />
                            <Form.Text className="text-muted">
                              Hướng dẫn này sẽ hiển thị cho khách hàng khi họ chọn phương thức thanh toán COD
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Hướng dẫn chuyển khoản ngân hàng</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={6}
                              name="bankTransferInstructions"
                              value={formData.bankTransferInstructions}
                              onChange={handleChange}
                              placeholder="Nhập hướng dẫn chuyển khoản ngân hàng, bao gồm số tài khoản, tên ngân hàng, tên người nhận, v.v."
                            />
                            <Form.Text className="text-muted">
                              Hướng dẫn này sẽ hiển thị cho khách hàng khi họ chọn phương thức thanh toán chuyển khoản ngân hàng
                            </Form.Text>
                          </Form.Group>
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

export default PaymentSettings; 