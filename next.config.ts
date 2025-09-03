import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production",
  },

  // Font optimization is now enabled by default in Next.js 15+

  // Enable compression for better performance
  compress: true,

  // Configure headers for better security and performance
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/:path*\\.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*\\.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Add rewrites for API endpoints to improve caching and performance
  rewrites: async () => {
    return {
      beforeFiles: [
        // Rewrite for improved API URLs and version management
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // Add redirects for SEO (example redirects)
  redirects: async () => {
    return [
      {
        source: '/docs',
        destination: '/dashboard/docs',
        permanent: true,
      },
      {
        source: '/bridges',
        destination: '/public-bridges',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: '*.githubusercontent.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable standalone output mode for optimal containerization
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Server components external packages config (moved from experimental in Next.js 15.4.5)
  serverExternalPackages: [],

  // Webpack configuration to optimize caching and reduce serialization warnings
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache configuration
    if (!dev && !isServer) {
      config.cache = {
        ...config.cache,
        compression: 'gzip',
        maxMemoryGenerations: 1,
      };

      // Enable build caching for production
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }

    // Reduce source map size in production
    if (!dev) {
      config.devtool = 'source-map';
    }

    return config;
  },

  // Optimize experimental features for better performance
  experimental: {
    // Enable webpack build worker for faster builds
    webpackBuildWorker: true,
    // Enable optimizeCss for production builds
    optimizeCss: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production",
    // Enable server actions
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" ? [process.env.NEXT_PUBLIC_URL || ''] : ['localhost:3000'],
    },
    // Enable more aggressive tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
    // Enable typedRoutes for better type safety
    typedRoutes: true,
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "contextlayer",

  project: "contextlayer",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Reduce source map upload size to minimize caching issues
  widenClientFileUpload: false,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,

  // Webpack plugin options to reduce serialization warnings
  sourcemaps: {
    // Don't upload source maps in development to reduce cache pressure
    disable: process.env.NODE_ENV === 'development',
  },
});