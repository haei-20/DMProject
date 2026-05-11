import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaThLarge,
  FaLightbulb,
  FaUtensils,
  FaCouch,
  FaSnowflake,
  FaShoppingBag,
  FaPen,
  FaBaby,
  FaGift,
  FaHeart,
  FaBirthdayCake,
  FaLeaf,
  FaPaw,
  FaHistory,
} from 'react-icons/fa';
import {
  CATEGORY_FORM_OPTIONS,
  CATEGORY_HOME_CARD_IMAGES,
  getCategoryDisplayEn,
  categoryPathEncoded,
} from '../constants/productCategoryTagMap';

const CATEGORY_ICONS = {
  General: FaThLarge,
  Lighting: FaLightbulb,
  'Kitchen & Dining': FaUtensils,
  'Home Decor': FaCouch,
  Christmas: FaSnowflake,
  'Storage & Bags': FaShoppingBag,
  Stationery: FaPen,
  'Toys & Kids': FaBaby,
  'Gift & Cards': FaGift,
  Romance: FaHeart,
  Party: FaBirthdayCake,
  Garden: FaLeaf,
  Animals: FaPaw,
  Vintage: FaHistory,
};

const CATEGORY_CARD_COLORS = [
  '#9b59b6',
  '#f39c12',
  '#3498db',
  '#e74c3c',
  '#1abc9c',
  '#34495e',
  '#16a085',
  '#e67e22',
  '#8e44ad',
  '#c0392b',
  '#27ae60',
  '#2980b9',
  '#d35400',
  '#7f8c8d',
];

const CategoryList = () => {
  const [imageFailed, setImageFailed] = useState({});

  const onImageError = useCallback((categoryKey) => {
    setImageFailed((prev) => ({ ...prev, [categoryKey]: true }));
  }, []);

  const categories = CATEGORY_FORM_OPTIONS.map((key, index) => {
    const Icon = CATEGORY_ICONS[key] || FaThLarge;
    const imageUrl = (CATEGORY_HOME_CARD_IMAGES[key] || '').trim();
    return {
      key,
      labelDisplay: getCategoryDisplayEn(key),
      icon: <Icon />,
      color: CATEGORY_CARD_COLORS[index % CATEGORY_CARD_COLORS.length],
      imageUrl,
    };
  });

  return (
    <div className="category-section py-4">
      <h2 className="section-title mb-4">Danh mục sản phẩm</h2>
      <div className="category-grid-row">
        {categories.map((category) => (
          <div key={category.key} className="col-category-tile">
            <Link to={categoryPathEncoded(category.key)} className="category-card">
              <div
                className={`category-image-container ${
                  category.imageUrl && !imageFailed[category.key] ? '' : 'category-image-container--solid'
                }`}
              >
                {category.imageUrl && !imageFailed[category.key] ? (
                  <img
                    src={category.imageUrl}
                    alt={category.labelDisplay}
                    className="category-image"
                    onError={() => onImageError(category.key)}
                  />
                ) : (
                  <div
                    className="category-gradient-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${category.color}33 0%, ${category.color}99 100%)`,
                    }}
                  />
                )}
                <div className="category-overlay" />
                <div
                  className="category-icon-wrapper"
                  style={{ backgroundColor: category.color, color: '#fff' }}
                >
                  {category.icon}
                </div>
              </div>
              <p className="category-name">{category.labelDisplay}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
