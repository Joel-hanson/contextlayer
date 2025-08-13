'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, GitBranch, Mail, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';

interface FeedbackFormData {
    type: 'bug' | 'feature' | 'general' | 'business';
    subject: string;
    message: string;
    email: string;
    priority: 'low' | 'medium' | 'high';
}

export default function FeedbackPage() {
    const [formData, setFormData] = useState<FeedbackFormData>({
        type: 'general',
        subject: '',
        message: '',
        email: '',
        priority: 'medium',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.message.trim()) {
            toast({
                title: "Required Fields Missing",
                description: "Please fill in both subject and message fields.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Create GitHub issue
            const title = `[${formData.type.toUpperCase()}] ${formData.subject}`;
            const body = generateIssueBody(formData);

            const githubIssueUrl = `https://github.com/Joel-hanson/contextlayer/issues/new?` +
                `title=${encodeURIComponent(title)}&` +
                `body=${encodeURIComponent(body)}`;

            window.open(githubIssueUrl, '_blank');

            toast({
                title: "Feedback Submitted",
                description: "Thank you! Your feedback has been submitted as a GitHub issue.",
            });

            // Reset form
            setFormData({
                type: 'general',
                subject: '',
                message: '',
                email: '',
                priority: 'medium',
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                title: "Submission Failed",
                description: "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateIssueBody = (data: FeedbackFormData): string => {
        let body = `## ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report\n\n`;
        body += `**Priority:** ${data.priority}\n\n`;
        body += `**Description:**\n${data.message}\n\n`;

        if (data.email) {
            body += `**Contact:** ${data.email}\n\n`;
        }

        body += `---\n`;
        body += `**Submitted via:** Feedback Form\n`;
        body += `**Timestamp:** ${new Date().toISOString()}\n`;
        body += `**User Agent:** ${navigator.userAgent}\n`;

        return body;
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Share Your Feedback</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Help us improve ContextLayer! Your feedback is valuable and helps us build better features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feedback Form */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Feedback Form
                            </CardTitle>
                            <CardDescription>
                                Tell us about bugs, suggest features, or share general feedback
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Feedback Type *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: 'bug' | 'feature' | 'general' | 'business') =>
                                                setFormData({ ...formData, type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bug">Bug Report</SelectItem>
                                                <SelectItem value="feature">Feature Request</SelectItem>
                                                <SelectItem value="general">General Feedback</SelectItem>
                                                <SelectItem value="business">Business Inquiry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(value: 'low' | 'medium' | 'high') =>
                                                setFormData({ ...formData, priority: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject *</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Brief description of your feedback"
                                        value={formData.subject}
                                        onChange={(e) =>
                                            setFormData({ ...formData, subject: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Detailed Message *</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Provide detailed information about your feedback, including steps to reproduce (for bugs) or use cases (for features)..."
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({ ...formData, message: e.target.value })
                                        }
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address (Optional)</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        placeholder="your.email@example.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        We&apos;ll use this to follow up on your feedback if needed
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
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
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5" />
                                GitHub Issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                For bugs and feature requests, you can also create issues directly on GitHub.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                    window.open('https://github.com/Joel-hanson/contextlayer/issues', '_blank')
                                }
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View GitHub Issues
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Direct Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                For business inquiries or sensitive matters, you can reach out directly.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                    window.location.href = 'mailto:joel@contextlayer.dev?subject=ContextLayer Feedback'
                                }
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Email Us
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Response Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Bug Reports:</span>
                                    <span className="text-muted-foreground">1-2 days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Feature Requests:</span>
                                    <span className="text-muted-foreground">3-5 days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>General Feedback:</span>
                                    <span className="text-muted-foreground">1 week</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}