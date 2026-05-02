import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { 
  FaTshirt, 
  FaMobile, 
  FaLaptop, 
  FaHeadphones, 
  FaHome, 
  FaGift, 
  FaBook, 
  FaBabyCarriage,
  FaFootballBall,
  FaUtensils
} from 'react-icons/fa';

const CategoryList = () => {
  // Enhanced categories with icons and colors
  const categories = [
    { id: 1, name: 'Accessories', icon: <FaHome />, color: '#9b59b6', image: 'https://tse1.mm.bing.net/th?id=OIP.5FbVgzH6eQ7OiGqTT8BRkwHaFj&pid=Api&P=0&h=180' },
    { id: 2, name: 'Decoration', icon: <FaGift />, color: '#e74c3c', image: 'https://www.dacsanhuongviet.vn/site/wp-content/uploads/2022/12/Banh-keo-ngay-xua-1-1536x1151.jpg' },
    { id: 3, name: 'Kitchen', icon: <FaBook />, color: '#3498db', image: 'https://tse3.mm.bing.net/th?id=OIP.WPLeUTEXLTybj9PgkZrf5AHaE8&pid=Api&P=0&h=180' },
    { id: 4, name: 'Others', icon: <FaBabyCarriage />, color: '#1abc9c', image: 'https://tse3.mm.bing.net/th?id=OIP.9wO_Bv1f9SHYqn7M2m_PZQHaHa&pid=Api&P=0&h=180' },
    { id: 5, name: 'Toys', icon: <FaFootballBall />, color: '#27ae60', image: 'https://img.freepik.com/premium-vector/hot-deals-vector-icon-flat-promotion-banner-hot-deal-price-tag-sale-offer-price_567423-966.jpg?w=2000' },

  ];

  return (
    <div className="category-section py-4">
      <h2 className="section-title mb-4">Danh mục sản phẩm</h2>
      <Row className="g-2">
      {categories.map((category) => (
  <div key={category.id} className="col-5-products">
    <Link 
      to={category.id === 10 ? '/combo' : `/?category=${category.name.toLowerCase()}`} 
      className="category-card"
    >
      <div className="category-image-container">
        <img 
          src={category.image} 
          alt={category.name} 
          className="category-image" 
        />
        <div className="category-overlay"></div>
        <div 
          className="category-icon-wrapper" 
          style={{ backgroundColor: `${category.color}`, color: 'var(--primary-color)' }}
        >
          {category.icon}
        </div>
      </div>
      <p className="category-name">{category.name}</p>
    </Link>
  </div>
))}

      </Row>
    </div>
  );
};

export default CategoryList; 