import React, { useState, useMemo } from 'react';
import { Table, Button, Modal, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import ApiDebug from '../../components/ApiDebug';
import './CategoryList.css';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../services/api';
import { CATEGORY_FORM_OPTIONS } from '../../constants/productCategoryTagMap';

const ALLOWED_NAMES = new Set(CATEGORY_FORM_OPTIONS);

function slugFromName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Luôn 14 dòng — trùng trang chủ / Product.category; ghép với Mongo nếu có name khớp. */
function buildTaxonomyRows(apiCategories) {
  const apiList = Array.isArray(apiCategories) ? apiCategories : [];
  const byName = {};
  apiList.forEach((c) => {
    if (c?.name && ALLOWED_NAMES.has(c.name)) {
      byName[c.name] = c;
    }
  });
  return CATEGORY_FORM_OPTIONS.map((name, index) => {
    const doc = byName[name];
    if (doc) {
      return { ...doc, __virtual: false };
    }
    return {
      _id: `virtual__${index}`,
      name,
      slug: slugFromName(name),
      description: '',
      __virtual: true,
    };
  });
}

const CategoryList = () => {
  const { data: apiCategories, isLoading, error, refetch } = useGetCategoriesQuery();
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);

  const categories = useMemo(() => buildTaxonomyRows(apiCategories), [apiCategories]);

  const extraMongoCategories = useMemo(() => {
    return (Array.isArray(apiCategories) ? apiCategories : []).filter(
      (c) => c?.name && !ALLOWED_NAMES.has(c.name)
    );
  }, [apiCategories]);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const isVirtualId = (row) =>
    row?.__virtual === true || /^virtual__\d+$/.test(String(row?._id || ''));

  const handleEdit = (category) => {
    setCurrentCategory({ ...category });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (isVirtualId(category)) {
      alert('Danh mục này chỉ có trên taxonomy (chưa có bản ghi MongoDB) — không cần xóa.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
      try {
        await deleteCategory(category._id).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Xóa thất bại. Kiểm tra xem còn sản phẩm dùng danh mục này không.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const body = {
      name: currentCategory.name,
      slug: currentCategory.slug,
      description: currentCategory.description || '',
    };
    try {
      if (isVirtualId(currentCategory)) {
        await createCategory(body).unwrap();
        refetch();
      } else if (currentCategory._id) {
        await updateCategory({
          id: currentCategory._id,
          categoryData: body,
        }).unwrap();
        refetch();
      } else {
        await createCategory(body).unwrap();
        refetch();
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Không thể lưu danh mục. Vui lòng thử lại.');
    }
  };

  const handleAddNew = () => {
    setCurrentCategory({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setCurrentCategory({
      ...currentCategory,
      name,
      slug: slugFromName(name),
    });
  };

  /** Dòng virtual: khóa tên để luôn khớp 14 nhóm chuẩn */
  const lockTaxonomyName =
    currentCategory &&
    isVirtualId(currentCategory) &&
    ALLOWED_NAMES.has(currentCategory.name);

  return (
    <AdminLayout>
      <ApiDebug isLoading={isLoading} error={error} data={apiCategories} name="Danh mục API" />
      <div className="category-list">
        <div className="category-list-header">
          <h1>Quản lý danh mục</h1>
          <div className="category-actions">
            <Button variant="primary" onClick={handleAddNew}>
              <FaPlus /> Thêm danh mục
            </Button>
          </div>
        </div>

        {extraMongoCategories.length > 0 && (
          <Alert variant="warning" className="my-3">
            Có <strong>{extraMongoCategories.length}</strong> danh mục trong MongoDB{' '}
            <em>không</em> thuộc 14 nhóm chuẩn (không xuất hiện trên trang chủ):{' '}
            {extraMongoCategories.map((c) => c.name).join(', ')}. Có thể xóa thủ công nếu không dùng.
          </Alert>
        )}

        {updateMessage && (
          <Alert
            variant={updateMessage.type}
            className="my-3"
            dismissible
            onClose={() => setUpdateMessage(null)}
          >
            {updateMessage.text}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="my-3">
            Lỗi tải danh mục từ API: {error.message || 'Lỗi không xác định'}. Bảng vẫn hiện 14 nhóm
            chuẩn (chưa ghép _id Mongo).
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh mục...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên (Product.category)</th>
                <th>Slug</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    {category.__virtual ? (
                      <span className="text-muted">{category._id}</span>
                    ) : (
                      category._id
                    )}
                  </td>
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
                      onClick={() => handleDelete(category)}
                      disabled={isDeleting || category.__virtual}
                      title={category.__virtual ? 'Chưa có trong DB' : 'Xóa'}
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
            <Modal.Title>
              {currentCategory?._id && !isVirtualId(currentCategory)
                ? 'Sửa danh mục'
                : currentCategory?.name && ALLOWED_NAMES.has(currentCategory.name)
                  ? 'Tạo / cập nhật danh mục chuẩn'
                  : 'Thêm danh mục mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSave}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Tên danh mục</Form.Label>
                <Form.Control
                  type="text"
                  value={currentCategory?.name || ''}
                  onChange={handleNameChange}
                  required
                  disabled={!!lockTaxonomyName}
                />
                {lockTaxonomyName && (
                  <Form.Text className="text-muted">
                    Tên cố định theo 14 nhóm chuẩn (trùng trang chủ).
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Slug</Form.Label>
                <InputGroup>
                  <InputGroup.Text>/</InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={currentCategory?.slug || ''}
                    onChange={(e) =>
                      setCurrentCategory({ ...currentCategory, slug: e.target.value })
                    }
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Dùng cho URL. Tự động tạo từ tên khi đổi tên (có thể chỉnh tay).
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={currentCategory?.description || ''}
                  onChange={(e) =>
                    setCurrentCategory({ ...currentCategory, description: e.target.value })
                  }
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Spinner animation="border" size="sm" className="me-2" />
                )}
                Lưu
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default CategoryList;
