import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import { useCart } from '../context/CartContext';
import { setGuestCheckoutToken } from '../utils/guestCheckout';
import '../styles/checkout.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

function CheckoutPaymentForm({ orderId, receiptEmail, isGuestCheckout, guestToken }) {
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
      <PaymentElement options={{ link: { display: 'never' } }} />
      <button type="submit" className="place-order-btn" disabled={!stripe || busy}>
        {busy ? (
          <span className="btn-spinner">
            <span>Processing</span>
            <span className="btn-spinner__dots" aria-hidden="true">
              <span className="btn-spinner__dot" />
              <span className="btn-spinner__dot" />
              <span className="btn-spinner__dot" />
            </span>
          </span>
        ) : (
          'Pay securely'
        )}
      </button>
    </form>
  );
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [contactEmail, setContactEmail] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [guestToken, setGuestTokenState] = useState('');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const shippingPrice = 15;
  const taxPrice = 0;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const totalPrice = Math.round((subtotal - discount + shippingPrice + taxPrice) * 100) / 100;
  const isLoggedIn = () => !!localStorage.getItem('token');

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  const startPaymentIntent = useCallback(async (oid, plainGuestToken) => {
    if (plainGuestToken) {
      const { data } = await api.post('/payment/create-payment-intent-guest', {
        orderId: oid,
        guestToken: plainGuestToken,
        currency: 'usd',
      });
      setClientSecret(data.clientSecret);
    } else {
      const { data } = await api.post('/payment/create-payment-intent', {
        orderId: oid,
        currency: 'usd',
      });
      setClientSecret(data.clientSecret);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u?.email) {
        setContactEmail(u.email);
        setReceiptEmail(u.email);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleChange = (e) => setShipping((s) => ({ ...s, [e.target.name]: e.target.value }));

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error('Enter a promo code.', toastOpts);
      return;
    }
    setCouponBusy(true);
    try {
      const { data } = await api.post('/orders/validate-coupon', { code, itemsPrice: subtotal });
      setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
      toast.success(`Promo ${data.code}: −$${Number(data.discountAmount).toFixed(2)}`, toastOpts);
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(getApiErrorMessage(err, 'Invalid or expired code.'), toastOpts);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) {
      toast.error('Your cart is empty.', toastOpts);
      navigate('/cart');
      return;
    }
    if (!publishableKey || !stripePromise) {
      toast.error('Payments are not configured — please contact support.', toastOpts);
      return;
    }

    const loggedIn = isLoggedIn();
    if (!loggedIn) {
      const ge = contactEmail.trim();
      if (!emailOk(ge)) {
        toast.error('Enter a valid email for your order confirmation and receipt.', toastOpts);
        return;
      }
    }

    if (!Number.isFinite(totalPrice) || totalPrice < 0.5) {
      toast.error('Order total must be at least $0.50 after discounts.', toastOpts);
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        name: i.name,
        qty: i.qty,
        image: i.image,
        price: i.price,
        product: i.productId,
        color: i.color,
        size: i.size,
      }));

      const oidStr = (obj) => String(obj?._id ?? obj);

      if (loggedIn) {
        const { data: order } = await api.post('/orders', {
          orderItems,
          shippingAddress: {
            ...shipping,
            fullName: shipping.fullName || undefined,
          },
          paymentMethod: 'Stripe',
          itemsPrice: subtotal,
          taxPrice,
          shippingPrice,
          totalPrice,
          receiptEmail: contactEmail?.trim() || undefined,
          couponCode: appliedCoupon?.code,
        });
        setCreatedOrder(order);
        setReceiptEmail(contactEmail || receiptEmail || '');
        setIsGuestCheckout(false);
        setGuestTokenState('');
        await startPaymentIntent(oidStr(order), null);
      } else {
        const ge = contactEmail.trim().toLowerCase();
        const { data } = await api.post('/orders/guest', {
          orderItems,
          shippingAddress: {
            ...shipping,
            fullName: shipping.fullName || undefined,
          },
          paymentMethod: 'Stripe',
          itemsPrice: subtotal,
          taxPrice,
          shippingPrice,
          totalPrice,
          guestEmail: ge,
          receiptEmail: ge,
          couponCode: appliedCoupon?.code,
        });
        const { guestCheckoutToken, ...orderShape } = data;
        setCreatedOrder(orderShape);
        setReceiptEmail(ge);
        setIsGuestCheckout(true);
        setGuestTokenState(guestCheckoutToken);
        const id = oidStr(orderShape);
        setGuestCheckoutToken(id, guestCheckoutToken);
        await startPaymentIntent(id, guestCheckoutToken);
      }

      setStep(2);
      toast.success('Order created. Enter your card details below.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Checkout failed'), toastOpts);
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length && step === 1) {
    return (
      <main className="checkout-page">
        <p>Your cart is empty.</p>
        <Link to="/products">Continue shopping</Link>
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

  const orderIdStr = createdOrder ? String(createdOrder._id) : '';

  return (
    <main className="checkout-page">
      <nav className="breadcrumb checkout-breadcrumb">
        <Link to="/home">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/cart">Cart</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Checkout</span>
      </nav>

      <h1>Checkout</h1>
      <p className="checkout-step-label">{step === 1 ? 'Step 1 of 2 — Shipping' : 'Step 2 of 2 — Payment'}</p>

      {step === 1 && (
        <form className="checkout-layout" onSubmit={handleShippingSubmit}>
          <div className="checkout-shipping">
            <h2>Shipping & contact</h2>
            {!isLoggedIn() && (
              <p className="checkout-hint">
                You’re checking out as a guest.{' '}
                <Link to="/login">Sign in</Link> to save this order to your account.
              </p>
            )}
            <input
              type="email"
              name="contactEmail"
              placeholder={
                isLoggedIn()
                  ? 'Email for receipt (defaults to your account email)'
                  : 'Email for receipt & order updates (required)'
              }
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="email"
              required={!isLoggedIn()}
              disabled={submitting}
            />
            <input
              name="fullName"
              placeholder="Full name"
              value={shipping.fullName}
              onChange={handleChange}
              autoComplete="name"
              disabled={submitting}
            />
            <input
              name="address"
              placeholder="Street address"
              value={shipping.address}
              onChange={handleChange}
              required
              disabled={submitting}
            />
            <input name="city" placeholder="City" value={shipping.city} onChange={handleChange} required disabled={submitting} />
            <input
              name="postalCode"
              placeholder="Postal code"
              value={shipping.postalCode}
              onChange={handleChange}
              required
              disabled={submitting}
            />
            <input name="country" placeholder="Country" value={shipping.country} onChange={handleChange} required disabled={submitting} />
            {!publishableKey && (
              <p className="checkout-hint checkout-hint--warn">
                Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in <code>frontend/.env</code> (see <code>frontend/.env.example</code>).
              </p>
            )}
          </div>

          <aside className="checkout-summary">
            <h2>Summary</h2>
            <div className="row">
              <span>Items</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="row">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>−${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="checkout-coupon-row">
              <input
                type="text"
                placeholder="Promo code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={submitting}
                autoComplete="off"
              />
              <button type="button" className="checkout-coupon-btn" disabled={submitting || couponBusy} onClick={applyCoupon}>
                {couponBusy ? '…' : 'Apply'}
              </button>
            </div>
            <div className="row">
              <span>Shipping</span>
              <span>${shippingPrice.toFixed(2)}</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button type="submit" className="place-order-btn" disabled={submitting}>
              {submitting ? (
                <span className="btn-spinner">
                  <span>Continue</span>
                  <span className="btn-spinner__dots" aria-hidden="true">
                    <span className="btn-spinner__dot" />
                    <span className="btn-spinner__dot" />
                    <span className="btn-spinner__dot" />
                  </span>
                </span>
              ) : (
                'Continue to payment'
              )}
            </button>
          </aside>
        </form>
      )}

      {step === 2 && createdOrder && stripePromise && elementsOptions && (
        <div className="checkout-layout checkout-layout--payment">
          <div className="checkout-shipping">
            <h2>Pay with card</h2>
            <p className="checkout-hint">Order #{orderIdStr}</p>
            <p className="checkout-hint">
              Shipped to: {shipping.address}, {shipping.city}
            </p>
            <button
              type="button"
              className="checkout-back-btn"
              onClick={() => {
                setStep(1);
                setClientSecret('');
              }}
            >
              ← Edit shipping
            </button>
            <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
              <CheckoutPaymentForm
                orderId={orderIdStr}
                receiptEmail={receiptEmail || contactEmail}
                isGuestCheckout={isGuestCheckout}
                guestToken={guestToken}
              />
            </Elements>
          </div>

          <aside className="checkout-summary">
            <h2>Order total</h2>
            {Number(createdOrder.discountAmount) > 0 && createdOrder.couponCode && (
              <div className="row">
                <span>Promo ({createdOrder.couponCode})</span>
                <span>−${Number(createdOrder.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="row total">
              <span>Total</span>
              <span>${Number(createdOrder.totalPrice).toFixed(2)}</span>
            </div>
            <p className="checkout-hint">Secured by Stripe. You will receive a confirmation email after payment.</p>
          </aside>
        </div>
      )}
    </main>
  );
};

export default Checkout;
