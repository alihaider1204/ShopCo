import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const previewUrlRef = useRef(null);

  const closeReceiptModal = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setReceiptModal(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    api
      .get('/orders/myorders')
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load your orders.'), toastOpts);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!receiptModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeReceiptModal();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [receiptModal, closeReceiptModal]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const paymentLabel = (order) => {
    if (order.paymentStatus === 'canceled') {
      return { text: 'Canceled', className: 'payment-badge payment-badge--muted' };
    }
    if (order.isPaid) return { text: 'Paid', className: 'payment-badge payment-badge--paid' };
    switch (order.paymentStatus) {
      case 'failed':
        return { text: 'Payment failed', className: 'payment-badge payment-badge--failed' };
      default:
        return { text: 'Payment pending', className: 'payment-badge payment-badge--pending' };
    }
  };

  const parseBlobError = async (blob) => {
    try {
      const text = await blob.text();
      const j = JSON.parse(text);
      return typeof j?.message === 'string' ? j.message : null;
    } catch {
      return null;
    }
  };

  const openReceiptPreview = async (orderId) => {
    closeReceiptModal();
    setInvoiceLoadingId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}/invoice?embed=1`, { responseType: 'blob' });
      const ct = (res.headers['content-type'] || '').toLowerCase();
      if (ct.includes('application/json')) {
        const msg = await parseBlobError(res.data);
        throw new Error(msg || 'Could not load receipt');
      }
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setReceiptModal({ orderId, blob, url });
    } catch (err) {
      let msg = getApiErrorMessage(err, 'Could not load receipt');
      const data = err.response?.data;
      if (data instanceof Blob) {
        const parsed = await parseBlobError(data);
        if (parsed) msg = parsed;
      } else if (data?.message) {
        msg = data.message;
      }
      toast.error(msg, toastOpts);
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const downloadReceiptFromModal = async () => {
    if (!receiptModal?.orderId) return;
    try {
      const res = await api.get(`/orders/${receiptModal.orderId}/invoice`, { responseType: 'blob' });
      const ct = (res.headers['content-type'] || '').toLowerCase();
      if (ct.includes('application/json')) {
        const msg = await parseBlobError(res.data);
        throw new Error(msg || 'Could not download receipt');
      }
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${receiptModal.orderId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded', toastOpts);
    } catch (err) {
      let msg = getApiErrorMessage(err, 'Could not download receipt');
      const data = err.response?.data;
      if (data instanceof Blob) {
        const parsed = await parseBlobError(data);
        if (parsed) msg = parsed;
      } else if (data?.message) {
        msg = data.message;
      }
      toast.error(msg, toastOpts);
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1>My Orders</h1>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className="shop-now-btn">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const pay = paymentLabel(order);
              return (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order._id}</h3>
                      <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                      <span className={pay.className}>{pay.text}</span>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${order.isDelivered ? 'delivered' : 'pending'}`}>
                        {order.isDelivered ? 'Delivered' : 'Processing'}
                      </span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.orderItems.map((item, index) => (
                      <div key={`${order._id}-${index}`} className="order-item">
                        <div className="item-image">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <p>
                            Size: {item.size || '—'} | Color: {item.color || '—'}
                          </p>
                          <p>Quantity: {item.qty}</p>
                          <p className="item-price">${Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="shipping-info">
                      <h4>Shipping Address</h4>
                      {order.shippingAddress?.fullName && <p>{order.shippingAddress.fullName}</p>}
                      <p>{order.shippingAddress?.address}</p>
                      <p>
                        {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                      </p>
                      <p>{order.shippingAddress?.country}</p>
                    </div>
                    <div className="order-summary">
                      <div className="total-amount">
                        <span>Total Amount:</span>
                        <span>${Number(order.totalPrice).toFixed(2)}</span>
                      </div>
                      <div className="order-actions">
                        {!order.isPaid && order.paymentStatus !== 'canceled' && (
                          <Link to={`/checkout/pay/${order._id}`} className="track-order-btn">
                            Complete payment
                          </Link>
                        )}
                        {order.isPaid && (
                          <button
                            type="button"
                            className="track-order-btn order-actions__secondary"
                            disabled={invoiceLoadingId === order._id}
                            onClick={() => openReceiptPreview(order._id)}
                          >
                            {invoiceLoadingId === order._id ? 'Loading…' : 'View receipt'}
                          </button>
                        )}
                        {order.isPaid && order.paymentResult?.receipt_url && (
                          <a
                            href={order.paymentResult.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="order-actions__link"
                          >
                            Payment receipt
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {receiptModal && (
        <div
          className="receipt-modal-backdrop"
          role="presentation"
          aria-hidden={false}
          onClick={closeReceiptModal}
        >
          <div
            className="receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="receipt-modal__header">
              <div>
                <h2 id="receipt-modal-title" className="receipt-modal__title">
                  Receipt preview
                </h2>
                <p className="receipt-modal__meta">Order #{receiptModal.orderId}</p>
              </div>
              <button
                type="button"
                className="receipt-modal__close"
                onClick={closeReceiptModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <iframe
              title="Receipt"
              className="receipt-modal__frame"
              src={receiptModal.url}
              sandbox="allow-same-origin"
            />
            <div className="receipt-modal__footer">
              <button type="button" className="receipt-modal__download" onClick={downloadReceiptFromModal}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
