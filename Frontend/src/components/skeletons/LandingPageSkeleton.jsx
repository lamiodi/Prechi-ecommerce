// LandingPageSkeleton.jsx — Hero + Featured products skeleton for landing page
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import Navbar2 from '../Navbar2';
import Footer from '../Footer';
import SkeletonPulse from './SkeletonPulse';

const LandingPageSkeleton = () => {
  const heroRef = useRef(null);
  const productsRef = useRef(null);

  useEffect(() => {
    if (heroRef.current) {
      const heroEls = heroRef.current.querySelectorAll('[data-skel]');
      gsap.fromTo(
        heroEls,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.15,
        }
      );
    }
    if (productsRef.current) {
      const cards = productsRef.current.querySelectorAll('[data-skel-card]');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          delay: 0.4,
        }
      );
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-Secondarycolor">
      <Navbar2 />

      {/* Hero Skeleton */}
      <section className="relative min-h-[100dvh] flex items-end overflow-hidden bg-Primarycolor">
        {/* Background shimmer */}
        <SkeletonPulse
          className="absolute inset-0"
          rounded=""
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
            backgroundSize: '400% 400%',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-Primarycolor via-Primarycolor/30 to-transparent" />

        {/* Hero content skeleton */}
        <div className="relative z-10 w-full section-container pb-16 sm:pb-20 md:pb-24 lg:pb-28 pt-32" ref={heroRef}>
          <div className="max-w-2xl">
            <div data-skel>
              <SkeletonPulse className="h-3 w-36 mb-6 opacity-30" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div data-skel>
              <SkeletonPulse className="h-12 sm:h-16 md:h-20 w-full max-w-lg mb-3 opacity-30" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <SkeletonPulse className="h-12 sm:h-16 md:h-20 w-3/4 mb-6 opacity-30" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div data-skel>
              <SkeletonPulse className="h-5 w-full max-w-md mb-10 opacity-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div className="flex items-center gap-4" data-skel>
              <SkeletonPulse className="h-12 sm:h-[3.25rem] w-32" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <SkeletonPulse className="h-12 sm:h-[3.25rem] w-36" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Skeleton */}
      <section className="py-12 md:py-16 lg:py-20 bg-Secondarycolor overflow-hidden">
        <div className="section-container mb-6 md:mb-8">
          <div className="flex items-end justify-between">
            <div>
              <SkeletonPulse className="h-3 w-16 mb-3" />
              <SkeletonPulse className="h-8 sm:h-10 w-56 sm:w-72" />
            </div>
            <SkeletonPulse className="hidden sm:block h-4 w-20" />
          </div>
        </div>

        <div className="section-container" ref={productsRef}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="overflow-hidden bg-surface rounded-sm border border-border/40" data-skel-card>
                <div className="aspect-[3/4] relative overflow-hidden">
                  <SkeletonPulse className="absolute inset-0" rounded="" />
                  {/* Overlay gradient matching product cards */}
                  <div className="absolute inset-0 bg-gradient-to-t from-Primarycolor/30 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <SkeletonPulse className="h-4 w-3/4 mb-2 opacity-30" style={{ background: 'rgba(255,255,255,0.12)' }} />
                    <SkeletonPulse className="h-3.5 w-1/3 opacity-20" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPageSkeleton;
