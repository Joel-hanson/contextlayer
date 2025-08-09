'use client';

import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';
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
            </ThemeProvider>
        </SessionProvider>
    );
}
