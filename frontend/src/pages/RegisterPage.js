import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useRegisterMutation, useVerifyOTPMutation } from '../services/api';
import { formatError } from '../utils/errorHandler';
import Message from '../components/Message';
import Loader from '../components/Loader';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [verifyOTP, { isLoading: isVerifyLoading }] = useVerifyOTPMutation();

  useEffect(() => {
    // If user is already logged in, redirect to home page
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đủ thông tin');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu không khớp');
      return;
    }

    try {
      const response = await register({ name, email, password }).unwrap();
      setUserId(response.userId);
      setSuccessMessage(response.message || 'Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực.');
      setShowOtpForm(true);
    } catch (err) {
      setErrorMessage(formatError(err));
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!otp) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }

    try {
      await verifyOTP({ userId, otp }).unwrap();
      setSuccessMessage('Đăng ký thành công! Chuyển hướng đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMessage(formatError(err));
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
            
            {!showOtpForm ? (
              <>
                <h2>Tạo tài khoản</h2>
                
                {errorMessage && <Message variant="error">{errorMessage}</Message>}
                {successMessage && <Message variant="success">{successMessage}</Message>}
                
                <form className="auth-form" onSubmit={handleRegister}>
                  <div className="form-group">
                    <label htmlFor="fullName">Tên người dùng</label>
                    <input
                      type="text"
                      id="fullName"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Mật khẩu</label>
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-login"
                    disabled={isRegisterLoading}
                  >
                    {isRegisterLoading ? <Loader /> : 'Đăng ký'}
                  </button>
                  
                  <div className="auth-link">
                    Đã có tài khỏan? <Link to="/login">Đăng nhập</Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>Xác thực mã OTP</h2>
                
                {errorMessage && <Message variant="error">{errorMessage}</Message>}
                {successMessage && <Message variant="success">{successMessage}</Message>}
                
                <form className="auth-form" onSubmit={handleVerifyOTP}>
                  <div className="form-group">
                    <label htmlFor="otp">Nhập mã OTP</label>
                    <input
                      type="text"
                      id="otp"
                      className="form-control"
                      placeholder="Nhập mã OTP đã được gửi đến email của bạn"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-login"
                    disabled={isVerifyLoading}
                  >
                    {isVerifyLoading ? <Loader /> : 'Verify'}
                  </button>
                  
                  <div className="auth-link">
                    <button 
                      type="button" 
                      className="btn-link"
                      onClick={() => setShowOtpForm(false)}
                    >
                      Quay lại đăng ký
                    </button>
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

export default RegisterPage; 