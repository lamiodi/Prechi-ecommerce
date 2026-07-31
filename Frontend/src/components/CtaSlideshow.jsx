import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: API_BASE_URL });

const CtaSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  const ctaimage = "https://res.cloudinary.com/dgcwviufp/image/upload/f_auto,q_auto,w_1200/v1756112992/ctaimage_md7l1k.png";
  const Newsletterimage = "https://res.cloudinary.com/dgcwviufp/image/upload/f_auto,q_auto,w_1200/v1756114935/Newsletterimage_uxjkup.webp";
  const bundleImage = "https://res.cloudinary.com/dgcwviufp/image/upload/f_auto,q_auto,w_1200/v1756112980/bundleImage_wonzss.png";
  const signup = "https://res.cloudinary.com/dgcwviufp/image/upload/f_auto,q_auto,w_800/v1756116485/tinywow_change_bg_photo_83585550_jtewv2.png";

  const slides = [
    {
      eyebrow: 'New Collection',
      title: 'His and Hers Sets',
      description: 'Your favourite style, matched for every moment.',
      cta: { label: 'Shop the set', to: '/product/24?variant=16' },
      image: ctaimage,
    },
    {
      eyebrow: 'Exclusive',
      title: 'Join the community',
      description: 'Be the first to know about new drops and exclusive offers.',
      highlight: 'Get 10% off your first order',
      cta: { label: 'Sign up', to: '/signup' },
      image: signup,
    },
    {
      eyebrow: 'Bundle Deal',
      title: '3-in-1 Bundle',
      description: 'Three products for the price of two. While stocks last.',
      highlight: 'Save 33% on bundles',
      cta: { label: 'Shop bundle', to: '/bundle/15' },
      image: bundleImage,
    },
    {
      eyebrow: 'Newsletter',
      title: 'Stay in the loop',
      description: 'Subscribe for early access to drops, restocks, and member-only deals.',
      isNewsletter: true,
      image: Newsletterimage,
    },
  ];

  const totalSlides = slides.length;

  // Auto advance
  useEffect(() => {
    if (isInputFocused) return;
    intervalRef.current = setInterval(() => {
      goToSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, [isInputFocused, totalSlides]);

  const goToSlide = (indexOrFn) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(typeof indexOrFn === 'function' ? indexOrFn : () => indexOrFn);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const handleNext = () => goToSlide((currentSlide + 1) % totalSlides);
  const handlePrev = () => goToSlide((currentSlide - 1 + totalSlides) % totalSlides);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setStatus('idle');
    try {
      const response = await api.post('/api/newsletter/subscribe', { email });
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        setEmail('');
      } else {
        throw new Error(response.data.message || 'Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-Primarycolor overflow-hidden">
      <div className="section-container">
        <div className="relative flex flex-col lg:flex-row min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] py-12 sm:py-16 lg:py-20 gap-8 lg:gap-16">

          {/* Text content */}
          <div className={`relative z-10 flex flex-col justify-center w-full lg:w-1/2 transition-all duration-500 ${
            isTransitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Eyebrow */}
            <span className="text-xs font-display font-medium tracking-[0.15em] uppercase text-white/40 mb-4">
              {slide.eyebrow}
            </span>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-white leading-[1.05] tracking-[-0.02em] mb-4" style={{ textWrap: 'balance' }}>
              {slide.title}
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-white/50 font-display font-light leading-relaxed max-w-md mb-6">
              {slide.description}
            </p>

            {/* Highlight text */}
            {slide.highlight && (
              <p className="text-lg sm:text-xl font-display font-semibold text-white mb-6">
                {slide.highlight}
              </p>
            )}

            {/* Newsletter form */}
            {slide.isNewsletter ? (
              <div className="max-w-md">
                {status === 'success' && (
                  <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm mb-4">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    <p className="text-success text-sm font-display">{message}</p>
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-sm mb-4">
                    <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
                    <p className="text-error text-sm font-display">{message}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    required
                    aria-label="Email address"
                    placeholder="Your email"
                    className="flex-1 h-12 px-4 bg-white/10 text-white text-sm font-display placeholder:text-white/30 border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    aria-label="Subscribe"
                    className="h-12 px-6 bg-white text-Primarycolor text-sm font-display font-medium tracking-[0.04em] uppercase hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </form>
                <p className="text-[0.6875rem] text-white/25 font-display mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            ) : (
              /* Regular CTA */
              <Link to={slide.cta.to}>
                <button className="group h-12 px-8 bg-white text-Primarycolor text-[0.8125rem] font-display font-medium tracking-[0.04em] uppercase transition-all duration-500 active:scale-[0.98] hover:bg-white/90 inline-flex items-center gap-2"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  {slide.cta.label}
                  <ArrowRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </Link>
            )}
          </div>

          {/* Image */}
          <div className={`relative w-full lg:w-1/2 flex items-center justify-center transition-all duration-500 ${
            isTransitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'
          }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="object-contain max-h-[320px] sm:max-h-[400px] lg:max-h-[460px] w-auto drop-shadow-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 section-container flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                currentSlide === index ? 'w-8 bg-white' : 'w-3 bg-white/20 hover:bg-white/40'
              }`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrow controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2.5 text-white/40 hover:text-white transition-colors duration-300"
            aria-label="Previous slide"
          >
            <ArrowLeft size={18} weight="light" />
          </button>
          <button
            onClick={handleNext}
            className="p-2.5 text-white/40 hover:text-white transition-colors duration-300"
            aria-label="Next slide"
          >
            <ArrowRight size={18} weight="light" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CtaSlideshow;