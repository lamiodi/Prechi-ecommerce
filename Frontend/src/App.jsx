import React, { Suspense, lazy, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CurrencyProvider } from './pages/CurrencyContext';
import { CartDrawerProvider } from './context/CartDrawerContext';
import SideCartDrawer from './components/SideCartDrawer';
import SmoothScroll from './components/SmoothScroll';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import gsap from 'gsap';

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

// Loading Component — GSAP-powered skeleton page loader
const PageLoader = () => {
  const loaderRef = useRef(null);
  useEffect(() => {
    if (!loaderRef.current) return;
    const bars = loaderRef.current.querySelectorAll('[data-bar]');
    gsap.fromTo(
      bars,
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        repeat: -1,
        yoyo: true,
      }
    );
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-Secondarycolor font-display">
      <div ref={loaderRef} className="flex flex-col items-center gap-6">
        <div className="text-xs font-display uppercase tracking-[0.15em] text-text-tertiary font-medium">
          Prechi
        </div>
        <div className="flex flex-col gap-1.5 w-20">
          <div data-bar className="h-[2px] bg-Primarycolor/20 rounded-full" />
          <div data-bar className="h-[2px] bg-Primarycolor/15 rounded-full" />
          <div data-bar className="h-[2px] bg-Primarycolor/10 rounded-full" />
        </div>
      </div>
    </div>
  );
};

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <CurrencyProvider>
        <AdminAuthProvider>
          <CartDrawerProvider>
            <SmoothScroll>
              <ScrollToTop />
              <SideCartDrawer />
              <Suspense fallback={<PageLoader />}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
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
                    <Route path="/cart" element={<CartErrorBoundary><Cart /></CartErrorBoundary>} />
                    <Route path="/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                    <Route path="/checkout" element={<Checkoutprocess />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/delivery-fee-thank-you" element={<DeliveryFeeThankYou />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  </Routes>
                </AnimatePresence>
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
            </SmoothScroll>
          </CartDrawerProvider>
        </AdminAuthProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;