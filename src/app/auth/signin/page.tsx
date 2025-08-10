'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Cleanup loading state on component unmount and add timeout protection
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (loading) {
            // Set a timeout to prevent infinite loading state
            timeoutId = setTimeout(() => {
                setLoading(false);
                setError('Request timed out. Please try again.');
            }, 30000); // 30 seconds timeout
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
        };
    }, [loading]);

    // Check for any persisted error on component mount
    useEffect(() => {
        const persistedError = sessionStorage.getItem('signin_error');
        if (persistedError) {
            setError(persistedError);
            sessionStorage.removeItem('signin_error'); // Clear it immediately
        }
    }, []);

    // Reset error when user starts typing in either field (only clear after actual changes)
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setEmail(newValue);
        // Only clear error if the user has made a meaningful change (not just focus/blur)
        if (error && newValue !== email) {
            setError(''); // Clear error when user modifies the field
            sessionStorage.removeItem('signin_error'); // Also clear persisted error
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setPassword(newValue);
        // Only clear error if the user has made a meaningful change (not just focus/blur)
        if (error && newValue !== password) {
            setError(''); // Clear error when user modifies the field
            sessionStorage.removeItem('signin_error'); // Also clear persisted error
        }
    };    // Helper function to get user-friendly error messages
    const getErrorMessage = (error: string | undefined) => {
        if (!error) return 'An unexpected error occurred';

        switch (error) {
            case 'CredentialsSignin':
                return 'Invalid email/username or password. Please check your credentials and try again.';
            case 'InvalidCredentials':
                return 'Invalid email/username or password. Please check your credentials and try again.';
            case 'Invalid credentials':
                return 'Invalid email/username or password. Please check your credentials and try again.';
            case 'CallbackRouteError':
                return 'Authentication failed. Please try again.';
            case 'OAuthSignin':
            case 'OAuthCallback':
                return 'OAuth authentication failed. Please try again.';
            case 'OAuthCreateAccount':
                return 'Failed to create account with OAuth provider.';
            case 'EmailCreateAccount':
                return 'Failed to create account with this email.';
            case 'Callback':
                return 'Authentication callback failed. Please try again.';
            case 'OAuthAccountNotLinked':
                return 'This email is already registered with a different sign-in method.';
            case 'EmailSignin':
                return 'Failed to send sign-in email.';
            case 'CredentialsSignInError':
                return 'Sign-in failed. Please check your credentials.';
            case 'SessionRequired':
                return 'You must be signed in to access this page.';
            default:
                // If the error message is already user-friendly, return it as-is
                if (error.includes('User already exists') ||
                    error.includes('Username and password are required') ||
                    error.includes('Email is required') ||
                    error.includes('Invalid credentials')) {
                    return error;
                }
                return 'Sign-in failed. Please try again or contact support if the problem persists.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling

        // Basic validation
        if (!email.trim()) {
            setError('Email or username is required');
            return;
        }

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting sign in...'); // Debug log
            const result = await signIn('credentials', {
                email: email.trim(),
                password,
                isSignUp: 'false',
                redirect: false, // This is crucial - prevents automatic redirect
            });

            console.log('Sign in result:', result); // Debug log

            if (result?.error) {
                const friendlyError = getErrorMessage(result.error);
                console.log('Sign in error:', result.error, '-> friendly:', friendlyError); // Debug log
                setError(friendlyError);
                // Persist error briefly in case of page reload
                sessionStorage.setItem('signin_error', friendlyError);
                setTimeout(() => sessionStorage.removeItem('signin_error'), 10000); // Clear after 10 seconds
                setLoading(false);
                return;
            }

            if (result?.ok) {
                // Double check authentication status
                const session = await getSession();
                if (session) {
                    console.log('Sign in successful, redirecting...'); // Debug log
                    router.push('/dashboard');
                    return;
                } else {
                    setError('Authentication succeeded but failed to create session. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            // If we get here, something unexpected happened
            setError('Sign-in failed for an unknown reason. Please try again.');
            setLoading(false);
        } catch (error) {
            console.error('Sign in error:', error);
            if (error instanceof Error) {
                setError(getErrorMessage(error.message));
            } else {
                setError('A network error occurred. Please check your connection and try again.');
            }
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await signIn('google', {
                callbackUrl: '/dashboard',
                redirect: false
            });

            if (result?.error) {
                const friendlyError = getErrorMessage(result.error);
                setError(friendlyError);
                setLoading(false);
            } else if (result?.url) {
                // Redirect to the callback URL
                window.location.href = result.url;
            } else {
                // If no URL and no error, something went wrong
                setError('Google sign-in failed to initialize. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            if (error instanceof Error) {
                setError(`Google sign-in failed: ${error.message}`);
            } else {
                setError('Google sign-in failed. Please try again or use email/password.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign in to ContextLayer
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="ml-2">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email or Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="Enter your email or username"
                                value={email}
                                onChange={handleEmailChange}
                                disabled={loading}
                                required
                                className={error && error.includes('email') ? 'border-destructive' : ''}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={handlePasswordChange}
                                disabled={loading}
                                required
                                className={error && error.includes('password') ? 'border-destructive' : ''}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !email.trim() || !password.trim()}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Demo Login Section */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Try Demo
                            </span>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-medium text-sm">Demo Account</h3>
                                <p className="text-muted-foreground text-xs">
                                    Explore all features with limits
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={async () => {
                                        setEmail('demo@contextlayer.app');
                                        setPassword('demo123');
                                        setError('');

                                        setTimeout(async () => {
                                            const form = document.querySelector('form') as HTMLFormElement;
                                            if (form) {
                                                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                            }
                                        }, 100);
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Try Demo'
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Email:</span>
                                <code className="bg-muted px-1 rounded text-xs">demo@contextlayer.app</code>
                            </div>
                            <div className="flex justify-between">
                                <span>Password:</span>
                                <code className="bg-muted px-1 rounded text-xs">demo123</code>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            Don&apos;t have an account?{' '}
                            <span className="line-through opacity-60">Create account</span>
                            <span className="block text-xs mt-1 text-amber-600 dark:text-amber-400">
                                Registration temporarily disabled
                            </span>
                        </p>
                        <p className="mt-3 text-xs">
                            For full access, use <strong>&quot;Continue with Google&quot;</strong> above
                        </p>
                    </div>

                    {/* Helpful tips section */}
                    {error && error.includes('Invalid') && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <p className="font-medium mb-1">Having trouble signing in?</p>
                            <ul className="space-y-1">
                                <li>• Make sure you&apos;re using the correct email or username</li>
                                <li>• Check that Caps Lock is not enabled</li>
                                <li>• Try signing in with Google if you created your account that way</li>
                                <li>• If you forgot your password, you may need to sign up again</li>
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
