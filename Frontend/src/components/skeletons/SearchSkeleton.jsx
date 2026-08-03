// SearchSkeleton.jsx — Search results page skeleton matching Prechi design system
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import SkeletonPulse from './SkeletonPulse';

const SearchSkeleton = () => {
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
    <div className="flex flex-col min-h-[100dvh] bg-Secondarycolor font-display">
      <Navbar2 />

      <div className="section-container pt-24 sm:pt-28 pb-16 flex-1">
        {/* Search header */}
        <div className="mb-10">
          <div className="border-b border-border pb-6">
            <div className="flex items-center gap-2 mb-3">
              <SkeletonPulse className="h-8 sm:h-10 w-56" />
              <SkeletonPulse className="h-8 sm:h-10 w-32" />
            </div>
            <SkeletonPulse className="h-6 w-28 rounded-full" />
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-10">
          <div className="bg-surface rounded-sm p-6 border border-border">
            <div className="flex flex-row gap-6 flex-1">
              <div className="flex-1">
                <SkeletonPulse className="h-3 w-24 mb-3" />
                <SkeletonPulse className="h-11 w-full" />
              </div>
              <div className="flex-1">
                <SkeletonPulse className="h-3 w-24 mb-3" />
                <SkeletonPulse className="h-11 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12"
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col" data-skel-card>
              <SkeletonPulse className="w-full aspect-[3/4] border border-border/30" />
              <div className="pt-3 sm:pt-4 space-y-2">
                <SkeletonPulse className="h-3.5 w-3/4" />
                <SkeletonPulse className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SearchSkeleton;
