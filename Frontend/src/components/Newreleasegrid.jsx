import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { ArrowRight } from '@phosphor-icons/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const NewReleaseGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);

  const isBrief = useCallback((product) => {
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
  }, []);

  const fetchNewReleases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/shopall?category=new&limit=4`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch products');
      }
      const productData = await response.json();
      let filteredProducts = productData
        .filter(item => item.is_product)
        .map(item => ({
          ...item,
          productId: item.product_id || item.id
        }));

      filteredProducts = [...filteredProducts].sort((a, b) => {
        const aIsBrief = isBrief(a);
        const bIsBrief = isBrief(b);
        if (aIsBrief && !bIsBrief) return -1;
        if (!aIsBrief && bIsBrief) return 1;
        return 0;
      });

      setProducts(filteredProducts.slice(0, 4));
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [isBrief]);

  useEffect(() => {
    fetchNewReleases();
  }, [fetchNewReleases]);

  const handleImageError = useCallback((e) => {
    e.target.style.opacity = '0';
  }, []);

  if (loading || contextLoading) {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="section-container">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div className="h-8 skeleton rounded-sm w-40" />
            <div className="h-4 skeleton rounded-sm w-20" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="w-full aspect-[3/4] skeleton rounded-sm" />
                <div className="pt-4 space-y-2.5">
                  <div className="h-3.5 skeleton rounded-sm w-3/4" />
                  <div className="h-3 skeleton rounded-sm w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 md:py-16">
        <div className="section-container text-center">
          <p className="text-text-secondary font-display text-sm mb-4">Unable to load new releases.</p>
          <button onClick={fetchNewReleases} className="btn btn-primary btn-sm">
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="section-container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight text-Primarycolor">
              New releases
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary font-display">
              Just dropped. Be the first to wear them.
            </p>
          </div>
          <Link
            to="/shop?category=new"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-display font-medium tracking-[0.04em] uppercase text-text-secondary hover:text-text-primary transition-colors duration-300 group"
          >
            View all
            <ArrowRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.variantId}
              product={product}
              onImageError={handleImageError}
            />
          ))}
        </div>

        {/* Mobile "View all" link */}
        <div className="flex sm:hidden justify-center mt-8">
          <Link
            to="/shop?category=new"
            className="btn btn-outline text-xs"
          >
            View all new releases
          </Link>
        </div>
      </div>
    </section>
  );
};

const ProductCard = ({ product, onImageError }) => {
  const { name, price, image, productId, variantId, total_stock } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isSoldOut = total_stock === 0;

  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) displayName = displayName.split('–')[0].trim();
  if (displayName.match(/\((.*?)\)$/)) displayName = displayName.replace(/\((.*?)\)$/, '').trim();

  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';

  return (
    <div className="group flex flex-col">
      <Link to={`/product/${productId}?variant=${variantId}`} className="block relative overflow-hidden bg-surface">
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}

          {isSoldOut && (
            <div className="absolute inset-0 bg-Primarycolor/50 flex items-center justify-center z-10">
              <span className="text-xs font-display font-medium tracking-[0.1em] uppercase text-white">
                Sold out
              </span>
            </div>
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
            width={400}
            height={533}
          />

          <div className="absolute inset-0 bg-Primarycolor/0 group-hover:bg-Primarycolor/5 transition-colors duration-500" />
        </div>
      </Link>

      <div className="pt-3 sm:pt-4">
        <Link to={`/product/${productId}?variant=${variantId}`}>
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

export default NewReleaseGrid;