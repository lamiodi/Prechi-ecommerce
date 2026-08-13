import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { Funnel, Rows, SquaresFour } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { SkeletonPulse } from './skeletons';
import ProductCard from './ProductCard';

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
      const productsData = res.data || [];

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

  // Skeleton card with GSAP shimmer
  const SkeletonCard = () => (
    <div className="flex flex-col">
      <SkeletonPulse className="w-full aspect-[3/4] border border-border/30" />
      <div className="pt-4 space-y-2.5">
        <SkeletonPulse className="h-3.5 w-3/4" />
        <SkeletonPulse className="h-3 w-1/3" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 min-w-0 flex-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(category)}
                className={`px-3.5 sm:px-4 py-2 text-[0.8125rem] font-display font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 rounded-sm ${
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
          <div className="flex sm:hidden items-center justify-end gap-0.5 border-t border-border/40 pt-2">
            <div className="flex items-center gap-0.5 border border-border rounded-sm p-0.5 bg-surface">
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
          <Button
            onClick={fetchProducts}
            size="sm"
          >
            Try again
          </Button>
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
              <Button
                onClick={handleLoadMore}
                variant="outline"
              >
                Load more ({products.length - displayedProducts.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};



export default ProductGrid;