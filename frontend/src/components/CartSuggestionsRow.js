import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatImageUrl } from '../utils/productHelpers';
import './CartSuggestionsRow.css';

export default function CartSuggestionsRow({
  title = 'Có thể bạn cần',
  products = [],
  onAdd,
  compact = false,
}) {
  if (!products.length) return null;

  return (
    <div className={`cart-suggestions${compact ? ' cart-suggestions--compact' : ''}`}>
      <h2 className="cart-suggestions-title">{title}</h2>
      <div className="cart-suggestions-scroll">
        {products.map((p) => (
          <div key={String(p._id)} className="cart-suggestions-card">
            <Link to={`/product/${p._id}`} className="cart-suggestions-link">
              <img
                src={formatImageUrl(p.image || (Array.isArray(p.images) && p.images[0]))}
                alt={p.name || ''}
                className="cart-suggestions-img"
              />
              <span className="cart-suggestions-name">{p.name}</span>
              <span className="cart-suggestions-price">{formatPrice(p.price)}</span>
            </Link>
            {onAdd && (
              <button type="button" className="cart-suggestions-add" onClick={() => onAdd(p)}>
                Thêm
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
