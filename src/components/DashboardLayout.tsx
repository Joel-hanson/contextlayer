'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Database,
    FileText,
    Home,
    LucideIcon,
    Menu,
    Network,
    Plus,
    Settings,
    X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: SidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
        { name: 'Bridges', href: '/dashboard/bridges', icon: Database, current: pathname === '/dashboard/bridges' },
        { name: 'Documentation', href: '/dashboard/docs', icon: FileText, current: pathname === '/dashboard/docs' },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: pathname === '/dashboard/settings' },
    ];

    return (
        <div className="min-h-screen bg-background font-mono">
            {/* Mobile sidebar */}
            <div className={cn(
                "fixed inset-0 z-50 lg:hidden",
                sidebarOpen ? "block" : "hidden"
            )}>
                <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
                <div className="fixed left-0 top-0 h-full w-64 bg-background border-r shadow-lg">
                    <SidebarContent navigation={navigation} onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <SidebarContent navigation={navigation} />
            </div>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Mobile header */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-x-2">
                        <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                            <Network className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold">MCP Bridge</span>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

interface SidebarContentProps {
    navigation: Array<{
        name: string;
        href: string;
        icon: LucideIcon;
        current: boolean;
    }>;
    onClose?: () => void;
}

function SidebarContent({ navigation, onClose }: SidebarContentProps) {
    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center justify-between">
                <Link href="/" className="flex items-center gap-x-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <Network className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-semibold">MCP Bridge</span>
                </Link>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            item.current
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                                        )}
                                        onClick={onClose}
                                    >
                                        <item.icon
                                            className={cn(
                                                item.current ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                                                'h-5 w-5 shrink-0'
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <Link
                            href="/dashboard"
                            onClick={(e) => {
                                e.preventDefault();
                                // You can add create bridge logic here or trigger a modal
                                onClose?.();
                            }}
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
                            Create Bridge
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
