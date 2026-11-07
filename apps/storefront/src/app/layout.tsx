import type { Metadata, Viewport } from 'next';

import './globals.css';

import { Toaster } from '@medusajs/ui';
import Head from 'next/head';

import { HtmlLangSetter } from '@/components/atoms/HtmlLangSetter/HtmlLangSetter';
import { ServiceWorkerRegister } from '@/components/atoms/ServiceWorkerRegister/ServiceWorkerRegister';
import { SplashScreen } from '@/components/atoms/SplashScreen/SplashScreen';
import { StatusBarColor } from '@/components/atoms/StatusBarColor/StatusBarColor';
import { retrieveCart } from '@/lib/data/cart';

import { Providers } from './providers';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Hybreed';
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  'Marketplace for Cameroon — buy, sell, and bid on everything. Every order protected by Hybreed Escrow.';

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteName}`,
    default: siteName
  },
  description: siteDescription,
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    type: 'website',
    images: [{ url: '/images/hero/banner-desktop-home.png' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription
  },
  appleWebApp: {
    capable: true,
    title: 'Hybreed',
    statusBarStyle: 'default'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cart = await retrieveCart();

  // default lang updated by HtmlLangSetter
  const htmlLang = 'en';

  return (
    <html
      lang={htmlLang}
      className=""
    >
      <Head>
        <link
          rel="preconnect"
          href="https://i.imgur.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://i.imgur.com"
        />
        {/* Image origins for faster LCP */}
        <link
          rel="preconnect"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://api.mercurjs.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://api.mercurjs.com"
        />
      </Head>
      <body className="relative bg-primary text-secondary antialiased">
        <HtmlLangSetter />
        <StatusBarColor />
        <ServiceWorkerRegister />
        <SplashScreen />
        <Providers cart={cart}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
