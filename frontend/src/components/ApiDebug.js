import React, { useEffect } from 'react';

// This component is used for debugging API responses
const ApiDebug = ({ isLoading, error, data, name = 'API' }) => {
  useEffect(() => {
    if (isLoading) {
      console.log(`${name} loading...`);
    } else if (error) {
      console.error(`${name} error:`, error);
    } else {
      console.log(`${name} data:`, data);
    }
  }, [isLoading, error, data, name]);

  return null; // This component doesn't render anything
};

export default ApiDebug; 