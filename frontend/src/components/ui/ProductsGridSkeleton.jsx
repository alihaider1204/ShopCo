import React from 'react';
import '../../styles/loaders.css';

function SkeletonCard() {
  return (
    <div className="product-skeleton-card">
      <div className="product-skeleton-image loaders-shimmer" />
      <div className="product-skeleton-body">
        <div className="product-skeleton-line product-skeleton-line--lg loaders-shimmer" />
        <div className="product-skeleton-line loaders-shimmer" />
        <div className="product-skeleton-line product-skeleton-line--short loaders-shimmer" />
      </div>
      <div className="product-skeleton-footer">
        <div className="product-skeleton-chips">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="product-skeleton-chip loaders-shimmer" />
          ))}
        </div>
        <div className="product-skeleton-btn loaders-shimmer" />
      </div>
    </div>
  );
}

const ProductsGridSkeleton = ({ count = 8 }) => (
  <div
    className="products-grid products-grid--skeleton"
    aria-busy="true"
    aria-label="Loading products"
  >
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default ProductsGridSkeleton;
