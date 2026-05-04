import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaUser, FaKey, FaEnvelope, FaPhone, FaSave } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import AdminLayout from './AdminLayout';
import './AdminProfile.css';

const AdminProfile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    // Fetch admin profile data
    // This is a placeholder - replace with actual API call
    setTimeout(() => {
      setProfile({
        name: userInfo?.name || 'Admin User',
        email: userInfo?.email || 'admin@example.com',
        phone: '+1 (555) 123-4567',
        avatar: userInfo?.avatar || '/images/avatar-placeholder.png',
      });
    }, 300);
  }, [userInfo]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Update profile API call would go here
    setTimeout(() => {
      setLoading(false);
      setMessage({
        type: 'success',
        content: 'Cập nhật hồ sơ thành công!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', content: '' });
      }, 3000);
    }, 1000);
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({
        type: 'danger',
        content: 'New passwords do not match!'
      });
      return;
    }
    
    setLoading(true);
    
    // Change password API call would go here
    setTimeout(() => {
      setLoading(false);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage({
        type: 'success',
        content: 'Đổi mật khẩu thành công!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', content: '' });
      }, 3000);
    }, 1000);
  };
  
  return (
    <AdminLayout>
      <div className="admin-profile">
        <h1>Hồ sơ quản trị</h1>
        
        <Row>
          <Col md={3}>
            <div className="profile-sidebar">
              <div className="profile-avatar">
                <img src={profile.avatar} alt="Ảnh đại diện quản trị" />
                <h3>{profile.name}</h3>
                <p>{profile.email}</p>
              </div>
              <div className="profile-nav">
                <Button 
                  variant={activeTab === 'profile' ? 'primary' : 'light'} 
                  className="profile-nav-btn" 
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUser /> Thông tin hồ sơ
                </Button>
                <Button 
                  variant={activeTab === 'security' ? 'primary' : 'light'} 
                  className="profile-nav-btn" 
                  onClick={() => setActiveTab('security')}
                >
                  <FaKey /> Cài đặt bảo mật
                </Button>
              </div>
            </div>
          </Col>
          
          <Col md={9}>
            {message.content && (
              <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', content: '' })}>
                {message.content}
              </Alert>
            )}
            
            {activeTab === 'profile' ? (
              <Card className="profile-card">
                <Card.Header>
                  <h2>Thông tin hồ sơ</h2>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleProfileSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Họ và tên</Form.Label>
                      <InputWithIcon icon={<FaUser />}>
                        <Form.Control 
                          type="text" 
                          name="name" 
                          value={profile.name} 
                          onChange={handleProfileChange}
                          required
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ email</Form.Label>
                      <InputWithIcon icon={<FaEnvelope />}>
                        <Form.Control 
                          type="email" 
                          name="email" 
                          value={profile.email} 
                          onChange={handleProfileChange}
                          required
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại</Form.Label>
                      <InputWithIcon icon={<FaPhone />}>
                        <Form.Control 
                          type="text" 
                          name="phone" 
                          value={profile.phone} 
                          onChange={handleProfileChange}
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>URL ảnh đại diện</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="avatar" 
                        value={profile.avatar} 
                        onChange={handleProfileChange}
                      />
                      <Form.Text className="text-muted">
                        Nhập URL ảnh đại diện của bạn.
                      </Form.Text>
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="profile-save-btn"
                    >
                      {loading ? 'Đang lưu...' : <><FaSave /> Lưu thay đổi</>}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              <Card className="profile-card">
                <Card.Header>
                  <h2>Đổi mật khẩu</h2>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handlePasswordSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu hiện tại</Form.Label>
                      <InputWithIcon icon={<FaKey />}>
                        <Form.Control 
                          type="password" 
                          name="currentPassword" 
                          value={passwords.currentPassword} 
                          onChange={handlePasswordChange}
                          required
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu mới</Form.Label>
                      <InputWithIcon icon={<FaKey />}>
                        <Form.Control 
                          type="password" 
                          name="newPassword" 
                          value={passwords.newPassword} 
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                      <InputWithIcon icon={<FaKey />}>
                        <Form.Control 
                          type="password" 
                          name="confirmPassword" 
                          value={passwords.confirmPassword} 
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                        />
                      </InputWithIcon>
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="profile-save-btn"
                    >
                      {loading ? 'Đang cập nhật...' : <><FaSave /> Cập nhật mật khẩu</>}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

// Helper component for input with icon
const InputWithIcon = ({ icon, children }) => {
  return (
    <div className="input-with-icon">
      <div className="input-icon">{icon}</div>
      {children}
    </div>
  );
};

export default AdminProfile; 