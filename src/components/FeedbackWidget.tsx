'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FeedbackData {
    type: 'BUG' | 'FEATURE' | 'GENERAL' | 'SUPPORT' | 'SECURITY';
    subject: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    contactEmail?: string;
}

export function FeedbackWidget() {
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackData>({
        type: 'GENERAL',
        subject: '',
        message: '',
        priority: 'MEDIUM',
        contactEmail: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { data: session, status } = useSession();
    const router = useRouter();

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && status !== 'loading' && !session) {
            // Redirect to sign in if user is not authenticated
            router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
            return;
        }
        setOpen(isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to submit feedback.",
                variant: "destructive",
            });
            return;
        }

        if (!feedback.subject.trim() || !feedback.message.trim()) {
            toast({
                title: "Required Fields Missing",
                description: "Please enter both subject and message.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionData = {
                ...feedback,
                contactEmail: feedback.contactEmail?.trim() || undefined,
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                metadata: {
                    timestamp: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit feedback');
            }

            toast({
                title: "Feedback Submitted",
                description: "Thank you! We've received your feedback and will review it soon.",
            });

            // Reset form
            setFeedback({
                type: 'GENERAL',
                subject: '',
                message: '',
                priority: 'MEDIUM',
                contactEmail: '',
            });
            setOpen(false);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                title: "Submission Failed",
                description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if still loading session
    if (status === 'loading') {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="fixed bottom-4 right-4 z-50 shadow-lg bg-background border-primary hover:bg-primary/10"
                >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Share Your Feedback</DialogTitle>
                    <DialogDescription>
                        Help us improve ContextLayer! Your feedback is valuable to us.
                        {!session && (
                            <span className="block mt-2 text-amber-600">
                                Please sign in to submit feedback.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {session ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="feedback-type">Feedback Type</Label>
                            <Select
                                value={feedback.type}
                                onValueChange={(value: 'BUG' | 'FEATURE' | 'GENERAL' | 'SUPPORT' | 'SECURITY') =>
                                    setFeedback({ ...feedback, type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select feedback type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BUG">Bug Report</SelectItem>
                                    <SelectItem value="FEATURE">Feature Request</SelectItem>
                                    <SelectItem value="GENERAL">General Feedback</SelectItem>
                                    <SelectItem value="SUPPORT">Support Request</SelectItem>
                                    <SelectItem value="SECURITY">Security Issue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                placeholder="Brief description of your feedback"
                                value={feedback.subject}
                                onChange={(e) =>
                                    setFeedback({ ...feedback, subject: e.target.value })
                                }
                                maxLength={200}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Your Message *</Label>
                            <Textarea
                                id="message"
                                placeholder="Please provide detailed information..."
                                value={feedback.message}
                                onChange={(e) =>
                                    setFeedback({ ...feedback, message: e.target.value })
                                }
                                rows={4}
                                maxLength={5000}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={feedback.priority}
                                onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') =>
                                    setFeedback({ ...feedback, priority: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Contact Email (Optional)</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="your.email@example.com (for follow-up)"
                                value={feedback.contactEmail}
                                onChange={(e) =>
                                    setFeedback({ ...feedback, contactEmail: e.target.value })
                                }
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Feedback
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                            Please sign in to submit feedback and help us improve ContextLayer.
                        </p>
                        <Button onClick={() => router.push('/auth/signin')}>
                            Sign In
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
