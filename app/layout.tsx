import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Anchor Wealth — Trading Desk',
  description: 'Professional crypto trading platform for wealth management clients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#0a0e1a', color: '#f1f5f9' }}>
        <Navigation />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  )
}
