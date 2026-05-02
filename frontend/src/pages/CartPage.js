import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { 
  removeFromCart, 
  updateCartQuantity, 
  calculatePrices 
} from '../redux/slices/cartSlice';
import { formatPrice, formatImageUrl } from '../utils/productHelpers';
import Layout from '../components/Layout';
import EmptyOrderPage from './EmptyOrderPage';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items, itemsPrice, shippingPrice, totalPrice } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Calculate totals whenever cart items change
  useEffect(() => {
    dispatch(calculatePrices());
  }, [items, dispatch]);

  const handleQuantityUpdate = (id, newQuantity) => {
    if (newQuantity > 0) {
      dispatch(updateCartQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/payment');
    } else {
      navigate('/login?redirect=payment');
    }
  };

  // If cart is empty, show the empty order page
  if (items.length === 0) {
    return <EmptyOrderPage />;
  }

  return (
    <Layout>
      <div className="cart-container">
        <h1>Your box</h1>
        
        <div className="cart-items">
          {items.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-image-container">
                <img 
                  src={formatImageUrl(item.image)} 
                  alt={item.name} 
                  className="cart-item-image" 
                />
              </div>
              
              <div className="cart-item-details">
                <h3 className="cart-item-title">{item.name}</h3>
                <div className="cart-item-price">
                  {formatPrice(item.price)}
                  {item.originalPrice && item.price < item.originalPrice && (
                    <span className="original-price ms-2">{formatPrice(item.originalPrice)}</span>
                  )}
                </div>
                
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityUpdate(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityUpdate(item._id, item.quantity + 1)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="cart-item-total">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <div className="summary-item">
            <span>Order Price</span>
            <span>{formatPrice(itemsPrice)}</span>
          </div>
          
          <div className="summary-item">
            <span>Shipping Cost ({items.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
            <span>{formatPrice(shippingPrice)}</span>
          </div>
          
          <div className="summary-item summary-total">
            <span>Total:</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          
          <div className="cart-summary-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button 
              className="btn-pink"
              onClick={handleCheckout}
            >
              Checkout
            </button>
            <button 
              className="btn-pink"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage; 