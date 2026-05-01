import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TransitionOverlay from '../components/ui/TransitionOverlay';
import { useCart } from '../context/CartContext';
import '../styles/cart.css';

const CHECKOUT_NAV_MS = 2800;

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, subtotal } = useCart();
  const [goingCheckout, setGoingCheckout] = useState(false);
  const checkoutTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (checkoutTimerRef.current) clearTimeout(checkoutTimerRef.current);
    };
  }, []);

  const deliveryFee = 15;
  const total = subtotal + deliveryFee;

  const goToCheckout = () => {
    if (goingCheckout) return;
    setGoingCheckout(true);
    checkoutTimerRef.current = setTimeout(() => {
      checkoutTimerRef.current = null;
      navigate('/checkout');
    }, CHECKOUT_NAV_MS);
  };

  return (
    <div className="cart-page">
      <TransitionOverlay
        show={goingCheckout}
        title="Going to checkout"
        subtitle="Preparing your order summary…"
      />
      <div className="cart-header">
        <div className="breadcrumb">
          <Link to="/home">Home</Link> › Cart
        </div>
        <h1>YOUR CART</h1>
      </div>

      {items.length === 0 ? (
        <p className="cart-empty">
          Your cart is empty.{' '}
          <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {items.map((item) => (
              <div key={`${item.productId}-${item.color}-${item.size}`} className="cart-item">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <button
                      type="button"
                      className="remove-item"
                      aria-label="Remove"
                      onClick={() => removeItem(item.productId, item.color, item.size)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="item-info">
                    <span>Size: {item.size}</span>
                    <span>Color: {item.color}</span>
                  </div>
                  <div className="item-price-qty">
                    <span className="price">${item.price}</span>
                    <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQty(item.productId, item.color, item.size, item.qty - 1)
                        }
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQty(item.productId, item.color, item.size, item.qty + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <p className="cart-coupon-note">Have a coupon? Apply it at checkout.</p>
            <button
              type="button"
              className="checkout-button"
              disabled={goingCheckout}
              onClick={goToCheckout}
            >
              {goingCheckout ? 'Please wait…' : 'Go to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
