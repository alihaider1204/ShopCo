import React from 'react';
import '../../styles/loaders.css';

function HomeProductSkeletonCard() {
  return (
    <div className="product-card product-card--home home-skeleton-product" aria-hidden="true">
      <div className="product-card__thumb">
        <div className="home-skeleton-product__img loaders-shimmer" />
      </div>
      <div className="product-card__info">
        <div className="home-skeleton-product__line home-skeleton-product__line--title loaders-shimmer" />
        <div className="home-skeleton-product__line home-skeleton-product__line--short loaders-shimmer" />
        <div className="home-skeleton-product__line home-skeleton-product__line--price loaders-shimmer" />
      </div>
    </div>
  );
}

function ProductSectionSkeleton() {
  return (
    <section className="products-section products-section--home" aria-hidden="true">
      <div className="home-skeleton__section-heading loaders-shimmer" />
      <div className="products-grid products-grid--home">
        {[1, 2, 3, 4].map((k) => (
          <HomeProductSkeletonCard key={k} />
        ))}
      </div>
      <div className="home-skeleton__viewall loaders-shimmer" />
    </section>
  );
}

/**
 * Mirrors homepage sections while the real page is deferred (min display time).
 */
const HomePageSkeleton = () => (
  <main className="home-page home-skeleton" aria-busy="true" aria-label="Loading homepage">
    <section className="hero hero--boygirl">
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="home-skeleton__hero-title loaders-shimmer" />
          <div className="home-skeleton__hero-line loaders-shimmer" />
          <div className="home-skeleton__hero-line home-skeleton__hero-line--mid loaders-shimmer" />
          <div className="home-skeleton__hero-cta loaders-shimmer" />
          <div className="hero__stats">
            {[1, 2, 3].map((k) => (
              <div key={k} className="hero__stat">
                <span className="home-skeleton__stat-num loaders-shimmer" />
                <span className="home-skeleton__stat-label loaders-shimmer" />
              </div>
            ))}
          </div>
        </div>
        <div className="hero__visual">
          <div className="home-skeleton__hero-visual loaders-shimmer" />
        </div>
      </div>
    </section>

    <section className="brands-row">
      <div className="brands-row__container">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="home-skeleton__brand loaders-shimmer loaders-shimmer--dark" />
        ))}
      </div>
    </section>

    <ProductSectionSkeleton />
    <ProductSectionSkeleton />

    <section className="dress-style dress-style--mosaic" aria-hidden="true">
      <div className="home-skeleton__dress-heading loaders-shimmer" />
      <div className="dress-style__mosaic">
        <div className="dress-style__tile dress-style__tile--casual home-skeleton-dress-tile loaders-shimmer" />
        <div className="dress-style__tile dress-style__tile--formal home-skeleton-dress-tile loaders-shimmer" />
        <div className="dress-style__tile dress-style__tile--party home-skeleton-dress-tile loaders-shimmer" />
        <div className="dress-style__tile dress-style__tile--gym home-skeleton-dress-tile loaders-shimmer" />
      </div>
    </section>

    <section className="happy-customers happy-customers--design" aria-hidden="true">
      <div className="happy-customers__head">
        <div className="home-skeleton__hc-title loaders-shimmer" />
        <div className="happy-customers__nav happy-customers__nav--plain">
          <span className="home-skeleton__hc-arrow loaders-shimmer" />
          <span className="home-skeleton__hc-arrow loaders-shimmer" />
        </div>
      </div>
      <div className="happy-customers__viewport-shell">
        <div className="happy-customers__viewport home-skeleton__hc-viewport">
          <div className="happy-customers__track home-skeleton__hc-track">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="home-skeleton__hc-card loaders-shimmer" />
            ))}
          </div>
        </div>
      </div>
    </section>
  </main>
);

export default HomePageSkeleton;
