import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable } from './AdminLoader';
import '../../styles/admin-ops.css';

const emptyPo = () => ({
  reference: '',
  supplierName: '',
  status: 'draft',
  notes: '',
  totalEstimate: '0',
});

const OperationsAdmin = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyPo());

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/purchase-orders')
      .then((res) => setRows(res.data || []))
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load purchase orders.'), toastOpts);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPo = async (e) => {
    e.preventDefault();
    if (!form.reference.trim() || !form.supplierName.trim()) return;
    try {
      await api.post('/admin/purchase-orders', {
        reference: form.reference.trim(),
        supplierName: form.supplierName.trim(),
        status: form.status,
        notes: form.notes.trim() || undefined,
        lines: [],
        totalEstimate: Number(form.totalEstimate) || 0,
      });
      toast.success('Purchase order created.', toastOpts);
      setForm(emptyPo());
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Create failed.'), toastOpts);
    }
  };

  const updateStatus = async (po, status) => {
    try {
      await api.put(`/admin/purchase-orders/${po._id}`, { status });
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Update failed.'), toastOpts);
    }
  };

  const remove = async (po) => {
    if (!window.confirm(`Delete PO ${po.reference}?`)) return;
    try {
      await api.delete(`/admin/purchase-orders/${po._id}`);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed.'), toastOpts);
    }
  };

  return (
    <section className="admin-catalog-section">
      <div className="admin-catalog-header">
        <h2 className="admin-catalog-title">Operations</h2>
      </div>
      <p className="admin-orders-sub">
        Lightweight purchase order log for restocking. Extend with line items and receiving workflows as you grow.
      </p>
      <form onSubmit={createPo} className="admin-cms-grid" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, gridColumn: '1 / -1', fontSize: '1rem' }}>New purchase order</h3>
        <label>
          Reference #
          <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} required />
        </label>
        <label>
          Supplier
          <input value={form.supplierName} onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))} required />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="in_transit">In transit</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          Est. total
          <input value={form.totalEstimate} onChange={(e) => setForm((f) => ({ ...f, totalEstimate: e.target.value }))} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Notes
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
        </label>
        <button type="submit" className="admin-form-button">
          Create
        </button>
      </form>
      {loading ? (
        <AdminLoaderTable rows={6} columns={5} showToolbar={false} />
      ) : (
        <div className="admin-orders-table-wrap admin-table-scroll-y">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((po) => (
                <tr key={po._id}>
                  <td>{po.reference}</td>
                  <td>{po.supplierName}</td>
                  <td>
                    <select
                      value={po.status}
                      onChange={(e) => updateStatus(po, e.target.value)}
                      aria-label={`Status for ${po.reference}`}
                    >
                      <option value="draft">draft</option>
                      <option value="ordered">ordered</option>
                      <option value="in_transit">in_transit</option>
                      <option value="received">received</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td>${Number(po.totalEstimate || 0).toFixed(2)}</td>
                  <td>
                    <button type="button" className="admin-chip-btn admin-chip-btn--danger" onClick={() => remove(po)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default OperationsAdmin;
