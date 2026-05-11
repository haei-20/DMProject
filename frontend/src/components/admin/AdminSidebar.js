import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaBox, FaShoppingBag, FaList, FaChartPie,
  FaCog, FaSignOutAlt, FaStore,
  FaImages, FaPercent, FaShieldAlt
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useGetPendingOrdersQuery, useGetProcessingOrdersQuery, useGetShippingOrdersQuery } from '../../services/api';
import '../../styles/AdminTheme.css';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const { data: pendingOrders } = useGetPendingOrdersQuery(undefined, {
    pollingInterval: 60000,
    refetchOnMountOrArgChange: true
  });
  
  const { data: processingOrders } = useGetProcessingOrdersQuery(undefined, {
    pollingInterval: 60000,
    refetchOnMountOrArgChange: true
  });
  
  const { data: shippingOrders } = useGetShippingOrdersQuery(undefined, {
    pollingInterval: 60000,
    refetchOnMountOrArgChange: true
  });
  
  const pendingOrderCount = pendingOrders?.length || 0;
  const processingOrderCount = processingOrders?.length || 0;
  const shippingOrderCount = shippingOrders?.length || 0;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo-container">
          <FaStore className="admin-logo-icon" />
          <h1 className="admin-logo-text">2NADH</h1>
        </div>
      </div>
      
      <div className="admin-user-profile">
        <div className="admin-user-avatar">
          {user?.name?.charAt(0) || 'A'}
        </div>
        <div className="admin-user-details">
          <h5 className="admin-user-name">{user?.name || 'Quản trị viên'}</h5>
          <p className="admin-user-role">Quản trị viên</p>
        </div>
      </div>
      
      <Nav className="admin-menu">
        <div className="admin-menu-section">
          <h6 className="admin-menu-label">Tổng quan</h6>
          
          <Nav.Item>
            <Link 
              to="/admin/dashboard" 
              className={`admin-menu-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
            >
              <FaHome className="admin-menu-icon" />
              <span className="admin-menu-text">Bảng điều khiển</span>
            </Link>
          </Nav.Item>
        
          <Nav.Item>
            <Link 
              to="/admin/analytics" 
              className={`admin-menu-item ${isActive('/admin/analytics') ? 'active' : ''}`}
            >
              <FaChartPie className="admin-menu-icon" />
              <span className="admin-menu-text">Thống kê</span>
            </Link>
          </Nav.Item>
        </div>
        
        <div className="admin-menu-section">
          <h6 className="admin-menu-label">Quản lý sản phẩm</h6>
          <p className="admin-menu-group-label">Sản phẩm</p>
          <Nav.Item>
            <Link 
              to="/admin/products" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/products') ? 'active' : ''}`}
            >
              <FaBox className="admin-menu-icon" />
              <span className="admin-menu-text">Tất cả sản phẩm</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/products/create" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/products/create') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Thêm sản phẩm mới</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/products/inventory" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/products/inventory') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Quản lý tồn kho</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/categories" 
              className={`admin-menu-item ${isActive('/admin/categories') ? 'active' : ''}`}
            >
              <FaList className="admin-menu-icon" />
              <span className="admin-menu-text">Danh mục</span>
            </Link>
          </Nav.Item>
        </div>
        
        <div className="admin-menu-section">
          <h6 className="admin-menu-label">Bán hàng</h6>
          <p className="admin-menu-group-label">Đơn hàng</p>
          <Nav.Item>
            <Link
              to="/admin/orders"
              className={`admin-menu-item admin-menu-item-nested ${location.pathname === '/admin/orders' ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Tất cả đơn hàng</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/orders/pending" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/orders/pending') ? 'active' : ''}`}
            >
              <FaShoppingBag className="admin-menu-icon" />
              <span className="admin-menu-text">Đơn hàng mới</span>
              {pendingOrderCount > 0 && (
                <span className="admin-badge admin-badge-primary admin-notification-badge">
                  {pendingOrderCount}
                </span>
              )}
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/orders/processing" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/orders/processing') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Đang xử lý</span>
              {processingOrderCount > 0 && (
                <span className="admin-badge admin-badge-info admin-notification-badge">
                  {processingOrderCount}
                </span>
              )}
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/orders/shipping" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/orders/shipping') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Đang giao</span>
              {shippingOrderCount > 0 && (
                <span className="admin-badge admin-badge-warning admin-notification-badge">
                  {shippingOrderCount}
                </span>
              )}
            </Link>
          </Nav.Item>
        </div>
        
        <div className="admin-menu-section">
          <h6 className="admin-menu-label">Marketing</h6>
          <p className="admin-menu-group-label">Khuyến mãi</p>
          <Nav.Item>
            <Link 
              to="/admin/marketing/discounts" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/marketing/discounts') ? 'active' : ''}`}
            >
              <FaPercent className="admin-menu-icon" />
              <span className="admin-menu-text">Giảm giá</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/marketing/coupons" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/marketing/coupons') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Mã giảm giá</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/marketing/deal-hot" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/marketing/deal-hot') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Deal Hot</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/marketing/combo" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/marketing/combo') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Combo sản phẩm</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/marketing/banner" 
              className={`admin-menu-item ${isActive('/admin/marketing/banner') ? 'active' : ''}`}
            >
              <FaImages className="admin-menu-icon" />
              <span className="admin-menu-text">Banner</span>
            </Link>
          </Nav.Item>
        </div>

        <div className="admin-menu-section">
          <h6 className="admin-menu-label">Hệ thống</h6>
          <Nav.Item>
            <Link 
              to="/admin/users" 
              className={`admin-menu-item ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <FaShieldAlt className="admin-menu-icon" />
              <span className="admin-menu-text">Người dùng hệ thống</span>
            </Link>
          </Nav.Item>
          <p className="admin-menu-group-label">Cài đặt</p>
          <Nav.Item>
            <Link 
              to="/admin/settings/general" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/settings/general') ? 'active' : ''}`}
            >
              <FaCog className="admin-menu-icon" />
              <span className="admin-menu-text">Cài đặt chung</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/settings/payment" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/settings/payment') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Phương thức thanh toán</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link 
              to="/admin/settings/shipping" 
              className={`admin-menu-item admin-menu-item-nested ${isActive('/admin/settings/shipping') ? 'active' : ''}`}
            >
              <span className="admin-menu-icon admin-menu-icon-placeholder" aria-hidden />
              <span className="admin-menu-text">Vận chuyển</span>
            </Link>
          </Nav.Item>
        </div>
      </Nav>
      
      <div className="admin-sidebar-footer">
        <button className="admin-logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="admin-menu-icon" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
