// ShopSkeleton.jsx — Shop/Collection page skeleton matching ShopAllPage layout
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import SkeletonPulse from './SkeletonPulse';

const ShopSkeleton = ({ columns = 4, count = 12 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('[data-skel-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-Secondarycolor">
      <Navbar2 />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 md:pb-20">
        <div className="section-container">
          {/* Page header */}
          <div className="mb-8 md:mb-12">
            <SkeletonPulse className="h-10 sm:h-12 w-48 mb-3" />
            <SkeletonPulse className="h-4 w-72" />
          </div>

          {/* Filter bar skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-8 md:mb-10 border-b border-border pb-3 sm:pb-4">
            <div className="flex items-center gap-1 overflow-hidden pb-1 -mb-px">
              {['All', 'New Arrivals', 'Sets', 'Tracksuits', '3 in 1'].map((_, i) => (
                <SkeletonPulse
                  key={i}
                  className="h-8 px-4"
                  style={{ width: `${60 + Math.random() * 40}px` }}
                />
              ))}
            </div>
            <SkeletonPulse className="h-9 w-28" />
          </div>

          {/* Product grid */}
          <div
            ref={containerRef}
            className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12`}
          >
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex flex-col" data-skel-card>
                {/* Image placeholder */}
                <SkeletonPulse className="w-full aspect-[3/4] border border-border/30" />
                {/* Text placeholders */}
                <div className="pt-3 sm:pt-4 space-y-2">
                  <SkeletonPulse className="h-3.5 w-3/4" />
                  <SkeletonPulse className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopSkeleton;
