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
    'Tracksuits': { title: 'Premium Tracksuits & Activewear | Prechi Clothing', description: 'Shop high-performance tracksuits and activewear. Superior comfort and stylish designs.' },
    'New Arrivals': { title: 'New Arrivals - Latest Collection | Prechi Clothing', description: 'Discover our newest arrivals in premium comfort wear.' },
    '3 in 1': { title: '3-in-1 Premium Bundles | Prechi Clothing', description: 'Explore our exclusive 3-in-1 bundles featuring coordinated sets.' },
    '5 in 1': { title: '5-in-1 Luxury Bundles | Prechi Clothing', description: 'Discover our premium 5-in-1 bundles with complete outfit coordination.' }
  };

  const currentMeta = metaConfig[currentFilter] || metaConfig['All'];
  useMetaTags(currentMeta.title, currentMeta.description);

  const isBrief = useCallback((product) => {
    if (!product) return false;
    if (!product.is_product && product.bundle_types && product.bundle_types.length > 0) {
      return product.bundle_types.some(type => {
        const typeLower = type.toLowerCase();
        return typeLower.includes('brief') || typeLower.includes('underwear') || typeLower.includes('boxer') || typeLower.includes('trunk');
      });
    }
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    return name.includes('brief') || name.includes('boxer') || name.includes('underwear') || name.includes('trunk') || cat === 'briefs';
  }, []);

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
        return { ...baseItem, is_product: true, variantId: item.variantId, sizes: item.sizes || [] };
      });
      if (!category) {
        processedData.sort((a, b) => {
          const aIsBrief = isBrief(a); const bIsBrief = isBrief(b);
          if (aIsBrief && !bIsBrief) return -1;
          if (!aIsBrief && bIsBrief) return 1;
          return 0;
        });
      }
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
  }, [category, isBrief, categories.length]);

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
          <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-border pb-4">
            {/* Filters */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 -mb-[calc(1rem+1px)]">
              {filterCategories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 text-[0.8125rem] font-display font-medium tracking-[0.02em] whitespace-nowrap transition-all duration-300 border-b-2 -mb-px ${
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
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Layout toggle (mobile) */}
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
              </div>
            </div>
          </div>

          {/* Product grid */}
          {loading || contextLoading ? (
            <div className={`grid gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12 ${
              mobileLayout === 'one'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}>
              {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-text-secondary font-display text-sm mb-4">Something went wrong loading products.</p>
              <button onClick={fetchProducts} className="btn btn-primary btn-sm">
                Try again
              </button>
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
                  <button
                    key={i}
                    onClick={() => {
                      setPage(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-8 h-8 rounded-sm text-xs font-display flex items-center justify-center transition-colors ${
                      page === i + 1 
                        ? 'bg-Primarycolor text-white' 
                        : 'bg-surface border border-border text-text-secondary hover:bg-border/50'
                    }`}
                  >
                    {i + 1}
                  </button>
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

// ─── Product Card ─────────────────────────────────────────────────
const ProductCard = ({ product, onImageError }) => {
  const { id, name, price, image, is_product, variantId, bundle_types, total_stock } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isSoldOut = is_product ? (total_stock === 0) : false;

  let displayName = name || 'Unnamed Product';

  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;

  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';

  return (
    <div className="group flex flex-col">
      <Link to={productUrl} className="block relative overflow-hidden bg-surface">
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}
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

          {isSoldOut && (
            <div className="absolute inset-0 bg-Primarycolor/50 flex items-center justify-center z-10">
              <span className="text-xs font-display font-medium tracking-[0.1em] uppercase text-white">
                Sold out
              </span>
            </div>
          )}

          {bundle_types && bundle_types.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {bundle_types.map((type, index) => (
                <span key={index} className="bg-Primarycolor text-white text-[0.625rem] font-display font-medium tracking-[0.08em] uppercase px-2.5 py-1">
                  {type}
                </span>
              ))}
            </div>
          )}

          <div className="absolute inset-0 bg-Primarycolor/0 group-hover:bg-Primarycolor/5 transition-colors duration-500" />
        </div>
      </Link>

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

export default ShopAllPage;