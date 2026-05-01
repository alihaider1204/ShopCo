import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderPanel } from './AdminLoader';
import '../../styles/admin-product-form.css';

const AdminCategoryForm = ({ mode = 'create', categoryId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [loading, setLoading] = useState(() => mode === 'edit' && Boolean(categoryId));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [form.image]);

  useEffect(() => {
    if (mode !== 'edit' || !categoryId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/categories/${categoryId}`);
        if (cancelled) return;
        setForm({
          name: data.name || '',
          description: data.description || '',
          image: data.image || '',
        });
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Could not load category.'), toastOpts);
          navigate('/admin?tab=categories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, categoryId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Choose an image file (JPG, PNG, WebP, etc.).', toastOpts);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd);
      if (data?.url) {
        setForm((f) => ({ ...f, image: data.url }));
        toast.success('Image uploaded.', toastOpts);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed. Try again or paste an image URL.'), toastOpts);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required.', toastOpts);
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required.', toastOpts);
      return;
    }
    if (submitting || loading) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
      };
      if (mode === 'edit') {
        if (!categoryId) return;
        await api.put(`/categories/${categoryId}`, payload);
        toast.success('Category updated.', toastOpts);
      } else {
        await api.post('/categories', {
          ...payload,
          image: payload.image || undefined,
        });
        toast.success('Category created.', toastOpts);
      }
      navigate('/admin?tab=categories');
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, mode === 'edit' ? 'Failed to update category.' : 'Failed to create category.'),
        toastOpts
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;
  const showPreview = Boolean(form.image && !imgBroken);

  if (loading) {
    return (
      <>
        <header className="admin-product-hero">
          <div className="admin-product-hero-top">
            <button type="button" className="admin-product-back" onClick={() => navigate('/admin?tab=categories')}>
              ← Back to dashboard
            </button>
          </div>
          <h1>{mode === 'edit' ? 'Edit category' : 'Add new category'}</h1>
        </header>
        <AdminLoaderPanel />
      </>
    );
  }

  return (
    <>
      <header className="admin-product-hero">
        <div className="admin-product-hero-top">
          <button type="button" className="admin-product-back" onClick={() => navigate('/admin?tab=categories')}>
            ← Back to dashboard
          </button>
        </div>
        <h1>{mode === 'edit' ? 'Edit category' : 'Add new category'}</h1>
        <p className="admin-product-lead">
          Categories are used on product listings and filters. Add a name, description, and an optional banner or icon image.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <section className="admin-product-section" aria-labelledby="cat-basic">
          <h2 id="cat-basic">Category details</h2>
          <p className="admin-product-section-desc">Name and description shoppers and admins see. The name must be unique.</p>
          <div className="admin-product-grid">
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-cat-name">Name</label>
              <input
                id="admin-cat-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={busy}
                placeholder="e.g. T-Shirts"
                autoComplete="off"
              />
            </div>
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-cat-desc">Description</label>
              <textarea
                id="admin-cat-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                disabled={busy}
                rows={4}
                placeholder="Brief summary for admin or future category pages."
              />
            </div>
          </div>
        </section>

        <section className="admin-product-section" aria-labelledby="cat-media">
          <h2 id="cat-media">Category image</h2>
          <p className="admin-product-section-desc">
            <span className="admin-product-optional">Optional.</span> Upload a file or paste a URL for a banner, tile, or icon (for example a path served from your site like{' '}
            <code>/seed-products/…</code>).
          </p>
          <div className="admin-product-media">
            <div className="admin-product-preview" aria-hidden={!showPreview}>
              {showPreview ? (
                <img src={form.image} alt="" onError={() => setImgBroken(true)} />
              ) : (
                <div className="admin-product-preview-empty">
                  {form.image && imgBroken
                    ? 'Preview failed — check the URL or upload a new file.'
                    : 'No image yet. Add one below or leave blank.'}
                </div>
              )}
            </div>
            <div className="admin-product-upload-col">
              <div className="admin-product-upload-row">
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
                <button
                  type="button"
                  className="admin-product-upload-btn"
                  disabled={busy || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : 'Upload image'}
                </button>
                <span className="admin-product-upload-hint">JPG, PNG, WebP recommended.</span>
              </div>
              <div className="admin-product-field" style={{ margin: 0 }}>
                <label htmlFor="admin-cat-image">
                  Image URL <span className="admin-product-optional">(optional)</span>
                </label>
                <input
                  id="admin-cat-image"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="https://… or path from /public"
                />
              </div>
              <p className="admin-product-upload-hint">If Cloudinary is not configured on the server, paste a public URL instead.</p>
            </div>
          </div>
        </section>

        <div className="admin-product-footer">
          <button type="button" className="admin-product-btn-secondary" disabled={busy} onClick={() => navigate('/admin?tab=categories')}>
            Cancel
          </button>
          <button type="submit" className="admin-product-btn-primary" disabled={busy}>
            {submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminCategoryForm;
