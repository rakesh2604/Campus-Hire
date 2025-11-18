'use client'

import { useEffect } from 'react'

/**
 * Hook to monitor and log performance metrics
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      if ('performance' in window && 'getEntriesByType' in window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.fetchStart,
          }

          // Log in development only
          if (process.env.NODE_ENV === 'development') {
            console.log('Performance Metrics:', metrics)
          }

          // Send to analytics in production
          // Example: analytics.track('page_load_performance', metrics)
        }
      }
    })

    // Monitor long tasks (blocking the main thread)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Log long tasks in development
              if (process.env.NODE_ENV === 'development') {
                console.warn('Long task detected:', {
                  duration: entry.duration,
                  name: entry.name,
                })
              }
              // Send to error tracking in production
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, [])
}

/**
 * Hook to measure component render time
 */
export const useRenderTime = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      return () => {
        const renderTime = performance.now() - startTime
        if (renderTime > 16) {
          // Warn if render takes longer than one frame (16ms)
          console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`)
        }
      }
    }
  })
}

