import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import AdminLayout from './AdminLayout';
import ProductForm from '../../components/admin/ProductForm';

const CreateProductPage = () => {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    // Redirect back to product list after successful creation
    navigate('/admin/products');
  };
  
  return (
    <AdminLayout>
      <Container>
        <h1 className="mb-4">Add New Product</h1>
        <ProductForm 
          mode="create"
          onSuccess={handleSuccess}
        />
      </Container>
    </AdminLayout>
  );
};

export default CreateProductPage; 