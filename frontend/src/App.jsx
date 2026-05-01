import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Newsletter from './components/sections/Newsletter'
import AdminHeader from './components/admin/AdminHeader'
import AdminFooter from './components/admin/AdminFooter'
import Home from './pages/Home'
import Admin from './pages/Admin'
import AddProduct from './pages/AddProduct'
import AddCategory from './pages/AddCategory'
import EditCategory from './pages/EditCategory'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import FooterContentPage from './pages/FooterContentPage'
import EditProduct from './pages/EditProduct'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import CompletePayment from './pages/CompletePayment'
import RequireAdmin from './components/RequireAdmin'
import { CartProvider } from './context/CartContext'
import './App.css'
import './styles/profile.css'
import './styles/orders.css'

const hideNewsletterForPath = (pathname) =>
  pathname === '/login' ||
  pathname === '/register' ||
  pathname === '/forgot-password' ||
  pathname.startsWith('/reset-password/')

const MainLayout = () => {
  const { pathname } = useLocation()
  const showNewsletter = !hideNewsletterForPath(pathname)
  const shellClass = showNewsletter ? 'layout-shell' : 'layout-shell layout-shell--auth'

  return (
    <div className="shop-layout-root">
      <Header />
      <div className={shellClass}>
        <Outlet />
      </div>
      {showNewsletter && (
        <div className="site-newsletter-anchor">
          <Newsletter />
        </div>
      )}
      <Footer />
    </div>
  )
}

const AdminLayout = () => (
  <>
    <AdminHeader />
    <Outlet />
    <AdminFooter />
  </>
)

function App() {
  return (
    <CartProvider>
      <div className="app-chrome">
        <Router>
          <ToastContainer position="top-center" autoClose={3200} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<PaymentSuccess />} />
              <Route path="/checkout/failure" element={<PaymentFailure />} />
              <Route path="/checkout/pay/:orderId" element={<CompletePayment />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/sale" element={<Navigate to="/products?sale=true" replace />} />
              <Route path="/new-arrivals" element={<Navigate to="/products?sort=newest" replace />} />
              <Route path="/brands" element={<Navigate to="/products" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/about" element={<FooterContentPage slug="about" />} />
              <Route path="/features" element={<FooterContentPage slug="features" />} />
              <Route path="/works" element={<FooterContentPage slug="works" />} />
              <Route path="/careers" element={<FooterContentPage slug="careers" />} />
              <Route path="/support" element={<FooterContentPage slug="support" />} />
              <Route path="/delivery" element={<FooterContentPage slug="delivery" />} />
              <Route path="/terms" element={<FooterContentPage slug="terms" />} />
              <Route path="/privacy" element={<FooterContentPage slug="privacy" />} />
              <Route path="/faq/account" element={<FooterContentPage slug="faqAccount" />} />
              <Route path="/faq/manage-deliveries" element={<FooterContentPage slug="faqDeliveries" />} />
              <Route path="/faq/orders" element={<FooterContentPage slug="faqOrders" />} />
              <Route path="/faq/payments" element={<FooterContentPage slug="faqPayments" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Admin />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/add-product"
                element={
                  <RequireAdmin>
                    <AddProduct />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/add-category"
                element={
                  <RequireAdmin>
                    <AddCategory />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/edit-category/:id"
                element={
                  <RequireAdmin>
                    <EditCategory />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/edit-product/:id"
                element={
                  <RequireAdmin>
                    <EditProduct />
                  </RequireAdmin>
                }
              />
            </Route>
          </Routes>
        </Router>
      </div>
    </CartProvider>
  )
}

export default App
