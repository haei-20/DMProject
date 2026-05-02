import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUniversity, FaCreditCard, FaMoneyBillWave, FaPaypal, FaChevronLeft } from 'react-icons/fa';
import { savePaymentMethod } from '../redux/slices/cartSlice';
import Layout from '../components/Layout';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if cart is empty or user is not authenticated
    if (items.length === 0) {
      navigate('/cart');
    } else if (!isAuthenticated) {
      navigate('/login?redirect=payment');
    }
  }, [items, isAuthenticated, navigate]);

  const paymentOptions = [
    { 
      id: 'bank', 
      name: 'Thẻ ngân hàng', 
      icon: <FaUniversity size={24} />, 
      background: '#FABFB7',
      color: '#D25B70'
    },
    { 
      id: 'credit', 
      name: 'Thẻ tín dụng', 
      icon: <FaCreditCard size={24} />, 
      background: '#FFE180',
      color: '#D0A137'
    },
    { 
      id: 'cash', 
      name: 'Tiền mặt', 
      icon: <FaMoneyBillWave size={24} />, 
      background: '#D4F5E9',
      color: '#26A97A'
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: <FaPaypal size={24} />, 
      background: '#B8E6FF',
      color: '#0E74BC'
    },
  ];

  const handleContinue = () => {
    if (paymentMethod) {
      dispatch(savePaymentMethod(paymentMethod));
      navigate('/order');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="payment-page">
        <div className="payment-header">
          <button className="back-button" onClick={handleBack}>
            <FaChevronLeft />
          </button>
        </div>
        
        <div className="payment-content">
          <h1 className="payment-title">Phương thức thanh toán</h1>
          
          <div className="payment-options-list">
            {paymentOptions.map((option) => (
              <div 
                key={option.id}
                className={`payment-option-card ${paymentMethod === option.id ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(option.id)}
                style={{ backgroundColor: option.background }}
              >
                <div className="payment-option-icon" style={{ color: option.color }}>
                  {option.icon}
                </div>
                <div className="payment-option-name" style={{ color: option.color }}>
                  {option.name}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            className="payment-continue-btn"
            onClick={handleContinue}
            disabled={!paymentMethod}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage; 