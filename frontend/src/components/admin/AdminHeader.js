import React, { useState } from 'react';
import { Navbar, Nav, Form, InputGroup, Dropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaBell, FaEnvelope, FaUser, 
  FaCog, FaSignOutAlt, FaMoon, FaSun 
} from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { setTheme } from '../../redux/slices/uiSlice';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar }) => {
  const [searchValue, setSearchValue] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (!searchValue.trim()) return;
    
    // Determine which section to search based on search value
    if (searchValue.toLowerCase().includes('đơn') || 
        searchValue.toLowerCase().includes('order') || 
        searchValue.match(/^#\d+$/)) {
      // Search orders
      navigate(`/admin/orders?search=${encodeURIComponent(searchValue)}`);
    } else if (searchValue.toLowerCase().includes('sản phẩm') || 
               searchValue.toLowerCase().includes('product')) {
      // Search products
      navigate(`/admin/products?search=${encodeURIComponent(searchValue)}`);
    } else if (searchValue.toLowerCase().includes('khách') || 
               searchValue.toLowerCase().includes('customer') || 
               searchValue.toLowerCase().includes('user')) {
      // Search customers
      navigate(`/admin/customers?search=${encodeURIComponent(searchValue)}`);
    } else {
      // Default to product search
      navigate(`/admin/products?search=${encodeURIComponent(searchValue)}`);
    }
    
    // Clear the search input after submitting
    setSearchValue('');
  };
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    // Could also update body class or data attribute here for global theme changes
  };
  
  return (
    <Navbar className="admin-header">
      <div className="admin-header-container">
        {/* Left side - search only */}
        <div className="admin-header-left">
          <Form className="admin-search-form" onSubmit={handleSearchSubmit}>
            <InputGroup>
              <Form.Control
                placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
                value={searchValue}
                onChange={handleSearchChange}
              />
              <Button variant="outline-primary" type="submit">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>
        </div>
        
        {/* Right side - Notifications and user menu */}
        <div className="admin-header-right">
          <Nav className="admin-header-nav">
            {/* Theme toggle */}
            <Nav.Item>
              <Button 
                variant="link" 
                className="icon-button" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </Button>
            </Nav.Item>
            
            {/* Notifications */}
            <Nav.Item>
              <Dropdown align="end">
                <Dropdown.Toggle as={Button} variant="link" className="icon-button" id="notification-dropdown">
                  <div className="icon-button-wrapper">
                    <FaBell />
                    <span className="notification-badge">3</span>
                  </div>
                </Dropdown.Toggle>
                
                <Dropdown.Menu className="notification-dropdown-menu">
                  <div className="notification-header">
                    <h6 className="mb-0">Thông báo</h6>
                    <small className="text-muted">3 Mới</small>
                  </div>
                  
                  <Dropdown.Divider />
                  
                  <Dropdown.Item as={Link} to="/admin/orders/123" className="notification-item">
                    <div className="notification-icon order">
                      <FaEnvelope />
                    </div>
                    <div className="notification-content">
                      <p className="notification-text">Đơn hàng #1234 đã được nhận</p>
                      <small className="notification-time">30 phút trước</small>
                    </div>
                  </Dropdown.Item>
                  
                  <Dropdown.Item as={Link} to="/admin/users" className="notification-item">
                    <div className="notification-icon user">
                      <FaUser />
                    </div>
                    <div className="notification-content">
                      <p className="notification-text">Người dùng mới</p>
                      <small className="notification-time">2 giờ trước</small>
                    </div>
                  </Dropdown.Item>
                  
                  <Dropdown.Item as={Link} to="/admin/products/456" className="notification-item">
                    <div className="notification-icon product">
                      <FaCog />
                    </div>
                    <div className="notification-content">
                      <p className="notification-text">Số lượng sản phẩm ít</p>
                      <small className="notification-time">1 ngày trước</small>
                    </div>
                  </Dropdown.Item>
                  
                  <Dropdown.Divider />
                  
                  <Dropdown.Item as={Link} to="/admin/notifications" className="text-center view-all">
                    Xem thêm thông báo
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>
            
            {/* User menu */}
            <Nav.Item>
              <Dropdown align="end">
                <Dropdown.Toggle as={Button} variant="link" className="user-dropdown-toggle" id="user-dropdown">
                  <div className="user-info">
                    <span className="user-name d-none d-md-block">{user?.name || 'Admin User'}</span>
                    <div className="user-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span>{user?.name?.[0] || 'A'}</span>
                      )}
                    </div>
                  </div>
                </Dropdown.Toggle>
                
                <Dropdown.Menu className="user-dropdown-menu">
                  <Dropdown.Item as={Link} to="/admin/profile">
                    <FaUser className="dropdown-icon" />
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/admin/settings/site">
                    <FaCog className="dropdown-icon" />
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="dropdown-icon" />
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>
          </Nav>
        </div>
      </div>
    </Navbar>
  );
};

export default AdminHeader; 