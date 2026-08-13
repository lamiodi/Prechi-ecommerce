import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { SkeletonPulse } from './skeletons';
import ProductCard from './ProductCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prechi-ecommerce.onrender.com';

const NewReleaseGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);

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
      const filteredProducts = productData
        .filter(item => item.is_product)
        .map(item => ({
          ...item,
          productId: item.product_id || item.id
        }));

      setProducts(filteredProducts.slice(0, 4));
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

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
            <SkeletonPulse className="h-8 w-40" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col">
                <SkeletonPulse className="w-full aspect-[3/4] border border-border/30" />
                <div className="pt-4 space-y-2.5">
                  <SkeletonPulse className="h-3.5 w-3/4" />
                  <SkeletonPulse className="h-3 w-1/3" />
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
          <Button onClick={fetchNewReleases} size="sm">
            Try again
          </Button>
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
          <Button asChild variant="outline" size="sm">
            <Link to="/shop?category=new">
              View all new releases
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};



export default NewReleaseGrid;