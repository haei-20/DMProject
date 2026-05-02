import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';

const ApiConnectionTest = () => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  
  const testConnection = async () => {
    setStatus('loading');
    setError('');
    
    // Get the API URL from environment or use default
    const url = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    setApiUrl(url);
    
    try {
      // Test the API status endpoint
      const response = await axios.get(`${url}/status`, {
        timeout: 5000 // 5 second timeout
      });
      setStatus('success');
      setMessage(response.data?.message || JSON.stringify(response.data));
    } catch (err) {
      setStatus('error');
      if (err.response) {
        // Server responded with a status code outside the 2xx range
        setError(`Server error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. The backend server may not be running.');
      } else {
        // Error setting up the request
        setError(err.message || 'Error connecting to the API');
      }
      console.error('API Connection Error:', err);
    }
  };

  useEffect(() => {
    // Automatically test on component mount
    testConnection();
  }, []);

  return (
    <Card className="my-4">
      <Card.Header as="h5">API Connection Status</Card.Header>
      <Card.Body>
        {status === 'loading' && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Testing connection to backend API...</p>
          </div>
        )}
        
        {status === 'success' && (
          <Alert variant="success">
            <Alert.Heading>Connection Successful!</Alert.Heading>
            <p>
              The frontend is successfully connected to the backend API at 
              <code> {apiUrl}</code>
            </p>
            <p>Response: {message}</p>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="danger">
            <Alert.Heading>Connection Failed</Alert.Heading>
            <p>There was an error connecting to the backend API:</p>
            <p><strong>{error}</strong></p>
            <hr />
            <p className="mb-0">
              Please ensure that:
              <ul>
                <li>The backend server is running at <code>{apiUrl}</code></li>
                <li>The API has a <code>/status</code> endpoint implemented</li>
                <li>CORS is properly configured on the backend</li>
                <li>There are no network issues preventing the connection</li>
              </ul>
            </p>
          </Alert>
        )}
        
        <Button 
          variant="primary" 
          onClick={testConnection} 
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Testing...' : 'Test API Connection'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ApiConnectionTest; 