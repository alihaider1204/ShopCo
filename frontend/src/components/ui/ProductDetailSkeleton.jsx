import React from 'react';
import '../../styles/loaders.css';

const ProductDetailSkeleton = () => (
  <main className="product-detail-page" aria-busy="true" aria-label="Loading product">
    <div className="breadcrumb product-detail-breadcrumb">
      <span className="loaders-shimmer" style={{ display: 'inline-block', width: 180, height: 14, borderRadius: 6 }} />
    </div>
    <div className="pdp-skeleton-grid">
      <div className="pdp-skeleton-gallery">
        <div className="pdp-skeleton-thumbs">
          {[1, 2, 3].map((k) => (
            <div key={k} className="pdp-skeleton-thumb loaders-shimmer" />
          ))}
        </div>
        <div className="pdp-skeleton-main loaders-shimmer" />
      </div>
      <div className="pdp-skeleton-copy">
        <div className="pdp-skeleton-line pdp-skeleton-line--title loaders-shimmer" />
        <div className="pdp-skeleton-line pdp-skeleton-line--price loaders-shimmer" />
        <div className="pdp-skeleton-line pdp-skeleton-line--body loaders-shimmer" />
        <div className="pdp-skeleton-line pdp-skeleton-line--body loaders-shimmer" />
        <div className="pdp-skeleton-line pdp-skeleton-line--body loaders-shimmer" />
        <div style={{ height: 120, borderRadius: 12 }} className="loaders-shimmer" />
      </div>
    </div>
  </main>
);

export default ProductDetailSkeleton;
