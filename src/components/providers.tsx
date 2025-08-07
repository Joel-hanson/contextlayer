'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                defaultTheme="light"
                storageKey="mcp-bridge-theme"
            >
                {children}
            </ThemeProvider>
        </SessionProvider>
    );
}
