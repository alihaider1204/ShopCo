import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderPanel } from './AdminLoader';
import '../../styles/admin-ops.css';

const ContentAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    heroImageUrl: '',
    ctaLabel: '',
    ctaHref: '/products',
    stat1Num: '',
    stat1Label: '',
    stat2Num: '',
    stat2Label: '',
    stat3Num: '',
    stat3Label: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/site-content/home_hero')
      .then((res) => {
        const d = res.data || {};
        setForm({
          title: d.title ?? '',
          subtitle: d.subtitle ?? '',
          heroImageUrl: d.heroImageUrl ?? '',
          ctaLabel: d.ctaLabel ?? '',
          ctaHref: d.ctaHref ?? '/products',
          stat1Num: d.stat1Num ?? '',
          stat1Label: d.stat1Label ?? '',
          stat2Num: d.stat2Num ?? '',
          stat2Label: d.stat2Label ?? '',
          stat3Num: d.stat3Num ?? '',
          stat3Label: d.stat3Label ?? '',
        });
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load content.'), toastOpts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/site-content/home_hero', form);
      toast.success('Home hero saved. Refresh the storefront to see changes.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed.'), toastOpts);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoaderPanel />;

  return (
    <section className="admin-catalog-section">
      <div className="admin-catalog-header">
        <h2 className="admin-catalog-title">Storefront content</h2>
      </div>
      <p className="admin-orders-sub">
        Hero copy and stats on the home page. Image URL can be absolute or a path served from your site (e.g. from Uploads).
      </p>
      <form onSubmit={save} className="admin-cms-grid">
        <label>
          Title
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Subtitle
          <textarea value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} rows={3} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Hero image URL
          <input value={form.heroImageUrl} onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))} placeholder="https://… or /path.png" />
        </label>
        <label>
          CTA label
          <input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
        </label>
        <label>
          CTA link
          <input value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
        </label>
        <h3 style={{ margin: '0.5rem 0 0', gridColumn: '1 / -1', fontSize: '1rem' }}>Stat blocks</h3>
        <label>
          Stat 1 number
          <input value={form.stat1Num} onChange={(e) => setForm((f) => ({ ...f, stat1Num: e.target.value }))} />
        </label>
        <label>
          Stat 1 label
          <input value={form.stat1Label} onChange={(e) => setForm((f) => ({ ...f, stat1Label: e.target.value }))} />
        </label>
        <label>
          Stat 2 number
          <input value={form.stat2Num} onChange={(e) => setForm((f) => ({ ...f, stat2Num: e.target.value }))} />
        </label>
        <label>
          Stat 2 label
          <input value={form.stat2Label} onChange={(e) => setForm((f) => ({ ...f, stat2Label: e.target.value }))} />
        </label>
        <label>
          Stat 3 number
          <input value={form.stat3Num} onChange={(e) => setForm((f) => ({ ...f, stat3Num: e.target.value }))} />
        </label>
        <label>
          Stat 3 label
          <input value={form.stat3Label} onChange={(e) => setForm((f) => ({ ...f, stat3Label: e.target.value }))} />
        </label>
        <button type="submit" className="admin-form-button" disabled={saving} style={{ justifySelf: 'start' }}>
          {saving ? 'Saving…' : 'Save hero'}
        </button>
      </form>
    </section>
  );
};

export default ContentAdmin;
