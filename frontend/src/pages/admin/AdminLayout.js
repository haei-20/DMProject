import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import './AdminLayout.css';

const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <AdminSidebar />
    <div className="admin-main">
      <AdminHeader />
      <div className="admin-content">
        {children}
      </div>
    </div>
  </div>
);

export default AdminLayout; 