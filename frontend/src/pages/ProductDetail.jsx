import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { toastOpts } from '../utils/api';
import ProductDetailSkeleton from '../components/ui/ProductDetailSkeleton';
import TransitionOverlay from '../components/ui/TransitionOverlay';
import { useCart } from '../context/CartContext';
import '../styles/product-detail.css';

const ADD_TO_CART_NAV_MS = 2500;

const tabs = [
  { id: 'reviews', label: 'Rating & Reviews' },
  { id: 'details', label: 'Product Details' },
  { id: 'faqs', label: 'FAQs' },
];

const renderStars = (rating, max = 5) => {
  const full = Math.round(Number(rating) || 0);
  return '★'.repeat(Math.min(full, max)) + '☆'.repeat(Math.max(0, max - full));
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('reviews'); // matches first tab

  const [reviewData, setReviewData] = useState({ reviews: [], pages: 1, total: 0 });

  const [related, setRelated] = useState([]);
  const [goingToCart, setGoingToCart] = useState(false);
  const cartNavTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cartNavTimerRef.current) clearTimeout(cartNavTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setGoingToCart(false);
    if (cartNavTimerRef.current) {
      clearTimeout(cartNavTimerRef.current);
      cartNavTimerRef.current = null;
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/products/${id}`);
        if (cancelled) return;
        setProduct(data);
        setMainImage(data.image);
        const colors = data.colors?.length ? data.colors : ['Default'];
        const sizes = data.sizes?.length ? data.sizes : ['One Size'];
        setColor(colors[0]);
        setSize(sizes.length === 1 && sizes[0] === 'One Size' ? sizes[0] : '');

        const relRes = await api.get('/products', {
          params: {
            dressStyle: data.dressStyle || undefined,
            limit: 5,
            sort: 'popular',
          },
        });
        if (!cancelled && relRes.data?.products) {
          setRelated(relRes.data.products.filter((p) => String(p._id) !== String(data._id)).slice(0, 4));
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'reviews') return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}/reviews`, {
          params: { page: 1, limit: 24 },
        });
        if (!cancelled) setReviewData(data);
      } catch {
        if (!cancelled) setReviewData({ reviews: [], pages: 1, total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tab]);

  const discountPct =
    product?.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (!product || goingToCart) return;
    if (!size) {
      toast.error('Please select a size first.', toastOpts);
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      color,
      size,
      qty,
    });
    toast.success(`${product.name} added to cart!`, toastOpts);
    setGoingToCart(true);
    cartNavTimerRef.current = setTimeout(() => {
      cartNavTimerRef.current = null;
      navigate('/cart');
    }, ADD_TO_CART_NAV_MS);
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="product-detail-page product-detail-error-page">
        <div className="product-detail-error-box">
          <span className="product-detail-error-icon" aria-hidden="true">!</span>
          <p className="product-detail-error">{error || 'Product not found'}</p>
          <Link to="/products" className="product-detail-error-link">← Back to shop</Link>
        </div>
      </main>
    );
  }

  const categoryName = product.category?.name || 'Shop';

  return (
    <main className="product-detail-page">
      <TransitionOverlay
        show={goingToCart}
        title="Added to cart"
        subtitle="Taking you to your bag…"
      />
      <nav className="breadcrumb product-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/home">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/products">Shop</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{categoryName}</span>
        <span className="breadcrumb-sep">›</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail-grid">
        <div className="product-detail-gallery">
          <div className="product-detail-thumbs">
            {[...new Set([product.image, ...(product.images || [])].filter(Boolean))].slice(0, 4).map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`thumb ${mainImage === src ? 'active' : ''}`}
                onClick={() => setMainImage(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <div className="product-detail-main-img">
            <img src={mainImage || product.image} alt={product.name} />
          </div>
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <div className="product-detail-rating">
            {renderStars(product.rating)}
            <span>{(product.rating || 0).toFixed(1)}/5</span>
          </div>
          <div className="product-detail-price-row">
            <span className="current">${product.price}</span>
            {product.originalPrice != null && product.originalPrice > product.price && (
              <>
                <span className="was">${product.originalPrice}</span>
                {discountPct != null && <span className="badge">-{discountPct}%</span>}
              </>
            )}
          </div>
          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-options">
            <label>Color</label>
            <div className="color-swatches">
              {(product.colors?.length ? product.colors : ['Default']).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${color === c ? 'selected' : ''}`}
                  title={c}
                  onClick={() => setColor(c)}
                >
                  {c.slice(0, 2)}
                </button>
              ))}
            </div>
            <label>Size {!size && (product.sizes?.length ?? 0) > 1 ? <span className="option-required">(required)</span> : null}</label>
            <div className="size-row">
              {(product.sizes?.length ? product.sizes : ['One Size']).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`size-btn ${size === s ? 'selected' : ''}`}
                  onClick={() => setSize((prev) => (prev === s ? '' : s))}
                >
                  {s}
                </button>
              ))}
            </div>
            <label>Quantity</label>
            <div className="qty-row">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="product-detail-add-cart"
            disabled={!size || goingToCart}
            onClick={handleAddToCart}
          >
            {goingToCart ? 'Adding…' : size ? 'Add to Cart' : 'Select a size'}
          </button>
        </div>
      </div>

      <div className="product-detail-tabs">
        <div className="tab-headers">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {tab === 'details' && <p>{product.description}</p>}
          {tab === 'reviews' && (
            <div className="reviews-block">
              <div className="reviews-toolbar">
                <span>All Reviews ({reviewData.total})</span>
              </div>
              <div className="reviews-grid">
                {reviewData.reviews.map((r) => (
                  <div key={r._id || `${r.name}-${r.comment}`} className="review-card">
                    <div className="review-stars">
                      {renderStars(r.rating)}
                      <span className="review-rating-num">{(Number(r.rating) || 0).toFixed(1)}/5</span>
                    </div>
                    <div className="review-name">
                      {r.name}
                      <span className="verified">✓</span>
                    </div>
                    <p>{r.comment}</p>
                    <time>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</time>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'faqs' && (
            <p className="faq-placeholder">Shipping returns and sizing FAQs — contact support for details.</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <h2>You Might Also Like</h2>
          <div className="related-grid">
            {related.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="related-card">
                <img src={p.image} alt={p.name} />
                <div className="related-meta">
                  <span>{p.name}</span>
                  <span className="related-price">${p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetail;
