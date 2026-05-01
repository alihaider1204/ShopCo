import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable } from './AdminLoader';
import '../../styles/admin-ops.css';

const CustomersAdmin = () => {
  const [segment, setSegment] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/customers', { params: { segment } })
      .then((res) => setRows(res.data || []))
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load customers.'), toastOpts);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [segment]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="admin-catalog-section">
      <div className="admin-catalog-header">
        <h2 className="admin-catalog-title">Customers</h2>
      </div>
      <p className="admin-orders-sub" style={{ marginBottom: '0.5rem' }}>
        Buyer accounts with lifetime spend and filters. Session &quot;login as customer&quot; is intentionally not enabled — use
        test accounts or order tools for support.
      </p>
      <div className="admin-segment-select">
        <label htmlFor="cust-seg" className="admin-filter-label">
          Segment
          <select
            id="cust-seg"
            value={segment}
            onChange={(e) => {
              setSegment(e.target.value);
            }}
          >
            <option value="all">All registered buyers</option>
            <option value="with_orders">With at least one paid order</option>
            <option value="newsletter">Newsletter opted in</option>
            <option value="high_value">Lifetime spend ≥ $500</option>
          </select>
        </label>
      </div>
      {loading ? (
        <AdminLoaderTable rows={8} columns={5} showToolbar={false} />
      ) : (
        <div className="admin-orders-table-wrap admin-table-scroll-y">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders (paid)</th>
                <th>Lifetime</th>
                <th>Newsletter</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.firstName} {r.lastName}
                  </td>
                  <td>{r.email}</td>
                  <td>{r.orderCount}</td>
                  <td>${Number(r.lifetimeSpent || 0).toFixed(2)}</td>
                  <td>{r.preferences?.newsletter ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CustomersAdmin;
