import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/checkout.css';

const PaymentFailure = () => {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');
  const reason = params.get('reason');

  return (
    <main className="checkout-page checkout-result checkout-result--error">
      <div className="checkout-result__icon checkout-result__icon--fail" aria-hidden="true">
        !
      </div>
      <h1>Payment did not go through</h1>
      <p className="checkout-result__lead">
        {reason ? reason : 'Your card was not charged. You can try again or use a different payment method.'}
      </p>
      {orderId && (
        <p className="checkout-hint">
          Reference: order <code>{orderId}</code>
        </p>
      )}
      <div className="checkout-result__actions">
        {orderId && (
          <Link to={`/checkout/pay/${orderId}`} className="place-order-btn checkout-result__link">
            Try payment again
          </Link>
        )}
        <Link to="/cart" className="checkout-back-btn checkout-result__secondary">
          Back to cart
        </Link>
        <Link to="/orders" className="checkout-back-btn checkout-result__secondary">
          My orders
        </Link>
      </div>
    </main>
  );
};

export default PaymentFailure;
