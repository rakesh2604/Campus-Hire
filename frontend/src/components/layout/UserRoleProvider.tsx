'use client'

import React, { useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useAuth'

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: userData } = useCurrentUser()
  const user = userData?.data
  
  // Don't block rendering - always render children immediately
  // User role will be set asynchronously

  useEffect(() => {
    // Set user role as data attribute on body for CSS targeting
    if (user?.role) {
      document.body.setAttribute('data-user-role', user.role)
    } else {
      document.body.removeAttribute('data-user-role')
    }

    // Hide Career Copilot / Careerflow extension elements for placement team and admin
    if (user?.role === 'placement' || user?.role === 'admin') {
      const hideExtensionElements = () => {
        // Find and hide elements with common extension identifiers
        const selectors = [
          '[class*="careerflow"]',
          '[class*="Careerflow"]',
          '[class*="career-copilot"]',
          '[class*="CareerCopilot"]',
          '[id*="careerflow"]',
          '[id*="Careerflow"]',
          '[id*="career-copilot"]',
          '[id*="CareerCopilot"]',
          // Also check for text content
          '*',
        ]

        // First, hide by selectors
        selectors.slice(0, -1).forEach((selector) => {
          try {
            const elements = document.querySelectorAll(selector)
            elements.forEach((el) => {
              const htmlEl = el as HTMLElement
              // Check if element contains careerflow/copilot related text
              const text = htmlEl.textContent || htmlEl.innerText || ''
              if (
                text.toLowerCase().includes('careerflow') ||
                text.toLowerCase().includes('career copilot') ||
                text.toLowerCase().includes('iamyourcareercopilot') ||
                text.toLowerCase().includes('savejobtotracker') ||
                text.toLowerCase().includes('viewjobtracker') ||
                text.toLowerCase().includes('aicoverlettergenerator') ||
                text.toLowerCase().includes('summarizejobdescription') ||
                text.toLowerCase().includes('ailinkedinpostgenerator') ||
                text.toLowerCase().includes('linkedinoptimization') ||
                text.toLowerCase().includes('findoutwhohiring')
              ) {
                htmlEl.style.display = 'none'
                htmlEl.style.visibility = 'hidden'
                htmlEl.style.opacity = '0'
                htmlEl.style.pointerEvents = 'none'
                htmlEl.style.position = 'absolute'
                htmlEl.style.left = '-9999px'
              }
            })
          } catch (e) {
            // Ignore selector errors
          }
        })

        // Also check all elements for specific text patterns (but exclude root and body)
        try {
          const allElements = document.querySelectorAll('*:not(html):not(body):not(#root)')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            // Skip if element is already hidden or is a critical app element
            if (htmlEl.id === 'root' || htmlEl.tagName === 'BODY' || htmlEl.tagName === 'HTML') {
              return
            }
            
            const text = (htmlEl.textContent || htmlEl.innerText || '').toLowerCase()
            const className = (htmlEl.className || '').toLowerCase()
            const id = (htmlEl.id || '').toLowerCase()

            // Only hide if it's clearly an extension element, not app content
            if (
              (text.includes('careerflow extension') || text.includes('iamyourcareercopilot')) &&
                      !text.includes('campushire') &&
              !text.includes('dashboard') &&
              !text.includes('profile') &&
              !text.includes('jobs') &&
              (className.includes('careerflow') || className.includes('career-copilot') ||
               id.includes('careerflow') || id.includes('career-copilot'))
            ) {
              htmlEl.style.display = 'none'
              htmlEl.style.visibility = 'hidden'
              htmlEl.style.opacity = '0'
              htmlEl.style.pointerEvents = 'none'
              htmlEl.style.position = 'absolute'
              htmlEl.style.left = '-9999px'
              htmlEl.style.width = '0'
              htmlEl.style.height = '0'
              htmlEl.style.overflow = 'hidden'
            }
          })
        } catch (e) {
          // Ignore errors
        }
      }

      // Run immediately and set up observer for dynamically added elements
      hideExtensionElements()
      
      // Use interval as backup for extension elements that load late (less frequent)
      const intervalId = setInterval(hideExtensionElements, 2000)
      
      const observer = new MutationObserver(() => {
        hideExtensionElements()
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'style'],
      })

      return () => {
        clearInterval(intervalId)
        observer.disconnect()
        document.body.removeAttribute('data-user-role')
      }
    }

    return () => {
      document.body.removeAttribute('data-user-role')
    }
  }, [user?.role])

  return <>{children}</>
}

