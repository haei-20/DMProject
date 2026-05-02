import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useResetPasswordMutation } from '../services/api';
import Loader from '../components/Loader';
import Message from '../components/Message';

// Custom styles for the form container
const formContainerStyles = {
  wrapper: {
    padding: '20px',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    marginBottom: '3px',
    display: 'block'
  }
};

// Styling for validation requirements
const validationStyles = {
  container: {
    marginTop: '8px',
    fontSize: '12px',
  },
  title: {
    fontWeight: '500',
    marginBottom: '3px',
    color: '#555',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
  },
  validIcon: {
    color: '#28a745',
    marginRight: '5px',
    fontSize: '10px',
  },
  invalidIcon: {
    color: '#ccc',
    marginRight: '5px',
    fontSize: '10px',
  },
  valid: {
    color: '#28a745',
  },
  invalid: {
    color: '#777',
  }
};

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
    marginBottom: '15px',
  },
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract otp and email from query parameters or state
  const queryParams = new URLSearchParams(location.search);
  const otp = queryParams.get('otp') || '';
  const email = queryParams.get('email') || '';
  
  const [otpInput, setOtpInput] = useState(otp);
  const [emailInput, setEmailInput] = useState(email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordReset, setPasswordReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Password reset mutation
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasNumber: false,
    hasLowercase: false,
    hasUppercase: false,
    hasSpecial: false
  });
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Đặt tất cả các điều kiện thành true
    setPasswordValidation({
      length: true,
      hasNumber: true,
      hasLowercase: true,
      hasUppercase: true,
      hasSpecial: true
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission values:', {
      email: emailInput,
      otp: otpInput,
      password,
      confirmPassword
    });
    
    // Clear previous error
    setErrorMessage('');
    
    // Validate form - trim values to prevent whitespace issues
    const trimmedEmail = emailInput.trim();
    const trimmedOtp = otpInput.trim();
    
    // Check inputs individually to provide more specific error messages
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email');
      return;
    }
    
    if (!trimmedOtp) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }
    
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (!confirmPassword) {
      setErrorMessage('Vui lòng xác nhận mật khẩu');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu không khớp');
      return;
    }
    
    // Display the values we're going to submit to help with debugging
    console.log('Input values to be submitted:', {
      email: trimmedEmail,
      otp: trimmedOtp,
      password: password.length + ' characters',
      confirmPassword: password === confirmPassword ? 'matches' : 'does not match'
    });
    
    try {
      setErrorMessage('');
      
      // Using exact field names from backend validation:
      // email, token, newPassword (as shown in backend controller)
      const resetData = {
        email: trimmedEmail,
        token: trimmedOtp,
        newPassword: password
      };
      
      console.log('Sending reset request with correct field names:', resetData);
      
      await resetPassword(resetData).unwrap();
      setPasswordReset(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.data && err.data.details) {
        console.error('Error details:', err.data.details);
        setErrorMessage(err.data.message + ': ' + JSON.stringify(err.data.details));
      } else {
        setErrorMessage(err.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
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
          <div className="auth-form-wrapper" style={formContainerStyles.wrapper}>
            <div className="back-to-home">
              <Link to="/" className="btn-back">
                <i className="fas fa-home"></i> Quay lại trang chủ
                </Link>
              </div>
            
            <h2>Đặt Lại Mật Khẩu</h2>
            
            {errorMessage && <Message variant="error">{errorMessage}</Message>}
          
          {passwordReset ? (
              <div className="password-reset-success" style={successStyles.container}>
                <div className="success-icon" style={successStyles.icon}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3 style={successStyles.title}>Đặt Lại Mật Khẩu Thành Công</h3>
                <p style={successStyles.text}>
                  Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
                <div className="loader-container">
                  <Loader /> Đang chuyển hướng đến trang đăng nhập...
                </div>
              </div>
          ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group" style={formContainerStyles.formGroup}>
                  <label htmlFor="email" style={formContainerStyles.label}>Địa Chỉ Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    placeholder="Nhập email của bạn"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="form-group" style={formContainerStyles.formGroup}>
                  <label htmlFor="otp" style={formContainerStyles.label}>Mã OTP/Token</label>
                  <input
                    type="text"
                    id="otp"
                    className="form-control"
                    placeholder="Nhập mã xác thực từ email"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="form-group" style={formContainerStyles.formGroup}>
                  <label htmlFor="password" style={formContainerStyles.label}>Mật Khẩu Mới</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    required
                  />
                  </div>
                  
                  
                
                <div className="form-group" style={formContainerStyles.formGroup}>
                  <label htmlFor="confirmPassword" style={formContainerStyles.label}>Xác Nhận Mật Khẩu</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-control"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader /> : 'Đặt Lại Mật Khẩu'}
                </button>
                
                <div className="auth-link">
                  <Link to="/login">Quay Lại Đăng Nhập</Link>
                </div>
              </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 