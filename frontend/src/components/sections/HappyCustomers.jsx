import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../utils/api';

function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const HappyCustomers = () => {
  const scrollRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const { data } = await api.get('/products/featured-reviews', { params: { limit: 20 } });
        if (!cancelled) setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      } catch {
        if (!cancelled) {
          setReviews([]);
          setFetchError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, reviews]);

  const scrollDir = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('.review-card');
    const gap = 24;
    const amount = (card?.offsetWidth ?? 320) + gap;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const showCarousel = !loading && reviews.length > 0;

  return (
    <section className="happy-customers happy-customers--design">
      <div className="happy-customers__head">
        <h2 className="happy-customers__title">OUR HAPPY CUSTOMERS</h2>
        <div className="happy-customers__nav happy-customers__nav--plain">
          <button
            type="button"
            className="carousel-arrow carousel-arrow--plain"
            onClick={() => scrollDir(-1)}
            aria-label="Previous"
            disabled={!showCarousel || !canPrev}
          >
            ←
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--plain"
            onClick={() => scrollDir(1)}
            aria-label="Next"
            disabled={!showCarousel || !canNext}
          >
            →
          </button>
        </div>
      </div>
      {loading && <p className="happy-customers__loading">Loading reviews…</p>}
      {!loading && fetchError && (
        <p className="happy-customers__empty">
          Reviews could not be loaded. Please try again later.
        </p>
      )}
      {!loading && !fetchError && reviews.length === 0 && (
        <p className="happy-customers__empty">No reviews yet.</p>
      )}
      {showCarousel && (
        <div className="happy-customers__viewport-shell">
          <div className="happy-customers__viewport" ref={scrollRef}>
            <div className="happy-customers__track">
              {reviews.map((r, idx) => {
                const starCount = Math.min(5, Math.max(0, Math.round(Number(r.rating) || 0)));
                return (
                  <div
                    className="review-card review-card--carousel"
                    key={`${r.createdAt ?? ''}-${r.name}-${idx}`}
                  >
                    <div className="review-card__stars-row">
                      {starCount > 0 ? '★'.repeat(starCount) : '—'}
                    </div>
                    <div className="review-card__header">
                      <span className="review-card__name">{r.name}</span>
                      <span className="verified-badge verified-badge--pill" aria-label="Verified buyer">
                        ✓
                      </span>
                    </div>
                    <blockquote className="review-card__quote">
                      <span className="review-card__text">&ldquo;{r.comment}&rdquo;</span>
                    </blockquote>
                    <div className="review-card__date">Posted on {formatReviewDate(r.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HappyCustomers;
