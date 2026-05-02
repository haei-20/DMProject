import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaChevronRight, FaMapMarkerAlt, FaCreditCard, FaClipboardList, FaStar, FaGift, FaSignOutAlt } from 'react-icons/fa';
import { logout } from '../redux/slices/authSlice';
import { useGetUserProfileQuery } from '../services/api';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const { data: userProfile, error: profileError, isLoading: profileLoading } = useGetUserProfileQuery();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const profileOptions = [
    {
      id: 'address',
      name: 'Manage Adress',
      icon: <FaMapMarkerAlt color="#D25B70" size={20} />,
      onClick: () => navigate('/profile/address'),
    },
    {
      id: 'payment',
      name: 'Payment',
      icon: <FaCreditCard color="#D25B70" size={20} />,
      onClick: () => navigate('/payment'),
    },
    {
      id: 'orders',
      name: 'Orders',
      icon: <FaClipboardList color="#D25B70" size={20} />,
      onClick: () => navigate('/orders'),
    },
    {
      id: 'favorites',
      name: 'Favourites',
      icon: <FaStar color="#D25B70" size={20} />,
      onClick: () => navigate('/wishlist'),
    },
    {
      id: 'offers',
      name: 'Offers',
      icon: <FaGift color="#D25B70" size={20} />,
      onClick: () => navigate('/offers'),
    }
  ];

  if (profileLoading) return <Loader />;
  if (profileError) return <Message variant="error">{profileError?.data?.message || 'Failed to load profile'}</Message>;

  return (
    <div className="profile-screen">
      <div className="profile-header-bar">
        <div className="profile-title">
          <h1>Your order</h1>
          <p>Order now!</p>
        </div>
        
        <div className="profile-address-prompt">
          <FaMapMarkerAlt color="#fff" />
          <span>Write your adress</span>
        </div>
      </div>
      
      <div className="profile-content-card">
        <div className="profile-options-list">
          {profileOptions.map((option) => (
            <div 
              key={option.id} 
              className="profile-option-item"
              onClick={option.onClick}
            >
              <div className="option-left">
                <div className="option-icon">
                  {option.icon}
                </div>
                <div className="option-name">
                  {option.name}
                </div>
              </div>
              <div className="option-right">
                <FaChevronRight color="#666" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="logout-button" onClick={handleLogout}>
          Log Out
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 