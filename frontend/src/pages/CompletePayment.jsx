import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import { getGuestCheckoutToken } from '../utils/guestCheckout';
import '../styles/checkout.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

function ResumePaymentForm({ orderId, receiptEmail, isGuestCheckout, guestToken }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${encodeURIComponent(orderId)}`,
          receipt_email: receiptEmail || undefined,
        },
      });
      if (error) {
        toast.error(error.message || 'Payment failed', toastOpts);
        try {
          if (isGuestCheckout && guestToken) {
            await api.put(`/orders/${orderId}/payment-failed-guest`, {
              guestToken,
              message: error.message,
            });
          } else {
            await api.put(`/orders/${orderId}/payment-failed`, { message: error.message });
          }
        } catch {
          /* ignore */
        }
        navigate(
          `/checkout/failure?order_id=${encodeURIComponent(orderId)}&reason=${encodeURIComponent(error.message || '')}`
        );
        return;
      }
      try {
        if (isGuestCheckout && guestToken) {
          await api.post(`/orders/${orderId}/sync-payment-guest`, { guestToken });
        } else {
          await api.post(`/orders/${orderId}/sync-payment`);
        }
      } catch (syncErr) {
        toast.error(getApiErrorMessage(syncErr, 'Could not confirm payment'), toastOpts);
        return;
      }
      navigate(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-payment-form">
      <PaymentElement />
      <button type="submit" className="place-order-btn" disabled={!stripe || busy}>
        {busy ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

const CompletePayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestToken, setGuestToken] = useState('');

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const bootstrap = useCallback(async () => {
    if (!orderId) {
      setError('Invalid order.');
      setLoading(false);
      return;
    }
    if (!publishableKey || !stripePromise) {
      setError('Payments are not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).');
      setLoading(false);
      return;
    }

    const guestTok = getGuestCheckoutToken(orderId);
    const loggedIn = !!localStorage.getItem('token');

    if (!guestTok && !loggedIn) {
      setError('Sign in to pay for this order, or complete checkout in the same browser session (guest).');
      setLoading(false);
      return;
    }

    try {
      if (guestTok) {
        const { data: o } = await api.get(`/orders/guest/${orderId}`, { params: { guestToken: guestTok } });
        if (o.isPaid) {
          navigate(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
          return;
        }
        setOrder(o);
        setIsGuestCheckout(true);
        setGuestToken(guestTok);
        const { data } = await api.post('/payment/create-payment-intent-guest', {
          orderId,
          guestToken: guestTok,
          currency: 'usd',
        });
        setClientSecret(data.clientSecret);
      } else {
        const { data: o } = await api.get(`/orders/${orderId}`);
        if (o.isPaid) {
          navigate(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
          return;
        }
        setOrder(o);
        setIsGuestCheckout(false);
        setGuestToken('');
        const { data } = await api.post('/payment/create-payment-intent', {
          orderId,
          currency: 'usd',
        });
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Could not start payment.');
      setError(msg);
      toast.error(msg, toastOpts);
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate, stripePromise]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (loading) {
    return (
      <main className="checkout-page">
        <p>Loading payment…</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="checkout-page checkout-result checkout-result--error">
        <h1>Unable to pay</h1>
        <p>{error || 'Order not found.'}</p>
        <Link to="/login">Sign in</Link>
        {' · '}
        <Link to="/cart">Cart</Link>
      </main>
    );
  }

  const elementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#1E1E1E',
            borderRadius: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        },
      }
    : null;

  const receiptEmail = order.user?.email || order.guestEmail || order.receiptEmail || '';

  return (
    <main className="checkout-page">
      <nav className="breadcrumb checkout-breadcrumb">
        <Link to="/home">Home</Link>
        <span className="breadcrumb-sep">›</span>
        {isGuestCheckout ? (
          <Link to="/cart">Cart</Link>
        ) : (
          <Link to="/orders">Orders</Link>
        )}
        <span className="breadcrumb-sep">›</span>
        <span>Pay order</span>
      </nav>
      <h1>Complete payment</h1>
      <p className="checkout-hint">
        Order #{order._id} · ${Number(order.totalPrice).toFixed(2)} due
      </p>

      {stripePromise && elementsOptions && (
        <div className="checkout-layout checkout-layout--payment">
          <div className="checkout-shipping">
            <h2>Payment details</h2>
            <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
              <ResumePaymentForm
                orderId={order._id}
                receiptEmail={receiptEmail}
                isGuestCheckout={isGuestCheckout}
                guestToken={guestToken}
              />
            </Elements>
          </div>
          <aside className="checkout-summary">
            <h2>Summary</h2>
            <div className="row">
              <span>Items</span>
              <span>${Number(order.itemsPrice).toFixed(2)}</span>
            </div>
            <div className="row">
              <span>Shipping</span>
              <span>${Number(order.shippingPrice).toFixed(2)}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>${Number(order.totalPrice).toFixed(2)}</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default CompletePayment;
