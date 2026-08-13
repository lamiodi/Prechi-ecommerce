import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { CurrencyContext } from '../pages/CurrencyContext';
import { SkeletonPulse } from './skeletons';
import { toTitleCase } from '../lib/utils';

const colorMap = {
  Black: "#000000",
  White: "#FFFFFF",
  Brown: "#8B4513",
  Grey: "#808080",
  "Light Grey": "#D3D3D3",
  Pink: "#FFC0CB",
  Lilac: "#C8A2C8",
  Blue: "#0000FF",
  "Navy Blue": "#000080",
  Green: "#008000",
  Red: "#FF0000",
};

const ProductCard = React.memo(({ product, onImageError, autoPlay = true }) => {
  const { id, name, price, image, images: rawImages, is_product, variantId, bundle_types, total_stock, colors } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);

  // Normalize image list (ensure array of non-empty unique image URLs)
  const imageList = useMemo(() => {
    let list = [];
    if (Array.isArray(rawImages) && rawImages.length > 0) {
      list = rawImages.filter(Boolean);
    } else if (image) {
      list = [image];
    }
    // Deduplicate
    return Array.from(new Set(list));
  }, [rawImages, image]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const cardRef = useRef(null);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  const isSoldOut = is_product ? total_stock === 0 : false;
  let displayName = toTitleCase(name || 'Unnamed Product');

  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;

  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';

  const hasMultipleImages = imageList.length > 1;

  // Track viewport visibility with IntersectionObserver
  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, []);

  // Preload next image in line to ensure instantaneous 60fps transitions
  useEffect(() => {
    if (!hasMultipleImages) return;
    const nextIndex = (currentIndex + 1) % imageList.length;
    const nextUrl = imageList[nextIndex];
    if (nextUrl) {
      const img = new Image();
      img.src = nextUrl;
    }
  }, [currentIndex, imageList, hasMultipleImages]);

  // Next image handler with loop
  const handleNext = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  }, [imageList.length]);

  // Prev image handler with loop
  const handlePrev = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  }, [imageList.length]);

  // Jump to specific index
  const handleSelectIndex = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  }, []);

  // Dynamic auto slideshow for visible cards as user scrolls
  useEffect(() => {
    if (!autoPlay || !hasMultipleImages || !isVisible) return;

    // Fast slideshow when hovered (1.5s), smooth auto-cycling when visible in viewport (2.6s - 3.2s)
    const intervalTime = isHovered ? 1500 : Math.floor(2600 + (id % 5) * 200);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, hasMultipleImages, isVisible, isHovered, imageList.length, id]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
    touchStartX.current = null;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Instantly advance to next image on hover if multiple images available
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleImageLoad = (idx) => {
    setImagesLoaded((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div
      ref={cardRef}
      className="group flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={productUrl}
        className="block relative overflow-hidden bg-surface rounded-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-Secondarycolor/30">
          {/* Skeleton loader until primary image is loaded */}
          {!imagesLoaded[0] && <SkeletonPulse className="absolute inset-0 z-0" rounded="" />}

          {/* Image Stack with smooth hardware-accelerated CSS transition */}
          {imageList.map((imgUrl, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <img
                key={`${imgUrl}-${idx}`}
                src={imgUrl}
                alt={`${displayName} - view ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out will-change-transform group-hover:scale-[1.03] ${
                  isCurrent ? 'opacity-100 z-1' : 'opacity-0 z-0'
                }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
                onError={onImageError}
                onLoad={() => handleImageLoad(idx)}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            );
          })}

          {/* Sold out badge */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-Primarycolor/50 flex items-center justify-center z-10">
              <span className="text-xs font-display font-medium tracking-[0.1em] uppercase text-white">
                Sold out
              </span>
            </div>
          )}

          {/* Bundle Badges */}
          {bundle_types && bundle_types.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
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

          {/* Carousel Arrows (Visible on hover or touch for multi-image cards) */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                aria-label="Previous Image"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/75 hover:scale-110 active:scale-95"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Next Image"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/75 hover:scale-110 active:scale-95"
              >
                <CaretRight size={14} weight="bold" />
              </button>

              {/* Carousel Pagination Dots */}
              <div className="absolute bottom-2.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-2">
                {imageList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={(e) => handleSelectIndex(e, idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? 'w-4 bg-white shadow-sm opacity-100'
                        : 'w-1.5 bg-white/60 hover:bg-white opacity-70 group-hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Soft dark tint on hover */}
          <div className="absolute inset-0 bg-Primarycolor/0 group-hover:bg-Primarycolor/5 transition-colors duration-500 pointer-events-none" />
        </div>
      </Link>

      {/* Details */}
      <div className="pt-3 sm:pt-4">
        <Link to={productUrl}>
          <h3 className="text-sm font-display font-medium text-text-primary leading-snug line-clamp-1 group-hover:text-text-secondary transition-colors duration-300">
            {displayName}
          </h3>
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-display text-text-secondary tabular-nums">
            {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
              style: 'currency',
              currency: displayCurrency,
              minimumFractionDigits: country === 'Nigeria' ? 0 : 2,
              maximumFractionDigits: country === 'Nigeria' ? 0 : 2,
            })}
          </p>

          {colors && colors.length > 1 && (
            <div className="flex items-center gap-1" title={`${colors.length} options available`}>
              {colors.slice(0, 4).map((c, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: colorMap[c.color_name] || c.color_code || '#000000' }}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-[0.65rem] text-text-tertiary font-display font-medium">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
