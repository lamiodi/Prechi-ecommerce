// ShopSkeleton.jsx — Clean Product Grid Skeleton matching ShopAllPage & ProductGrid layouts
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import SkeletonPulse from './SkeletonPulse';

const ShopSkeleton = ({ count = 8, mobileLayout = 'two' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('[data-skel-card]');
    gsap.fromTo(
      cards,
      { opacity: 0.5, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out',
      }
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className={`grid gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-5 lg:gap-y-12 ${
        mobileLayout === 'one'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col" data-skel-card>
          {/* Image placeholder matching aspect ratio */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface rounded-sm">
            <SkeletonPulse className="absolute inset-0" rounded="" />
          </div>
          {/* Details placeholders */}
          <div className="pt-3 sm:pt-4 space-y-2">
            <SkeletonPulse className="h-4 w-3/4 rounded-xs" />
            <SkeletonPulse className="h-3.5 w-1/3 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopSkeleton;
