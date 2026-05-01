import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderTable } from './AdminLoader';

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/categories');
        if (!cancelled) setCategories(res.data || []);
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Could not load categories.'), toastOpts);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category “${name}”? Products still linked to this category may need to be reassigned first.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted.', toastOpts);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete category.'), toastOpts);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-catalog-section" aria-labelledby="admin-categories-heading">
      <div className="admin-catalog-header">
        <h2 id="admin-categories-heading" className="admin-catalog-title">
          Categories
        </h2>
        <button className="admin-form-button" type="button" onClick={() => navigate('/admin/add-category')}>
          Add category
        </button>
      </div>
      {loading ? (
        <div className="admin-orders-table-wrap admin-table-scroll-y">
          <AdminLoaderTable rows={6} columns={3} showToolbar={false} />
        </div>
      ) : categories.length === 0 ? (
        <p className="admin-orders-empty">No categories found. Create a category before adding products.</p>
      ) : (
        <>
          <div className="admin-orders-table-wrap admin-table-scroll-y">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Description</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const desc = (c.description || '').trim() || '—';
                  return (
                    <tr key={c._id}>
                      <td className="admin-table-cell--middle">
                        <strong className="admin-table-ellipsis admin-table-ellipsis--wide" title={c.name}>
                          {c.name}
                        </strong>
                      </td>
                      <td>
                        <span className="admin-table-ellipsis admin-table-ellipsis--wide" title={desc === '—' ? '' : desc}>
                          {desc}
                        </span>
                      </td>
                      <td className="admin-table-cell--middle">
                        <div className="admin-table-cell-actions">
                          <button
                            type="button"
                            className="admin-chip-btn admin-chip-btn--outline"
                            disabled={deletingId === c._id}
                            onClick={() => navigate(`/admin/edit-category/${c._id}`)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-chip-btn admin-chip-btn--danger"
                            disabled={deletingId === c._id}
                            onClick={() => handleDelete(c._id, c.name)}
                          >
                            {deletingId === c._id ? '…' : 'Delete'}
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
            Showing {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </>
      )}
    </section>
  );
};

export default CategoriesAdmin;
