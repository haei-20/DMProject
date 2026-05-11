import React, { useState } from 'react';
import { Card, Button, Row, Col, Badge, Toast } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAddToCartMutation, useAddToWishlistMutation, useRemoveFromWishlistMutation, useGetWishlistQuery } from '../services/api';
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar, FaCheck } from 'react-icons/fa';
import { formatPrice } from '../utils/productHelpers';
import { DEFAULT_PRODUCT_IMAGE_URL } from '../constants/defaultProductImageUrl';
import { getCategoryDisplayEn } from '../constants/productCategoryTagMap';
import { addToCart } from '../redux/slices/cartSlice';
import './ProductCard.css';

const ProductCard = ({ product, inWishlist = false }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { data: wishlistItems = [] } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated
  });
  const dispatch = useDispatch();
  
  // Check if product is in wishlist
  const isInWishlist = inWishlist || wishlistItems.some(item => item._id === product._id);
  
  const [addToCartApi, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToWishlist, { isLoading: isAddingToWishlist }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistMutation();
  
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist;
  const productImage = product?.image?.trim() ? product.image : DEFAULT_PRODUCT_IMAGE_URL;
  const priceValue = Number(product?.price ?? 0);
  const discountValue = Number(product?.discount ?? 0);
  const ratingValue = Number(product?.rating ?? 0);
  const reviewsCount = Number(product?.numReviews ?? 0);
  const safeCurrentPrice = Number.isFinite(priceValue)
    ? priceValue * (1 - (Number.isFinite(discountValue) ? discountValue : 0) / 100)
    : 0;
  
  // Add state for showing success toast
  const [showToast, setShowToast] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Enhanced handle add to cart
  const handleAddToCart = async (e) => {
    // Prevent navigation to product page if clicked through Link
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setAddedSuccess(false);
      
      // Create cart item
      const cartItem = {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.salePrice || product.price,
        originalPrice: product.price,
        countInStock: product.stock || product.countInStock,
        quantity: 1
      };
      
      // Add to Redux store first (this works immediately)
      dispatch(addToCart(cartItem));
      
      // Then try to sync with backend
      await addToCartApi({ 
        productId: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        originalPrice: product.price,
        quantity: 1
      });
      
      // Show success indicator
      setAddedSuccess(true);
      setShowToast(true);
      // Hide toast after 2 seconds
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Even if API fails, we've already updated the Redux store
      // so the user will still see their item in the cart
      setAddedSuccess(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };
  
  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      if (isInWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };
  
  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="star-filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="star-half" />);
      } else {
        stars.push(<FaRegStar key={i} className="star-empty" />);
      }
    }
    
    return stars;
  };

  return (
    <Card className="product-card h-100">
      {product.discount > 0 && (
        <div className="discount-badge">
          <Badge bg="danger">-{product.discount}%</Badge>
        </div>
      )}
      
      {isAuthenticated && (
        <Button
          variant="link"
          className={`wishlist-btn ${isInWishlist ? 'in-wishlist' : ''}`}
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
        >
          {isInWishlist ? <FaHeart /> : <FaRegHeart />}
        </Button>
      )}
      
      {/* Quick add to cart toast notification */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)}
        className="position-absolute add-success-toast"
        style={{ 
          zIndex: 5, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Toast.Body className="d-flex align-items-center bg-success text-white">
          <FaCheck className="me-2" /> Đã thêm vào giỏ hàng!
        </Toast.Body>
      </Toast>
      
      <Link to={`/product/${product._id}`} className="product-link">
        <div className="product-image-container">
          <Card.Img 
            variant="top" 
            src={productImage} 
            alt={product.name} 
            className="product-image"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = DEFAULT_PRODUCT_IMAGE_URL;
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          
          {/* Add Quick Add To Cart overlay button */}
          {/* <Button 
            variant="primary" 
            className="quick-add-overlay-btn"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !(product.stock || product.countInStock)}
          >
            <FaShoppingCart className="me-2" /> Thêm vào giỏ
          </Button> */}
        </div>
      </Link>
      
      <Card.Body className="d-flex flex-column">
        <Link to={`/product/${product._id}`} className="product-link">
          <Card.Title className="product-title">{product.name}</Card.Title>
        </Link>
        <div className="product-meta-badges">
          {product.category && (
            <Badge bg="secondary" className="product-category-badge">
              {getCategoryDisplayEn(product.category)}
            </Badge>
          )}
          {Array.isArray(product.tags) &&
            product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} pill bg="light" text="dark" className="product-tag-badge border">
                {tag}
              </Badge>
            ))}
          {Array.isArray(product.tags) && product.tags.length > 3 && (
            <Badge pill bg="light" className="product-tag-badge border text-muted">
              +{product.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="my-2 product-rating">
          {renderStars(ratingValue)}
          <span className="rating-count">({Number.isFinite(reviewsCount) ? reviewsCount : 0})</span>
        </div>
        
        <div className="product-price-row mt-auto">
          <div className="product-price">
            {discountValue > 0 && (
              <span className="original-price">
                {formatPrice(Number.isFinite(priceValue) ? priceValue : 0)}
              </span>
            )}
            <span className="current-price">
              {formatPrice(safeCurrentPrice)}
            </span>
          </div>
          <Button 
            variant={addedSuccess ? "success" : "primary"}
            className="cart-button"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !(product.stock || product.countInStock)}
            title="Thêm vào giỏ hàng"
          >
            {isAddingToCart ? '...' : addedSuccess ? <FaCheck /> : <FaShoppingCart />}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard; 