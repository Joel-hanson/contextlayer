'use client';

import { GoogleAnalytics as GoogleAnalyticsScript } from '@next/third-parties/google';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// Check if we're in production environment
const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';

// Log pageview event
export function pageview(url: string) {
    if (typeof window.gtag !== 'undefined' && GA_MEASUREMENT_ID && isProduction) {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
}

// Log custom event
export function event({ action, category, label, value }: {
    action: string;
    category: string;
    label?: string;
    value?: number;
}) {
    if (typeof window.gtag !== 'undefined' && isProduction) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}

// Component to inject Google Analytics scripts
export function GoogleAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && GA_MEASUREMENT_ID && isProduction) {
            // Construct the URL with search parameters if present
            const url = searchParams?.toString()
                ? `${pathname}?${searchParams.toString()}`
                : pathname;

            // Track pageview
            pageview(url);
        }
    }, [pathname, searchParams]);

    // Don't render anything if no GA ID is found or not in production
    if (!GA_MEASUREMENT_ID || !isProduction) return null;

    return <GoogleAnalyticsScript gaId={GA_MEASUREMENT_ID} />;
}
