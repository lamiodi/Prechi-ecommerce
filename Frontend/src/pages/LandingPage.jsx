import React, { useState, useEffect, useRef, Suspense, lazy, useContext } from 'react';
import { Menu, X, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar2 from '../components/Navbar2';
import { CurrencyContext } from '../pages/CurrencyContext';
import NewsletterForm from '../components/NewsletterForm';
import Footer from '../components/Footer';
import Button from '../components/Button';
import SEO from '../components/SEO';
// Hero video from public folder (portrait MP4)
const heroVideo = '/IMG_9987.mp4';

// Lazy load components for better performance
const LocationPopup = lazy(() => import('../components/LocationPopup'));
const WhatsAppChatWidget = lazy(() => import('../components/WhatsAppChatWidget'));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '') + '/api'
  : 'https://prechi-ecommerce.onrender.com/api';

const LandingPage = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState({ mobile: false, desktop: false });
  const [products, setProducts] = useState([]);
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);

  // Access currency context for dynamic price formatting
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

  // Helper function to format prices dynamically
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
        const res = await axios.get(`${API_BASE_URL}/shopall`);
        if (Array.isArray(res.data)) {
          // Shuffle the array
          const shuffled = res.data.sort(() => 0.5 - Math.random());
          // Set only the first 4 products from the shuffled array
          setProducts(shuffled.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch products for landing page:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleVideoError = (videoType) => {
    console.error(`${videoType} video failed to load`);
    setVideoError(true);
  };

  const handleVideoLoaded = (videoType) => {
    console.log(`${videoType} video loaded successfully`);
    setVideoLoaded(prev => ({ ...prev, [videoType.toLowerCase()]: true }));
  };

  useEffect(() => {
    // Scroll to top on mount (fixes mobile showing footer first)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Force video load on component mount
    if (mobileVideoRef.current) {
      mobileVideoRef.current.load();
    }
    if (desktopVideoRef.current) {
      desktopVideoRef.current.load();
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <SEO 
        title="Home" 
        description="Shop premium tracksuits, coordinated sets, and exclusive streetwear from Prechi Clothing. Bold designs and unmatched comfort for everyday excellence."
        url="/"
      />
      {/* Navigation - Overlaying the hero section */}
      <Navbar2 />
      <main className="bg-Secondarycolor">
        {/* Hero Section */}
        <section className="relative h-[85vh] md:h-[90vh] lg:h-screen bg-white overflow-hidden">
          {/* Cloudinary Videos */}
          <video
            ref={mobileVideoRef}
            className="absolute top-0 left-0 w-full h-full object-cover lg:hidden z-10"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => handleVideoError('Mobile')}
            onLoadStart={() => console.log('Mobile video loading started')}
            onCanPlay={() => console.log('Mobile video can play')}
            onLoadedData={() => handleVideoLoaded('Mobile')}
          />
          <video
            ref={desktopVideoRef}
            className="absolute top-0 left-0 w-full h-full object-cover hidden lg:block z-10"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => handleVideoError('Desktop')}
            onLoadStart={() => console.log('Desktop video loading started')}
            onCanPlay={() => console.log('Desktop video can play')}
            onLoadedData={() => handleVideoLoaded('Desktop')}
          />

          {/* Debug overlay - shows if videos are not loading */}
          {videoError && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center z-30">
              <p className="text-black text-xl font-bold">Video Loading Error</p>
            </div>
          )}

          {/* Content overlay with transparent background */}
          <div className="relative z-30 container mx-auto lg:mx-5 h-full flex items-center md:items-end justify-start pt-12 sm:pt-16 md:pt-20 md:pb-16 lg:pt-0 lg:pb-32">
            <div className="typography flex flex-col w-full items-start space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 z-20 ml-2 lg:ml-8">
              <h1 className="text-left lgx:text-5xl leading-tight sm:leading-normal md:leading-relaxed text-white">
                <span className="font-PatrickHand max-sm:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  Bold Fits.
                </span>
                <br />
                <span className="font-PatrickHand max-sm:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl block mt-2">
                  Premium Sets & Tracksuits.
                </span>
              </h1>
              <Link to="/shop">
                <Button
                  label="SHOP NOW"
                  variant="secondary"
                  size="medium"
                  stateProp="default"
                  className="w-44 hover:opacity-90"
                  divClassName=""
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Product Showcase Grid */}
        <section className="bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {products.length > 0 ? (
              products.map((product, index) => {
                const productUrl = product.is_product
                  ? `/product/${product.id}${product.variantId ? `?variant=${product.variantId}` : ''}`
                  : `/bundle/${product.id}`;

                return (
                  <div key={product.id || index} className="relative group cursor-pointer overflow-hidden">
                    <div className="aspect-[4/5]">
                      <img
                        src={product.image || "https://via.placeholder.com/400x500?text=No+Image"}
                        alt={product.name || "Product Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=No+Image'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-8 left-8 text-white">
                        <h3 className="text-3xl font-bold mb-2 uppercase font-Manrope">{product.name}</h3>
                        <p className="text-lg mb-4 font-PatrickHand">{formatPrice(product.price)}</p>
                        <Link to={productUrl}>
                          <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors font-Manrope">
                            SHOP NOW
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Skeleton loading state
              [...Array(4)].map((_, i) => (
                <div key={i} className="relative group cursor-pointer overflow-hidden bg-gray-800 animate-pulse">
                  <div className="aspect-[4/5]"></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <NewsletterForm inverted={true} />
      </main>
      {/* Footer */}
      <Footer inverted={true} />

      {/* Lazy-loaded components for better performance */}
      <Suspense fallback={null}>
        <WhatsAppChatWidget />
      </Suspense>
      <Suspense fallback={null}>
        <LocationPopup />
      </Suspense>
    </div>
  );
};

export default LandingPage;
