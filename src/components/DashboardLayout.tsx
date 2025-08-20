'use client';

import { FeedbackWidget } from '@/components/FeedbackWidget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    BrainCogIcon,
    ChevronFirst,
    ChevronLast,
    Database,
    FileText,
    Home,
    LogOut,
    LucideIcon,
    Menu,
    MessageCircle,
    Settings,
    User,
    X
} from 'lucide-react';
import { Route } from 'next';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { UrlObject } from 'url';

interface SidebarProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: SidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
        { name: 'MCP Servers', href: '/dashboard/bridges', icon: Database, current: pathname === '/dashboard/bridges' },
        { name: 'Quick Guide', href: '/guide', icon: BookOpen, current: pathname === '/guide' },
        { name: 'Documentation', href: '/dashboard/docs', icon: FileText, current: pathname === '/dashboard/docs' },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: pathname === '/dashboard/settings' },
    ];

    // Add admin navigation for admin users
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
    const isAdmin = session?.user?.email && (adminEmails.includes(session.user.email))

    if (isAdmin) {
        navigation.push({ name: 'Admin Dashboard', href: '/admin', icon: BrainCogIcon, current: pathname === '/admin' })
        navigation.push({ name: 'Feedback Management', href: '/dashboard/feedback', icon: MessageCircle, current: pathname === '/dashboard/feedback' })
    }

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-background font-mono">
            {/* Mobile sidebar */}
            <div className={cn(
                "fixed inset-0 z-50 lg:hidden",
                sidebarOpen ? "block" : "hidden"
            )}>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                <div className="fixed left-0 top-0 h-full w-72 bg-background border-r shadow-xl transition-transform duration-200 ease-in-out">
                    <SidebarContent
                        navigation={navigation}
                        onClose={() => setSidebarOpen(false)}
                        session={session}
                        onSignOut={handleSignOut}
                    />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className={cn(
                "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 border-r",
                sidebarCollapsed ? "lg:w-20" : "lg:w-72"
            )}>
                <SidebarContent
                    navigation={navigation}
                    session={session}
                    onSignOut={handleSignOut}
                    collapsed={sidebarCollapsed}
                />
            </div>

            {/* Main content */}
            <div className={cn(
                "transition-all duration-300 relative",
                sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
            )}>
                {/* Sidebar collapse button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={cn(
                        "hidden lg:flex fixed z-50 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-muted items-center justify-center",
                        sidebarCollapsed
                            ? "left-[68px] top-[22px]" // When sidebar is collapsed (80px - 12px)
                            : "left-[264px] top-[22px]" // When sidebar is expanded (272px - 8px)
                    )}
                >
                    {sidebarCollapsed ? (
                        <ChevronLast className="h-5 w-5" />
                    ) : (
                        <ChevronFirst className="h-5 w-5" />
                    )}
                </Button>
                {/* Mobile header */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                        className="touch-manipulation"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open sidebar</span>
                    </Button>
                    <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="flex items-center gap-x-2 min-w-0">
                            <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                                <BrainCogIcon className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold truncate">ContextLayer</span>
                        </div>
                        {/* Mobile user menu */}
                        {session?.user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="touch-manipulation">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
                                            {session.user.image ? (
                                                <Image
                                                    src={session.user.image}
                                                    alt={session.user.name || session.user.username || 'User'}
                                                    width={24}
                                                    height={24}
                                                    className="h-full w-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <User className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span className="sr-only">Open user menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="px-3 py-2">
                                        <p className="text-sm font-medium truncate">
                                            {session.user.name || session.user.username || 'User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {session.user.email}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Page content */}
                <main className="py-10">
                    {/* Demo user banner */}
                    {session?.user?.email === 'demo@contextlayer.app' && (
                        <div className="px-4 sm:px-6 lg:px-8 mb-6">
                            <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                            Demo Account
                                        </Badge>
                                        <div className="text-sm min-w-0">
                                            <p className="font-medium truncate">
                                                Limited demo access
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                2 MCP server max • 30 requests/min • Rate limited
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/auth/signin">
                                        <Button size="sm" variant="default" className="w-full sm:w-auto touch-manipulation">
                                            Create Account
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
            <FeedbackWidget />
        </div>
    );
}

interface SidebarContentProps {
    navigation: Array<{
        name: string;
        href: string | UrlObject;
        icon: LucideIcon;
        current: boolean;
    }>;
    onClose?: () => void;
    session?: {
        user: {
            name?: string | null;
            email?: string | null;
            username?: string | null;
            image?: string | null;
        }
    } | null;
    onSignOut?: () => void;
    collapsed?: boolean;
}

function SidebarContent({ navigation, onClose, session, onSignOut, collapsed }: SidebarContentProps) {
    return (
        <div className={cn(
            "flex grow flex-col overflow-y-auto bg-background pb-4 relative",
            collapsed ? "px-3" : "px-6"
        )}>
            <div className="flex h-16 shrink-0 items-center">
                <Link href="/dashboard" className={cn(
                    "flex items-center",
                    collapsed ? "justify-center w-full" : "gap-x-2"
                )}>
                    <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                        <BrainCogIcon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {!collapsed && <span className="text-xl font-semibold">ContextLayer</span>}
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
                                        href={item.href as Route}
                                        className={cn(
                                            item.current
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                            'group flex rounded-md text-sm leading-6 font-medium transition-colors touch-manipulation',
                                            collapsed ? 'h-10 w-10 mx-auto items-center justify-center' : 'gap-x-3 p-3'
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
                                        {!collapsed && item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>

                    {/* User Profile Section */}
                    {session?.user && (
                        <li className="mt-auto pt-4 border-t">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className={cn(
                                        "w-full h-auto font-normal transition-all",
                                        collapsed ? "justify-center p-1" : "justify-start p-2 -mx-2"
                                    )}>
                                        <div className={cn(
                                            "flex items-center min-w-0",
                                            collapsed ? "justify-center" : "gap-x-3 flex-1"
                                        )}>
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
                                                {session.user.image ? (
                                                    <Image
                                                        src={session.user.image}
                                                        alt={session.user.name || session.user.username || 'User'}
                                                        width={32}
                                                        height={32}
                                                        className="h-full w-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <User className="h-4 w-4" />
                                                )}
                                            </div>
                                            {!collapsed && (
                                                <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                                                    <div className="flex items-center gap-2 w-full min-w-0">
                                                        <p className="text-sm font-medium truncate flex-1">
                                                            {session.user.name || session.user.username || 'User'}
                                                        </p>
                                                        {session.user.email === 'demo@contextlayer.app' && (
                                                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 shrink-0">
                                                                Demo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate w-full">
                                                        {session.user.email}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings" onClick={onClose}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </li>
                    )}

                    {/* <li className="mt-2">
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
                    </li> */}
                </ul>
            </nav>
        </div>
    );
}
