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
              // Suppress browser extension console errors (they don't affect app functionality)
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (
                    message.includes('chrome-extension://') ||
                    message.includes('Sensilet') ||
                    message.includes('Exodus') ||
                    message.includes('Backpack') ||
                    message.includes('Yours Wallet') ||
                    message.includes('Cannot redefine property: solana') ||
                    message.includes('Cannot redefine property: ethereum') ||
                    message.includes('Denying load of chrome-extension://') ||
                    message.includes('origins don\\'t match') ||
                    message.includes('Failed to fetch dynamically imported module: chrome-extension://') ||
                    message.includes('__nextjs_original-stack-frame') ||
                    message.includes('web_accessible_resources') ||
                    message.includes('SecurityError') ||
                    message.includes('Blocked a frame') ||
                    message.includes('ERR_FAILED') && message.includes('chrome-extension://')
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (
                    message.includes('chrome-extension://') ||
                    message.includes('Sensilet') ||
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

