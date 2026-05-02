import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import ApiDebug from '../../components/ApiDebug';
import './CategoryList.css';
import { 
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation
} from '../../services/api';

// Default categories to use if API doesn't return data
const defaultCategories = [
  { _id: 'milk', name: 'Sữa các loại', slug: 'sua-cac-loai' },
  { _id: 'produce', name: 'Rau - Củ - Trái Cây', slug: 'rau-cu-trai-cay' },
  { _id: 'cleaning', name: 'Hóa Phẩm - Tẩy rửa', slug: 'hoa-pham-tay-rua' },
  { _id: 'personal-care', name: 'Chăm Sóc Cá Nhân', slug: 'cham-soc-ca-nhan' },
  { _id: 'office-toys', name: 'Văn phòng phẩm - Đồ chơi', slug: 'van-phong-pham-do-choi' },
  { _id: 'candy', name: 'Bánh Kẹo', slug: 'banh-keo' },
  { _id: 'beverages', name: 'Đồ uống - Giải khát', slug: 'do-uong-giai-khat' },
  { _id: 'instant-food', name: 'Mì - Thực Phẩm Ăn Liền', slug: 'mi-thuc-pham-an-lien' }
];

const CategoryList = () => {
  const { data: apiCategories, isLoading, error, refetch } = useGetCategoriesQuery();
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [localCategories, setLocalCategories] = useState([]);
  
  // Use defaultCategories if API doesn't return data
  const categories = apiCategories && (Array.isArray(apiCategories) && apiCategories.length > 0) 
    ? apiCategories 
    : localCategories.length > 0 ? localCategories : defaultCategories;

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // Debug logging
  useEffect(() => {
    console.log('API Categories data:', apiCategories);
    console.log('Using categories:', categories);
    console.log('Loading state:', isLoading);
    console.log('Error state:', error);
  }, [categories, apiCategories, isLoading, error]);

  // Initialize local categories when API data is loaded
  useEffect(() => {
    if (apiCategories && Array.isArray(apiCategories) && apiCategories.length > 0) {
      setLocalCategories(apiCategories);
    } else {
      // Only set default categories on initial load
      const initialRun = localCategories.length === 0;
      if (initialRun) {
        setLocalCategories([...defaultCategories]);
      }
    }
  }, [apiCategories]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        // Try API call first
        await deleteCategory(categoryId).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete category:', err);
        
        // If API call fails, update locally
        const updatedCategories = localCategories.filter(cat => cat._id !== categoryId);
        setLocalCategories(updatedCategories);
        alert('API call failed, but category was removed from the UI.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory._id) {
        // Update existing category
        try {
          await updateCategory({
            id: currentCategory._id,
            categoryData: {
              name: currentCategory.name,
              slug: currentCategory.slug,
              description: currentCategory.description || ''
            }
          }).unwrap();
          refetch();
        } catch (err) {
          // If API call fails, update locally
          const updatedCategories = localCategories.map(cat => 
            cat._id === currentCategory._id ? {...currentCategory} : cat
          );
          setLocalCategories(updatedCategories);
          console.log('API call failed, but category was updated locally.');
        }
      } else {
        // Create new category
        try {
          const result = await createCategory({
            name: currentCategory.name,
            slug: currentCategory.slug,
            description: currentCategory.description || ''
          }).unwrap();
          refetch();
        } catch (err) {
          // If API call fails, add locally with temporary ID
          const newCategory = {
            ...currentCategory,
            _id: 'local_' + Date.now()
          };
          setLocalCategories([...localCategories, newCategory]);
          console.log('API call failed, but category was added locally.');
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleAddNew = () => {
    setCurrentCategory({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setCurrentCategory({
      ...currentCategory,
      name,
      slug: generateSlug(name)
    });
  };

  return (
    <AdminLayout>
      <ApiDebug 
        isLoading={isLoading}
        error={error}
        data={apiCategories}
        name="API Categories"
      />
      <div className="category-list">
        <div className="category-list-header">
          <h1>Categories Management</h1>
          <div className="category-actions">
            <Button variant="primary" onClick={handleAddNew}>
              <FaPlus /> Thêm danh mục
            </Button>
          </div>
        </div>

        {updateMessage && (
          <Alert variant={updateMessage.type} className="my-3" dismissible onClose={() => setUpdateMessage(null)}>
            {updateMessage.text}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="my-3">
            Error loading categories from API: {error.message || 'Unknown error'}. Using default categories.
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading categories...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category._id}>
                  <td>{category._id}</td>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="me-2" 
                      onClick={() => handleEdit(category)}
                      disabled={isDeleting}
                    >
                      <FaEdit />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDelete(category._id)}
                      disabled={isDeleting}
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
            <Modal.Title>{currentCategory?._id ? 'Edit Category' : 'Add New Category'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSave}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Category Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentCategory?.name || ''} 
                  onChange={handleNameChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Slug</Form.Label>
                <InputGroup>
                  <InputGroup.Text>/</InputGroup.Text>
                  <Form.Control 
                    type="text" 
                    value={currentCategory?.slug || ''} 
                    onChange={(e) => setCurrentCategory({...currentCategory, slug: e.target.value})}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Used for URL. Auto-generated from name, but you can customize it.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={3}
                  value={currentCategory?.description || ''} 
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && <Spinner animation="border" size="sm" className="me-2" />}
                Save
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default CategoryList; 