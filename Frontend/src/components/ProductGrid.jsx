import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { Funnel, Rows, SquaresFour } from '@phosphor-icons/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useContext(AuthContext);
  const { currency, exchangeRate, country, contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 12;
  const categories = ['All', 'Sets', 'Tracksuits', 'New Arrivals', '3 in 1', '5 in 1'];
  const categoryMap = {
    'Sets': 'Sets',
    'Tracksuits': 'Tracksuits',
    'New Arrivals': 'new',
    '3 in 1': '3in1',
    '5 in 1': '5in1'
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${API_BASE_URL}/api/shopall`;
      if (filter !== 'All' && categoryMap[filter]) {
        url += `?category=${categoryMap[filter]}`;
      }
      const res = await axios.get(url);
      let productsData = res.data || [];

      if (filter === 'All') {
        productsData = [...productsData].sort((a, b) => {
          const isBrief = (product) => {
            if (!product) return false;
            if (!product.is_product && product.bundle_types && product.bundle_types.length > 0) {
              return product.bundle_types.some(type => {
                const typeLower = type.toLowerCase();
                return typeLower.includes('brief') || typeLower.includes('underwear') || typeLower.includes('boxer') || typeLower.includes('trunk');
              });
            }
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            return name.includes('brief') || name.includes('boxer') || name.includes('underwear') || name.includes('trunk') || category === 'briefs';
          };
          const aIsBrief = isBrief(a);
          const bIsBrief = isBrief(b);
          if (aIsBrief && !bIsBrief) return -1;
          if (!aIsBrief && bIsBrief) return 1;
          return 0;
        });
      }

      setProducts(productsData);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const displayedProducts = useMemo(() => {
    return products.slice(0, page * itemsPerPage);
  }, [products, page]);

  const hasMoreProducts = displayedProducts.length < products.length;

  const handleFilterChange = (category) => {
    setFilter(category);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleImageError = useCallback((e) => {
    e.target.style.opacity = '0';
  }, []);

  // Skeleton card
  const SkeletonCard = () => (
    <div className="flex flex-col">
      <div className="w-full aspect-[3/4] skeleton rounded-sm" />
      <div className="pt-4 space-y-2.5">
        <div className="h-3.5 skeleton rounded-sm w-3/4" />
        <div className="h-3 skeleton rounded-sm w-1/3" />
      </div>
    </div>
  );

  return (
    <section className="py-12 md:py-16 lg:py-20">
      {/* Section header */}
      <div className="section-container mb-8 md:mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight text-Primarycolor">
              Shop Collection
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary font-display">
              Premium comfort, tailored for everyday movement.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex text-sm font-display font-medium tracking-[0.04em] uppercase text-text-secondary hover:text-text-primary transition-colors duration-300 whitespace-nowrap"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="section-container mb-6 md:mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(category)}
                className={`px-4 py-2 text-[0.8125rem] font-display font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 ${
                  filter === category
                    ? 'text-Primarycolor bg-surface'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                aria-pressed={filter === category}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Layout toggle (mobile only) */}
          <div className="flex sm:hidden items-center gap-0.5 border border-border rounded-sm p-0.5">
            <button
              onClick={() => setMobileLayout('one')}
              className={`p-1.5 rounded-sm transition-colors ${mobileLayout === 'one' ? 'bg-Primarycolor text-white' : 'text-text-tertiary'}`}
              aria-label="Single column"
            >
              <Rows size={14} weight="bold" />
            </button>
            <button
              onClick={() => setMobileLayout('two')}
              className={`p-1.5 rounded-sm transition-colors ${mobileLayout === 'two' ? 'bg-Primarycolor text-white' : 'text-text-tertiary'}`}
              aria-label="Two column"
            >
              <SquaresFour size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading || contextLoading ? (
        <div className="section-container">
          <div className={`grid gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12 ${
            mobileLayout === 'one'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : error ? (
        <div className="section-container text-center py-16">
          <p className="text-text-secondary font-display text-sm mb-4">Something went wrong loading products.</p>
          <button
            onClick={fetchProducts}
            className="btn btn-primary btn-sm"
          >
            Try again
          </button>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="section-container text-center py-16">
          <p className="text-text-tertiary font-display text-sm">No products found for this filter.</p>
        </div>
      ) : (
        <div className="section-container">
          <div className={`grid gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12 ${
            mobileLayout === 'one'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {displayedProducts.map((product, index) => (
              <ProductCard
                key={`${product.is_product ? 'p' : 'b'}-${product.id}-${index}`}
                product={product}
                onImageError={handleImageError}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMoreProducts && (
            <div className="flex justify-center mt-12 md:mt-16">
              <button
                onClick={handleLoadMore}
                className="btn btn-outline"
              >
                Load more ({products.length - displayedProducts.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

// ─── Product Card ─────────────────────────────────────────────────
const ProductCard = ({ product, onImageError }) => {
  const { id, name, price, image, color, is_product, variantId, bundle_types, total_stock } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isSoldOut = is_product ? (total_stock === 0) : false;

  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }

  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;

  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';

  return (
    <div className="group flex flex-col">
      <Link to={productUrl} className="block relative overflow-hidden bg-surface">
        {/* Image container */}
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {/* Skeleton placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={image}
            alt={displayName}
            className={`w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-[1.03] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            onError={onImageError}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-Primarycolor/50 flex items-center justify-center">
              <span className="text-xs font-display font-medium tracking-[0.1em] uppercase text-white">
                Sold out
              </span>
            </div>
          )}

          {/* Bundle type badges */}
          {bundle_types && bundle_types.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {bundle_types.map((type, index) => (
                <span
                  key={index}
                  className="bg-Primarycolor text-white text-[0.625rem] font-display font-medium tracking-[0.08em] uppercase px-2.5 py-1"
                >
                  {type}
                </span>
              ))}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-Primarycolor/0 group-hover:bg-Primarycolor/5 transition-colors duration-500" />
        </div>
      </Link>

      {/* Info */}
      <div className="pt-3 sm:pt-4">
        <Link to={productUrl}>
          <h3 className="text-sm font-display font-medium text-text-primary leading-snug line-clamp-1 group-hover:text-text-secondary transition-colors duration-300">
            {displayName}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-display text-text-secondary tabular-nums">
          {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
            style: 'currency',
            currency: displayCurrency,
            minimumFractionDigits: country === 'Nigeria' ? 0 : 2,
            maximumFractionDigits: country === 'Nigeria' ? 0 : 2
          })}
        </p>
      </div>
    </div>
  );
};

export default ProductGrid;