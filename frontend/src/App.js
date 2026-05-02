import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import ApiStatus component
import ApiStatus from './components/ApiStatus';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import OrderPage from './pages/OrderPage';
import OrderStatusPage from './pages/OrderStatusPage';
import ProfilePage from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';
import LoadingDemoPage from './pages/LoadingDemoPage';
import EmptyOrderPage from './pages/EmptyOrderPage';
import ProtectedRoute from './components/ProtectedRoute';
import DealHotPage from './pages/DealHotPage';
import ComboPage from './pages/ComboPage';

// Import missing page components
import OrdersPage from './pages/OrdersPage';
// import AddressPage from './pages/AddressPage';
// import OffersPage from './pages/OffersPage';
import NotificationsPage from './pages/NotificationsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductList from './pages/admin/ProductList';
import CreateProductPage from './pages/admin/CreateProductPage';
import UserList from './pages/admin/UserList';
import OrderList from './pages/admin/OrderList';
import CategoryList from './pages/admin/CategoryList';
import AdminStats from './pages/admin/AdminStats';
import AdminProfile from './pages/admin/AdminProfile';
import InventoryManagement from './pages/admin/InventoryManagement';
import OrderDetail from './pages/admin/OrderDetail';
import AdminRoute from './components/AdminRoute';
import UnderConstructionPage from './pages/admin/UnderConstructionPage';
import PendingOrders from './pages/admin/PendingOrders';
import ProcessingOrders from './pages/admin/ProcessingOrders';
import ShippingOrders from './pages/admin/ShippingOrders';
import CustomerList from './pages/admin/CustomerList';
import CustomerGroups from './pages/admin/CustomerGroups';
import DiscountList from './pages/admin/DiscountList';
import CouponList from './pages/admin/CouponList';
import BannerList from './pages/admin/BannerList';
import GeneralSettings from './pages/admin/GeneralSettings';
import PaymentSettings from './pages/admin/PaymentSettings';
import ShippingSettings from './pages/admin/ShippingSettings';
import ProductAnalytics from './pages/admin/ProductAnalytics';
import DealHotManagement from './pages/admin/DealHotManagement';
import ComboManagement from './pages/admin/ComboManagement';

function App() {
  return (
    <Router>
      {/* Add ApiStatus component */}
      <ApiStatus />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/deal-hot" element={<DealHotPage />} />
        <Route path="/combo" element={<ComboPage />} />
        
        {/* Redirect cart to home with cart drawer param */}
        <Route path="/cart" element={<Navigate to="/?drawer=cart" replace />} />
        
        {/* Redirect profile to home with account drawer param */}
        <Route path="/profile" element={<Navigate to="/?drawer=account" replace />} />
        
        <Route path="/loading-demo" element={<LoadingDemoPage />} />
        <Route path="/empty-order" element={<EmptyOrderPage />} />
        
        {/* Protected routes */}
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        } />
        <Route path="/order" element={
          <ProtectedRoute>
            <OrderPage />
          </ProtectedRoute>
        } />
        <Route path="/order-status/:id" element={
          <ProtectedRoute>
            <OrderStatusPage />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        
        {/* Added missing routes referenced in AccountDrawer */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile/address" element={
          <ProtectedRoute>
            {/* Temporary placeholder until AddressPage is created */}
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/offers" element={
          <ProtectedRoute>
            {/* Temporary placeholder until OffersPage is created */}
            <HomePage />
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/products" element={
          <AdminRoute>
            <ProductList />
          </AdminRoute>
        } />
        <Route path="/admin/products/create" element={
          <AdminRoute>
            <CreateProductPage />
          </AdminRoute>
        } />
        <Route path="/admin/products/inventory" element={
          <AdminRoute>
            <InventoryManagement />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserList />
          </AdminRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminRoute>
            <OrderList />
          </AdminRoute>
        } />
        <Route path="/admin/order/:id" element={
          <AdminRoute>
            <OrderDetail />
          </AdminRoute>
        } />
        <Route path="/admin/categories" element={
          <AdminRoute>
            <CategoryList />
          </AdminRoute>
        } />
        <Route path="/admin/orders/pending" element={
          <AdminRoute>
            <PendingOrders />
          </AdminRoute>
        } />
        <Route path="/admin/orders/processing" element={
          <AdminRoute>
            <ProcessingOrders />
          </AdminRoute>
        } />
        <Route path="/admin/orders/shipping" element={
          <AdminRoute>
            <ShippingOrders />
          </AdminRoute>
        } />
        <Route path="/admin/customers" element={
          <AdminRoute>
            <CustomerList />
          </AdminRoute>
        } />
        <Route path="/admin/customers/groups" element={
          <AdminRoute>
            <CustomerGroups />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/discounts" element={
          <AdminRoute>
            <DiscountList />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/coupons" element={
          <AdminRoute>
            <CouponList />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/banner" element={
          <AdminRoute>
            <BannerList />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/combo" element={
          <AdminRoute>
            <ComboManagement />
          </AdminRoute>
        } />
        <Route path="/admin/settings/general" element={
          <AdminRoute>
            <GeneralSettings />
          </AdminRoute>
        } />
        <Route path="/admin/settings/payment" element={
          <AdminRoute>
            <PaymentSettings />
          </AdminRoute>
        } />
        <Route path="/admin/settings/shipping" element={
          <AdminRoute>
            <ShippingSettings />
          </AdminRoute>
        } />
        <Route path="/admin/stats" element={
          <AdminRoute>
            <AdminStats />
          </AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute>
            <AdminStats />
          </AdminRoute>
        } />
        <Route path="/admin/profile" element={
          <AdminRoute>
            <AdminProfile />
          </AdminRoute>
        } />
        <Route path="/admin/analytics/product" element={
          <AdminRoute>
            <ProductAnalytics />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/deal-hot" element={
          <AdminRoute>
            <DealHotManagement />
          </AdminRoute>
        } />
        <Route path="/admin/marketing/combo" element={
          <AdminRoute>
            <ComboManagement />
          </AdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
