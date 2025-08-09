# Docker Compose Development Environment for MCP Bridge

## Quick Start

1. **Initial Setup** (First time only):

   ```bash
   # Clone and setup
   git clone <repository-url>
   cd mcp-bridge

   # Install dependencies locally for IDE support
   npm install

   # Copy environment file
   cp .env.example .env.local
   ```

2. **Start Development Environment**:

   ```bash
   # Start all services
   docker-compose up

   # Or run in background
   docker-compose up -d
   ```

3. **Access the Application**:
   - **Main App**: http://localhost:3000
   - **pgAdmin**: http://localhost:5050 (admin@mcp-bridge.local / admin)
   - **PostgreSQL**: localhost:5432 (postgres / password)
   - **Redis**: localhost:6379

## Services Overview

### Main Application (`app`)

- **Container**: `mcp-bridge-app`
- **Port**: 3000
- **Hot Reload**: ✅ (source code mounted as volumes)
- **Environment**: Development with all debugging enabled

### PostgreSQL Database (`db`)

- **Container**: `mcp-bridge-db`
- **Port**: 5432
- **Database**: `mcp_bridge`
- **Credentials**: postgres / password
- **Persistence**: Docker volume `postgres_data`
- **Init Script**: Automatically creates schema and sample data

### Redis Cache (`redis`)

- **Container**: `mcp-bridge-redis`
- **Port**: 6379
- **Persistence**: Docker volume `redis_data`
- **Usage**: Session management and caching

### pgAdmin (`pgadmin`) - Optional

- **Container**: `mcp-bridge-pgadmin`
- **Port**: 5050
- **Credentials**: admin@mcp-bridge.local / admin
- **Pre-configured**: Database connection ready to use

## Development Workflow

### Daily Development

```bash
# Start development environment
docker-compose up

# View logs
docker-compose logs -f app

# Restart just the app (after dependency changes)
docker-compose restart app

# Stop everything
docker-compose down
```

### Database Operations

```bash
# Access PostgreSQL directly
docker-compose exec db psql -U postgres -d mcp_bridge

# View database logs
docker-compose logs db

# Reset database (CAUTION: loses all data)
docker-compose down -v
docker-compose up db
```

### Cache Operations

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Clear cache
docker-compose exec redis redis-cli FLUSHALL
```

### IDE Setup

Since dependencies are installed locally (`npm install`), your IDE will have full autocomplete and IntelliSense support. The application runs in Docker, but development feels native.

### Installing New Dependencies

```bash
# Install in both places for IDE support
npm install <package-name>

# Rebuild the Docker image to include new dependencies
docker-compose down
docker-compose build app
docker-compose up
```

## Docker Compose Commands

### Service Management

```bash
# Start specific services
docker-compose up app db

# Scale services (if needed)
docker-compose up --scale app=2

# Start with tools (pgAdmin)
docker-compose --profile tools up
```

### Development Tools

```bash
# Shell into the app container
docker-compose exec app sh

# Shell into database
docker-compose exec db psql -U postgres -d mcp_bridge

# View real-time logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Data Management

```bash
# Backup database
docker-compose exec db pg_dump -U postgres mcp_bridge > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres -d mcp_bridge < backup.sql

# Reset all data
docker-compose down -v
docker-compose up
```

## Environment Configuration

### Environment Variables

Edit `.env.local` file to customize:

- Database credentials
- Application secrets
- Performance settings
- Feature flags

### Database Schema

The database is automatically initialized with:

- Complete schema for bridges, endpoints, logs
- Sample data (GitHub API bridge, JSONPlaceholder)
- Proper indexes and constraints
- UUID extensions and custom functions

## Production Considerations

### Building for Production

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Run production stack
docker-compose -f docker-compose.prod.yml up
```

### Security Notes

- Change default passwords in production
- Use proper secrets management
- Configure firewall rules
- Enable SSL/TLS termination
- Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **Port Conflicts**:

   ```bash
   # Check what's using the port
   lsof -i :3000

   # Change ports in docker-compose.yml if needed
   ```

2. **Database Connection Issues**:

   ```bash
   # Check if database is ready
   docker-compose logs db

   # Test connection
   docker-compose exec app npm run db:test
   ```

3. **Hot Reload Not Working**:

   ```bash
   # Ensure volumes are mounted correctly
   docker-compose config

   # Restart with clean build
   docker-compose down
   docker-compose build --no-cache app
   docker-compose up
   ```

4. **Performance Issues**:

   ```bash
   # Check resource usage
   docker stats

   # Increase Docker memory allocation if needed
   ```

### Logs and Debugging

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# All logs
docker-compose logs -f

# Debug specific container
docker-compose exec app sh
npm run debug
```

## Migrating from npm run dev

### Old Workflow

```bash
npm install
npm run dev          # ❌ Don't use this anymore
```

### New Workflow

```bash
npm install          # ✅ For IDE support only
docker-compose up    # ✅ For actual development
```

This approach gives you the best of both worlds:

- IDE autocomplete and type checking (from local node_modules)
- Consistent development environment (from Docker)
- Easy database and cache management
- Production-like setup
