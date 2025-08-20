'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    userId: string;
    user?: {
        name?: string | null;
        email?: string | null;
    };
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminFeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { data: session, status } = useSession();
    const router = useRouter();

    // Response dialog state
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [currentFeedbackId, setCurrentFeedbackId] = useState<string | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    useEffect(() => {
        if (status === 'loading') return;

        // Redirect non-admin users
        if (!session || !isAdmin) {
            router.push('/dashboard');
            return;
        }

        const fetchAllFeedback = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams({
                    page: '1',
                    limit: '50',
                    ...(filterType !== 'all' && { type: filterType }),
                    ...(filterStatus !== 'all' && { status: filterStatus }),
                });

                const response = await fetch(`/api/admin/feedback?${params}`);
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

        fetchAllFeedback();
    }, [session, status, router, filterType, filterStatus, isAdmin]);

    // Function to update feedback status
    const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Update local state
            setFeedbackList(prevList =>
                prevList.map(item =>
                    item.id === feedbackId
                        ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
                        : item
                )
            );
        } catch (error) {
            console.error('Error updating feedback status:', error);
        }
    };

    // Function to open response dialog
    const openResponseDialog = (feedbackId: string) => {
        const feedback = feedbackList.find(f => f.id === feedbackId);
        if (feedback) {
            setCurrentFeedbackId(feedbackId);
            setAdminResponse(feedback.adminResponse || '');
            setResponseDialogOpen(true);
        }
    };

    // Function to submit admin response
    const submitAdminResponse = async () => {
        if (!currentFeedbackId) return;

        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/admin/feedback/${currentFeedbackId}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ response: adminResponse }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit response');
            }

            // Update local state
            setFeedbackList(prevList =>
                prevList.map(item =>
                    item.id === currentFeedbackId
                        ? { ...item, adminResponse, updatedAt: new Date().toISOString() }
                        : item
                )
            );

            // Close dialog
            setResponseDialogOpen(false);
            setCurrentFeedbackId(null);
            setAdminResponse('');
        } catch (error) {
            console.error('Error submitting admin response:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

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

                {/* Admin Response Dialog */}
                <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Admin Response</DialogTitle>
                            <DialogDescription>
                                Your response will be visible to the user who submitted this feedback.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Textarea
                                placeholder="Enter your response to this feedback..."
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                rows={6}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setResponseDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={submitAdminResponse}
                                disabled={!adminResponse.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Response'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }    // Redirect non-admin users
    if (!session || !isAdmin) {
        return null; // Will redirect in useEffect
    }

    return (
        <>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Feedback Management
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage all user feedback submissions
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
                            </CardContent>
                        </Card>
                    ) : (
                        feedbackList.map((feedback) => (
                            <Card key={feedback.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {feedback.subject}
                                            </CardTitle>
                                            {feedback.user && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    From: {feedback.user.name || 'Unknown'} ({feedback.user.email || 'No email'})
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
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

                                        {/* Admin Action Buttons */}
                                        <div className="border-t pt-4 flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateFeedbackStatus(feedback.id, 'IN_PROGRESS')}
                                                disabled={feedback.status === 'IN_PROGRESS'}
                                            >
                                                Mark In Progress
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateFeedbackStatus(feedback.id, 'RESOLVED')}
                                                disabled={feedback.status === 'RESOLVED'}
                                            >
                                                Mark Resolved
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateFeedbackStatus(feedback.id, 'CLOSED')}
                                                disabled={feedback.status === 'CLOSED'}
                                            >
                                                Close
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openResponseDialog(feedback.id)}
                                            >
                                                {feedback.adminResponse ? 'Edit Response' : 'Add Response'}
                                            </Button>
                                        </div>
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
