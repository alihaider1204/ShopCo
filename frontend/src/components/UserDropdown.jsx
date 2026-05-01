import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authStorage } from '../utils/api';
import { isAdminFromToken } from '../utils/adminGate';

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(() => isAdminFromToken());
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem('token');
      setLoggedIn(!!token);
      setIsAdmin(isAdminFromToken());
    };
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setLoggedIn(false);
    setIsAdmin(false);
    setOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  if (!loggedIn) {
    return (
      <div className="header__auth-links">
        <Link to="/login" className="header__auth-link">
          Log in
        </Link>
        <Link to="/register" className="header__auth-link header__auth-link--emphasis">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <span
        className="header__icon"
        role="img"
        aria-label="user"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
      >
        👤
      </span>
      {open && (
        <div className="user-dropdown-menu">
          {isAdmin && (
            <button type="button" onClick={() => handleNavigate('/admin')}>
              Admin
            </button>
          )}
          <button type="button" onClick={() => handleNavigate('/profile')}>
            My Account
          </button>
          <button type="button" onClick={() => handleNavigate('/orders')}>
            My Orders
          </button>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
