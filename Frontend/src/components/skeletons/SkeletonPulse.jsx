// SkeletonPulse.jsx — GSAP-powered skeleton primitives matching Prechi design system
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Base skeleton block with GSAP shimmer animation.
 * Uses Prechi design tokens: surface + border-subtle colors.
 */
const SkeletonPulse = ({
  className = '',
  width,
  height,
  rounded = 'rounded-sm',
  style = {},
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      ref.current,
      { backgroundPosition: '200% 0' },
      {
        backgroundPosition: '-200% 0',
        duration: 1.8,
        ease: 'none',
      }
    );
    return () => tl.kill();
  }, []);

  return (
    <div
      ref={ref}
      className={`${rounded} ${className}`}
      style={{
        background:
          'linear-gradient(90deg, #f5f5f4 0%, #f0f0f0 20%, #e8e8e6 50%, #f0f0f0 80%, #f5f5f4 100%)',
        backgroundSize: '400% 100%',
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default SkeletonPulse;
