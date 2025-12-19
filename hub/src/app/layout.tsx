import './globals.css'
import type { Metadata } from 'next'
import { ServiceWorkerPreventer } from '@/components/ServiceWorkerPreventer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'AssisantAI - Central Hub',
  description: 'Master dashboard for all AssisantAI applications',
  manifest: '/manifest.json',
  themeColor: '#667eea',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#667eea" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle provider collisions (fail-soft approach)
              (function() {
                // Prevent multiple wallet extensions from conflicting
                const originalDefineProperty = Object.defineProperty;
                Object.defineProperty = function(obj, prop, descriptor) {
                  // If trying to define window.solana or window.ethereum and it already exists, skip
                  if (obj === window && (prop === 'solana' || prop === 'ethereum')) {
                    if (window[prop] !== undefined) {
                      // Provider already exists, don't redefine
                      return obj;
                    }
                  }
                  try {
                    return originalDefineProperty.call(this, obj, prop, descriptor);
                  } catch (e) {
                    // If redefinition fails, return the object as-is (fail-soft)
                    if (e.message && e.message.includes('Cannot redefine property')) {
                      return obj;
                    }
                    throw e;
                  }
                };
              })();
              
              // Suppress browser extension console errors (they don't affect app functionality)
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Comprehensive list of crypto wallet extensions and related errors
                  const cryptoExtensions = [
                    'Sensilet', 'Exodus', 'Backpack', 'Yours Wallet', 'MetaMask', 'Phantom',
                    'Trust Wallet', 'Coinbase Wallet', 'Brave Wallet', 'Opera Wallet',
                    'MathWallet', 'TokenPocket', 'SafePal', 'Ledger', 'Trezor',
                    'Keplr', 'Cosmostation', 'Terra Station', 'Polkadot.js', 'SubWallet'
                  ];
                  
                  const cryptoErrors = [
                    'Cannot redefine property: solana',
                    'Cannot redefine property: ethereum',
                    'Cannot redefine property: bitcoin',
                    'Cannot redefine property: web3',
                    'wallet extension',
                    'crypto wallet',
                    'blockchain wallet'
                  ];
                  
                  const cryptoPatterns = [
                    'inject.bundle.js',
                    'findInstalledCompetitors',
                    'app-dabb4054.js',
                    'chrome-extension://invalid/',
                    'Denying load of chrome-extension://',
                    'Failed to fetch dynamically imported module: chrome-extension://'
                  ];
                  
                  if (
                    message.includes('chrome-extension://') ||
                    cryptoExtensions.some(ext => message.includes(ext)) ||
                    cryptoErrors.some(err => message.includes(err)) ||
                    cryptoPatterns.some(pattern => message.includes(pattern)) ||
                    message.includes('origins don\\'t match') ||
                    message.includes('__nextjs_original-stack-frame') ||
                    message.includes('web_accessible_resources') ||
                    message.includes('SecurityError') ||
                    message.includes('Blocked a frame') ||
                    (message.includes('ERR_FAILED') && message.includes('chrome-extension://'))
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  const cryptoExtensions = [
                    'Sensilet', 'Exodus', 'Backpack', 'Yours Wallet', 'MetaMask', 'Phantom',
                    'Trust Wallet', 'Coinbase Wallet', 'Brave Wallet', 'Opera Wallet'
                  ];
                  
                  if (
                    message.includes('chrome-extension://') ||
                    cryptoExtensions.some(ext => message.includes(ext)) ||
                    message.includes('React DevTools') ||
                    message.includes('beforeinstallprompt')
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body>
        <ServiceWorkerPreventer />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}

