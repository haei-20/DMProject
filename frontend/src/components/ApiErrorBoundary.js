import React from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import './ApiErrorBoundary.css';

/**
 * A component for consistently handling API errors and loading states
 */
const ApiErrorBoundary = ({ 
  children, 
  isLoading, 
  error, 
  loadingComponent, 
  errorComponent,
  loadingText = 'Đang tải dữ liệu...',
  errorTitle = 'Lỗi tải dữ liệu',
  errorText,
  retryFunction
}) => {
  // Use custom loading component if provided, otherwise use default spinner
  const renderLoadingState = () => {
    if (loadingComponent) return loadingComponent;
    return (
      <div className="api-error-boundary-loading">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">{loadingText}</p>
      </div>
    );
  };
  
  // Use custom error component if provided, otherwise use default alert
  const renderErrorState = () => {
    if (errorComponent) return errorComponent;
    
    // Extract error message from different error formats
    let errorMessage = errorText;
    if (!errorMessage) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.status) {
        errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown Error'}`;
      } else {
        errorMessage = 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.';
      }
    }
    
    return (
      <Alert variant="danger" className="api-error-boundary-alert">
        <Alert.Heading>{errorTitle}</Alert.Heading>
        <p>{errorMessage}</p>
        {retryFunction && (
          <div className="d-flex justify-content-end">
            <Button onClick={retryFunction} variant="outline-danger">
              Thử lại
            </Button>
          </div>
        )}
      </Alert>
    );
  };
  
  // First, handle loading state
  if (isLoading) {
    return renderLoadingState();
  }
  
  // Then, handle error state
  if (error) {
    return renderErrorState();
  }
  
  // If everything is fine, render children
  return children;
};

export default ApiErrorBoundary; 