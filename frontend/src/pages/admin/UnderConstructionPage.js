import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTools, FaArrowLeft } from 'react-icons/fa';
import AdminLayout from './AdminLayout';

const UnderConstructionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AdminLayout>
      <Container className="py-4">
        <div className="text-center mb-4">
          <FaTools size={64} className="text-warning mb-3" />
          <h1>Under Construction</h1>
          <p className="lead text-muted">
            This page ({location.pathname}) is currently under development.
          </p>
        </div>
        
        <Alert variant="info">
          <Alert.Heading>Coming Soon</Alert.Heading>
          <p>
            We're working hard to bring you this feature. Please check back later or 
            contact the development team for more information.
          </p>
        </Alert>
        
        <div className="text-center mt-4">
          <Button variant="primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </div>
      </Container>
    </AdminLayout>
  );
};

export default UnderConstructionPage; 