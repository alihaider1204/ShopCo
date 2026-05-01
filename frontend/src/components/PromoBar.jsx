import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'shop-promo-dismissed';

export default function PromoBar() {
  const [visible, setVisible] = useState(() => localStorage.getItem(STORAGE_KEY) !== '1');

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== '1');
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="promo-bar">
      <p className="promo-bar__text">
        Sign up and get 20% off your first order. <Link to="/register">Sign Up Now</Link>
      </p>
      <button type="button" className="promo-bar__close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
