import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useAddToCartMutation } from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Message from '../components/Message';
import './WishlistPage.css';
import { formatPrice } from '../utils/productHelpers';

const WishlistPage = () => {
  const navigate = useNavigate();
  
  // Fetch wishlist data
  const { data: wishlist, error, isLoading, refetch } = useGetWishlistQuery();
  
  // Mutations
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      refetch(); // Refresh the wishlist data
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  // Handle adding item to cart
  const handleAddToCart = async (product) => {
    try {
      await addToCart({
        productId: product._id,
        quantity: 1
      });
      // Optionally navigate to cart or show success message
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <h1 className="mb-4">Danh sách yêu thích của tôi</h1>
        
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">
            Lỗi khi tải danh sách yêu thích: {error.data?.message || error.error}
          </Message>
        ) : !wishlist || wishlist.length === 0 ? (
          <Alert variant="info">
            <Alert.Heading>Danh sách trống</Alert.Heading>
            <p>
              Khi bạn thêm sản phẩm vào danh sách yêu thích, chúng sẽ xuất hiện tại đây.
              Hãy bắt đầu mua sắm và thêm những sản phẩm bạn yêu thích!
            </p>
            <div>
              <Button variant="primary" onClick={() => navigate('/')}>
                Xem các sản phẩm
              </Button>
            </div>
          </Alert>
        ) : (
          <Row className={`wishlist-grid ${wishlist.length === 1 ? 'single-item' : ''}`}>
            {wishlist.map((item) => (
              <Col key={item._id} sm={6} md={4} lg={3} className="mb-4">
                <Card className="wishlist-item">
                  <div className="product-image22-container">
                    <Card.Img 
                      variant="top" 
                      src={item.image || '/images/product-placeholder.png'} 
                      alt={item.name}
                      className="product-image22 cursor-pointer"
                      onClick={() => navigate(`/product/${item._id}`)}
                    />
                  </div>
                  <Card.Body>
                    <Card.Title 
                      className="product-title cursor-pointer"
                      onClick={() => navigate(`/product/${item._id}`)}
                    >
                      {item.name}
                    </Card.Title>
                    <Card.Text className="product-price">
                      {formatPrice(item.price)}
                    </Card.Text>
                    <div className="button-row">
                      <Button
                        variant="outline-danger"
                        className="remove-btn"
                        onClick={() => handleRemoveFromWishlist(item._id)}
                        disabled={isRemoving}
                      >
                        <FaTrash /> Xóa
                      </Button>
                      <Button
                        variant="primary"
                        className="add-cart-btn"
                        onClick={() => handleAddToCart(item)}
                        disabled={isAddingToCart}
                      >
                        <FaShoppingCart /> 
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </Layout>
  );
};

export default WishlistPage; 