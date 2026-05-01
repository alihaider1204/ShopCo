import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderDashboard } from './AdminLoader';
import '../../styles/admin-dashboard.css';

const formatMoney = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ordersTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div>Orders: {payload[0]?.value ?? 0}</div>
    </div>
  );
};

const revenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div>Revenue: {formatMoney(v)}</div>
    </div>
  );
};

const AdminDashboardHome = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/orders/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load dashboard.'), toastOpts);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <AdminLoaderDashboard />;
  }

  if (!data) {
    return (
      <div className="admin-dash-empty">
        <p>Could not load dashboard data.</p>
        <button type="button" className="admin-dash-retry" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const days = data.chartDays ?? 14;

  return (
    <div className="admin-dash">
      <p className="admin-dash-intro">
        Store snapshot: catalog size, order volume, and paid revenue. Charts show the last <strong>{days} days</strong>{' '}
        (UTC).
      </p>

      <div className="admin-dash-kpi-grid">
        <article className="admin-dash-kpi">
          <span className="admin-dash-kpi__label">Total orders</span>
          <strong className="admin-dash-kpi__value">{data.totalOrders}</strong>
          <span className="admin-dash-kpi__hint">{data.paidOrders} paid (excludes canceled)</span>
        </article>
        <article className="admin-dash-kpi">
          <span className="admin-dash-kpi__label">Total products</span>
          <strong className="admin-dash-kpi__value">{data.totalProducts}</strong>
          <span className="admin-dash-kpi__hint">In catalog</span>
        </article>
        <article className="admin-dash-kpi">
          <span className="admin-dash-kpi__label">Total categories</span>
          <strong className="admin-dash-kpi__value">{data.totalCategories}</strong>
          <span className="admin-dash-kpi__hint">For filters and navigation</span>
        </article>
        <article className="admin-dash-kpi">
          <span className="admin-dash-kpi__label">Paid revenue</span>
          <strong className="admin-dash-kpi__value">{formatMoney(data.revenue)}</strong>
          <span className="admin-dash-kpi__hint">Lifetime, excl. canceled</span>
        </article>
      </div>

      <div className="admin-dash-subgrid">
        <span className="admin-dash-pill admin-dash-pill--warn">
          Awaiting payment: <strong>{data.pendingPayment}</strong>
        </span>
        <span className="admin-dash-pill admin-dash-pill--ok">
          Paid — not shipped: <strong>{data.awaitingDispatch}</strong>
        </span>
      </div>

      {(data.lowStockCount > 0 || (data.lowStockProducts && data.lowStockProducts.length > 0)) && (
        <div className="admin-low-stock-panel">
          <h3>
            Low stock — {data.lowStockCount} SKU{data.lowStockCount !== 1 ? 's' : ''} (≤ {data.lowStockThreshold ?? 5}{' '}
            units)
          </h3>
          <ul className="admin-low-stock-list">
            {(data.lowStockProducts || []).map((p) => (
              <li key={p._id}>
                {p.name} — <strong>{p.countInStock}</strong> left
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="admin-dash-charts">
        <div className="admin-dash-chart-card">
          <h3>Orders per day</h3>
          <div className="admin-dash-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} tickLine={false} axisLine={{ stroke: '#e8e8e8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#666' }} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={ordersTooltip} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#111" strokeWidth={2} fill="#111" fillOpacity={0.06} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-dash-chart-card">
          <h3>Paid revenue by day</h3>
          <div className="admin-dash-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} tickLine={false} axisLine={{ stroke: '#e8e8e8' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#666' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={revenueTooltip} />
                <Bar dataKey="revenue" name="Revenue" fill="#2e7d32" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
