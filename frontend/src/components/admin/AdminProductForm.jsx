import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';
import { AdminLoaderPanel } from './AdminLoader';
import '../../styles/admin-product-form.css';

const emptyForm = () => ({
  name: '',
  price: '',
  originalPrice: '',
  brand: '',
  category: '',
  description: '',
  image: '',
  countInStock: '10',
  colors: '',
  sizes: '',
  dressStyle: '',
});

const AdminProductForm = ({ mode, productId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(() => mode === 'edit' && Boolean(productId));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [form.image]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/categories');
        if (!cancelled) setCategories(res.data || []);
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Could not load categories.'), toastOpts);
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!productId) {
      navigate('/admin?tab=products', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingProduct(true);
      try {
        const { data: p } = await api.get(`/products/${productId}`);
        if (cancelled) return;
        const colors = Array.isArray(p.colors) ? p.colors.join(', ') : p.colors || '';
        const sizes = Array.isArray(p.sizes) ? p.sizes.join(', ') : p.sizes || '';
        setForm({
          name: p.name || '',
          price: p.price != null ? String(p.price) : '',
          originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
          brand: p.brand || '',
          category: (p.category && p.category._id) || p.category || '',
          description: p.description || '',
          image: p.image || '',
          countInStock: p.countInStock != null ? String(p.countInStock) : '0',
          colors,
          sizes,
          dressStyle: p.dressStyle || '',
        });
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Could not load product.'), toastOpts);
          navigate('/admin?tab=products');
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, productId, navigate]);

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
    const imageUrl = form.image.trim();
    if (!imageUrl) {
      toast.error('A main product image is required — upload a photo or paste an image URL.', toastOpts);
      return;
    }
    if (!form.name.trim() || !form.category) {
      toast.error('Name and category are required.', toastOpts);
      return;
    }
    if (!form.sizes.trim()) {
      toast.error('At least one size is required (comma-separated, e.g. S, M, L, XL).', toastOpts);
      return;
    }
    if (submitting || loadingCats || loadingProduct) return;

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : '',
      brand: form.brand.trim(),
      category: form.category,
      description: form.description.trim(),
      image: imageUrl,
      countInStock: Number(form.countInStock || 0),
      colors: form.colors,
      sizes: form.sizes.trim(),
      dressStyle: form.dressStyle.trim(),
    };

    setSubmitting(true);
    try {
      if (mode === 'edit') {
        if (!productId) return;
        await api.put(`/products/${productId}`, payload);
        toast.success('Product updated.', toastOpts);
      } else {
        await api.post('/products', {
          ...payload,
          originalPrice: form.originalPrice.trim() ? Number(form.originalPrice) : undefined,
        });
        toast.success('Product created.', toastOpts);
      }
      navigate('/admin?tab=products');
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, mode === 'edit' ? 'Failed to update product.' : 'Failed to create product.'),
        toastOpts
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loadingCats || loadingProduct;
  const showPreview = Boolean(form.image && !imgBroken);

  if (loadingProduct) {
    return (
      <>
        <header className="admin-product-hero">
          <div className="admin-product-hero-top">
            <button type="button" className="admin-product-back" onClick={() => navigate('/admin?tab=products')}>
              ← Back to dashboard
            </button>
          </div>
          <h1>Edit product</h1>
        </header>
        <AdminLoaderPanel />
      </>
    );
  }

  return (
    <>
      <header className="admin-product-hero">
        <div className="admin-product-hero-top">
          <button type="button" className="admin-product-back" onClick={() => navigate('/admin?tab=products')}>
            ← Back to dashboard
          </button>
        </div>
        <h1>{mode === 'edit' ? 'Edit product' : 'Add new product'}</h1>
        <p className="admin-product-lead">
          Set how this product appears in your store: name, imagery, pricing, and inventory.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <section className="admin-product-section" aria-labelledby="sec-basic">
          <h2 id="sec-basic">Basic information</h2>
          <p className="admin-product-section-desc">Title, brand, category, and how you describe the product to customers.</p>
          <div className="admin-product-grid">
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-p-name">Product name</label>
              <input
                id="admin-p-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={busy}
                placeholder="e.g. Cotton crewneck tee"
                autoComplete="off"
              />
            </div>
            <div className="admin-product-field">
              <label htmlFor="admin-p-brand">Brand</label>
              <input id="admin-p-brand" name="brand" value={form.brand} onChange={handleChange} required disabled={busy} />
            </div>
            <div className="admin-product-field">
              <label htmlFor="admin-p-category">Category</label>
              <select id="admin-p-category" name="category" value={form.category} onChange={handleChange} required disabled={busy}>
                <option value="">{loadingCats ? 'Loading categories…' : 'Select a category'}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-p-desc">Description</label>
              <textarea
                id="admin-p-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                disabled={busy}
                rows={5}
                placeholder="Materials, fit, care instructions, and selling points."
              />
            </div>
            <div className="admin-product-field">
              <label htmlFor="admin-p-style">
                Style / dress style <span className="admin-product-optional">(optional)</span>
              </label>
              <input
                id="admin-p-style"
                name="dressStyle"
                value={form.dressStyle}
                onChange={handleChange}
                disabled={busy}
                placeholder="e.g. Casual, Formal"
              />
            </div>
          </div>
        </section>

        <section className="admin-product-section" aria-labelledby="sec-media">
          <h2 id="sec-media">Main image</h2>
          <p className="admin-product-section-desc">
            A primary photo is <strong>required</strong>. Upload a file (Cloudinary) or paste a URL — for example a path served from your site like{' '}
            <code>/seed-products/…</code>.
          </p>
          <div className="admin-product-media">
            <div className="admin-product-preview" aria-hidden={!showPreview}>
              {showPreview ? (
                <img src={form.image} alt="" onError={() => setImgBroken(true)} />
              ) : (
                <div className="admin-product-preview-empty">
                  {form.image && imgBroken
                    ? 'Preview failed — check the URL or upload a new file.'
                    : 'No image yet. Upload or add a URL below.'}
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
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </button>
                <span className="admin-product-upload-hint">JPG, PNG, WebP recommended.</span>
              </div>
              <div className="admin-product-field" style={{ margin: 0 }}>
                <label htmlFor="admin-p-image">Image URL</label>
                <input
                  id="admin-p-image"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="https://… or /path/from/public"
                  required
                />
              </div>
              <p className="admin-product-upload-hint">
                After upload, the URL field fills automatically. You can edit it if needed.
              </p>
            </div>
          </div>
        </section>

        <section className="admin-product-section" aria-labelledby="sec-price">
          <h2 id="sec-price">Pricing</h2>
          <p className="admin-product-section-desc">Current selling price and optional “was” price for sale badges.</p>
          <div className="admin-product-grid">
            <div className="admin-product-field">
              <label htmlFor="admin-p-price">Price</label>
              <input
                id="admin-p-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                disabled={busy}
              />
            </div>
            <div className="admin-product-field">
              <label htmlFor="admin-p-original">
                Original price <span className="admin-product-optional">(optional)</span>
              </label>
              <input
                id="admin-p-original"
                name="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={handleChange}
                disabled={busy}
                placeholder="For strike-through / sale badge"
              />
            </div>
          </div>
        </section>

        <section className="admin-product-section" aria-labelledby="sec-inv">
          <h2 id="sec-inv">Inventory & variants</h2>
          <p className="admin-product-section-desc">
            Stock count, <strong>required</strong> sizes (comma-separated), and optional colors — shown on the product page.
          </p>
          <div className="admin-product-grid">
            <div className="admin-product-field">
              <label htmlFor="admin-p-stock">Units in stock</label>
              <input
                id="admin-p-stock"
                name="countInStock"
                type="number"
                min="0"
                value={form.countInStock}
                onChange={handleChange}
                disabled={busy}
              />
            </div>
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-p-colors">
                Colors <span className="admin-product-optional">(optional)</span>
              </label>
              <input
                id="admin-p-colors"
                name="colors"
                value={form.colors}
                onChange={handleChange}
                disabled={busy}
                placeholder="e.g. Black, White, Navy"
              />
            </div>
            <div className="admin-product-field admin-product-field--full">
              <label htmlFor="admin-p-sizes">Sizes</label>
              <input
                id="admin-p-sizes"
                name="sizes"
                value={form.sizes}
                onChange={handleChange}
                required
                disabled={busy}
                placeholder="e.g. S, M, L, XL"
              />
            </div>
          </div>
        </section>

        <div className="admin-product-footer">
          <button type="button" className="admin-product-btn-secondary" disabled={busy} onClick={() => navigate('/admin?tab=products')}>
            Cancel
          </button>
          <button type="submit" className="admin-product-btn-primary" disabled={busy}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminProductForm;
