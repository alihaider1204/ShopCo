import React from 'react';
import ProductCard from './ProductCard';

const ProductsGrid = ({ products = [] }) => {
  if (!products.length) {
    return <p className="products-empty">No products match your filters.</p>;
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductsGrid;
