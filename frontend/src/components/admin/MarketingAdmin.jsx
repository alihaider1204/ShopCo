import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable, AdminLoaderPanel } from './AdminLoader';
import '../../styles/admin-ops.css';

const emptyCoupon = () => ({
  code: '',
  label: '',
  type: 'percent',
  value: '10',
  minOrderAmount: '0',
  maxUses: '',
  expiresAt: '',
  active: true,
});

const MarketingAdmin = () => {
  const [sub, setSub] = useState('coupons');

  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [campForm, setCampForm] = useState({ name: '', channel: 'email', segment: '', notes: '', status: 'draft' });
  const [loadingCamp, setLoadingCamp] = useState(false);

  const loadCoupons = useCallback(() => {
    setLoadingCoupons(true);
    api
      .get('/admin/coupons')
      .then((res) => setCoupons(res.data || []))
      .catch((err) => toast.error(getApiErrorMessage(err, 'Could not load coupons.'), toastOpts))
      .finally(() => setLoadingCoupons(false));
  }, []);

  const loadSubs = useCallback(() => {
    setLoadingSubs(true);
    api
      .get('/admin/newsletter/subscribers')
      .then((res) => setSubs(res.data || []))
      .catch((err) => toast.error(getApiErrorMessage(err, 'Could not load subscribers.'), toastOpts))
      .finally(() => setLoadingSubs(false));
  }, []);

  const loadCampaigns = useCallback(() => {
    setLoadingCamp(true);
    api
      .get('/admin/campaigns')
      .then((res) => setCampaigns(res.data || []))
      .catch((err) => toast.error(getApiErrorMessage(err, 'Could not load campaigns.'), toastOpts))
      .finally(() => setLoadingCamp(false));
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    if (sub === 'newsletter') loadSubs();
    if (sub === 'campaigns') loadCampaigns();
  }, [sub, loadSubs, loadCampaigns]);

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', {
        code: couponForm.code,
        label: couponForm.label || undefined,
        type: couponForm.type,
        value: Number(couponForm.value),
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        maxUses: couponForm.maxUses === '' ? null : Number(couponForm.maxUses),
        expiresAt: couponForm.expiresAt || null,
        active: couponForm.active,
      });
      toast.success('Coupon created.', toastOpts);
      setCouponForm(emptyCoupon());
      loadCoupons();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Create failed.'), toastOpts);
    }
  };

  const toggleCoupon = async (c) => {
    try {
      await api.put(`/admin/coupons/${c._id}`, { active: !c.active });
      loadCoupons();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Update failed.'), toastOpts);
    }
  };

  const removeCoupon = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api.delete(`/admin/coupons/${c._id}`);
      loadCoupons();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed.'), toastOpts);
    }
  };

  const removeSubscriber = async (s) => {
    if (!window.confirm(`Remove ${s.email} from the list?`)) return;
    try {
      await api.delete(`/admin/newsletter/subscribers/${s._id}`);
      loadSubs();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Remove failed.'), toastOpts);
    }
  };

  const exportNewsletter = async () => {
    try {
      const res = await api.get('/admin/newsletter/export.csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-subscribers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed.'), toastOpts);
    }
  };

  const addCampaign = async (e) => {
    e.preventDefault();
    if (!campForm.name.trim()) return;
    try {
      await api.post('/admin/campaigns', campForm);
      toast.success('Campaign log added.', toastOpts);
      setCampForm({ name: '', channel: 'email', segment: '', notes: '', status: 'draft' });
      loadCampaigns();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed.'), toastOpts);
    }
  };

  return (
    <section className="admin-catalog-section">
      <div className="admin-catalog-header">
        <h2 className="admin-catalog-title">Marketing</h2>
      </div>
      <p className="admin-orders-sub">Coupons apply at checkout. Newsletter lists storefront signups. Campaigns are an internal log (e.g. Mailchimp sends).</p>

      <div className="admin-subtabs">
        <button type="button" className={`admin-subtab${sub === 'coupons' ? ' admin-subtab--active' : ''}`} onClick={() => setSub('coupons')}>
          Coupons
        </button>
        <button type="button" className={`admin-subtab${sub === 'newsletter' ? ' admin-subtab--active' : ''}`} onClick={() => setSub('newsletter')}>
          Newsletter
        </button>
        <button type="button" className={`admin-subtab${sub === 'campaigns' ? ' admin-subtab--active' : ''}`} onClick={() => setSub('campaigns')}>
          Campaigns
        </button>
      </div>

      {sub === 'coupons' && (
        <>
          <form onSubmit={createCoupon} className="admin-cms-grid" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, gridColumn: '1 / -1' }}>New coupon</h3>
            <label>
              Code
              <input value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value }))} required />
            </label>
            <label>
              Label (optional)
              <input value={couponForm.label} onChange={(e) => setCouponForm((f) => ({ ...f, label: e.target.value }))} />
            </label>
            <label>
              Type
              <select value={couponForm.type} onChange={(e) => setCouponForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </label>
            <label>
              Value
              <input value={couponForm.value} onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))} />
            </label>
            <label>
              Min order ($)
              <input value={couponForm.minOrderAmount} onChange={(e) => setCouponForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
            </label>
            <label>
              Max uses (blank = unlimited)
              <input value={couponForm.maxUses} onChange={(e) => setCouponForm((f) => ({ ...f, maxUses: e.target.value }))} />
            </label>
            <label>
              Expires (ISO date, optional)
              <input value={couponForm.expiresAt} onChange={(e) => setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))} placeholder="2026-12-31" />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm((f) => ({ ...f, active: e.target.checked }))} />
              Active
            </label>
            <button type="submit" className="admin-form-button" style={{ justifySelf: 'start' }}>
              Create coupon
            </button>
          </form>
          {loadingCoupons ? (
            <AdminLoaderPanel />
          ) : (
            <div className="admin-orders-table-wrap admin-table-scroll-y">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Uses</th>
                    <th>Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <strong>{c.code}</strong>
                        {c.label && <div className="admin-muted">{c.label}</div>}
                      </td>
                      <td>{c.type}</td>
                      <td>{c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</td>
                      <td>
                        {c.usedCount}
                        {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                      </td>
                      <td>{c.active ? 'Yes' : 'No'}</td>
                      <td>
                        <button type="button" className="admin-chip-btn admin-chip-btn--outline" onClick={() => toggleCoupon(c)}>
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="admin-chip-btn admin-chip-btn--danger" onClick={() => removeCoupon(c)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {sub === 'newsletter' && (
        <>
          <div className="admin-bulk-bar">
            <button type="button" className="admin-form-button" onClick={exportNewsletter}>
              Export CSV
            </button>
            <button type="button" className="admin-orders-reset" onClick={loadSubs}>
              Refresh
            </button>
          </div>
          {loadingSubs ? (
            <AdminLoaderTable rows={6} columns={2} showToolbar={false} />
          ) : (
            <div className="admin-orders-table-wrap admin-table-scroll-y">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Subscribed</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s._id}>
                      <td>{s.email}</td>
                      <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <button type="button" className="admin-chip-btn admin-chip-btn--danger" onClick={() => removeSubscriber(s)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {sub === 'campaigns' && (
        <>
          <form onSubmit={addCampaign} className="admin-cms-grid" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, gridColumn: '1 / -1' }}>Log a campaign</h3>
            <label>
              Name
              <input value={campForm.name} onChange={(e) => setCampForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label>
              Channel
              <select value={campForm.channel} onChange={(e) => setCampForm((f) => ({ ...f, channel: e.target.value }))}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="social">Social</option>
                <option value="ads">Ads</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Audience / segment note
              <input value={campForm.segment} onChange={(e) => setCampForm((f) => ({ ...f, segment: e.target.value }))} />
            </label>
            <label>
              Status
              <select value={campForm.status} onChange={(e) => setCampForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea value={campForm.notes} onChange={(e) => setCampForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </label>
            <button type="submit" className="admin-form-button">
              Save log
            </button>
          </form>
          {loadingCamp ? (
            <AdminLoaderTable rows={5} columns={4} showToolbar={false} />
          ) : (
            <div className="admin-orders-table-wrap admin-table-scroll-y">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{c.channel}</td>
                      <td>{c.status}</td>
                      <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default MarketingAdmin;
