"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface PublicBridge {
    id: string;
    slug: string;
    name: string;
    description: string;
    baseUrl: string;
    stats: {
        toolCount: number;
        promptCount: number;
        resourceCount: number;
        usageCount: number;
    };
    preview: {
        tools: Array<{ name: string; description: string }>;
        prompts: Array<{ name: string; description: string }>;
        resources: Array<{ name: string; description: string; uri: string }>;
    };
    createdAt: string;
    updatedAt: string;
}

export function PublicBridgesListing() {
    const [bridges, setBridges] = useState<PublicBridge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"popular" | "latest">("popular");
    const { toast } = useToast();

    useEffect(() => {
        const fetchPublicBridges = async () => {
            try {
                setLoading(true);
                const sortParam = activeTab === "popular" ? "usage" : "latest";
                const response = await fetch(`/api/public/bridges?limit=20&sort=${sortParam}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch public bridges");
                }
                const data = await response.json();
                setBridges(data.bridges || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchPublicBridges();
    }, [activeTab]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied to clipboard",
                description: `${label} has been copied to your clipboard.`,
                duration: 3000,
            });
        } catch {
            toast({
                title: "Failed to copy",
                description: "Could not copy to clipboard. Please try again.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    const getStatsPreview = (stats: { toolCount: number; promptCount: number; resourceCount: number }) => {
        const items = [];
        if (stats.toolCount > 0) items.push(`${stats.toolCount} tools`);
        if (stats.promptCount > 0) items.push(`${stats.promptCount} prompts`);
        if (stats.resourceCount > 0) items.push(`${stats.resourceCount} resources`);

        if (items.length === 0) return "No content";
        return items.join(", ");
    };

    const getMcpEndpoint = (slug: string) => {
        return `${window.location.origin}/mcp/${slug}`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Public MCP Bridges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Public MCP Bridges</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">Error: {error}</p>
                </CardContent>
            </Card>
        );
    }

    if (bridges.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Public MCP Bridges</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        No public bridges available yet. Be the first to create one!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Public MCP Bridges Marketplace</CardTitle>
                <p className="text-muted-foreground">
                    Discover and connect to community-built MCP bridges. Copy the endpoint to use with your AI assistant.
                </p>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "popular" | "latest")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="popular">Popular</TabsTrigger>
                        <TabsTrigger value="latest">Latest</TabsTrigger>
                    </TabsList>
                    <TabsContent value="popular" className="mt-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bridge</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>MCP Endpoint</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bridges.map((bridge) => (
                                        <TableRow key={bridge.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{bridge.name}</div>
                                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                                        {bridge.description}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="default">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <Badge variant="outline" className="text-xs">
                                                        {getStatsPreview(bridge.stats)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                                    {getMcpEndpoint(bridge.slug)}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(getMcpEndpoint(bridge.slug), "MCP endpoint")}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="latest" className="mt-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bridge</TableHead>
                                        <TableHead>Content</TableHead>
                                        <TableHead>MCP Endpoint</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bridges.map((bridge) => (
                                        <TableRow key={bridge.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{bridge.name}</div>
                                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                                        {bridge.description}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="default">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <Badge variant="outline" className="text-xs">
                                                        {getStatsPreview(bridge.stats)}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                                    {getMcpEndpoint(bridge.slug)}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(getMcpEndpoint(bridge.slug), "MCP endpoint")}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
                {bridges.length === 20 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Showing first 20 bridges. More coming soon!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
