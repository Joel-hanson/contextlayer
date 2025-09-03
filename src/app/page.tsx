'use client';

import { PublicBridgesListing } from '@/components/public-bridges-listing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Bot,
  BrainCogIcon,
  CheckCircle,
  Code2,
  Cpu,
  GitBranch,
  Globe,
  Shield,
  Star,
  User,
  Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ContextLayer",
    "applicationCategory": "DeveloperApplication",
    "description": "Transform any REST API into Model Context Protocol (MCP) servers that AI assistants like Claude Desktop can use. Web-based configuration, secure authentication, and automatic tool generation.",
    "url": process.env.NEXT_PUBLIC_URL || "https://contextlayer.tech",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "ContextLayer"
    },
    "featureList": [
      "Web-based API configuration",
      "Secure authentication support",
      "Automatic MCP tool generation",
      "Universal REST API compatibility",
      "Bridge management dashboard",
      "Configuration templates"
    ]
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <div className="flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              {/* Logo */}
              <Link className="flex items-center space-x-2 flex-shrink-0" href="/">
                <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                  <BrainCogIcon className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">ContextLayer</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    How it Works
                  </a>
                  <a
                    href="#examples"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Examples
                  </a>
                </nav>
                <div className="flex items-center space-x-3">
                  {isLoading ? (
                    // Loading state
                    <Button size="sm" disabled className="text-sm font-medium">
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Loading...
                    </Button>
                  ) : session ? (
                    // Authenticated user - show dashboard
                    <Link href="/dashboard">
                      <Button size="sm" className="text-sm font-medium">
                        <User className="mr-2 h-3 w-3" />
                        Dashboard
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    // Not authenticated - show sign in
                    <>
                      <Link href="/auth/signin">
                        <Button size="sm" className="font-mono text-xs font-medium">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex md:hidden items-center space-x-2">
                {isLoading ? (
                  // Loading state
                  <Button size="sm" disabled className="text-xs px-3">
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                  </Button>
                ) : session ? (
                  // Authenticated user - show dashboard
                  <Link href="/dashboard">
                    <Button size="sm" className="text-xs px-3">
                      <User className="mr-1 h-3 w-3" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  // Not authenticated - show sign in
                  <Link href="/auth/signin">
                    <Button size="sm" className="text-xs px-3">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main>
          <section className="container flex flex-col items-center justify-center space-y-4 py-16 sm:py-24 md:py-32">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Star className="mr-1 h-3 w-3" />
                Transform Your API
              </Badge>
            </div>
            <div className="mx-auto max-w-[980px] text-center px-4">
              <h1 className="text-3xl font-bold leading-tight tracking-tighter sm:text-4xl md:text-6xl lg:leading-[1.1]">
                Transform REST APIs to{' '}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Model Context Protocol
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-[750px] text-base sm:text-lg text-muted-foreground md:text-xl">
                Transform your REST API into an MCP server that AI assistants like Claude Desktop can use.
                Configure your APIs through our web interface and connect via HTTP.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md sm:max-w-none sm:w-auto">
              {session ? (
                // Authenticated user - go to dashboard
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full touch-manipulation">
                    <User className="mr-2 h-4 w-4" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                // Not authenticated - sign in to get started
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full touch-manipulation">
                    Start Creating MCP Servers
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/guide" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full touch-manipulation">
                  <Bot className="mr-2 h-4 w-4" />
                  View Examples
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Web-based Configuration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Use your existing endpoints</span>
              </div>
            </div>
          </section>

          {/* Public Bridges Section - Moved to top for better visibility */}
          <section className="container py-16 sm:py-24">
            <PublicBridgesListing />
          </section>

          {/* Features Section */}
          <section id="features" className="container py-16 sm:py-24 bg-muted/20">
            <div className="mx-auto max-w-[980px] text-center mb-12 sm:mb-16 px-4">
              <h2 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-5xl">
                Everything you need to transform APIs
              </h2>
              <p className="mx-auto mt-4 max-w-[750px] text-base sm:text-lg text-muted-foreground">
                Powerful features designed to make API integration seamless and efficient.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Quick Setup</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Configure your API connection through our web interface. Authentication and endpoint configuration made easy.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Secure Authentication</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Support for Bearer tokens, API keys, and Basic auth. Your credentials are stored securely.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Universal Compatibility</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Works with any REST API. Transform existing services into AI-accessible tools.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Auto-Generated Tools</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Automatically converts your API endpoints into MCP tools that AI assistants can understand.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Cpu className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">MCP Server Management</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Manage your MCP servers with database storage, start/stop controls, and configuration templates.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Configuration Templates</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Built-in templates for popular APIs and export/import your MCP server configurations for backup.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* How it Works Section */}
          <section id="how-it-works" className="container py-16 sm:py-24">
            <div className="mx-auto max-w-[980px] text-center mb-12 sm:mb-16 px-4">
              <h2 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-5xl">
                How it works
              </h2>
              <p className="mx-auto mt-4 max-w-[750px] text-base sm:text-lg text-muted-foreground">
                Three simple steps to connect any REST API to the Model Context Protocol ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg sm:text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Configure Your API</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Enter your REST API details including base URL, authentication, and endpoints through our user-friendly interface.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg sm:text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Generate MCP Server</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Our platform automatically converts your API endpoints into MCP tools that AI assistants can discover and use.
                </p>
              </div>

              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg sm:text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Connect AI Assistant</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Copy the generated MCP endpoint and configure it in your AI assistant (Claude Desktop, VS Code, etc.) to start using your APIs.
                </p>
              </div>
            </div>
          </section>

          {/* Examples Section */}
          <section id="examples" className="container py-16 sm:py-24 bg-muted/20">
            <div className="mx-auto max-w-[980px] text-center mb-12 sm:mb-16 px-4">
              <h2 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-5xl">
                See It In Action
              </h2>
              <p className="mx-auto mt-4 max-w-[750px] text-base sm:text-lg text-muted-foreground">
                Here&apos;s how ContextLayer transforms REST APIs into MCP tools that AI assistants can use.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 px-4">
              {/* Example 1: Weather API */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Weather API to MCP</h3>
                      <p className="text-muted-foreground">OpenWeatherMap to MCP conversion</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-mono">
                      <div className="text-blue-600 mb-2">{`// REST API Endpoint`}</div>
                      <div>GET /weather?q=London&appid=API_KEY</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-mono">
                      <div className="text-green-600 mb-2">{`// MCP Tool`}</div>
                      <div>get_current_weather(city: &quot;London&quot;)</div>
                      <div className="text-muted-foreground mt-1">→ Returns weather data for AI assistant</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Example 2: GitHub API */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                      <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">GitHub API to MCP</h3>
                      <p className="text-muted-foreground">Repository management for AI</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-mono">
                      <div className="text-blue-600 mb-2">{`// REST API Endpoint`}</div>
                      <div>GET /repos/user/project/issues</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm font-mono">
                      <div className="text-green-600 mb-2">{`// MCP Tool`}</div>
                      <div>get_repository_issues(repo: &quot;user/project&quot;)</div>
                      <div className="text-muted-foreground mt-1">→ AI can analyze and help with issues</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Link href="/dashboard/bridges">
                <Button size="lg">
                  Start Creating Your MCP Servers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container py-24">
            <div className="mx-auto max-w-[980px] text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
                Ready to transform your APIs?
              </h2>
              <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground mb-8">
                Start connecting your REST APIs to the Model Context Protocol ecosystem today.
                Built with Next.js and requires user authentication.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  // Authenticated user - go to MCP servers
                  <Link href="/dashboard/bridges">
                    <Button size="lg" className="w-full sm:w-auto">
                      <User className="mr-2 h-4 w-4" />
                      Manage Your MCP Servers
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  // Not authenticated - sign up required
                  <Link href="/auth/signin">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started (Sign Up Required)
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/docs">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Documentation
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
        </main>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                  <BrainCogIcon className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">ContextLayer</span>
              </Link>
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with Vercel, Prisma, Next.js, shadcn/ui and Copilot.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {/* <a href="https://github.com/Joel-hanson/contextlayer" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a> */}
              <Link href="/dashboard/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/guide" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
