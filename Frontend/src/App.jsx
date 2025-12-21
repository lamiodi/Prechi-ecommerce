import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CurrencyProvider } from './pages/CurrencyContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Eager load critical pages
import LandingPage from './pages/LandingPage';

// Lazy load other pages
const Home = lazy(() => import('./pages/Home'));
const ShopAllPage = lazy(() => import('./pages/ShopAllPage'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Checkoutprocess = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Signup = lazy(() => import('./pages/Signup'));
const UserOrders = lazy(() => import('./pages/UserOrders'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MorePage = lazy(() => import('./pages/Moresection'));
const HelpPage = lazy(() => import('./pages/Helpsection'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const DeliveryFeeThankYou = lazy(() => import('./pages/DeliveryFeeThankYou'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import CartErrorBoundary from './components/CartErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AdminAuthProvider>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/search" element={<SearchResults />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/shop" element={<ShopAllPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/bundle/:id" element={<ProductDetails />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/cart" element={<CartErrorBoundary><Cart /></CartErrorBoundary>} /> {/* Removed ProtectedRoute for guest access */}
              <Route path="/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
              <Route path="/checkout" element={<Checkoutprocess />} /> {/* Removed ProtectedRoute for guest access */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/thank-you" element={<ThankYou />} /> {/* Removed ProtectedRoute for guest access */}
              <Route path="/delivery-fee-thank-you" element={<DeliveryFeeThankYou />} /> {/* Removed ProtectedRoute for guest access */}

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
          </Suspense>
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AdminAuthProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;