import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import TransitionOverlay from '../ui/TransitionOverlay';

const ADD_TO_CART_NAV_MS = 2500;

function sizesForProduct(product) {
  const raw = product.sizes?.filter(Boolean);
  if (raw?.length) return raw;
  return ['One Size'];
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const id = product._id || product.id;
  const rating = Number(product.rating);
  const ratingNum = Number.isFinite(rating) ? rating : 0;
  const ratingLabel = ratingNum.toFixed(1);

  const sizes = sizesForProduct(product);

  const [selectedSize, setSelectedSize] = useState(() =>
    sizes.length === 1 && sizes[0] === 'One Size' ? sizes[0] : ''
  );
  const [goingToCart, setGoingToCart] = useState(false);
  const cartNavTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cartNavTimerRef.current) clearTimeout(cartNavTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const sz = sizesForProduct(product);
    setSelectedSize(sz.length === 1 && sz[0] === 'One Size' ? sz[0] : '');
  }, [product._id, product.id]);

  const needsSizePick = !(sizes.length === 1 && sizes[0] === 'One Size');
  const canAdd = Boolean(selectedSize);

  const renderStars = (r) => {
    const full = Math.floor(r);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  const discountPct =
    product.originalPrice != null &&
    product.originalPrice > product.price &&
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedSize) return;
    const colors = product.colors?.length ? product.colors : ['Default'];
    addItem({
      productId: id,
      name: product.name,
      image: product.image,
      price: product.price,
      color: colors[0],
      size: selectedSize,
      qty: 1,
    });
    setGoingToCart(true);
    cartNavTimerRef.current = setTimeout(() => {
      cartNavTimerRef.current = null;
      navigate('/cart');
    }, ADD_TO_CART_NAV_MS);
  };

  const pickSize = (e, s) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize((prev) => (prev === s ? '' : s));
  };

  return (
    <div className="product-card">
      <TransitionOverlay
        show={goingToCart}
        title="Added to cart"
        subtitle="Taking you to your bag…"
      />
      <Link to={`/product/${id}`} className="product-card-top">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <div className="product-rating">
            <span className="stars">{renderStars(ratingNum)}</span>
            <span className="count">{ratingLabel}/5</span>
          </div>
          <div className="product-price">
            <span className="current-price">${product.price}</span>
            {product.originalPrice != null && product.originalPrice > product.price && (
              <>
                <span className="original-price">${product.originalPrice}</span>
                {discountPct != null && <span className="discount-tag">-{discountPct}%</span>}
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="product-card-footer">
        <span className="product-card-size-label">Size</span>
        <div className="product-card-sizes" role="group" aria-label="Choose size">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              className={`product-card-size-chip ${selectedSize === s ? 'selected' : ''}`}
              aria-pressed={selectedSize === s}
              onClick={(e) => pickSize(e, s)}
            >
              {s}
            </button>
          ))}
        </div>
        {needsSizePick && !selectedSize ? (
          <p className="product-card-size-hint">Select a size to add to cart</p>
        ) : null}
        <button
          type="button"
          className="add-to-cart-btn"
          disabled={!canAdd || goingToCart}
          onClick={handleAddToCart}
        >
          {goingToCart ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
