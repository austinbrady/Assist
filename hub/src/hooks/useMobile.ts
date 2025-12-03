'use client'

import { useState, useEffect } from 'react'

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
}

export function useMobile(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape',
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width < 768
    const isTablet = width >= 768 && width < 1024
    const isDesktop = width >= 1024
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
    }
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

