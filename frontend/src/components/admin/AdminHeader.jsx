import React from 'react';
import { Link } from 'react-router-dom';
import UserDropdown from '../UserDropdown';
import '../../styles/admin-ops.css';

const AdminHeader = () => (
  <header className="header">
    <div className="header__container header__container--admin">
      <div className="header__logo">SHOP.CO Admin</div>
      <div className="header__actions header__actions--admin">
        <Link to="/home" className="admin-header-store-link">
          View storefront
        </Link>
        <UserDropdown />
      </div>
    </div>
  </header>
);

export default AdminHeader;
