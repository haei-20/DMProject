import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebar.show);

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <button
        type="button"
        className={`admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        aria-label="Đóng menu"
        onClick={() => dispatch(toggleSidebar(false))}
      />
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 