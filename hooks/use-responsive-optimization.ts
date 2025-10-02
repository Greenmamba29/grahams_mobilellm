import { useState, useEffect, useCallback } from 'react';
import { kombaiAI, ResponsiveBreakpoint } from '@/lib/kombai-ai-service';

interface ViewportDimensions {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

interface ResponsiveOptimization {
  viewport: ViewportDimensions;
  breakpoint: ResponsiveBreakpoint;
  recommendations: {
    layout: 'stack' | 'grid' | 'sidebar' | 'full-width';
    navigation: 'mobile' | 'tablet' | 'desktop';
    spacing: 'compact' | 'normal' | 'spacious';
    typography: 'small' | 'normal' | 'large';
    interactions: 'touch' | 'mouse' | 'hybrid';
  };
  adaptiveClasses: {
    container: string[];
    grid: string[];
    spacing: string[];
    text: string[];
  };
  performanceHints: string[];
}

export function useResponsiveOptimization(): ResponsiveOptimization {
  const [viewport, setViewport] = useState<ViewportDimensions>(() => {
    // Safe default for SSR
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768, orientation: 'landscape' };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };
  });

  const [optimization, setOptimization] = useState<ResponsiveOptimization>({
    viewport,
    breakpoint: { name: 'desktop', minWidth: 1024, suggestions: [] },
    recommendations: {
      layout: 'grid',
      navigation: 'desktop',
      spacing: 'normal',
      typography: 'normal',
      interactions: 'mouse'
    },
    adaptiveClasses: {
      container: ['container', 'mx-auto', 'px-4'],
      grid: ['grid', 'gap-6'],
      spacing: ['p-4'],
      text: ['text-base']
    },
    performanceHints: []
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';

    setViewport({ width, height, orientation });
  }, []);

  const generateOptimization = useCallback((viewportData: ViewportDimensions): ResponsiveOptimization => {
    const breakpoint = kombaiAI.getResponsiveSuggestions(viewportData);
    
    // Determine layout strategy
    let layout: ResponsiveOptimization['recommendations']['layout'] = 'grid';
    let navigation: ResponsiveOptimization['recommendations']['navigation'] = 'desktop';
    let spacing: ResponsiveOptimization['recommendations']['spacing'] = 'normal';
    let typography: ResponsiveOptimization['recommendations']['typography'] = 'normal';
    let interactions: ResponsiveOptimization['recommendations']['interactions'] = 'mouse';

    // Mobile optimizations (< 768px)
    if (viewportData.width < 768) {
      layout = 'stack';
      navigation = 'mobile';
      spacing = 'compact';
      typography = 'small';
      interactions = 'touch';
    }
    // Tablet optimizations (768px - 1024px)
    else if (viewportData.width < 1024) {
      layout = viewportData.orientation === 'landscape' ? 'sidebar' : 'stack';
      navigation = 'tablet';
      spacing = 'normal';
      typography = 'normal';
      interactions = 'hybrid';
    }
    // Desktop optimizations (>= 1024px)
    else {
      layout = viewportData.width > 1440 ? 'full-width' : 'grid';
      navigation = 'desktop';
      spacing = viewportData.width > 1440 ? 'spacious' : 'normal';
      typography = viewportData.width > 1440 ? 'large' : 'normal';
      interactions = 'mouse';
    }

    // Generate adaptive classes
    const adaptiveClasses = generateAdaptiveClasses(viewportData, {
      layout, navigation, spacing, typography, interactions
    });

    // Generate performance hints
    const performanceHints = generatePerformanceHints(viewportData, breakpoint);

    return {
      viewport: viewportData,
      breakpoint,
      recommendations: {
        layout,
        navigation,
        spacing,
        typography,
        interactions
      },
      adaptiveClasses,
      performanceHints
    };
  }, []);

  const generateAdaptiveClasses = (
    viewport: ViewportDimensions, 
    recommendations: ResponsiveOptimization['recommendations']
  ) => {
    const classes = {
      container: ['mx-auto'],
      grid: ['grid'],
      spacing: ['p-4'],
      text: ['text-base']
    };

    // Container classes
    if (recommendations.layout === 'full-width') {
      classes.container.push('max-w-none', 'px-8');
    } else if (recommendations.layout === 'grid') {
      classes.container.push('max-w-7xl', 'px-4', 'sm:px-6', 'lg:px-8');
    } else {
      classes.container.push('max-w-4xl', 'px-4');
    }

    // Grid classes
    if (recommendations.layout === 'stack') {
      classes.grid = ['flex', 'flex-col', 'space-y-4'];
    } else if (recommendations.layout === 'sidebar') {
      classes.grid = ['grid', 'grid-cols-1', 'lg:grid-cols-4', 'gap-6'];
    } else if (recommendations.layout === 'full-width') {
      classes.grid = ['grid', 'grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3', '2xl:grid-cols-4', 'gap-8'];
    } else {
      classes.grid = ['grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6'];
    }

    // Spacing classes
    if (recommendations.spacing === 'compact') {
      classes.spacing = ['p-2', 'sm:p-3'];
    } else if (recommendations.spacing === 'spacious') {
      classes.spacing = ['p-6', 'lg:p-8'];
    } else {
      classes.spacing = ['p-4', 'sm:p-6'];
    }

    // Typography classes
    if (recommendations.typography === 'small') {
      classes.text = ['text-sm', 'sm:text-base'];
    } else if (recommendations.typography === 'large') {
      classes.text = ['text-base', 'lg:text-lg'];
    } else {
      classes.text = ['text-base'];
    }

    // Add responsive prefixes
    if (viewport.width < 768) {
      // Mobile-specific classes
      classes.container.push('px-3');
      if (recommendations.interactions === 'touch') {
        classes.spacing.push('touch-manipulation');
      }
    }

    return classes;
  };

  const generatePerformanceHints = (
    viewport: ViewportDimensions, 
    breakpoint: ResponsiveBreakpoint
  ): string[] => {
    const hints: string[] = [];

    if (viewport.width < 768) {
      hints.push('Consider lazy loading images below the fold');
      hints.push('Minimize bundle size for mobile networks');
      hints.push('Use touch-friendly interactive elements (min 44px)');
      hints.push('Prioritize above-the-fold content');
    } else if (viewport.width < 1024) {
      hints.push('Optimize for both portrait and landscape orientations');
      hints.push('Consider hybrid touch/mouse interactions');
      hints.push('Balance between mobile and desktop features');
    } else {
      hints.push('Take advantage of larger viewport for rich interactions');
      hints.push('Consider preloading next-page content');
      hints.push('Use parallel loading for multiple data sources');
    }

    // Connection-aware hints
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
        hints.push('Detected slow connection - prioritize critical resources');
        hints.push('Consider text-only mode for better performance');
      }
    }

    // Memory-aware hints
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory && deviceMemory < 4) {
        hints.push('Limited device memory - reduce animation complexity');
        hints.push('Consider pagination over infinite scroll');
      }
    }

    return hints;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, [updateViewport]);

  useEffect(() => {
    const newOptimization = generateOptimization(viewport);
    setOptimization(newOptimization);
  }, [viewport, generateOptimization]);

  return optimization;
}

// Helper function to get optimal grid columns based on viewport
export function getOptimalColumns(width: number, itemMinWidth = 300): number {
  if (width < 640) return 1;
  if (width < 768) return Math.floor(width / itemMinWidth) || 1;
  if (width < 1024) return Math.floor(width / itemMinWidth) || 2;
  return Math.min(Math.floor(width / itemMinWidth), 4);
}

// Helper function to determine if touch interactions should be prioritized
export function shouldUseTouchInteractions(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 1024;
  
  return hasTouchScreen && isSmallScreen;
}

// Helper function to get performance-optimized animation settings
export function getAnimationSettings(viewport: ViewportDimensions) {
  const isLowEnd = viewport.width < 768 || 
    (typeof navigator !== 'undefined' && 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4);
  
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return {
    duration: isLowEnd ? 0.2 : 0.3,
    ease: isLowEnd ? 'easeOut' : 'easeOut', // Simplified for compatibility
    reduceMotion: isLowEnd || prefersReducedMotion,
    enableParallax: !isLowEnd && viewport.width >= 1024
  };
}
