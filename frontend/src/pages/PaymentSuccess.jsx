import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import { useCart } from '../context/CartContext';
import { getGuestCheckoutToken, clearGuestCheckoutToken } from '../utils/guestCheckout';
import '../styles/checkout.css';

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const guestTok = getGuestCheckoutToken(orderId);
        let data;
        if (guestTok) {
          const res = await api.post(`/orders/${orderId}/sync-payment-guest`, { guestToken: guestTok });
          data = res.data;
        } else {
          const res = await api.post(`/orders/${orderId}/sync-payment`);
          data = res.data;
        }
        if (cancelled) return;
        setOrder(data);
        if (data?.isPaid) {
          clearGuestCheckoutToken(orderId);
          clearCart();
        } else {
          toast.info(
            'We are confirming your payment. Refresh in a moment if status is still pending.',
            toastOpts
          );
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(err, 'Could not load order.');
          setError(msg);
          toast.error(msg, toastOpts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, clearCart]);

  if (loading) {
    return (
      <main className="checkout-page checkout-result">
        <p>Confirming your payment…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="checkout-page checkout-result checkout-result--error">
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <Link to="/orders" className="place-order-btn checkout-result__link">
          View my orders
        </Link>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="checkout-page checkout-result checkout-result--success">
      <div className="checkout-result__icon" aria-hidden="true">
        ✓
      </div>
      <h1>Payment successful</h1>
      <p className="checkout-result__lead">
        Thank you
        {order.user?.firstName
          ? `, ${order.user.firstName}`
          : order.shippingAddress?.fullName
            ? `, ${order.shippingAddress.fullName.split(/\s+/)[0]}`
            : ''}
        . Your order is confirmed.
      </p>
      <div className="checkout-result__card">
        <p>
          <strong>Order</strong> #{order._id}
        </p>
        <p>
          <strong>Total paid</strong> ${Number(order.totalPrice).toFixed(2)}
        </p>
        {order.isPaid && (
          <p className="checkout-hint">A confirmation email with your items is on the way to your inbox.</p>
        )}
      </div>
      <div className="checkout-result__actions">
        {(!order.isGuest || localStorage.getItem('token')) && (
          <Link to="/orders" className="place-order-btn checkout-result__link">
            View orders & receipts
          </Link>
        )}
        {order.isGuest && !localStorage.getItem('token') && (
          <p className="checkout-hint" style={{ marginBottom: 8 }}>
            A confirmation was sent to your email. <Link to="/register">Create an account</Link> to track future orders.
          </p>
        )}
        <Link to="/products" className="checkout-back-btn checkout-result__secondary">
          Continue shopping
        </Link>
      </div>
    </main>
  );
};

export default PaymentSuccess;
