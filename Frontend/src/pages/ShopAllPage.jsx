import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Rows, SquaresFour, SortAscending } from '@phosphor-icons/react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { Button } from '../components/ui/button';
import { SkeletonPulse, ShopSkeleton } from '../components/skeletons';
import ProductCard from '../components/ProductCard';
import { toTitleCase } from '../lib/utils';

const useMetaTags = (title, description) => {
  useEffect(() => {
    document.title = title;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
    return () => {
      document.title = 'Prechi Clothing - Premium Comfort Wear';
    };
  }, [title, description]);
};

const CollectionPageSchema = () => {
  const pageTitle = 'Shop All';
  const pageDescription = 'Explore our complete collection of premium tracksuits and streetwear';
  const pageUrl = window.location.href;
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": pageTitle,
        "description": pageDescription,
        "url": pageUrl,
        "mainEntity": { "@type": "ItemList", "itemListElement": [] }
      })}
    </script>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '') + '/api'
  : 'https://prechi-ecommerce.onrender.com/api';
const api = axios.create({ baseURL: API_BASE_URL });

const ShopAllPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useAuth();
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 16;
  const category = searchParams.get('category');

  const specialFilters = ['All', 'New Arrivals', '3 in 1', '5 in 1'];

  const filterCategories = useMemo(() => {
    const dynamicCategories = categories.filter(c =>
      !['new arrivals', '3 in 1', '5 in 1', 'all'].includes(c.toLowerCase())
    );
    return [...specialFilters, ...dynamicCategories];
  }, [categories]);

  const categoryMap = {
    'New Arrivals': 'new',
    '3 in 1': '3in1',
    '5 in 1': '5in1',
    ...categories.reduce((acc, cat) => ({ ...acc, [cat]: cat }), {})
  };

  const reverseCategoryMap = {
    'new': 'New Arrivals',
    '3in1': '3 in 1',
    '5in1': '5 in 1',
    ...categories.reduce((acc, cat) => ({ ...acc, [cat.toLowerCase()]: cat }), {})
  };

  const metaConfig = {
    'All': { title: 'Shop All - Premium Tracksuits, Sets & Streetwear | Prechi Clothing', description: 'Explore our complete collection of premium tracksuits, coordinated sets, and streetwear.' },
    'Sets': { title: 'Premium Sets Collection | Prechi Clothing', description: 'Discover our luxury coordinated sets collection. Premium comfort sets with superior fit.' },
    'Bags': { title: 'Signature Leather Bags | Prechi Clothing', description: 'Explore our luxury handcrafted signature leather bags.' },
    'Tracksuits': { title: 'Premium Tracksuits & Activewear | Prechi Clothing', description: 'Shop high-performance tracksuits and activewear. Superior comfort and stylish designs.' },
    'New Arrivals': { title: 'New Arrivals - Latest Collection | Prechi Clothing', description: 'Discover our newest arrivals in premium comfort wear.' },
    '3 in 1': { title: '3-in-1 Premium Bundles | Prechi Clothing', description: 'Explore our exclusive 3-in-1 bundles featuring coordinated sets.' },
    '5 in 1': { title: '5-in-1 Luxury Bundles | Prechi Clothing', description: 'Discover our premium 5-in-1 bundles with complete outfit coordination.' }
  };

  const currentMeta = metaConfig[currentFilter] || metaConfig['All'];
  useMetaTags(currentMeta.title, currentMeta.description);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (categories.length === 0) {
        const catRes = await api.get('/shopall/categories');
        if (Array.isArray(catRes.data)) setCategories(catRes.data);
      }
      const endpoint = category ? `/shopall?category=${category}` : `/shopall`;
      const res = await api.get(endpoint);
      if (!Array.isArray(res.data)) throw new Error('Unexpected response format');
      const processedData = res.data.map(item => {
        const baseItem = { id: item.id, name: item.name, price: item.price, image: item.image, created_at: item.created_at, category: item.category, total_stock: item.total_stock };
        if (!item.is_product) return { ...baseItem, is_product: false, bundle_types: item.bundle_types || [] };
        return { ...baseItem, is_product: true, variantId: item.variantId, sizes: item.sizes || [], colors: item.colors || [] };
      });
      setProducts(processedData);
      if (category) {
        const normalizedCategory = category.toLowerCase();
        if (reverseCategoryMap[normalizedCategory]) setCurrentFilter(reverseCategoryMap[normalizedCategory]);
        else {
          const match = categories.find(c => c.toLowerCase() === normalizedCategory);
          setCurrentFilter(match || 'All');
        }
      } else setCurrentFilter('All');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [category, categories.length]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (currentFilter === '3 in 1' || currentFilter === '5 in 1') {
      filtered = filtered.filter(item => !item.is_product && item.bundle_types?.includes(currentFilter === '3 in 1' ? '3-in-1' : '5-in-1'));
    }
    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-high': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'newest': filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      default: break;
    }
    return filtered;
  }, [products, currentFilter, sortBy]);

  const displayedProducts = useMemo(() => filteredProducts.slice(0, page * itemsPerPage), [filteredProducts, page]);
  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    const newParams = new URLSearchParams();
    if (filter !== 'All') newParams.set('category', categoryMap[filter] || filter.toLowerCase());
    setSearchParams(newParams);
    setPage(1);
  };

  const handleImageError = (e) => { e.target.style.opacity = '0'; };

  const getPageTitle = () => currentFilter === 'All' ? 'All Products' : currentFilter;

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
    <PageTransition className="flex flex-col min-h-[100dvh] bg-Secondarycolor">
      <CollectionPageSchema />
      <SEO
        title="Shop All"
        description="Browse our complete collection of premium tracksuits, coordinated sets, and exclusive streetwear."
        url="/shop"
      />
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-20">
        <div className="section-container">
          {/* Page header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-Primarycolor">
              {getPageTitle()}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
              <p className="text-sm text-text-secondary font-display">
                Premium comfort, tailored for everyday movement.
              </p>
              {!loading && (
                <p className="text-xs text-text-tertiary font-display tabular-nums">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Filter + Sort bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-8 md:mb-10 border-b border-border pb-3 sm:pb-4">
            {/* Filters */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 sm:pb-1 -mb-px sm:-mb-[calc(1rem+1px)] min-w-0 flex-1">
              {filterCategories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-3.5 sm:px-4 py-2 text-[0.8125rem] font-display font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 border-b-2 -mb-px ${
                    currentFilter === filter
                      ? 'text-Primarycolor border-Primarycolor'
                      : 'text-text-tertiary border-transparent hover:text-text-primary hover:border-border'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                  aria-pressed={currentFilter === filter}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
              {/* Layout toggle (mobile) */}
              <div className="flex sm:hidden items-center gap-0.5 border border-border rounded-sm p-0.5 bg-surface">
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

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none h-9 pl-3 pr-8 text-xs font-display font-medium tracking-[0.02em] text-text-secondary bg-transparent border border-border rounded-sm focus:outline-none focus:border-Primarycolor transition-colors cursor-pointer"
                >
                  <option value="default">Sort by</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="newest">Newest First</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Product grid */}
          {loading || contextLoading ? (
            <ShopSkeleton />
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-text-secondary font-display text-sm mb-4">Something went wrong loading products.</p>
              <Button onClick={fetchProducts} size="sm">
                Try again
              </Button>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-tertiary font-display text-sm">No products found for this filter.</p>
            </div>
          ) : (
            <>
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

              {/* Pagination */}
          {!loading && filteredProducts.length > itemsPerPage && (
            <div className="flex justify-center mt-12 md:mt-16">
              {/* Add shadcn pagination component here later */}
              <div className="flex gap-1">
                {[...Array(Math.ceil(filteredProducts.length / itemsPerPage))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? 'default' : 'outline'}
                    size="icon"
                    className="w-8 h-8 rounded-sm text-xs font-display flex items-center justify-center transition-colors"
                    onClick={() => {
                      setPage(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </PageTransition>
  );
};



export default ShopAllPage;