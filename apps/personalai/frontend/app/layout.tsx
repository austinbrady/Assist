import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal AI - Local AI Service',
  description: 'Powerful local AI service for text, image, and video processing',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.jpg', sizes: 'any', type: 'image/jpeg' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#007AFF" />
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
                    message.includes('Blocked a frame')
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
                    message.includes('React DevTools')
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}

