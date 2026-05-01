import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductsFilter from '../components/products/ProductsFilter';
import ProductsGrid from '../components/products/ProductsGrid';
import ProductsPagination from '../components/products/ProductsPagination';
import ProductsGridSkeleton from '../components/ui/ProductsGridSkeleton';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import '../styles/products.css';

/** Matches price slider range in ProductsFilter — avoids hiding products until user narrows price */
const DEFAULT_PRICE_RANGE = [0, 500];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get('category') || '';
  const keywordFromUrl = searchParams.get('keyword') || '';
  const dressStyleFromUrl = searchParams.get('dressStyle') || '';
  const sortFromUrl = searchParams.get('sort') || 'popular';
  const pageFromUrl = Math.max(1, Number(searchParams.get('page')) || 1);
  const saleFromUrl = ['true', '1'].includes(String(searchParams.get('sale') || '').toLowerCase());

  const initialFilter = () => ({
    category: categoryFromUrl,
    price: [...DEFAULT_PRICE_RANGE],
    color: '',
    size: '',
    dressStyle: dressStyleFromUrl,
  });

  const [filters, setFilters] = useState(() => initialFilter());
  const [appliedFilters, setAppliedFilters] = useState(() => initialFilter());

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(pageFromUrl);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState(sortFromUrl);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const next = initialFilter();
    setFilters(next);
    setAppliedFilters(next);
    setPage(pageFromUrl);
    setSort(sortFromUrl);
  }, [categoryFromUrl, pageFromUrl, sortFromUrl, dressStyleFromUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError('');
      try {
        const params = {
          page,
          limit: 10,
          sort,
          keyword: keywordFromUrl || undefined,
          category: appliedFilters.category || undefined,
          minPrice: appliedFilters.price[0],
          maxPrice: appliedFilters.price[1],
          color: appliedFilters.color || undefined,
          size: appliedFilters.size || undefined,
          dressStyle: appliedFilters.dressStyle || undefined,
          ...(saleFromUrl ? { onSale: 'true' } : {}),
        };
        const { data } = await api.get('/products', { params });
        if (cancelled) return;
        setProducts(data.products || []);
        setPages(data.pages || 1);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setPages(1);
          setTotal(0);
          const msg = getApiErrorMessage(err, 'Failed to load products. Please try again.');
          setFetchError(msg);
          toast.error(msg, toastOpts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, sort, appliedFilters, keywordFromUrl, saleFromUrl]);

  const startItem = total === 0 ? 0 : (page - 1) * 10 + 1;
  const endItem = Math.min(page * 10, total);

  const handleSortChange = (e) => {
    const v = e.target.value;
    setSort(v);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.set('sort', v);
    next.delete('page');
    setSearchParams(next);
  };

  const onPageChange = (p) => {
    setPage(p);
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (filters.category) next.set('category', filters.category);
    else next.delete('category');
    if (filters.dressStyle) next.set('dressStyle', filters.dressStyle);
    else next.delete('dressStyle');
    next.delete('page');
    setSearchParams(next);
  };

  /** Clear sidebar filters + URL filter params; keeps keyword & sort (header search unchanged). */
  const resetFilters = () => {
    const cleared = {
      category: '',
      price: [...DEFAULT_PRICE_RANGE],
      color: '',
      size: '',
      dressStyle: '',
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('dressStyle');
    next.delete('page');
    next.delete('sale');
    setSearchParams(next);
  };

  const categoryTitle = saleFromUrl
    ? 'On Sale'
    : categories.find((c) => c._id === appliedFilters.category)?.name ||
      categoryFromUrl ||
      'All Products';

  return (
    <div className="products-page">
      <nav className="breadcrumb products-breadcrumb">
        <Link to="/home">Home</Link>
        <span className="breadcrumb-sep">›</span>
            <Link to="/products">Shop</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{categoryTitle}</span>
      </nav>

      <div className="products-layout">
        <ProductsFilter
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          onApply={applyFilters}
          onReset={resetFilters}
        />
        <div className="products-main">
          <div className="products-header">
            <h2 className="products-title">{categoryTitle}</h2>
            <div className="products-sort">
              <span>
                Showing {startItem}-{endItem} of {total} Products
              </span>
              <select value={sort} onChange={handleSortChange}>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          {loading ? (
            <ProductsGridSkeleton count={10} />
          ) : fetchError ? (
            <div className="products-empty">
              <p>{fetchError}</p>
              <button
                type="button"
                className="add-to-cart-btn"
                style={{ maxWidth: 200, margin: '1rem auto' }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <p className="products-empty">No products found. Try adjusting your filters.</p>
          ) : (
            <ProductsGrid products={products} />
          )}
          {!loading && !fetchError && (
            <ProductsPagination currentPage={page} totalPages={pages} onPageChange={onPageChange} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
