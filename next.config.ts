import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production",
  },
  images: {
    remotePatterns: [new URL('https://lh3.googleusercontent.com/**')],
  },

  // Webpack configuration to optimize caching and reduce serialization warnings
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache configuration
    if (!dev && !isServer) {
      config.cache = {
        ...config.cache,
        compression: 'gzip',
        maxMemoryGenerations: 1,
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