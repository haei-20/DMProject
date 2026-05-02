import React, { useState, useEffect } from 'react';
import LoadingPage from '../components/LoadingPage';
import Layout from '../components/Layout';

const LoadingDemoPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("We are working task");
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    let interval;
    
    if (isLoading) {
      // Create countdown timer
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          // When timer reaches 0, stop loading
          if (prevTimer <= 1) {
            clearInterval(interval);
            setIsLoading(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [isLoading]);

  const handleRestart = () => {
    setTimer(5);
    setIsLoading(true);
  };

  const handleMessageChange = (e) => {
    setLoadingMessage(e.target.value);
  };

  return (
    <Layout>
      <div className="loading-demo-container">
        <h1>Loading Page Demo</h1>
        <p>This page demonstrates the loading overlay component.</p>
        
        <div className="demo-controls">
          <div className="form-group">
            <label htmlFor="loadingMessage">Custom Loading Message:</label>
            <input
              type="text"
              id="loadingMessage"
              className="form-control"
              value={loadingMessage}
              onChange={handleMessageChange}
            />
          </div>
          
          <button 
            className="btn-login" 
            onClick={handleRestart}
          >
            Show Loading Page Again
          </button>
        </div>
        
        <div className="loading-example">
          <h2>This content will be visible but blurred when loading</h2>
          <p>The loading overlay will appear on top of this content, making it slightly visible but blurred underneath.</p>
          <div className="example-box">
            <p>You can still see the general layout of the page while it's loading.</p>
          </div>
        </div>
      </div>
      
      {isLoading && <LoadingPage message={`${loadingMessage} (${timer}s)`} />}
    </Layout>
  );
};

export default LoadingDemoPage; 