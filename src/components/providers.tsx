'use client';

import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { GoogleAnalytics } from './GoogleAnalytics';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                defaultTheme="light"
                storageKey="contextlayer-theme"
            >
                {children}
                <Toaster />
                <Suspense>
                    <GoogleAnalytics />
                </Suspense>
            </ThemeProvider>
        </SessionProvider>
    );
}
