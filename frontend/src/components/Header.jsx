import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import PromoBar from './PromoBar';
import { useCart } from '../context/CartContext';

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: '/products', label: 'Shop' },
  { to: '/sale', label: 'On Sale' },
  { to: '/new-arrivals', label: 'New Arrivals' },
  { to: '/brands', label: 'Brands' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/products') return;
    setSearch(searchParams.get('keyword') || '');
  }, [location.pathname, searchParams]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileNavOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileNavOpen]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) { navigate('/products'); closeMobileNav(); return; }
    navigate(`/products?keyword=${encodeURIComponent(q)}`);
    closeMobileNav();
  };

  return (
    <>
      <PromoBar />

      {/*
        Backdrop + mobile drawer are rendered OUTSIDE <header>.
        <header> has position:sticky + z-index which creates its own stacking context,
        so any child can never paint above the promo bar (z-index 101, root context).
        Siblings of <header> are in the root context and can use any z-index freely.
      */}
      {mobileNavOpen && (
        <div
          className="mobile-drawer__backdrop"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      <nav
        className={`mobile-drawer${mobileNavOpen ? ' mobile-drawer--open' : ''}`}
        aria-label="Site navigation"
        aria-hidden={!mobileNavOpen}
        inert={!mobileNavOpen ? '' : undefined}
      >
        <button
          type="button"
          className="mobile-drawer__close"
          aria-label="Close menu"
          onClick={closeMobileNav}
        >
          ✕
        </button>
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} onClick={closeMobileNav}>
            {label}
          </Link>
        ))}
      </nav>

      <header className="header">
        <div className="header__container">
          {/* Hamburger — only visible on mobile */}
          <button
            type="button"
            className="header__menu-btn"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            ☰
          </button>

          <div className="header__logo">
            <Link to="/home">SHOP.CO</Link>
          </div>

          {/* Desktop-only inline nav — hidden on mobile via CSS */}
          <nav className="header__nav" id="site-navigation" aria-label="Site navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
          </nav>

          <form className="header__search-form" onSubmit={onSearchSubmit} role="search">
            <input
              type="search"
              placeholder="Search for products..."
              className="header__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
              enterKeyHint="search"
            />
            <button type="submit" className="header__search-submit" aria-label="Submit search">
              <SearchIcon />
            </button>
          </form>

          <div className="header__actions">
            <div className="cart-icon">
              <Link to="/cart">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
