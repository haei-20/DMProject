import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaWallet, FaArrowRight, FaBoxOpen } from 'react-icons/fa';
import { Button } from 'react-bootstrap';

const EmptyOrderPage = () => {
  return (
    <div className="empty-order-container">
      {/* Empty Cart Illustration */}
      <div className="empty-cart-illustration">
        <div className="empty-icon">
          <FaBoxOpen size={60} color="#e0e0e0" />
        </div>
        <img 
          src="/images/empty-orders.png" 
          alt="Giỏ hàng trống" 
          className="empty-cart-image" 
        />
      </div>
      
      {/* Empty Message */}
      <div className="empty-message">
        <h3 className="message-title">Chưa có đơn hàng nào</h3>
        <p className="message-main">Bạn chưa có đơn hàng nào trong tài khoản.</p>
        <p className="message-sub">Hãy khám phá các sản phẩm và đặt hàng ngay!</p>
        
        <div className="empty-actions">
          <Button 
            as={Link} 
            to="/" 
            variant="primary" 
            className="shop-now-btn"
          >
            Mua sắm ngay <FaArrowRight className="ms-2" />
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <Link to="/" className="nav-item">
          <div className="nav-icon">
            <FaHome />
          </div>
          <span>Cửa hàng</span>
        </Link>
        <div className="nav-item">
          <div className="cart-icon-circle">
            <FaShoppingCart />
            <span className="cart-total">£0.00</span>
          </div>
        </div>
        <Link to="/profile" className="nav-item active">
          <div className="nav-icon">
            <FaWallet />
          </div>
          <span>Đơn hàng</span>
        </Link>
      </div>
      
      <style jsx="true">{`
        .empty-order-container {
          padding: 30px 20px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          background-color: #fff;
        }
        
        .empty-cart-illustration {
          margin-bottom: 30px;
          text-align: center;
        }
        
        .empty-icon {
          margin-bottom: 20px;
        }
        
        .empty-cart-image {
          max-width: 220px;
          width: 100%;
          height: auto;
        }
        
        .empty-message {
          text-align: center;
          max-width: 350px;
        }
        
        .message-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #333;
        }
        
        .message-main {
          font-size: 16px;
          color: #555;
          margin-bottom: 8px;
        }
        
        .message-sub {
          font-size: 14px;
          color: #777;
          margin-bottom: 25px;
        }
        
        .empty-actions {
          margin-top: 20px;
        }
        
        .shop-now-btn {
          padding: 10px 25px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #4361ee;
          border: none;
          transition: all 0.3s ease;
        }
        
        .shop-now-btn:hover {
          background-color: #3a56d4;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(67, 97, 238, 0.2);
        }
        
        .bottom-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: white;
          border-top: 1px solid #eee;
          padding: 10px 15%;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #777;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .nav-item.active {
          color: #4361ee;
          font-weight: 500;
        }
        
        .nav-item:hover {
          color: #4361ee;
        }
        
        .nav-icon {
          font-size: 20px;
          margin-bottom: 5px;
        }
        
        .cart-icon-circle {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #4361ee, #3a56d4);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          position: relative;
          top: -15px;
          box-shadow: 0 4px 10px rgba(67, 97, 238, 0.3);
        }
        
        @media (max-width: 768px) {
          .empty-order-container {
            padding: 20px 15px 70px;
          }
          
          .bottom-navigation {
            padding: 10px 5%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmptyOrderPage; 