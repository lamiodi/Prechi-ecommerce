import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { motion, useScroll, useTransform } from 'motion/react';

const HeroSection = () => {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Parallax setup
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Background moves slightly slower than scroll (parallax)
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  // Content moves slightly faster and fades out
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const desktopVideoUrl = "https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto/v1752867614/Prechi_Clothing_-_Made_for_You._1_hj54pu.mp4";
  const mobileVideoUrl = "https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto/v1752867619/Prechi_Clothing_-_Made_for_You._2_j9h7aw.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setIsLoaded(true);
    video.addEventListener('canplay', handleCanPlay);

    // Determine video source based on viewport
    const isMobile = window.innerWidth < 768;
    video.src = isMobile ? mobileVideoUrl : desktopVideoUrl;
    video.load();

    return () => video.removeEventListener('canplay', handleCanPlay);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-end overflow-hidden bg-Primarycolor"
    >
      {/* Parallax Video background */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: backgroundY }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1.2s] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          aria-hidden="true"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-Primarycolor via-Primarycolor/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-Primarycolor/40 to-transparent" />
      </motion.div>

      {/* Parallax Content */}
      <motion.div 
        className="relative z-10 w-full section-container pb-16 sm:pb-20 md:pb-24 lg:pb-28 pt-32"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div
            className={`transition-all duration-700 delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <span className="inline-block text-xs sm:text-[0.8125rem] font-display font-medium tracking-[0.15em] uppercase text-white/50 mb-4 sm:mb-6">
              Summer 2025 Collection
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-[-0.03em] mb-5 sm:mb-6 transition-all duration-700 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              textWrap: 'balance',
            }}
          >
            Made for the way you move
          </h1>

          {/* Subline */}
          <p
            className={`text-base sm:text-lg text-white/60 font-display font-light leading-relaxed max-w-md mb-8 sm:mb-10 transition-all duration-700 delay-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            Premium comfort, crafted for movement. Designed to fit your everyday.
          </p>

          {/* CTAs */}
          <div
            className={`flex items-center gap-4 transition-all duration-700 delay-[900ms] ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <Link to="/shop">
              <button className="h-12 sm:h-[3.25rem] px-8 sm:px-10 bg-white text-Primarycolor text-[0.8125rem] sm:text-sm font-display font-medium tracking-[0.04em] uppercase transition-all duration-500 active:scale-[0.98] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                Shop now
              </button>
            </Link>
            <Link
              to="/shop?category=new"
              className="group inline-flex items-center gap-2 h-12 sm:h-[3.25rem] px-4 sm:px-6 text-[0.8125rem] sm:text-sm font-display font-medium tracking-[0.04em] uppercase text-white/70 hover:text-white transition-colors duration-300"
            >
              New arrivals
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700 delay-[1100ms] ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ opacity: contentOpacity }}
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/30" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
