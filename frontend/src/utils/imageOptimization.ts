/**
 * Image optimization utilities for better performance
 */

/**
 * Lazy load images with Intersection Observer
 */
export const setupLazyImages = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  })

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img)
  })
}

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Get optimized image URL (for future CDN integration)
 */
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  quality?: number
): string => {
  // For now, return original URL
  // In production, integrate with image CDN (e.g., Cloudinary, Imgix)
  if (!width && !quality) {
    return url
  }

  // Example: If using Cloudinary
  // return `https://res.cloudinary.com/your-cloud/image/fetch/w_${width},q_${quality || 80}/${url}`

  return url
}

