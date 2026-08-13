import React, { useState, useEffect, useRef, Suspense, lazy, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import Navbar2 from '../components/Navbar2';
import { CurrencyContext } from '../pages/CurrencyContext';
import NewsletterForm from '../components/NewsletterForm';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import SEO from '../components/SEO';
import PageTransition from '../components/PageTransition';

import img1 from '../assets/images/IMG_4552.JPG';
import img2 from '../assets/images/IMG_4554.JPG';
import img3 from '../assets/images/IMG_4558.JPG';
import img4 from '../assets/images/IMG_4559.JPG';

const LocationPopup = lazy(() => import('../components/LocationPopup'));
const WhatsAppChatWidget = lazy(() => import('../components/WhatsAppChatWidget'));

import { toTitleCase } from '../lib/utils';

// Parallax Category Card Component
const ParallaxCategoryCard = ({ category, index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      <Link
        to={category.link}
        className="group relative block overflow-hidden bg-surface rounded-sm border border-border/40 aspect-[3/4]"
      >
        <motion.img
          src={category.image}
          alt={category.title}
          className="absolute inset-0 w-full h-[120%] object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          style={{ y: imageY, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          onError={(e) => { e.target.style.opacity = '0'; }}
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-Primarycolor/90 via-Primarycolor/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-4 sm:p-5">
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-display font-medium tracking-[0.1em] uppercase text-white/90 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
              Category
            </span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-1 group-hover:translate-x-0.5 transition-transform duration-300">
              {category.title}
            </h3>
            <p className="text-xs sm:text-sm font-display text-white/80 line-clamp-1 mb-3">
              {category.subtitle}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-[0.08em] text-white/90 group-hover:text-white transition-colors duration-300">
              <span>Explore Collection</span>
              <ArrowUpRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`.replace(/\/api$/, '') + '/api'
  : 'https://prechi-ecommerce.onrender.com/api';

const DEFAULT_CATEGORY_IMAGES = {
  newArrivals: 'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786624254/products/hh7gi5fyxookuopvrae5.jpg',
  sets: 'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620683/prechi_products/cugrpbmrbtexkzr8b0zj.jpg',
  maleWears: 'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786609055/kb21cywto2ljzfwqy2cs.jpg',
  femaleWears: 'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620533/prechi_products/b02g7rxr25jxtcbcccwj.jpg'
};

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
    contextLoading: false,
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/shopall`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (error) {
        console.error('Error fetching products for category showcase:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const getCategoryCards = () => {
    const newArrivalProd = products.find(p => p.is_new_release || p.category?.toLowerCase() === 'new');
    const setsProd = products.find(p => p.category === 'Sets' && !p.name?.toLowerCase().includes('men'));
    const maleProd = products.find(p => p.name?.toLowerCase().includes('men') || p.name?.toLowerCase().includes('male'));
    const femaleProd = products.find(p => p.name?.toLowerCase().includes('skirt') || p.name?.toLowerCase().includes('pink') || p.name?.toLowerCase().includes('milkshake') || (!p.name?.toLowerCase().includes('men') && p.category === 'Sets'));

    return [
      {
        id: 'new-arrivals',
        title: 'New Arrivals',
        subtitle: 'Latest Drops & Fresh Fits',
        link: '/shop?category=new',
        image: newArrivalProd?.image || DEFAULT_CATEGORY_IMAGES.newArrivals,
      },
      {
        id: 'sets',
        title: 'Sets',
        subtitle: 'Coordinated Luxury Outfits',
        link: '/shop?category=Sets',
        image: setsProd?.image || DEFAULT_CATEGORY_IMAGES.sets,
      },
      {
        id: 'male-wears',
        title: 'Male Wears',
        subtitle: "Men's Premium Streetwear",
        link: '/shop?category=Male%20Wears',
        image: maleProd?.image || DEFAULT_CATEGORY_IMAGES.maleWears,
      },
      {
        id: 'female-wears',
        title: 'Female Wears',
        subtitle: "Women's Elevated Essentials",
        link: '/shop?category=Female%20Wears',
        image: femaleProd?.image || DEFAULT_CATEGORY_IMAGES.femaleWears,
      },
    ];
  };

  const categoryCards = getCategoryCards();

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

        {/* Explore Collection Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-Secondarycolor overflow-hidden">
          <div className="section-container mb-6 md:mb-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-display font-medium tracking-[0.15em] uppercase text-text-tertiary mb-2 block">
                  Categories
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

          {/* Category Cards Grid */}
          <div className="section-container">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {categoryCards.map((categoryItem, index) => (
                <ParallaxCategoryCard
                  key={categoryItem.id}
                  category={categoryItem}
                  index={index}
                />
              ))}
            </div>

            {/* Mobile shop all */}
            <div className="flex sm:hidden justify-center mt-8">
              <Button asChild variant="outline" size="sm" className="w-full max-w-[200px]">
                <Link to="/shop">
                  Shop all categories
                </Link>
              </Button>
            </div>
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
