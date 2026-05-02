import React, { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import './ApiStatus.css';

// Create the status API slice with RTK Query
export const statusApi = createApi({
  reducerPath: 'statusApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' 
  }),
  endpoints: (builder) => ({
    getApiStatus: builder.query({
      query: () => '/status',
      // Poll every 2 minutes
      pollingInterval: 120000,
    }),
  }),
});

// Export the generated hooks
export const { useGetApiStatusQuery } = statusApi;

const ApiStatus = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    message: '',
    showAlert: false,
    retryCount: 0
  });
  
  // Check API status on mount and at longer intervals
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          // API is connected
          if (!status.isConnected) {
            // Was disconnected before, now reconnected
            setStatus({
              isConnected: true,
              message: 'Connection to API restored',
              showAlert: true,
              retryCount: 0
            });
      
            // Auto-hide the success message after 5 seconds
            setTimeout(() => {
              setStatus(prev => ({ ...prev, showAlert: false }));
            }, 5000);
          } else if (status.showAlert) {
            // Already connected and showing alert, hide it
            setStatus(prev => ({ ...prev, showAlert: false }));
          }
        } else {
          // API returned a non-200 status
          handleDisconnection(`API server error: ${response.status}`);
        }
      } catch (error) {
        // Network error, likely API is down
        handleDisconnection('Cannot connect to API server');
      }
    };
    
    const handleDisconnection = (message) => {
      setStatus(prev => ({
        isConnected: false,
        message,
        showAlert: true,
        retryCount: prev.retryCount + 1
      }));
    };
    
    // Check immediately
    checkApiStatus();
    
    // Then check every 2 minutes
    const interval = setInterval(checkApiStatus, 120000);
    
    return () => clearInterval(interval);
  }, [status.isConnected, status.showAlert, status.retryCount]);
  
  const handleClose = () => {
    setStatus(prev => ({ ...prev, showAlert: false }));
  };
  
  if (!status.showAlert) {
    return null;
  }
  
  return (
    <div className={`api-status-container ${status.isConnected ? 'success' : 'error'}`}>
      <Alert 
        variant={status.isConnected ? 'success' : 'danger'} 
        onClose={handleClose} 
        dismissible
        className="api-status-alert"
      >
        <div className="d-flex align-items-center">
          <div className={`status-indicator ${status.isConnected ? 'connected' : 'disconnected'}`} />
          <div className="status-message">
            {status.message}
            {!status.isConnected && status.retryCount > 1 && (
              <span className="retry-message"> (Retrying... {status.retryCount})</span>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default ApiStatus; 