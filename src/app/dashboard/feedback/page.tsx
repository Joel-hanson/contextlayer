'use client';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Feedback {
    id: string;
    type: string;
    subject: string;
    message: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    adminResponse?: string;
    resolvedAt?: string;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function MyFeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin?callbackUrl=/dashboard/feedback');
            return;
        }

        const fetchFeedback = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams({
                    page: '1',
                    limit: '20',
                    ...(filterType !== 'all' && { type: filterType }),
                    ...(filterStatus !== 'all' && { status: filterStatus }),
                });

                const response = await fetch(`/api/feedback?${params}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch feedback');
                }

                const data = await response.json();
                setFeedbackList(data.feedback);
                setPagination(data.pagination);
            } catch (error) {
                console.error('Error fetching feedback:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedback();
    }, [session, status, router, filterType, filterStatus]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'default';
            case 'IN_PROGRESS':
                return 'secondary';
            case 'RESOLVED':
                return 'success';
            case 'CLOSED':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case 'CRITICAL':
                return 'destructive';
            case 'HIGH':
                return 'destructive';
            case 'MEDIUM':
                return 'default';
            case 'LOW':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (status === 'loading' || isLoading) {
        return (
            <>
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!session) {
        return null; // Will redirect in useEffect
    }

    return (
        <>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        My Feedback
                    </h1>
                    <p className="text-muted-foreground">
                        Track and manage your submitted feedback
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="BUG">Bug Reports</SelectItem>
                            <SelectItem value="FEATURE">Feature Requests</SelectItem>
                            <SelectItem value="GENERAL">General Feedback</SelectItem>
                            <SelectItem value="SUPPORT">Support Requests</SelectItem>
                            <SelectItem value="SECURITY">Security Issues</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Feedback List */}
                <div className="space-y-4">
                    {feedbackList.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No feedback found matching your filters.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Use the feedback widget or visit the feedback page to submit your first feedback.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        feedbackList.map((feedback) => (
                            <Card key={feedback.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <CardTitle className="text-lg">
                                            {feedback.subject}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Badge variant={getStatusBadgeVariant(feedback.status) as "default" | "secondary" | "destructive" | "outline"}>
                                                {feedback.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge variant={getPriorityBadgeVariant(feedback.priority) as "default" | "secondary" | "destructive" | "outline"}>
                                                {feedback.priority}
                                            </Badge>
                                            <Badge variant="outline">
                                                {feedback.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Submitted on {formatDate(feedback.createdAt)}
                                        {feedback.resolvedAt && (
                                            <span className="ml-2 text-green-600">
                                                • Resolved on {formatDate(feedback.resolvedAt)}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Message:</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {feedback.message}
                                            </p>
                                        </div>

                                        {feedback.adminResponse && (
                                            <div className="border-t pt-4">
                                                <h4 className="text-sm font-medium mb-2 text-green-700">
                                                    Admin Response:
                                                </h4>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-green-50 p-3 rounded">
                                                    {feedback.adminResponse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination Info */}
                {pagination && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Showing {feedbackList.length} of {pagination.total} feedback items
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
