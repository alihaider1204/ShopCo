import React, { useState, useEffect } from 'react';

const colors = ['#00C12B', '#F50606', '#F5DD06', '#F57906', '#06CAF5', '#063AF5', '#A506F5', '#F506A4', '#fff', '#000'];
/** Values must match `sizes` strings stored on products (see seed / admin). */
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'];
const dressStyles = ['Casual', 'Formal', 'Party', 'Gym'];

const ProductsFilter = ({ filters, setFilters, categories = [], onApply, onReset }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="filters-mobile-toggle"
        aria-expanded={mobileOpen}
        aria-controls="products-filters-panel"
        onClick={() => setMobileOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
        </svg>
        Filters
      </button>

      {mobileOpen && (
        <div
          className="filters-backdrop"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="products-filters-panel"
        className={`products-filter ${mobileOpen ? 'products-filter--open' : ''}`}
        aria-modal={mobileOpen}
        role="dialog"
        aria-label="Product filters"
      >
        <div className="filter-drag-handle" aria-hidden="true" />

        <div className="filter-header">
          <h3>Filters</h3>
          <button
            type="button"
            className="close-filter"
            onClick={() => {
              onReset?.();
              setMobileOpen(false);
            }}
            aria-label="Reset filters and close"
          >
            ×
          </button>
        </div>

        <div className="filter-scrollable-body">
          <div className="filter-group">
            <div className="filter-title">
              <span>Categories</span>
            </div>
            <select
              className="filter-category-select"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-title">
              <span>Price</span>
            </div>
            <div className="price-range-container">
              <input
                type="range"
                min="0"
                max="500"
                value={filters.price[1]}
                className="price-range"
                aria-label="Maximum price"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    price: [prev.price[0], parseInt(e.target.value, 10)],
                  }))
                }
              />
              <div className="price-labels">
                <span>${filters.price[0]}</span>
                <span>${filters.price[1]}</span>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">
              <span>Colors</span>
            </div>
            <div className="colors-grid">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={`color-option ${filters.color === color ? 'selected' : ''} ${color === '#fff' ? 'color-option--light' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, color: prev.color === color ? '' : color }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">
              <span>Size</span>
            </div>
            <div className="size-grid">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-option ${filters.size === size ? 'selected' : ''}`}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, size: prev.size === size ? '' : size }))
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">
              <span>Dress Style</span>
            </div>
            <select
              className="filter-category-select"
              value={filters.dressStyle}
              onChange={(e) => setFilters((prev) => ({ ...prev, dressStyle: e.target.value }))}
            >
              <option value="">Any</option>
              {dressStyles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-sticky-footer">
          <button
            type="button"
            className="apply-filter"
            onClick={() => {
              onApply();
              setMobileOpen(false);
            }}
          >
            Apply Filter
          </button>
        </div>
      </aside>
    </>
  );
};

export default ProductsFilter;
