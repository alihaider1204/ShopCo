import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable } from './AdminLoader';
import '../../styles/admin-ops.css';

const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const LOW_STOCK = 5;

const ProductsAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [stockDraft, setStockDraft] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/products/admin/all', {
        params: {
          limit: 500,
          page: 1,
          ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        },
      })
      .then((res) => {
        const list = res.data.products ?? res.data;
        const arr = Array.isArray(list) ? list : [];
        setProducts(arr);
        const m = {};
        arr.forEach((p) => {
          m[p._id] = String(p.countInStock ?? 0);
        });
        setStockDraft(m);
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, 'Could not load products.'), toastOpts);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted.', toastOpts);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed.'), toastOpts);
    } finally {
      setDeletingId(null);
    }
  };

  const saveStockChanges = async () => {
    const updates = [];
    for (const p of products) {
      const orig = Number(p.countInStock);
      const next = Number(stockDraft[p._id]);
      if (Number.isFinite(next) && next >= 0 && next !== orig) {
        updates.push({ id: p._id, countInStock: Math.floor(next) });
      }
    }
    if (!updates.length) {
      toast.info('No stock changes to save.', toastOpts);
      return;
    }
    setBulkBusy(true);
    try {
      await api.put('/products/bulk-stock', { updates });
      toast.success(`Updated stock for ${updates.length} product(s).`, toastOpts);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Bulk update failed.'), toastOpts);
    } finally {
      setBulkBusy(false);
    }
  };

  const applyProductSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const clearProductSearch = () => {
    setSearchInput('');
    setKeyword('');
  };

  return (
    <section className="admin-catalog-section" aria-labelledby="admin-products-heading">
      <div className="admin-catalog-header">
        <h2 id="admin-products-heading" className="admin-catalog-title">
          Products
        </h2>
        <button className="admin-form-button" type="button" onClick={() => navigate('/admin/add-product')}>
          Add product
        </button>
      </div>
      <div className="admin-orders-toolbar">
        <form className="admin-orders-filters" onSubmit={applyProductSearch}>
          <label className="admin-filter-label admin-filter-label--grow">
            Search products
            <input
              type="search"
              name="product-search"
              autoComplete="off"
              placeholder="Name, brand, or description"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <button type="submit" className="admin-form-button admin-form-button--inline">
            Search
          </button>
          <button type="button" className="admin-orders-reset" onClick={clearProductSearch}>
            Clear
          </button>
        </form>
      </div>
      {loading ? (
        <div className="admin-orders-table-wrap admin-table-scroll-y">
          <AdminLoaderTable rows={8} columns={7} showToolbar={false} />
        </div>
      ) : products.length === 0 ? (
        <p className="admin-orders-empty">
          {keyword
            ? 'No products match your search. Try different keywords or clear the search.'
            : 'No products found. Add your first product to get started.'}
        </p>
      ) : (
        <>
          <div className="admin-bulk-bar">
            <button type="button" className="admin-form-button" disabled={bulkBusy} onClick={saveStockChanges}>
              {bulkBusy ? 'Saving…' : 'Save stock changes'}
            </button>
            <span className="admin-muted" style={{ fontSize: '0.85rem' }}>
              Rows with stock ≤ {LOW_STOCK} are highlighted. Threshold matches server default (LOW_STOCK_THRESHOLD).
            </span>
          </div>
          <div className="admin-orders-table-wrap admin-table-scroll-y">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th scope="col">Image</th>
                  <th scope="col">Name</th>
                  <th scope="col">Brand</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const catName = p.category?.name || '—';
                  const nextStock = Number(stockDraft[p._id]);
                  const stockLow = Number.isFinite(nextStock) ? nextStock <= LOW_STOCK : Number(p.countInStock) <= LOW_STOCK;
                  return (
                    <tr key={p._id}>
                      <td className="admin-table-cell--middle">
                        {p.image ? (
                          <img className="admin-table-thumb" src={p.image} alt="" width={44} height={44} loading="lazy" />
                        ) : (
                          <span className="admin-table-thumb admin-table-thumb--placeholder" aria-hidden>
                            No img
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="admin-table-ellipsis admin-table-ellipsis--wide" title={p.name}>
                          {p.name}
                        </span>
                      </td>
                      <td>
                        <span className="admin-table-ellipsis" title={p.brand}>
                          {p.brand}
                        </span>
                      </td>
                      <td>
                        <span className="admin-table-ellipsis" title={catName}>
                          {catName}
                        </span>
                      </td>
                      <td className="admin-table-cell--middle">{formatMoney(p.price)}</td>
                      <td className="admin-table-cell--middle admin-stock-cell">
                        <div className="admin-stock-inline">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className="admin-stock-input"
                            value={stockDraft[p._id] ?? ''}
                            onChange={(e) =>
                              setStockDraft((m) => ({
                                ...m,
                                [p._id]: e.target.value,
                              }))
                            }
                            aria-label={`Stock for ${p.name}`}
                          />
                          <span
                            className={stockLow ? 'admin-stock-pill' : 'admin-stock-pill admin-stock-pill--ok'}
                          >
                            {stockLow ? 'Low' : 'OK'}
                          </span>
                        </div>
                      </td>
                      <td className="admin-table-cell--middle">
                        <div className="admin-table-cell-actions">
                          <button
                            type="button"
                            className="admin-chip-btn admin-chip-btn--outline"
                            onClick={() => navigate(`/admin/edit-product/${p._id}`)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-chip-btn admin-chip-btn--danger"
                            disabled={deletingId === p._id}
                            onClick={() => handleDelete(p._id)}
                          >
                            {deletingId === p._id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="admin-table-footnote">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
            {keyword ? <> matching &quot;{keyword}&quot;</> : null}
            {products.length >= 500 && !keyword ? ' — list shows up to 500; use search to find a product.' : null}
          </p>
        </>
      )}
    </section>
  );
};

export default ProductsAdmin;
