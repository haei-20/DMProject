import React, { useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '../../services/api';
import './UserList.css';

const UserList = () => {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleEdit = (user) => {
    setCurrentUser({...user});
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId).unwrap();
        setSuccessMessage('User deleted successfully');
        // Success message will be cleared after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      if (currentUser._id) {
        // Update existing user
        await updateUser({
          id: currentUser._id,
          userData: {
            name: currentUser.name,
            email: currentUser.email,
            isAdmin: currentUser.isAdmin
          }
        }).unwrap();
        setSuccessMessage('User updated successfully');
      } else {
        // Create new user - this would need a createUser mutation
        // For simplicity, we'll just show a message
        setSuccessMessage('This would create a new user in a real API');
      }
      
    setShowModal(false);
      // Success message will be cleared after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleAddNew = () => {
    setCurrentUser({ _id: null, name: '', email: '', isAdmin: false });
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="user-list">
        <div className="user-list-header">
          <h1>Users Management</h1>
          <Button variant="primary" onClick={handleAddNew}>
            <FaUserPlus /> ADD NEW USER
          </Button>
        </div>

        {successMessage && (
          <Alert variant="success" className="my-3" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="my-3">
            Error loading users: {error.message}
            <Button variant="link" onClick={refetch}>Try again</Button>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading users...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users && users.map(user => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => handleEdit(user)}
                      disabled={isUpdating || isDeleting}
                    >
                      <FaEdit />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(user._id)}
                      disabled={isUpdating || isDeleting}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{currentUser?._id ? 'Edit User' : 'Add New User'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSave}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentUser?.name || ''} 
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={currentUser?.email || ''} 
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox" 
                  label="Admin Privileges" 
                  checked={currentUser?.isAdmin || false} 
                  onChange={(e) => setCurrentUser({...currentUser, isAdmin: e.target.checked})}
                />
              </Form.Group>
              {!currentUser?._id && (
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                    required={!currentUser?._id}
                  />
                </Form.Group>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                Save
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default UserList; 