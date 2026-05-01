import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderPanel } from './AdminLoader';
import '../../styles/admin-ops.css';
import '../../styles/admin-dashboard.css';

const ReportsAdmin = () => {
  const [tax, setTax] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/admin/reports/tax-summary'), api.get('/admin/reports/funnel')])
      .then(([t, f]) => {
        setTax(t.data || []);
        setFunnel(f.data || null);
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load reports.'), toastOpts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadOrders = async () => {
    try {
      const res = await api.get('/orders/admin/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed.'), toastOpts);
    }
  };

  if (loading && !funnel) return <AdminLoaderPanel />;

  return (
    <section className="admin-catalog-section">
      <div className="admin-catalog-header">
        <h2 className="admin-catalog-title">Reports</h2>
      </div>
      <p className="admin-orders-sub">Exports and revenue summaries. Pair with your accounting stack for filing-ready tax reports.</p>

      <div className="admin-bulk-bar" style={{ marginBottom: '1.25rem' }}>
        <button type="button" className="admin-form-button" onClick={downloadOrders}>
          Download orders CSV
        </button>
        <button type="button" className="admin-orders-reset" onClick={load}>
          Refresh summaries
        </button>
      </div>

      {funnel && (
        <div className="admin-dash-kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <article className="admin-dash-kpi">
            <span className="admin-dash-kpi__label">Orders (30d)</span>
            <strong className="admin-dash-kpi__value">{funnel.ordersLast30Days}</strong>
            <span className="admin-dash-kpi__hint">Created in the last 30 days</span>
          </article>
          <article className="admin-dash-kpi">
            <span className="admin-dash-kpi__label">Paid orders (30d)</span>
            <strong className="admin-dash-kpi__value">{funnel.paidOrdersLast30Days}</strong>
            <span className="admin-dash-kpi__hint">{funnel.conversionHint || '—'}</span>
          </article>
          <article className="admin-dash-kpi">
            <span className="admin-dash-kpi__label">Paid revenue (30d)</span>
            <strong className="admin-dash-kpi__value">${Number(funnel.paidRevenueLast30Days || 0).toFixed(2)}</strong>
            <span className="admin-dash-kpi__hint">Excl. canceled</span>
          </article>
          <article className="admin-dash-kpi">
            <span className="admin-dash-kpi__label">Orders (all time)</span>
            <strong className="admin-dash-kpi__value">{funnel.ordersAllTime}</strong>
            <span className="admin-dash-kpi__hint">{funnel.note}</span>
          </article>
        </div>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Tax &amp; revenue by month (UTC)</h3>
      <div className="admin-orders-table-wrap admin-table-scroll-y">
        <table className="admin-report-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Orders</th>
              <th>Gross</th>
              <th>Tax</th>
              <th>Shipping</th>
              <th>Items net</th>
            </tr>
          </thead>
          <tbody>
            {tax.map((r) => (
              <tr key={r.month}>
                <td>{r.month}</td>
                <td>{r.orders}</td>
                <td>${r.gross.toFixed(2)}</td>
                <td>${r.taxCollected.toFixed(2)}</td>
                <td>${r.shipping.toFixed(2)}</td>
                <td>${r.netItems.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportsAdmin;
