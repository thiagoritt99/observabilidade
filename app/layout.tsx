import type { Metadata, Viewport } from 'next'
import { Outfit, Noto_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
})

const notoSerif = Noto_Serif({ 
  subsets: ["latin"],
  variable: '--font-noto-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FMP Dashboard | Monitoramento de Sistemas',
  description: 'Dashboard de monitoramento de sistemas e servicos da FMP - Fundacao Escola Superior do Ministerio Publico',
  generator: 'Next.js',
  keywords: ['FMP', 'Dashboard', 'Monitoramento', 'Status', 'Sistemas'],
  authors: [{ name: 'TI FMP' }],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#191818',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${outfit.variable} ${notoSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
