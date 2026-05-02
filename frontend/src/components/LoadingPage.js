import React from 'react';

const LoadingPage = ({ message = "We are working task" }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">Please Wait</h2>
        <p className="loading-subtext">{message}</p>
      </div>
    </div>
  );
};

export default LoadingPage; 