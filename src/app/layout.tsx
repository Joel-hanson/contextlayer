import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ContextLayer - Transform REST APIs into MCP Servers",
    template: "%s | ContextLayer"
  },
  description: "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use. Web-based configuration, secure authentication, and automatic tool generation.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "REST API",
    "AI tools",
    "Claude Desktop",
    "API bridge",
    "AI assistant",
    "API integration",
    "developer tools",
    "API to MCP",
    "AI automation",
    "REST to MCP converter"
  ],
  authors: [{ name: "ContextLayer Team" }],
  creator: "ContextLayer",
  publisher: "ContextLayer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://contextlayer.tech'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ContextLayer - Transform REST APIs into MCP Servers",
    description: "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use. Web-based configuration, secure authentication, and automatic tool generation.",
    url: '/',
    siteName: 'ContextLayer',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ContextLayer - Bridge REST APIs to Model Context Protocol',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ContextLayer - Transform REST APIs into MCP Servers",
    description: "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use.",
    images: ['/og-image.png'],
    creator: '@contextlayer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className='font-mono antialiased'
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
