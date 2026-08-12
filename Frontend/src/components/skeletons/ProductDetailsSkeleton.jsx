// ProductDetailsSkeleton.jsx — Full-page product detail skeleton matching Prechi's layout
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import SkeletonPulse from './SkeletonPulse';

const ProductDetailsSkeleton = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('[data-skel]');
    gsap.fromTo(
      els,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-Secondarycolor font-display">
      <Navbar2 />

      {/* Promo Bar Skeleton */}
      <div className="bg-Primarycolor py-2.5 px-4 mt-16 sm:mt-20 border-b border-white/10">
        <div className="section-container flex items-center justify-between">
          <SkeletonPulse className="h-3 w-48 opacity-20" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <SkeletonPulse className="h-3 w-20 opacity-20" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      <main className="flex-1 pt-8 pb-20" ref={containerRef}>
        <div className="section-container">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8" data-skel>
            <SkeletonPulse className="h-3 w-10" />
            <span className="text-border">/</span>
            <SkeletonPulse className="h-3 w-16" />
            <span className="text-border">/</span>
            <SkeletonPulse className="h-3 w-32" />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left: Gallery */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image */}
              <div data-skel>
                <SkeletonPulse className="w-full aspect-[3/4] border border-border" />
              </div>
              {/* Thumbnails */}
              <div className="grid grid-cols-5 gap-3" data-skel>
                {[...Array(4)].map((_, i) => (
                  <SkeletonPulse key={i} className="aspect-[3/4] border border-border" />
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="lg:col-span-5 space-y-8 sticky top-28">
              {/* Brand + Name */}
              <div data-skel>
                <SkeletonPulse className="h-3 w-28 mb-3" />
                <SkeletonPulse className="h-8 w-3/4 mb-3" />
                <SkeletonPulse className="h-7 w-1/3" />
              </div>

              <div className="h-px bg-border" data-skel />

              {/* Color selector */}
              <div data-skel>
                <SkeletonPulse className="h-3 w-20 mb-3" />
                <div className="flex gap-2.5">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonPulse key={i} className="w-8 h-8" rounded="rounded-full" />
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div data-skel>
                <SkeletonPulse className="h-3 w-20 mb-3" />
                <div className="grid grid-cols-5 gap-2">
                  {['S', 'M', 'L', 'XL', '2XL'].map((_, i) => (
                    <SkeletonPulse key={i} className="h-11" />
                  ))}
                </div>
              </div>

              {/* Quantity + CTA */}
              <div className="space-y-4" data-skel>
                <div className="flex items-center gap-4">
                  <SkeletonPulse className="h-12 w-28" />
                  <SkeletonPulse className="h-12 flex-1" />
                </div>
              </div>

              {/* Guarantees */}
              <div className="border-t border-border pt-6 space-y-4" data-skel>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="w-5 h-5 flex-shrink-0" rounded="rounded-full" />
                    <SkeletonPulse className="h-3 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="mt-20 border-t border-border pt-16" data-skel>
            <SkeletonPulse className="h-5 w-40 mb-6" />
            <div className="space-y-3">
              <SkeletonPulse className="h-3 w-full" />
              <SkeletonPulse className="h-3 w-5/6" />
              <SkeletonPulse className="h-3 w-4/6" />
              <SkeletonPulse className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailsSkeleton;
