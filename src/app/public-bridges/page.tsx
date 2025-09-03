'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getBaseUrl } from '@/lib/url';
import {
    ArrowLeft,
    BookOpen,
    Copy,
    Globe,
    Search,
    Settings,
    Star,
    Users,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PublicBridge {
    id: string;
    slug: string;
    name: string;
    description: string;
    baseUrl: string;
    createdAt: string;
    updatedAt: string;
    owner: {
        name: string;
        username?: string;
        image?: string;
    };
    stats: {
        toolCount: number;
        promptCount: number;
        resourceCount: number;
        usageCount: number;
    };
    preview: {
        tools: { name: string; description: string }[];
        prompts: { name: string; description: string }[];
        resources: { name: string; description: string; uri: string }[];
    };
}

interface PublicBridgesResponse {
    bridges: PublicBridge[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export default function PublicBridgesPage() {
    const [bridges, setBridges] = useState<PublicBridge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PublicBridgesResponse['pagination'] | null>(null);
    const baseUrl = getBaseUrl();

    const fetchBridges = async (searchTerm: string = '', pageNum: number = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: '12',
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(`/api/public/bridges?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch public bridges');
            }

            const data: PublicBridgesResponse = await response.json();
            setBridges(data.bridges);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching public bridges:', err);
            setError(err instanceof Error ? err.message : 'Failed to load public bridges');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBridges(search, page);
    }, [search, page]);

    const copyMcpUrl = (bridge: PublicBridge) => {
        const mcpUrl = `${baseUrl}/mcp/${bridge.slug}`;
        navigator.clipboard.writeText(mcpUrl);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/auth/signin">
                                <Button size="sm">Sign In</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <section className="container py-12">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Globe className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Public MCP Bridges</h1>
                    </div>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Discover and use community-shared MCP bridges. Connect these tools to your AI assistant to extend its capabilities.
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search bridges..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Stats */}
                {pagination && !loading && (
                    <div className="text-center mb-8">
                        <p className="text-muted-foreground">
                            {pagination.total === 0
                                ? 'No bridges found'
                                : `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} bridge${pagination.total !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                )}
            </section>

            {/* Content */}
            <section className="container pb-12 flex-1">
                {/* Error State */}
                {error && (
                    <Card className="border-destructive/50 bg-destructive/5 mb-8">
                        <CardContent className="p-6 text-center">
                            <Globe className="h-8 w-8 text-destructive mx-auto mb-2" />
                            <p className="text-destructive font-medium">Failed to load public bridges</p>
                            <p className="text-destructive/80 text-sm">{error}</p>
                            <Button
                                variant="outline"
                                onClick={() => fetchBridges(search, page)}
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-18" />
                                    </div>
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-9 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Bridges Grid */}
                {!loading && bridges.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {bridges.map((bridge) => (
                                <Card key={bridge.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg truncate flex-1">{bridge.name}</CardTitle>
                                                <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-50 text-blue-700 text-xs">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    Public
                                                </Badge>
                                            </div>
                                            <CardDescription className="line-clamp-2 text-sm">
                                                {bridge.description || 'No description provided'}
                                            </CardDescription>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span>by {bridge.owner.name}</span>
                                                {bridge.stats.usageCount > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <Star className="h-3 w-3" />
                                                        <span>{bridge.stats.usageCount} uses</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 pt-0">
                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-1">
                                            <Badge variant="outline" className="text-xs py-1 px-1 flex items-center justify-center">
                                                <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{bridge.stats.toolCount}</span>
                                            </Badge>
                                            <Badge variant="outline" className="text-xs py-1 px-1 flex items-center justify-center">
                                                <BookOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{bridge.stats.resourceCount}</span>
                                            </Badge>
                                            <Badge variant="outline" className="text-xs py-1 px-1 flex items-center justify-center">
                                                <Settings className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{bridge.stats.promptCount}</span>
                                            </Badge>
                                        </div>

                                        {/* Preview Tools */}
                                        {bridge.preview.tools.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Tools:</h4>
                                                <div className="space-y-1">
                                                    {bridge.preview.tools.slice(0, 2).map((tool, idx) => (
                                                        <div key={idx} className="text-xs p-2 bg-muted/50 rounded">
                                                            <div className="font-medium truncate">{tool.name}</div>
                                                            <div className="text-muted-foreground line-clamp-1">{tool.description}</div>
                                                        </div>
                                                    ))}
                                                    {bridge.stats.toolCount > 2 && (
                                                        <div className="text-xs text-muted-foreground text-center py-1">
                                                            +{bridge.stats.toolCount - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* MCP URL */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">MCP URL</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyMcpUrl(bridge)}
                                                    className="h-7 w-7 p-0"
                                                    title="Copy MCP URL"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                                                <span className="font-mono text-xs text-muted-foreground truncate">
                                                    {typeof window !== 'undefined' ? `${window.location.host}/mcp/${bridge.slug}` : `${getBaseUrl()}/mcp/${bridge.slug}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Copy Button */}
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            size="sm"
                                            onClick={() => copyMcpUrl(bridge)}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy URL
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!pagination.hasPrev || loading}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.pages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= pagination.pages - 2) {
                                            pageNum = pagination.pages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPage(pageNum)}
                                                disabled={loading}
                                                className="w-10"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!pagination.hasNext || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!loading && bridges.length === 0 && !error && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">
                                {search ? 'No bridges found' : 'No Public Bridges Yet'}
                            </h3>
                            <p className="text-muted-foreground text-center mb-4 max-w-md">
                                {search
                                    ? `No bridges match "${search}". Try a different search term.`
                                    : 'Be the first to share a public MCP bridge with the community!'
                                }
                            </p>
                            {search && (
                                <Button variant="outline" onClick={() => handleSearch('')}>
                                    Clear Search
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t py-6">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-bold">ContextLayer</span>
                        </Link>
                        <span className="text-sm text-muted-foreground">Public Bridge Marketplace</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <Link href="/dashboard/docs" className="hover:text-foreground transition-colors">
                            Documentation
                        </Link>
                        <Link href="/guide" className="hover:text-foreground transition-colors">
                            Help
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
