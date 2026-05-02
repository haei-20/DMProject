import React, { useState, useEffect } from 'react';
import { Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../services/api';
import Loader from '../components/Loader';
import Message from '../components/Message';

// Styling for success message
const successStyles = {
  container: {
    textAlign: 'center',
    padding: '20px 15px',
    marginTop: '15px'
  },
  icon: {
    fontSize: '48px',
    color: '#28a745',
    marginBottom: '15px'
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333'
  },
  text: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '8px'
  },
  note: {
    fontSize: '14px',
    color: '#777',
    fontStyle: 'italic',
    marginTop: '15px',
    marginBottom: '20px'
  }
};

// Form styling
const formStyles = {
  description: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center'
  }
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  
  // Redirect to OTP page after 3 seconds when email is sent
  useEffect(() => {
    if (emailSent) {
      const timer = setTimeout(() => {
        navigate(`/reset-password`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [emailSent, email, navigate]);
  
  // Forgot password mutation
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  
  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    
    try {
      setErrorMessage('');
      await forgotPassword({ email }).unwrap();
      setEmailSent(true);
    } catch (err) {
      setErrorMessage(err.data?.message || 'Không thể gửi mã OTP đặt lại mật khẩu. Vui lòng thử lại.');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-sidebar">
          <div className="auth-logo-block">
            <img src="/logo.png" alt="2NADH" className="logo-image" />
          </div>
        </div>
        
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <div className="back-to-home">
              <Link to="/" className="btn-back">
                <i className="fas fa-home"></i> Quay lại trang chủ
              </Link>
            </div>
            
            <h2>Quên Mật Khẩu</h2>
            
            {errorMessage && <Message variant="error">{errorMessage}</Message>}
          
          {emailSent ? (
              <div className="password-reset-success" style={successStyles.container}>
                <div className="success-icon" style={successStyles.icon}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 style={successStyles.title}>Đã Gửi Mã OTP</h3>
                <p style={successStyles.text}>
                  Chúng tôi đã gửi mã OTP đến <strong>{email}</strong>.
                </p>
                <p style={successStyles.text}>
                  Bạn sẽ được chuyển đến trang nhập mã OTP và mật khẩu mới.
              </p>
                <p className="note" style={successStyles.note}>
                  Nếu bạn không nhận được email trong vòng vài phút, vui lòng kiểm tra thư mục spam.
              </p>
                <div className="loader-container">
                  <Loader /> Đang chuyển hướng...
                </div>
              </div>
          ) : (
            <>
                <p className="auth-description" style={formStyles.description}>
                  Nhập địa chỉ email của bạn để nhận mã OTP đặt lại mật khẩu.
              </p>
              
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Địa Chỉ Email</label>
                    <input
                    type="email"
                      id="email"
                      className="form-control"
                      placeholder="Nhập email của bạn"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isLoading}
                    required
                  />
                  </div>
                
                  <button
                  type="submit"
                    className="btn-login"
                  disabled={isLoading}
                >
                    {isLoading ? <Loader /> : 'Gửi Mã OTP'}
                  </button>
                
                  <div className="auth-link">
                    <Link to="/login">Quay Lại Đăng Nhập</Link>
                </div>
                </form>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 