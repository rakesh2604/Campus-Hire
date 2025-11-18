// Simple toast notification utility
// Note: For production, install react-toastify: npm install react-toastify
// For now, using console.log as fallback

export const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
) => {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }

  console.log(`${icons[type]} ${message}`)
  
  // Create a temporary toast notification element
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl max-w-md transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'info' ? 'bg-blue-500 text-white' :
    'bg-yellow-500 text-white'
  }`
  toast.textContent = `${icons[type]} ${message}`
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

