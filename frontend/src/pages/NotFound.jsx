import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/checkout.css';

const NotFound = () => (
  <main className="checkout-page checkout-result">
    <h1>Page not found</h1>
    <p className="checkout-result__lead">We couldn’t find that URL.</p>
    <div className="checkout-result__actions">
      <Link to="/home" className="place-order-btn checkout-result__link">
        Home
      </Link>
      <Link to="/products" className="checkout-back-btn checkout-result__secondary">
        Shop
      </Link>
    </div>
  </main>
);

export default NotFound;
