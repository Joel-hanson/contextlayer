import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
    id: string;
    title: string;
    description: string;
    date: string;
    readTime: string;
}

const blogPosts: BlogPost[] = [
    // {
    //     id: 'getting-started-with-mcp',
    //     title: 'Getting Started with Model Context Protocol',
    //     description: 'Learn the basics of MCP and how ContextLayer simplifies API integration for AI assistants.',
    //     date: '2024-01-15',
    //     readTime: '5 min read',
    // },
    // {
    //     id: 'best-practices-api-security',
    //     title: 'Best Practices for API Security in MCP Bridges',
    //     description: 'Essential security considerations when bridging APIs to AI assistants.',
    //     date: '2024-01-10',
    //     readTime: '8 min read',
    // },
    // {
    //     id: 'claude-desktop-setup',
    //     title: 'Complete Claude Desktop Setup Guide',
    //     description: 'Step-by-step guide to configure Claude Desktop with your MCP servers.',
    //     date: '2024-01-05',
    //     readTime: '6 min read',
    // },
];

export default function BlogPage() {
    return (
        <div className="space-y-6">
            {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <CalendarDays className="h-4 w-4" />
                            <time dateTime={post.date}>
                                {new Date(post.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                            <span>•</span>
                            <span>{post.readTime}</span>
                        </div>
                        <CardTitle>
                            <Link href={{ pathname: '/blog/[id]', query: { id: post.id } }} className="hover:text-primary transition-colors">
                                {post.title}
                            </Link>
                        </CardTitle>
                        <CardDescription>{post.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={{ pathname: '/blog/[id]', query: { id: post.id } }}
                            className="text-primary hover:underline text-sm font-medium"
                        >
                            Read more →
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
