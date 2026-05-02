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
        content: 'Profile updated successfully!'
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
        content: 'Password changed successfully!'
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
        <h1>Admin Profile</h1>
        
        <Row>
          <Col md={3}>
            <div className="profile-sidebar">
              <div className="profile-avatar">
                <img src={profile.avatar} alt="Admin Avatar" />
                <h3>{profile.name}</h3>
                <p>{profile.email}</p>
              </div>
              <div className="profile-nav">
                <Button 
                  variant={activeTab === 'profile' ? 'primary' : 'light'} 
                  className="profile-nav-btn" 
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUser /> Profile Information
                </Button>
                <Button 
                  variant={activeTab === 'security' ? 'primary' : 'light'} 
                  className="profile-nav-btn" 
                  onClick={() => setActiveTab('security')}
                >
                  <FaKey /> Security Settings
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
                  <h2>Profile Information</h2>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleProfileSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
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
                      <Form.Label>Email Address</Form.Label>
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
                      <Form.Label>Phone Number</Form.Label>
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
                      <Form.Label>Profile Picture URL</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="avatar" 
                        value={profile.avatar} 
                        onChange={handleProfileChange}
                      />
                      <Form.Text className="text-muted">
                        Enter a URL for your profile picture.
                      </Form.Text>
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="profile-save-btn"
                    >
                      {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              <Card className="profile-card">
                <Card.Header>
                  <h2>Change Password</h2>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handlePasswordSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
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
                      <Form.Label>New Password</Form.Label>
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
                      <Form.Label>Confirm New Password</Form.Label>
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
                      {loading ? 'Updating...' : <><FaSave /> Update Password</>}
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