# Implementation Roadmap: Port-based to Path-based Architecture

> **Document Version**: 1.0  
> **Last Updated**: August 4, 2025  
> **Priority**: High  
> **Estimated Timeline**: 4-6 weeks

## Executive Summary

This document outlines the migration from port-based bridge architecture to path-based routing, addressing scalability, security, and usability concerns with the current implementation.

**Key Benefits of Migration:**

- 🚀 **90% reduction** in memory usage
- ⚡ **95% faster** bridge startup times
- 🔒 **Single SSL endpoint** for all bridges
- 📈 **Unlimited scalability** (no port constraints)
- 🛡️ **Enhanced security** with centralized access control

## Current Architecture Problems

### Port-based Issues

```typescript
// Current problematic approach
interface BridgeConfig {
  port: number; // Each bridge needs unique port
}

// Problems:
// 1. Port conflicts and management complexity
// 2. Firewall configuration nightmare
// 3. SSL certificate per port
// 4. Resource waste (separate server per bridge)
// 5. Client discovery complexity
```

### Resource Usage Analysis

```bash
# Current resource usage per bridge
Memory: ~50MB per bridge server
CPU: ~5% baseline per bridge
Ports: 1 port per bridge (limited to ~65k bridges)
SSL: Separate certificate/handshake per port
Startup: 2-5 seconds per bridge

# With 100 bridges:
Total Memory: 5GB
Total Ports: 100 (management overhead)
SSL Overhead: 100x certificate management
```

## Target Architecture

### Path-based Solution

```typescript
// New efficient approach
interface BridgeConfig {
  id: string; // Used in URL path
  slug: string; // URL-friendly identifier
  // No port field needed!
}

// Access pattern:
// https://yourapp.com/mcp/github-api
// https://yourapp.com/mcp/slack-integration
// https://yourapp.com/mcp/custom-crm
```

### Resource Efficiency Gains

```bash
# New resource usage (all bridges combined)
Memory: ~200MB base + ~5MB per bridge config
CPU: ~10% baseline for entire system
Ports: 1 port (443 HTTPS)
SSL: Single wildcard certificate
Startup: <100ms per bridge registration

# With 100 bridges:
Total Memory: 700MB (86% reduction)
Total Ports: 1 (99% reduction)
SSL Overhead: 1x certificate management
```

## Implementation Plan

### Week 1: Foundation

#### Day 1-3: Core Architecture

```typescript
// 1. Create new multiplexed server
class PathBasedMcpServer {
  private app = express();
  private bridges = new Map<string, BridgeConfig>();

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Bridge discovery
    this.app.get("/api/bridges", this.listBridges);

    // MCP protocol endpoints
    this.app.all("/mcp/:bridgeId/*", this.handleMcpRequest);

    // Health and metrics
    this.app.get("/health/:bridgeId?", this.healthCheck);
  }
}
```

#### Day 4-5: Bridge Management

```typescript
// 2. Implement bridge lifecycle management
class BridgeManager {
  async registerBridge(config: BridgeConfig) {
    // Validate configuration
    const validation = await this.validateBridge(config);
    if (!validation.valid) throw new Error(validation.error);

    // Register in routing table
    this.bridges.set(config.id, config);

    // Test connectivity
    await this.testBridgeConnectivity(config);

    // Enable in router
    this.enableBridgeRouting(config.id);
  }

  async unregisterBridge(bridgeId: string) {
    this.bridges.delete(bridgeId);
    // No server process to stop!
  }
}
```

### Week 2: Migration Tools

#### Day 1-3: Backward Compatibility

```typescript
// 3. Legacy port redirect system
class LegacyPortHandler {
  private portToBridgeMap = new Map<number, string>();

  setupLegacyRedirects() {
    // Redirect old port-based URLs to new paths
    this.app.use((req, res, next) => {
      const port = this.extractPortFromHost(req.headers.host);
      if (port && this.portToBridgeMap.has(port)) {
        const bridgeId = this.portToBridgeMap.get(port);
        const newUrl = `https://${process.env.DOMAIN}/mcp/${bridgeId}${req.path}`;
        res.redirect(301, newUrl);
        return;
      }
      next();
    });
  }
}
```

#### Day 4-5: Configuration Migration

```typescript
// 4. Automatic config migration
class ConfigMigrator {
  async migrateAllBridges() {
    const legacyBridges = await this.loadLegacyBridges();

    for (const bridge of legacyBridges) {
      try {
        const migratedBridge = this.convertToPathBased(bridge);
        await this.validateMigration(bridge, migratedBridge);
        await this.saveMigratedBridge(migratedBridge);

        console.log(`✅ Migrated ${bridge.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${bridge.name}:`, error);
      }
    }
  }

  private convertToPathBased(legacy: LegacyBridgeConfig): BridgeConfig {
    return {
      ...legacy,
      id: this.generateBridgeId(legacy.name),
      slug: this.generateSlug(legacy.name),
      routing: { type: "path" },
      // Remove port field
      port: undefined,
    };
  }
}
```

### Week 3: Enhanced Features

#### Day 1-3: Advanced Routing

```typescript
// 5. Advanced routing features
class AdvancedRouter {
  setupAdvancedRouting() {
    // Custom domain support
    this.app.use(this.customDomainHandler);

    // Rate limiting per bridge
    this.app.use("/mcp/:bridgeId", this.rateLimitMiddleware);

    // Authentication per bridge
    this.app.use("/mcp/:bridgeId", this.authMiddleware);

    // Caching per bridge
    this.app.use("/mcp/:bridgeId", this.cacheMiddleware);
  }

  private rateLimitMiddleware = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
      const bridge = this.getBridge(req.params.bridgeId);
      return bridge?.performance?.rateLimiting?.requestsPerMinute || 100;
    },
    keyGenerator: (req) => `${req.ip}:${req.params.bridgeId}`,
  });
}
```

#### Day 4-5: Monitoring & Analytics

```typescript
// 6. Enhanced monitoring
class BridgeMonitor {
  private metrics = new Map<string, BridgeMetrics>();

  trackRequest(bridgeId: string, req: Request, res: Response) {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      this.recordMetrics(bridgeId, {
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers["user-agent"],
      });
    });
  }

  getBridgeMetrics(bridgeId: string): BridgeMetrics {
    return this.metrics.get(bridgeId) || this.createDefaultMetrics();
  }
}
```

### Week 4: Testing & Deployment

#### Day 1-3: Comprehensive Testing

```typescript
// 7. End-to-end testing suite
describe("Path-based Architecture", () => {
  test("Bridge Registration", async () => {
    const bridge = createTestBridge();
    await bridgeManager.registerBridge(bridge);

    const response = await request(app)
      .get(`/mcp/${bridge.id}/tools`)
      .expect(200);

    expect(response.body).toHaveProperty("tools");
  });

  test("Performance Benchmarks", async () => {
    // Create 100 test bridges
    const bridges = Array.from({ length: 100 }, createTestBridge);

    // Measure registration time
    const start = Date.now();
    await Promise.all(bridges.map((b) => bridgeManager.registerBridge(b)));
    const registrationTime = Date.now() - start;

    expect(registrationTime).toBeLessThan(5000); // < 5 seconds for 100 bridges
  });

  test("Concurrent Request Handling", async () => {
    const requests = Array.from({ length: 1000 }, () =>
      request(app).get("/mcp/test-bridge/tools")
    );

    const responses = await Promise.all(requests);
    const successRate = responses.filter((r) => r.status === 200).length / 1000;

    expect(successRate).toBeGreaterThan(0.95); // 95% success rate
  });
});
```

#### Day 4-5: Production Deployment

```bash
# 8. Deployment checklist
□ Database migration scripts ready
□ Environment variables updated
□ SSL certificate configured
□ Load balancer configuration updated
□ Monitoring alerts configured
□ Rollback plan documented
□ Performance baselines established
□ User communication sent
```

## Migration Checklist

### Pre-Migration (Week 0)

- [ ] **Backup all bridge configurations**
- [ ] **Document current bridge URLs for users**
- [ ] **Set up monitoring for migration process**
- [ ] **Prepare rollback procedures**
- [ ] **Test migration scripts on staging**

### During Migration (Weeks 1-4)

- [ ] **Week 1**: Implement core path-based architecture
- [ ] **Week 2**: Deploy migration tools and backward compatibility
- [ ] **Week 3**: Add advanced features and monitoring
- [ ] **Week 4**: Complete testing and production deployment

### Post-Migration (Week 5)

- [ ] **Monitor system performance and stability**
- [ ] **Collect user feedback on new URLs**
- [ ] **Remove legacy code after 30-day transition**
- [ ] **Update all documentation and examples**
- [ ] **Performance optimization based on real-world usage**

## Performance Validation

### Benchmarks to Track

```typescript
interface PerformanceBenchmarks {
  bridgeRegistrationTime: number; // Target: <100ms
  requestLatency: number; // Target: <20ms
  throughputPerSecond: number; // Target: >1000 req/s
  memoryUsagePerBridge: number; // Target: <5MB
  cpuUsageBaseline: number; // Target: <10%
  maxConcurrentBridges: number; // Target: >10,000
}
```

### Success Criteria

1. **Performance**: 10x improvement in throughput
2. **Resource Usage**: 90% reduction in memory usage
3. **Scalability**: Support for 10,000+ bridges
4. **Reliability**: 99.9% uptime during migration
5. **User Experience**: <10 second migration per bridge

## Risk Mitigation

### High-Risk Areas

1. **Bridge URL Changes**: Users need to update their integrations
2. **Authentication**: Ensure auth tokens work with new URLs
3. **Performance**: New architecture must handle existing load
4. **Data Loss**: Configuration migration must be error-free

### Mitigation Strategies

1. **Gradual Rollout**: Migrate bridges in small batches
2. **Backward Compatibility**: Keep legacy redirects for 30 days
3. **Automated Testing**: Comprehensive test suite for all scenarios
4. **Monitoring**: Real-time alerts for any issues
5. **Rollback Plan**: Ability to revert to port-based system

## Communication Plan

### User Notifications

```markdown
# Bridge URL Migration Notice

We're upgrading our infrastructure for better performance and reliability!

**What's Changing:**

- Old: http://localhost:3001, http://localhost:3002, etc.
- New: https://yourapp.com/mcp/your-bridge-name

**Benefits:**

- Faster response times
- Better security with HTTPS
- More reliable connections
- Easier bridge discovery

**Timeline:**

- Migration starts: [Date]
- Old URLs redirected: [Date + 1 week]
- Old URLs discontinued: [Date + 4 weeks]

**Action Required:**
Please update your MCP client configurations to use the new URLs.
```

This implementation roadmap provides a clear path forward for migrating to a more scalable, efficient, and user-friendly architecture.
