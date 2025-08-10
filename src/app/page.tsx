'use client';

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
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                <BrainCogIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">ContextLayer</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm">
              <a href="#features" className="transition-colors hover:text-foreground/80">
                Features
              </a>
              <a href="#how-it-works" className="transition-colors hover:text-foreground/80">
                How it Works
              </a>
              <a href="#examples" className="transition-colors hover:text-foreground/80">
                Examples
              </a>
            </nav>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center space-y-4 py-24 md:py-32">
        <div className="flex items-center space-x-2 mb-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Star className="mr-1 h-3 w-3" />
            Transform Any API
          </Badge>
        </div>
        <div className="mx-auto max-w-[980px] text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Bridge REST APIs to{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Model Context Protocol
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Transform any REST API into an MCP server that AI assistants like Claude Desktop can use.
            Configure your APIs through our web interface and connect via HTTP.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Start Building Bridges
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/guide">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Bot className="mr-2 h-4 w-4" />
              View Examples
            </Button>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex items-center space-x-8 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Web-based Configuration</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Use your existing endpoints</span>
          </div>
          {/* <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <a href="https://github.com/Joel-hanson/contextlayer" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Open Source
            </a>
          </div> */}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 bg-muted/20">
        <div className="mx-auto max-w-[980px] text-center mb-16">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
            Everything you need to bridge APIs
          </h2>
          <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground">
            Powerful features designed to make API integration seamless and efficient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Quick Setup</CardTitle>
              <CardDescription>
                Configure your API bridge through our web interface. Authentication and endpoint configuration made easy.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>
                Support for Bearer tokens, API keys, and Basic auth. Your credentials are stored securely.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Universal Compatibility</CardTitle>
              <CardDescription>
                Works with any REST API. Transform existing services into AI-accessible tools.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Auto-Generated Tools</CardTitle>
              <CardDescription>
                Automatically converts your API endpoints into MCP tools that AI assistants can understand.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Bridge Management</CardTitle>
              <CardDescription>
                Manage your bridges with database storage, start/stop controls, and configuration templates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Configuration Templates</CardTitle>
              <CardDescription>
                Built-in templates for popular APIs and export/import your bridge configurations for backup.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="container py-24">
        <div className="mx-auto max-w-[980px] text-center mb-16">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground">
            Three simple steps to connect any REST API to the Model Context Protocol ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Configure Your API</h3>
            <p className="text-muted-foreground">
              Enter your REST API details including base URL, authentication, and endpoints through our user-friendly interface.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Generate MCP Server</h3>
            <p className="text-muted-foreground">
              Our system creates MCP-compatible tools from your API endpoints that AI assistants can discover and use.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect & Use</h3>
            <p className="text-muted-foreground">
              Access your bridge via HTTP at `/mcp/[bridgeId]` and connect it to Claude Desktop or other MCP-compatible clients.
            </p>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section id="examples" className="container py-24 bg-muted/20">
        <div className="mx-auto max-w-[980px] text-center mb-16">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
            See It In Action
          </h2>
          <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground">
            Here&apos;s how ContextLayer transforms REST APIs into MCP tools that AI assistants can use.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Example 1: Weather API */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Weather API Bridge</h3>
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
                  <h3 className="text-xl font-semibold">GitHub API Bridge</h3>
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
              Start Creating Your Bridges
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl">
            Ready to bridge your APIs?
          </h2>
          <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground mb-8">
            Start connecting your REST APIs to the Model Context Protocol ecosystem today.
            Built with Next.js and requires user authentication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/bridges">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started (Sign Up Required)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/docs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
  );
}
