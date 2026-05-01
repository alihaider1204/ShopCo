import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable } from './AdminLoader';
import '../../styles/admin-ops.css';

const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const CARRIER_OPTIONS = [
  { value: '', label: 'Select carrier (optional)' },
  { value: 'USPS', label: 'USPS' },
  { value: 'UPS', label: 'UPS' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'DHL', label: 'DHL' },
  { value: 'Amazon Logistics', label: 'Amazon Logistics' },
  { value: 'Royal Mail', label: 'Royal Mail' },
  { value: 'Canada Post', label: 'Canada Post' },
  { value: 'Other', label: 'Other' },
];

function suggestTrackingUrl(carrier, trackingNumber) {
  const n = String(trackingNumber || '').trim();
  if (!n) return '';
  const enc = encodeURIComponent(n);
  switch (carrier) {
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc}`;
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${enc}`;
    case 'FedEx':
      return `https://www.fedex.com/fedextrack/?trknbr=${enc}`;
    case 'DHL':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${enc}`;
    case 'Royal Mail':
      return `https://www.royalmail.com/track-your-item#/tracking-results/${enc}`;
    case 'Canada Post':
      return `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${enc}`;
    default:
      return '';
  }
}

const paymentBadge = (order) => {
  if (order.paymentStatus === 'canceled') {
    return { text: 'Canceled', cls: 'admin-order-pay admin-order-pay--muted' };
  }
  if (order.stripeRefundId) {
    return { text: 'Refunded', cls: 'admin-order-pay admin-order-pay--muted' };
  }
  if (order.isPaid) return { text: 'Paid', cls: 'admin-order-pay admin-order-pay--ok' };
  switch (order.paymentStatus) {
    case 'failed':
      return { text: 'Failed', cls: 'admin-order-pay admin-order-pay--bad' };
    default:
      return { text: 'Pending', cls: 'admin-order-pay admin-order-pay--warn' };
  }
};

const OrdersAdmin = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [payment, setPayment] = useState('all');
  const [delivered, setDelivered] = useState('all');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);

  const [shipModal, setShipModal] = useState(null);
  const [shipBusy, setShipBusy] = useState(false);

  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);

  const [noteByOrder, setNoteByOrder] = useState({});
  const [noteBusy, setNoteBusy] = useState(null);

  const loadStats = useCallback(() => {
    api
      .get('/orders/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) =>
        toast.error(getApiErrorMessage(err, 'Could not load order stats.'), toastOpts)
      );
  }, []);

  const loadOrders = useCallback(() => {
    setLoading(true);
    const params = { page: meta.page, limit: 25 };
    if (payment !== 'all') params.payment = payment;
    if (delivered !== 'all') params.delivered = delivered;
    if (query) params.q = query;

    api
      .get('/orders/admin/all', { params })
      .then((res) => {
        setOrders(res.data.orders || []);
        setMeta({
          page: res.data.page || 1,
          pages: res.data.pages || 1,
          total: res.data.total || 0,
        });
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load orders.'), toastOpts);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [meta.page, payment, delivered, query]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const applySearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    setQuery(q);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const downloadInvoice = async (orderId) => {
    setInvoiceId(orderId);
    try {
      const res = await api.get(`/orders/admin/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded', toastOpts);
    } catch (err) {
      let msg = getApiErrorMessage(err, 'Could not download invoice');
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          if (parsed?.message) msg = parsed.message;
        } catch {
          /* ignore */
        }
      } else if (data?.message) msg = data.message;
      toast.error(msg, toastOpts);
    } finally {
      setInvoiceId(null);
    }
  };

  const openShipModal = (orderId) => {
    setShipModal({ orderId, carrier: '', trackingNumber: '', trackingUrl: '', customCarrier: '' });
  };

  const submitShipModal = async () => {
    if (!shipModal?.orderId) return;
    let carrier = String(shipModal.carrier || '').trim();
    if (carrier === 'Other') {
      carrier = String(shipModal.customCarrier || '').trim() || 'Other';
    }
    const trackingNumber = shipModal.trackingNumber.trim();
    let trackingUrl = shipModal.trackingUrl.trim();
    if (!trackingUrl && carrier && trackingNumber) {
      const sug = suggestTrackingUrl(carrier, trackingNumber);
      if (sug) trackingUrl = sug;
    }
    setShipBusy(true);
    try {
      await api.put(`/orders/admin/${shipModal.orderId}/delivered`, {
        shippingCarrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
      });
      toast.success('Order marked as shipped.', toastOpts);
      setShipModal(null);
      loadOrders();
      loadStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Update failed.'), toastOpts);
    } finally {
      setShipBusy(false);
    }
  };

  const openTrackingEdit = (o) => {
    setTrackingModal({
      orderId: o._id,
      carrier: o.shippingCarrier || '',
      trackingNumber: o.trackingNumber || '',
      trackingUrl: o.trackingUrl || '',
    });
  };

  const submitTrackingEdit = async () => {
    if (!trackingModal?.orderId) return;
    const carrier = trackingModal.carrier.trim();
    const trackingNumber = trackingModal.trackingNumber.trim();
    let trackingUrl = trackingModal.trackingUrl.trim();
    if (!trackingUrl && carrier && trackingNumber) {
      const sug = suggestTrackingUrl(carrier, trackingNumber);
      if (sug) trackingUrl = sug;
    }
    setTrackingBusy(true);
    try {
      await api.put(`/orders/admin/${trackingModal.orderId}/shipment`, {
        shippingCarrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
      });
      toast.success('Tracking updated.', toastOpts);
      setTrackingModal(null);
      loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update tracking.'), toastOpts);
    } finally {
      setTrackingBusy(false);
    }
  };

  const addNote = async (orderId) => {
    const text = String(noteByOrder[orderId] || '').trim();
    if (!text) return;
    setNoteBusy(orderId);
    try {
      await api.post(`/orders/admin/${orderId}/notes`, { text });
      setNoteByOrder((m) => ({ ...m, [orderId]: '' }));
      toast.success('Note saved.', toastOpts);
      loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save note.'), toastOpts);
    } finally {
      setNoteBusy(null);
    }
  };

  const refundStripe = async (orderId) => {
    if (
      !window.confirm(
        'Issue a full refund in Stripe for this order? Inventory will be restored if the order is not marked delivered.'
      )
    ) {
      return;
    }
    setRefundingId(orderId);
    try {
      await api.post(`/orders/admin/${orderId}/refund`);
      toast.success('Refund processed.', toastOpts);
      loadOrders();
      loadStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Refund failed.'), toastOpts);
    } finally {
      setRefundingId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (
      !window.confirm(
        'Cancel this order? Unpaid: no Stripe action. Paid: use Refund if money was captured — cancel only adjusts status/stock per rules.'
      )
    ) {
      return;
    }
    setCancelingId(orderId);
    try {
      await api.put(`/orders/admin/${orderId}/cancel`, {});
      toast.success('Order canceled.', toastOpts);
      loadOrders();
      loadStats();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not cancel order.'), toastOpts);
    } finally {
      setCancelingId(null);
    }
  };

  const resetFilters = () => {
    setPayment('all');
    setDelivered('all');
    setSearchInput('');
    setQuery('');
    setMeta((m) => ({ ...m, page: 1 }));
  };

  return (
    <section className="admin-orders-section">
      <div className="admin-orders-header">
        <h2>ORDERS</h2>
        <p className="admin-orders-sub">Payments, receipts, fulfillment &amp; tracking</p>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Total orders</span>
            <strong className="admin-stat-card__value">{stats.totalOrders}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Paid revenue</span>
            <strong className="admin-stat-card__value">{formatMoney(stats.revenue)}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Awaiting payment</span>
            <strong className="admin-stat-card__value">{stats.pendingPayment}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Paid — not shipped</span>
            <strong className="admin-stat-card__value">{stats.awaitingDispatch}</strong>
          </div>
        </div>
      )}

      <div className="admin-orders-toolbar">
        <form className="admin-orders-filters" onSubmit={applySearch}>
          <label className="admin-filter-label">
            Payment
            <select
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value);
                setMeta((m) => ({ ...m, page: 1 }));
              }}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label className="admin-filter-label">
            Shipped
            <select
              value={delivered}
              onChange={(e) => {
                setDelivered(e.target.value);
                setMeta((m) => ({ ...m, page: 1 }));
              }}
            >
              <option value="all">All</option>
              <option value="yes">Delivered</option>
              <option value="no">Not delivered</option>
            </select>
          </label>
          <label className="admin-filter-label admin-filter-label--grow">
            Search
            <input
              type="text"
              placeholder="Order ID, email, name, address, tracking, or coupon"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <button type="submit" className="admin-form-button admin-form-button--inline">
            Search
          </button>
          <button type="button" className="admin-orders-reset" onClick={resetFilters}>
            Reset
          </button>
        </form>
      </div>

      <div className="admin-orders-table-wrap">
        {loading ? (
          <AdminLoaderTable rows={8} columns={8} showToolbar={false} />
        ) : orders.length === 0 ? (
          <p className="admin-orders-empty">No orders match these filters.</p>
        ) : (
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Shipping</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const pay = paymentBadge(o);
                const u = o.user;
                const name = u
                  ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                  : o.isGuest
                    ? 'Guest'
                    : '—';
                const open = expanded === o._id;
                return (
                  <React.Fragment key={o._id}>
                    <tr className={open ? 'admin-order-row--open' : ''}>
                      <td>
                        <code className="admin-order-id">{String(o._id).slice(0, 8)}…</code>
                        <button
                          type="button"
                          className="admin-linkish"
                          onClick={() => setExpanded(open ? null : o._id)}
                        >
                          {open ? 'Hide' : 'Details'}
                        </button>
                        {o.discountAmount > 0 && o.couponCode && (
                          <div>
                            <small className="admin-muted">
                              Coupon {o.couponCode} (−{formatMoney(o.discountAmount)})
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{name}</div>
                        <small className="admin-muted">{u?.email || o.guestEmail || '—'}</small>
                      </td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>{formatMoney(o.totalPrice)}</td>
                      <td>
                        <span className={pay.cls}>{pay.text}</span>
                        {o.stripeRefundId && (
                          <div className="refund-badge">Stripe refund recorded</div>
                        )}
                      </td>
                      <td>
                        {o.paymentStatus === 'canceled' ? (
                          <span className="admin-order-pay admin-order-pay--muted">Canceled</span>
                        ) : (
                          <span
                            className={
                              o.isDelivered ? 'admin-order-pay admin-order-pay--ok' : 'admin-order-pay admin-order-pay--warn'
                            }
                          >
                            {o.isDelivered ? 'Delivered' : 'Processing'}
                          </span>
                        )}
                        {o.isDelivered && (o.shippingCarrier || o.trackingNumber) && (
                          <div>
                            <small className="admin-muted">
                              {[o.shippingCarrier, o.trackingNumber].filter(Boolean).join(' · ')}
                            </small>
                          </div>
                        )}
                      </td>
                      <td className="admin-order-documents">
                        <div className="admin-order-documents-inner">
                          {o.isPaid ? (
                            <>
                              <button
                                type="button"
                                className="admin-chip-btn"
                                disabled={invoiceId === o._id || cancelingId === o._id}
                                onClick={() => downloadInvoice(o._id)}
                              >
                                {invoiceId === o._id ? '…' : 'Invoice'}
                              </button>
                              {o.paymentResult?.receipt_url && (
                                <a
                                  href={o.paymentResult.receipt_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-chip-btn admin-chip-btn--outline"
                                  title="Open Stripe-hosted receipt"
                                >
                                  Receipt
                                </a>
                              )}
                            </>
                          ) : (
                            <span className="admin-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-order-actions">
                        <div className="admin-order-actions-inner">
                          {!o.isDelivered && o.paymentStatus !== 'canceled' ? (
                            <>
                              {o.isPaid && (
                                <button
                                  type="button"
                                  className="admin-chip-btn admin-chip-btn--primary"
                                  disabled={cancelingId === o._id}
                                  onClick={() => openShipModal(o._id)}
                                >
                                  Mark shipped
                                </button>
                              )}
                              <button
                                type="button"
                                className="admin-chip-btn admin-chip-btn--danger"
                                disabled={cancelingId === o._id}
                                onClick={() => cancelOrder(o._id)}
                              >
                                {cancelingId === o._id ? '…' : 'Cancel'}
                              </button>
                            </>
                          ) : o.isDelivered ? (
                            <button
                              type="button"
                              className="admin-chip-btn admin-chip-btn--outline"
                              onClick={() => openTrackingEdit(o)}
                            >
                              Tracking
                            </button>
                          ) : (
                            <span className="admin-muted">—</span>
                          )}
                          {o.isPaid &&
                            !o.stripeRefundId &&
                            o.paymentStatus !== 'canceled' &&
                            o.stripePaymentIntentId && (
                              <button
                                type="button"
                                className="admin-chip-btn"
                                disabled={refundingId === o._id}
                                onClick={() => refundStripe(o._id)}
                              >
                                {refundingId === o._id ? '…' : 'Refund'}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="admin-order-detail-row">
                        <td colSpan={8}>
                          <div className="admin-order-detail">
                            <div className="admin-order-detail__grid">
                              <div>
                                <h4>Items</h4>
                                <ul className="admin-order-lines">
                                  {(o.orderItems || []).map((it, i) => (
                                    <li key={i}>
                                      {it.name} × {it.qty} — {formatMoney(it.price * it.qty)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4>Shipping</h4>
                                <p className="admin-detail-text">
                                  {o.shippingAddress?.fullName && (
                                    <>
                                      {o.shippingAddress.fullName}
                                      <br />
                                    </>
                                  )}
                                  {o.shippingAddress?.address}
                                  <br />
                                  {o.shippingAddress?.city}, {o.shippingAddress?.postalCode}
                                  <br />
                                  {o.shippingAddress?.country}
                                </p>
                                {o.isDelivered && (
                                  <div className="admin-fulfillment-block">
                                    <h4>Fulfillment</h4>
                                    <p className="admin-detail-text">
                                      Carrier: {o.shippingCarrier || '—'}
                                      <br />
                                      Tracking: {o.trackingNumber || '—'}
                                      {o.trackingUrl && (
                                        <>
                                          <br />
                                          <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer">
                                            Open tracking page
                                          </a>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                )}
                                <h4>Payment</h4>
                                <p className="admin-detail-text">
                                  Method: {o.paymentMethod}
                                  <br />
                                  {o.stripePaymentIntentId && (
                                    <>
                                      Stripe PI: <code>{o.stripePaymentIntentId}</code>
                                      <br />
                                    </>
                                  )}
                                  {o.receiptEmail && (
                                    <>
                                      Receipt email: {o.receiptEmail}
                                      <br />
                                    </>
                                  )}
                                  {o.paidAt && <>Paid at: {formatDate(o.paidAt)}</>}
                                </p>
                              </div>
                            </div>
                            <div className="admin-fulfillment-block">
                              <h4>Internal notes</h4>
                              <ul className="admin-notes-list">
                                {(o.adminNotes || []).map((n, idx) => (
                                  <li key={idx}>
                                    {n.text}
                                    <span className="admin-notes-meta">
                                      {n.authorLabel && <>{n.authorLabel} · </>}
                                      {n.createdAt ? formatDate(n.createdAt) : ''}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="admin-modal__field" style={{ marginTop: '0.65rem' }}>
                                <textarea
                                  placeholder="Add a note (team only, not emailed to customer)…"
                                  value={noteByOrder[o._id] || ''}
                                  onChange={(e) =>
                                    setNoteByOrder((m) => ({
                                      ...m,
                                      [o._id]: e.target.value,
                                    }))
                                  }
                                  rows={2}
                                />
                                <button
                                  type="button"
                                  className="admin-form-button admin-form-button--small"
                                  style={{ marginTop: '0.35rem' }}
                                  disabled={noteBusy === o._id}
                                  onClick={() => addNote(o._id)}
                                >
                                  {noteBusy === o._id ? 'Saving…' : 'Save note'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta.pages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-form-button admin-form-button--small"
            disabled={meta.page <= 1}
            onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {meta.page} of {meta.pages} ({meta.total} orders)
          </span>
          <button
            type="button"
            className="admin-form-button admin-form-button--small"
            disabled={meta.page >= meta.pages}
            onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {shipModal && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => !shipBusy && setShipModal(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Mark order as shipped</h3>
            <p className="admin-modal__lead">
              Add carrier and tracking so your team and the customer have a paper trail. You can ship without tracking and
              add it later from the row action.
            </p>
            <div className="admin-modal__field">
              <label htmlFor="ship-carrier">Carrier</label>
              <select
                id="ship-carrier"
                value={shipModal.carrier}
                onChange={(e) => setShipModal((s) => ({ ...s, carrier: e.target.value }))}
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c.value || 'empty'} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {shipModal.carrier === 'Other' && (
              <div className="admin-modal__field">
                <label htmlFor="ship-carrier-custom">Carrier name</label>
                <input
                  id="ship-carrier-custom"
                  value={shipModal.customCarrier || ''}
                  onChange={(e) => setShipModal((s) => ({ ...s, customCarrier: e.target.value }))}
                  placeholder="e.g. Local courier"
                />
              </div>
            )}
            <div className="admin-modal__field">
              <label htmlFor="ship-track">Tracking number</label>
              <input
                id="ship-track"
                value={shipModal.trackingNumber}
                onChange={(e) => setShipModal((s) => ({ ...s, trackingNumber: e.target.value }))}
                placeholder="Optional"
                autoComplete="off"
              />
            </div>
            <div className="admin-modal__field">
              <label htmlFor="ship-url">Tracking URL (optional)</label>
              <input
                id="ship-url"
                value={shipModal.trackingUrl}
                onChange={(e) => setShipModal((s) => ({ ...s, trackingUrl: e.target.value }))}
                placeholder="Leave blank to auto-suggest for major carriers"
              />
            </div>
            <div className="admin-modal__actions">
              <button type="button" className="admin-orders-reset" disabled={shipBusy} onClick={() => setShipModal(null)}>
                Cancel
              </button>
              <button type="button" className="admin-form-button" disabled={shipBusy} onClick={submitShipModal}>
                {shipBusy ? 'Saving…' : 'Confirm shipped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {trackingModal && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => !trackingBusy && setTrackingModal(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Update tracking</h3>
            <p className="admin-modal__lead">Adjust carrier or tracking for an order already marked shipped.</p>
            <div className="admin-modal__field">
              <label htmlFor="tr-carrier">Carrier</label>
              <input
                id="tr-carrier"
                value={trackingModal.carrier}
                onChange={(e) => setTrackingModal((s) => ({ ...s, carrier: e.target.value }))}
                placeholder="e.g. UPS"
              />
            </div>
            <div className="admin-modal__field">
              <label htmlFor="tr-num">Tracking number</label>
              <input
                id="tr-num"
                value={trackingModal.trackingNumber}
                onChange={(e) => setTrackingModal((s) => ({ ...s, trackingNumber: e.target.value }))}
              />
            </div>
            <div className="admin-modal__field">
              <label htmlFor="tr-url">Tracking URL</label>
              <input
                id="tr-url"
                value={trackingModal.trackingUrl}
                onChange={(e) => setTrackingModal((s) => ({ ...s, trackingUrl: e.target.value }))}
              />
            </div>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-orders-reset"
                disabled={trackingBusy}
                onClick={() => setTrackingModal(null)}
              >
                Cancel
              </button>
              <button type="button" className="admin-form-button" disabled={trackingBusy} onClick={submitTrackingEdit}>
                {trackingBusy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrdersAdmin;
