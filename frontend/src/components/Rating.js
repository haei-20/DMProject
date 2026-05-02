import React from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const Rating = ({ value, text, color }) => {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {value >= star ? (
            <FaStar style={{ color: color || '#f8e825' }} />
          ) : value >= star - 0.5 ? (
            <FaStarHalfAlt style={{ color: color || '#f8e825' }} />
          ) : (
            <FaRegStar style={{ color: color || '#f8e825' }} />
          )}
        </span>
      ))}
      {text && <span className="rating-text">{text}</span>}
    </div>
  );
};

export default Rating; 