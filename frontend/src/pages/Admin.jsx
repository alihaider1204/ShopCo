import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductsAdmin from '../components/admin/ProductsAdmin';
import CategoriesAdmin from '../components/admin/CategoriesAdmin';
import OrdersAdmin from '../components/admin/OrdersAdmin';
import AdminDashboardHome from '../components/admin/AdminDashboardHome';
import CustomersAdmin from '../components/admin/CustomersAdmin';
import MarketingAdmin from '../components/admin/MarketingAdmin';
import ContentAdmin from '../components/admin/ContentAdmin';
import OperationsAdmin from '../components/admin/OperationsAdmin';
import ReportsAdmin from '../components/admin/ReportsAdmin';

const VALID_TABS = [
  'overview',
  'orders',
  'products',
  'categories',
  'customers',
  'marketing',
  'content',
  'operations',
  'reports',
];

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => {
    const t = searchParams.get('tab');
    return VALID_TABS.includes(t) ? t : 'overview';
  }, [searchParams]);

  const setTab = (next) => {
    if (next === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: next }, { replace: true });
    }
  };

  return (
    <main className="admin-page">
      <h1 className="admin-title">Admin Dashboard</h1>
      <div className="admin-tabs admin-tabs--extended">
        <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
          Overview
        </button>
        <button type="button" className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          Products
        </button>
        <button type="button" className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
          Categories
        </button>
        <button type="button" className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>
          Customers
        </button>
        <button type="button" className={tab === 'marketing' ? 'active' : ''} onClick={() => setTab('marketing')}>
          Marketing
        </button>
        <button type="button" className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
          Content
        </button>
        <button type="button" className={tab === 'operations' ? 'active' : ''} onClick={() => setTab('operations')}>
          Operations
        </button>
        <button type="button" className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
          Reports
        </button>
      </div>
      <div className="admin-content">
        {tab === 'overview' && <AdminDashboardHome />}
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'products' && <ProductsAdmin />}
        {tab === 'categories' && <CategoriesAdmin />}
        {tab === 'customers' && <CustomersAdmin />}
        {tab === 'marketing' && <MarketingAdmin />}
        {tab === 'content' && <ContentAdmin />}
        {tab === 'operations' && <OperationsAdmin />}
        {tab === 'reports' && <ReportsAdmin />}
      </div>
    </main>
  );
};

export default Admin;
