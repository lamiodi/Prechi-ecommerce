import React, { useState, useEffect, useRef, Suspense, lazy, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import Navbar2 from '../components/Navbar2';
import { CurrencyContext } from '../pages/CurrencyContext';
import NewsletterForm from '../components/NewsletterForm';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';
import { CircularGallery } from '../components/ui/circular-gallery-2';

import img1 from '../assets/images/IMG_4552.JPG';
import img2 from '../assets/images/IMG_4554.JPG';
import img3 from '../assets/images/IMG_4558.JPG';
import img4 from '../assets/images/IMG_4559.JPG';

const LocationPopup = lazy(() => import('../components/LocationPopup'));
const WhatsAppChatWidget = lazy(() => import('../components/WhatsAppChatWidget'));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '') + '/api'
  : 'https://prechi-ecommerce.onrender.com/api';

const DEFAULT_FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'ASH & PINK TRACKSUIT SET',
    price: 70000,
    image: img1,
    is_product: true,
  },
  {
    id: 2,
    name: 'NAVY BLUE TRACKSUIT SET',
    price: 70000,
    image: img2,
    is_product: true,
  },
  {
    id: 3,
    name: 'Brown Diamond Set',
    price: 70000,
    image: img3,
    is_product: true,
  },
  {
    id: 4,
    name: 'Pink Diamond Set',
    price: 70000,
    image: img4,
    is_product: true,
  },
];

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
    contextLoading: false,
  };

  const {
    currency = 'NGN',
    exchangeRate = 1,
    country = 'Nigeria',
    contextLoading = false,
  } = currencyContext;

  const formatPrice = (price) => {
    let parsedPrice = 0;
    if (typeof price === 'number') {
      parsedPrice = price;
    } else if (typeof price === 'string') {
      parsedPrice = parseFloat(price.replace(/[₦,]/g, '')) || 0;
    }
    const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate);
    const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
    return displayPrice.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: country === 'Nigeria' ? 0 : 2,
      maximumFractionDigits: country === 'Nigeria' ? 0 : 2
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/shopall`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data.slice(0, 4));
        } else {
          setProducts(DEFAULT_FEATURED_PRODUCTS);
        }
      } catch (error) {
        setProducts(DEFAULT_FEATURED_PRODUCTS);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Format circular gallery items with visible product name AND price text
  const galleryItems = useMemo(() => {
    const activeProducts = products.length > 0 ? products : DEFAULT_FEATURED_PRODUCTS;
    return activeProducts.map((prod) => {
      const formattedPrice = formatPrice(prod.price || 70000);
      let name = prod.name || 'Featured Product';
      if (name.includes('–')) name = name.split('–')[0].trim();
      return {
        image: prod.image || img1,
        text: `${name} — ${formattedPrice}`,
        name: name,
        price: formattedPrice,
        url: prod.is_product ? `/product/${prod.id}` : `/bundle/${prod.id}`
      };
    });
  }, [products, country, exchangeRate]);

  return (
    <PageTransition className="min-h-[100dvh] bg-Secondarycolor grain-overlay">
      <SEO
        title="Home"
        description="Shop premium tracksuits, coordinated sets, and exclusive streetwear from Prechi Clothing. Bold designs and unmatched comfort for everyday excellence."
        url="/"
      />
      <Navbar2 />

      <main>
        {/* Hero */}
        <HeroSection />

        {/* Editorial Showcase Grid / Circular Gallery */}
        <section className="py-12 md:py-16 lg:py-20 bg-Secondarycolor overflow-hidden">
          <div className="section-container mb-6 md:mb-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-display font-medium tracking-[0.15em] uppercase text-text-tertiary mb-2 block">
                  Featured
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold tracking-tight text-Primarycolor">
                  Explore the collection
                </h2>
              </div>
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-display font-medium tracking-[0.04em] uppercase text-text-secondary hover:text-text-primary transition-colors duration-300 group"
              >
                Shop all
                <ArrowUpRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Interactive 3D Circular Gallery */}
          <div className="w-full relative h-[480px] sm:h-[550px] md:h-[620px] mb-6">
            <CircularGallery
              items={galleryItems}
              bend={3}
              borderRadius={0.06}
              scrollEase={0.03}
              scrollSpeed={2.5}
              className="w-full h-full"
            />
          </div>

          {/* Explore Button */}
          <div className="flex justify-center mt-6">
            <Button asChild variant="outline" size="sm" className="px-8 py-3">
              <Link to="/shop" className="flex items-center gap-2 font-display text-xs uppercase tracking-wider">
                Explore Full Collection
                <ArrowUpRight size={14} weight="bold" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Newsletter */}
        <NewsletterForm inverted={true} />
      </main>

      <Footer inverted={false} />

      <Suspense fallback={null}>
        <WhatsAppChatWidget />
      </Suspense>
      <Suspense fallback={null}>
        <LocationPopup />
      </Suspense>
    </PageTransition>
  );
};

export default LandingPage;
