'use client'

import { useEffect } from 'react'

export function ServiceWorkerPreventer() {
  useEffect(() => {
    // Prevent service worker registration in development
    if ('serviceWorker' in navigator) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
      // Also prevent any new registrations
      window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
      });
    }
  }, [])

  return null
}

