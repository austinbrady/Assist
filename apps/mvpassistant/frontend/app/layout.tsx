import './globals.css'

export const metadata = {
  title: 'MVP Assistant - Your Personalized AI',
  description: 'A local AI assistant that generates custom tools based on your needs',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
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
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body>{children}</body>
    </html>
  )
}

