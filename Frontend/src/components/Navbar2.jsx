import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MagnifyingGlass, User, ShoppingBag, ArrowLeft, SignOut, Package, List, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useCartDrawer } from '../context/CartDrawerContext';
import { toastSuccess } from '../utils/toastConfig';
import LogoWhite from '../assets/icons/Preachilogowhite.png';
import LogoBlack from '../assets/icons/prechilogoblack.png';

export default function Navbar2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { openCart, cart } = useCartDrawer();
  const totalCartCount = (cart?.items || []).reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);

  const whiteBackgroundPages = [
    '/shop', '/shopall', '/search', '/product/', '/bundle/',
    '/cart', '/checkout', '/orders', '/profile', '/signup',
    '/forgot-password', '/help', '/more', '/thank-you'
  ];

  const isWhiteBg = whiteBackgroundPages.some(path => location.pathname.includes(path));
  const isDark = !isWhiteBg;

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoadingTimeout(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('pendingOrderId');
    toastSuccess('Logged out successfully');
    navigate('/login');
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleCartClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    openCart();
  };

  // Colors based on context
  const textColor = isDark ? 'text-white' : 'text-Primarycolor';
  const hoverColor = isDark ? 'hover:text-white/70' : 'hover:text-Primarycolor/70';
  const iconSize = 20;

  if (loading && !loadingTimeout) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-40 h-16">
        <div className="h-full flex items-center justify-center">
          <div className="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin opacity-40" />
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ${
          isScrolled
            ? isDark
              ? 'bg-Primarycolor/90 backdrop-blur-xl border-b border-white/5'
              : 'bg-white/90 backdrop-blur-xl border-b border-Primarycolor/5'
            : 'bg-transparent'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="section-container">
          <div className="flex h-16 items-center justify-between">

            {/* Left: Mobile menu + Desktop nav links */}
            <div className="flex items-center gap-1">
              {/* Mobile menu button */}
              <button
                className={`lg:hidden p-2 -ml-2 ${textColor} ${hoverColor} transition-colors duration-300`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} weight="light" /> : <List size={22} weight="light" />}
              </button>

              {/* Desktop navigation links */}
              <div className="hidden lg:flex items-center gap-8 ml-2">
                {[
                  { to: '/shop', label: 'Shop' },
                  { to: '/shop?category=new', label: 'New' },
                  { to: '/help', label: 'Contact' },
                  { to: '/more', label: 'About' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`text-[0.8125rem] font-medium tracking-[0.04em] uppercase ${textColor} ${hoverColor} transition-colors duration-300 relative group`}
                  >
                    {label}
                    <span className={`absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-500 ${isDark ? 'bg-white' : 'bg-Primarycolor'}`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Logo */}
            <Link
              to="/home"
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
              aria-label="Prechi - Home"
            >
              <img
                src={isDark ? LogoWhite : LogoBlack}
                alt="Prechi"
                className="h-7 w-auto object-contain sm:h-8 transition-opacity duration-300 hover:opacity-80"
              />
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 ${textColor} ${hoverColor} transition-colors duration-300`}
                aria-label="Search"
              >
                <MagnifyingGlass size={iconSize} weight="light" />
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 ${textColor} ${hoverColor} transition-colors duration-300`}
                    aria-label="Account menu"
                    aria-expanded={isMenuOpen}
                  >
                    <User size={iconSize} weight="light" />
                  </button>

                  {/* Dropdown */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-1.5 z-50"
                      role="menu"
                    >
                      <div className="px-4 py-2.5 border-b border-border-subtle">
                        <p className="text-xs text-text-tertiary font-display">Signed in as</p>
                        <p className="text-sm font-medium text-text-primary font-display truncate mt-0.5">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors font-display"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={16} weight="light" />
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors font-display"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Package size={16} weight="light" />
                        Orders
                      </Link>
                      <div className="border-t border-border-subtle my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors font-display"
                        role="menuitem"
                      >
                        <SignOut size={16} weight="light" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`p-2 ${textColor} ${hoverColor} transition-colors duration-300`}
                  aria-label="Sign in"
                >
                  <User size={iconSize} weight="light" />
                </Link>
              )}

              {/* Cart */}
              {location.pathname === '/cart' ? (
                <button
                  onClick={() => navigate(-1)}
                  className={`p-2 ${textColor} ${hoverColor} transition-colors duration-300`}
                  aria-label="Go back"
                >
                  <ArrowLeft size={iconSize} weight="light" />
                </button>
              ) : (
                <button
                  onClick={handleCartClick}
                  className={`p-2 ${textColor} ${hoverColor} transition-colors duration-300 relative cursor-pointer`}
                  aria-label="Open Shopping Bag"
                >
                  <ShoppingBag size={iconSize} weight="light" />
                  {totalCartCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-Primarycolor text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center border border-white">
                      {totalCartCount > 9 ? '9+' : totalCartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar - slides down */}
        <div
          className={`overflow-hidden transition-all duration-500 ${
            isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          } ${isDark ? 'bg-Primarycolor/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="section-container py-3">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <MagnifyingGlass size={18} weight="light" className={`flex-shrink-0 ${isDark ? 'text-white/50' : 'text-Primarycolor/40'}`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent text-sm font-display placeholder:font-display focus:outline-none ${
                  isDark ? 'text-white placeholder:text-white/40' : 'text-Primarycolor placeholder:text-Primarycolor/40'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className={`text-xs font-medium tracking-[0.04em] uppercase ${isDark ? 'text-white/50 hover:text-white' : 'text-Primarycolor/40 hover:text-Primarycolor'} transition-colors`}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-Primarycolor/60 backdrop-blur-sm transition-opacity duration-500 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-Primarycolor transition-transform duration-500 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6">
            {/* User greeting */}
            {user && (
              <div className="mb-8 pb-6 border-b border-white/10">
                <p className="text-white/50 text-xs font-display tracking-[0.06em] uppercase mb-1">Welcome back</p>
                <p className="text-white text-lg font-display font-medium">{user.first_name}</p>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {[
                { to: '/shop', label: 'Shop All' },
                { to: '/shop?category=new', label: 'New Arrivals' },
                { to: '/shop?category=3in1', label: '3 in 1' },
                { to: '/shop?category=5in1', label: '5 in 1' },
                { to: '/shop?category=Bags', label: 'Bags' },
                { to: '/shop?category=Sets', label: 'Sets' },
                { to: '/help', label: 'Contact' },
                { to: '/more', label: 'About' },
              ].map(({ to, label }, i) => (
                <Link
                  key={to}
                  to={to}
                  className="text-white/80 hover:text-white text-2xl font-display font-light py-2 transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : '0ms',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openCart();
                }}
                className="flex items-center gap-3 text-white/80 hover:text-white py-2.5 text-sm font-display transition-colors w-full text-left"
              >
                <ShoppingBag size={18} weight="light" />
                Shopping Bag {totalCartCount > 0 && `(${totalCartCount})`}
              </button>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 text-white/60 hover:text-white py-2.5 text-sm font-display transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} weight="light" />
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-3 text-white/60 hover:text-white py-2.5 text-sm font-display transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package size={18} weight="light" />
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-white/60 hover:text-white py-2.5 text-sm font-display transition-colors w-full text-left"
                  >
                    <SignOut size={18} weight="light" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 text-white/60 hover:text-white py-2.5 text-sm font-display transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={18} weight="light" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
