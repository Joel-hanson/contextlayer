# Deployment Documentation

Comprehensive guides for deploying ContextLayer to production environments.

## Available Guides

### Main Deployment Guide

- **[Deployment Guide](./deployment.md)** - Complete production deployment guide with all options

### Platform-Specific Guides

- **[Docker Guide](./docker.md)** - Containerized deployment with Docker
- **[Vercel Deployment](./vercel.md)** - Deploy to Vercel platform
- **[Quick Deploy](./quick-deploy.md)** - Fast deployment options

## Deployment Options

### 🚀 **Vercel (Recommended)**

**Best for**: Small to medium teams, automatic scaling, minimal configuration

**Pros**:

- Zero-config deployment
- Automatic HTTPS and CDN
- Built-in preview deployments
- Excellent Next.js integration

**Getting Started**: See [Vercel Deployment Guide](./vercel.md)

### 🐳 **Docker (Self-hosted)**

**Best for**: Full control, custom infrastructure, enterprise environments

**Pros**:

- Complete control over environment
- Easy scaling with orchestration
- Consistent across environments
- Great for on-premise deployment

**Getting Started**: See [Docker Deployment Guide](./docker.md)

### ☁️ **Cloud Platforms**

**Best for**: Enterprise deployments, specific compliance requirements

**Supported Platforms**:

- AWS (ECS, EC2, Lambda)
- Google Cloud Platform (Cloud Run, GKE)
- Microsoft Azure (Container Instances, AKS)
- DigitalOcean (App Platform, Droplets)

## Quick Start

### For Development/Testing

```bash
# Clone and setup
git clone https://github.com/Joel-hanson/contextlayer.git
cd contextlayer
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server
npm run dev
```

### For Production (Docker)

```bash
# Quick production deployment
git clone https://github.com/Joel-hanson/contextlayer.git
cd contextlayer
cp .env.example .env.production
# Edit .env.production with production values
docker-compose -f docker-compose.prod.yml up -d
```

## Requirements

### System Requirements

- **CPU**: 1+ cores (2+ recommended)
- **Memory**: 512MB minimum (1GB+ recommended)
- **Storage**: 1GB minimum for application and data
- **Network**: HTTPS capability for production

### Dependencies

- **Node.js**: 18.0.0 or higher
- **Database**: PostgreSQL 13+ (production) or SQLite (development)
- **Container Runtime**: Docker 20.10+ (for containerized deployment)

### External Services

- **Authentication**: Google OAuth credentials (required)
- **Database**: PostgreSQL instance (managed or self-hosted)
- **Email**: SMTP service (optional, for notifications)
- **Monitoring**: Sentry or similar (optional, for error tracking)

## Environment Configuration

### Essential Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/contextlayer"

# Authentication
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="https://your-domain.com"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Optional Configuration

```bash
# Performance
DEFAULT_RATE_LIMIT_RPM=100
CACHE_TTL_SECONDS=300

# Monitoring
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_GA_ID="your-analytics-id"

# Admin
ADMIN_EMAILS="admin@yourcompany.com"
```

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Database setup and migrated
- [ ] OAuth providers configured
- [ ] SSL certificate ready (production)
- [ ] Domain configured and pointing to deployment

### Post-deployment

- [ ] Health check endpoint responding
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] SSL certificate installed and working
- [ ] Monitoring and logging configured

## Security Considerations

### Production Security

- **HTTPS Only** - Always use SSL/TLS in production
- **Secure Headers** - CSP, HSTS, and security headers configured
- **Environment Isolation** - Separate production environment variables
- **Access Control** - Proper firewall and access controls
- **Regular Updates** - Keep dependencies and base images updated

### Database Security

- **Connection Security** - Use SSL for database connections
- **Access Control** - Limit database access to application only
- **Backup Strategy** - Regular automated backups
- **Encryption** - Enable encryption at rest if available

## Monitoring & Maintenance

### Health Monitoring

- Built-in health check endpoint: `/api/health`
- Database connectivity monitoring
- API response time tracking
- Error rate monitoring

### Backup Strategy

- **Database**: Automated daily backups
- **Configuration**: Version-controlled environment configs
- **Application**: Container image versioning

### Updates & Maintenance

- **Dependencies**: Regular security updates
- **Database**: Migration testing in staging
- **Rollback Plan**: Quick rollback procedures documented

## Scaling Considerations

### Horizontal Scaling

- **Load Balancing**: Multiple application instances
- **Database**: Read replicas for read-heavy workloads
- **Caching**: Redis or similar for session and API caching
- **CDN**: Static asset distribution

### Performance Optimization

- **Connection Pooling**: Database connection optimization
- **Caching**: API response and tool definition caching
- **Rate Limiting**: Per-user and per-API rate controls
- **Monitoring**: Performance metrics and alerting

## Troubleshooting

### Common Issues

- **Database Connection**: Check DATABASE_URL and network connectivity
- **Authentication Errors**: Verify OAuth configuration and redirect URLs
- **Performance Issues**: Check resource usage and database performance
- **SSL Issues**: Verify certificate installation and configuration

### Getting Help

- **Documentation**: Check relevant deployment guide
- **GitHub Issues**: Search existing issues or create new one
- **Community**: Join GitHub Discussions for community help
- **Support**: Contact support for enterprise deployments

---

**Choose Your Deployment Method**:

- 🚀 **New to deployment?** Start with [Quick Deploy](./quick-deploy.md)
- 🐳 **Need full control?** Use [Docker Guide](./docker.md)
- ☁️ **Want easy scaling?** Try [Vercel Deployment](./vercel.md)
- 📚 **Need complete setup?** Follow [Full Deployment Guide](./deployment.md)
