import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyOTPMutation, useResendOTPMutation } from '../services/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import Layout from '../components/Layout';
import Loader from '../components/Loader';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Extract email from state or query param
  const email = location.state?.email || new URLSearchParams(location.search).get('email');
  
  const [otp, setOtp] = useState('');
  const [formError, setFormError] = useState('');
  const [showResendSuccess, setShowResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // OTP verification mutation
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
  
  // Resend OTP mutation
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();
  
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);
  
  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  // Handle OTP input change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
    if (value.length <= 6) { // Limit to 6 digits
      setOtp(value);
    }
  };
  
  // Handle OTP verification
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      setFormError('');
      const result = await verifyOTP({ email, otp }).unwrap();
      
      // If verification successful, store user data and token
      if (result.token && result.user) {
        dispatch(setCredentials({
          user: result.user,
          token: result.token
        }));
        navigate('/');
      }
    } catch (err) {
      setFormError(err.data?.message || 'Verification failed. Please try again.');
    }
  };
  
  // Handle resend OTP
  const handleResend = async () => {
    try {
      await resendOTP({ email }).unwrap();
      setShowResendSuccess(true);
      setCountdown(60); // 60 seconds cooldown
      setTimeout(() => setShowResendSuccess(false), 5000);
    } catch (err) {
      setFormError(err.data?.message || 'Failed to resend OTP. Please try again.');
    }
  };
  
  if (!email) {
    return null; // Navigate happens in useEffect
  }
  
  return (
    <Layout>
      <Container className="py-5">
        <Card className="p-4 mx-auto" style={{ maxWidth: '500px' }}>
          <h2 className="text-center mb-4">Verify Your Account</h2>
          
          <p className="text-center mb-4">
            We've sent a verification code to <strong>{email}</strong>
          </p>
          
          {formError && <Alert variant="danger">{formError}</Alert>}
          {showResendSuccess && (
            <Alert variant="success">
              A new verification code has been sent to your email.
            </Alert>
          )}
          
          <Form onSubmit={handleVerify}>
            <Form.Group className="mb-3">
              <Form.Label>Enter 6-digit verification code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={isVerifying}
              />
            </Form.Group>
            
            <Button
              variant="primary"
              type="submit"
              className="w-100 mb-3"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? <Loader size="sm" inline /> : 'Verify Account'}
            </Button>
            
            <div className="text-center mt-3">
              <p>Didn't receive the code?</p>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={isResending || countdown > 0}
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend verification code'}
              </Button>
            </div>
          </Form>
        </Card>
      </Container>
    </Layout>
  );
};

export default OTPVerificationPage; 