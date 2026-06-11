import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export default function useWindowSize() {
  const [width, setWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.tablet;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isMobile:  width <= BREAKPOINTS.mobile,
    isTablet:  width <= BREAKPOINTS.tablet && width > BREAKPOINTS.mobile,
    isDesktop: width > BREAKPOINTS.tablet,
  };
}