'use client'

import { useState, useEffect, useRef } from 'react'
import { detectVideos, VideoInfo } from '@/utils/videoDetector'

export interface ViewingContext {
  page: {
    url: string
    title: string
    appName: string
    route: string
  }
  formFields: Array<{
    name: string
    type: string
    value: string
    label?: string
  }>
  filters: Array<{
    name: string
    value: string
  }>
  videos: VideoInfo[]
  content: {
    headings: string[]
    visibleText: string
    activeSection?: string
  }
}

/**
 * Detect app name from URL
 */
function detectAppName(url: string): string {
  if (url.includes('localhost:4203') || url.includes('personalai')) {
    return 'PersonalAI'
  }
  if (url.includes('localhost:4204') || url.includes('mvpassistant')) {
    return 'MVP Assistant'
  }
  if (url.includes('localhost:4205') || url.includes('promptwriter')) {
    return 'Prompt Writer'
  }
  if (url.includes('localhost:4200') || url.includes('hub')) {
    return 'Assist Hub'
  }
  return 'Unknown App'
}

/**
 * Extract form fields from DOM
 */
function extractFormFields(): Array<{
  name: string
  type: string
  value: string
  label?: string
}> {
  const fields: Array<{
    name: string
    type: string
    value: string
    label?: string
  }> = []
  
  // Get all input elements
  const inputs = document.querySelectorAll('input, textarea, select')
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    
    // Skip hidden inputs
    if (element.type === 'hidden') return
    
    // Skip if not visible
    if (element.offsetParent === null) return
    
    const name = element.name || element.id || ''
    const type = element.type || element.tagName.toLowerCase()
    const value = element.value || ''
    
    // Skip empty values unless it's a select or checkbox/radio
    if (!value && type !== 'select' && type !== 'checkbox' && type !== 'radio') {
      return
    }
    
    // Try to find label
    let label: string | undefined
    if (element.id) {
      const labelElement = document.querySelector(`label[for="${element.id}"]`)
      if (labelElement) {
        label = labelElement.textContent?.trim() || undefined
      }
    }
    
    // If no label found, try parent label
    if (!label) {
      const parentLabel = element.closest('label')
      if (parentLabel) {
        label = parentLabel.textContent?.trim() || undefined
      }
    }
    
    fields.push({
      name,
      type,
      value: value.substring(0, 200), // Limit value length
      label,
    })
  })
  
  return fields
}

/**
 * Extract active filters from DOM
 */
function extractFilters(): Array<{ name: string; value: string }> {
  const filters: Array<{ name: string; value: string }> = []
  
  // Look for common filter patterns
  const filterSelects = document.querySelectorAll('select[data-filter], select.filter, select[name*="filter"]')
  filterSelects.forEach((select) => {
    const element = select as HTMLSelectElement
    if (element.value && element.offsetParent !== null) {
      filters.push({
        name: element.name || element.id || 'filter',
        value: element.value,
      })
    }
  })
  
  // Look for active filter buttons/chips
  const activeFilters = document.querySelectorAll('[data-filter-active="true"], .filter-active, [class*="active"][class*="filter"]')
  activeFilters.forEach((filter) => {
    const text = filter.textContent?.trim()
    if (text) {
      filters.push({
        name: 'active_filter',
        value: text,
      })
    }
  })
  
  // Look for search inputs
  const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="Search" i]')
  searchInputs.forEach((input) => {
    const element = input as HTMLInputElement
    if (element.value && element.offsetParent !== null) {
      filters.push({
        name: 'search',
        value: element.value,
      })
    }
  })
  
  return filters
}

/**
 * Extract visible content structure
 */
function extractContent(): {
  headings: string[]
  visibleText: string
  activeSection?: string
} {
  const headings: string[] = []
  const visibleTexts: string[] = []
  
  // Extract visible headings
  const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headingElements.forEach((heading) => {
    const htmlHeading = heading as HTMLElement
    if (htmlHeading.offsetParent !== null) {
      const text = heading.textContent?.trim()
      if (text && text.length > 0) {
        headings.push(text.substring(0, 100)) // Limit length
      }
    }
  })
  
  // Extract visible text from main content areas
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.content',
    '.main-content',
    'article',
    '[class*="content"]',
  ]
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector)
    const htmlElement = element as HTMLElement | null
    if (htmlElement && htmlElement.offsetParent !== null) {
      const text = htmlElement.textContent?.trim()
      if (text && text.length > 50) {
        visibleTexts.push(text.substring(0, 500)) // Limit to 500 chars
        break // Use first substantial content area
      }
    }
  }
  
  // If no main content found, get page title
  if (visibleTexts.length === 0) {
    const title = document.title
    if (title) {
      visibleTexts.push(title)
    }
  }
  
  // Detect active section (tab, menu item, etc.)
  let activeSection: string | undefined
  const activeTab = document.querySelector('[role="tab"][aria-selected="true"], .tab-active, [class*="active"][class*="tab"]')
  if (activeTab) {
    activeSection = activeTab.textContent?.trim() || undefined
  }
  
  return {
    headings: headings.slice(0, 10), // Limit to 10 headings
    visibleText: visibleTexts.join(' ').substring(0, 500),
    activeSection,
  }
}

/**
 * Hook to detect viewing context
 * Polls DOM every 2-3 seconds to detect what user is viewing
 */
export function useContextDetection(pollInterval: number = 2500): ViewingContext {
  const [context, setContext] = useState<ViewingContext>(() => {
    // Initial context
    if (typeof window === 'undefined') {
      return {
        page: { url: '', title: '', appName: '', route: '' },
        formFields: [],
        filters: [],
        videos: [],
        content: { headings: [], visibleText: '' },
      }
    }
    
    return {
      page: {
        url: window.location.href,
        title: document.title,
        appName: detectAppName(window.location.href),
        route: window.location.pathname,
      },
      formFields: extractFormFields(),
      filters: extractFilters(),
      videos: detectVideos(),
      content: extractContent(),
    }
  })
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return
    
    // Update context immediately
    const updateContext = () => {
      try {
        setContext({
          page: {
            url: window.location.href,
            title: document.title,
            appName: detectAppName(window.location.href),
            route: window.location.pathname,
          },
          formFields: extractFormFields(),
          filters: extractFilters(),
          videos: detectVideos(),
          content: extractContent(),
        })
      } catch (error) {
        console.error('Error updating context:', error)
      }
    }
    
    // Initial update
    updateContext()
    
    // Set up polling interval
    intervalRef.current = setInterval(updateContext, pollInterval)
    
    // Also update on navigation
    const handlePopState = () => updateContext()
    window.addEventListener('popstate', handlePopState)
    
    // Update on focus (user might have switched tabs/apps)
    const handleFocus = () => updateContext()
    window.addEventListener('focus', handleFocus)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('focus', handleFocus)
    }
  }, [pollInterval])
  
  return context
}
