#!/bin/bash

# Health check script for ContextLayer
# This script checks if the application is running and healthy

set -e

# Configuration
HOST="${HEALTH_CHECK_HOST:-localhost}"
PORT="${HEALTH_CHECK_PORT:-3000}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"

# Function to check if service is running
check_service() {
    local url="http://${HOST}:${PORT}/api/health"
    local response_code
    
    echo "Checking service health at ${url}..."
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time ${TIMEOUT} \
        --retry 3 \
        --retry-delay 5 \
        "${url}" || echo "000")
    
    if [ "${response_code}" = "200" ]; then
        echo "✅ Service is healthy (HTTP ${response_code})"
        return 0
    else
        echo "❌ Service is unhealthy (HTTP ${response_code})"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo "Checking database connectivity..."
    
    if command -v npx &> /dev/null; then
        if npx prisma db ping &> /dev/null; then
            echo "✅ Database is accessible"
            return 0
        else
            echo "❌ Database is not accessible"
            return 1
        fi
    else
        echo "⚠️  Cannot check database (Prisma not available)"
        return 0
    fi
}

# Main health check
main() {
    echo "🏥 Running ContextLayer health check..."
    echo "================================================"
    
    local exit_code=0
    
    # Check service
    if ! check_service; then
        exit_code=1
    fi
    
    echo ""
    
    # Check database
    if ! check_database; then
        exit_code=1
    fi
    
    echo "================================================"
    
    if [ ${exit_code} -eq 0 ]; then
        echo "🎉 All health checks passed!"
    else
        echo "💥 Some health checks failed!"
    fi
    
    exit ${exit_code}
}

# Run health check
main "$@"
