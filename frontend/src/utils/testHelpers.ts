/**
 * Testing utilities and helpers
 */

/**
 * Test if a route can be lazy loaded
 */
export const testLazyRoute = async (importFn: () => Promise<any>): Promise<boolean> => {
  try {
    const module = await importFn()
    return !!module.default
  } catch (error) {
    console.error('Lazy route test failed:', error)
    return false
  }
}

/**
 * Simulate API error scenarios
 */
export const simulateAPIError = (status: number, message?: string) => {
  const error: any = new Error(message || `HTTP ${status} Error`)
  error.response = {
    status,
    data: {
      error: message || `Error ${status}`,
    },
  }
  return error
}

/**
 * Test error boundary by throwing an error
 */
export const triggerErrorBoundary = () => {
  throw new Error('Test error for error boundary')
}

/**
 * Check if component is responsive
 */
export const checkResponsive = (element: HTMLElement): boolean => {
  const styles = window.getComputedStyle(element)
  return styles.display !== 'none' && styles.visibility !== 'hidden'
}

/**
 * Performance test helper
 */
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-start`)
    fn()
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    const measure = performance.getEntriesByName(name)[0]
    return measure.duration
  }
  return 0
}

