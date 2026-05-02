import React from 'react';

const Message = ({ variant = 'info', children }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className={`alert ${getVariantClass()}`} role="alert">
      {children}
    </div>
  );
};

export default Message; 