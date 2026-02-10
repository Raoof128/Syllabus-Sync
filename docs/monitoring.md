# Monitoring & Observability Guide

**Production-Ready Monitoring Strategy for The Syllabus Sync**

## 🎯 Monitoring Philosophy

### **Observability-First Development**

Every feature should be built with monitoring in mind from day one. We believe that what gets measured gets improved, and what gets ignored breaks in production.

### **Core Monitoring Pillars**

- **Performance Metrics:** Real-time user experience and system performance
- **Error Tracking:** Comprehensive error capture and alerting
- **Business Analytics:** User behavior and feature adoption
- **System Health:** Infrastructure and service availability
- **Security Monitoring:** Threat detection and incident response

## 📊 Application Performance Monitoring (APM)

### **Frontend Performance**

```typescript
// lib/monitoring/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  loadTime: number; // Page load completion
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isRecording = false;

  startMonitoring() {
    if (typeof window !== 'undefined' && !this.isRecording) {
      this.isRecording = true;

      getCLS((metric) => this.recordMetric('CLS', metric));
      getFID((metric) => this.recordMetric('FID', metric));
      getFCP((metric) => this.recordMetric('FCP', metric));
      getLCP((metric) => this.recordMetric('LCP', metric));
      getTTFB((metric) => this.recordMetric('TTFB', metric));

      // Track page load time
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.recordMetric('LoadTime', { value: loadTime, rating: this.rateMetric(loadTime) });
      });
    }
  }

  private recordMetric(name: string, metric: any) {
    this.metrics.push({
      name,
      value: metric.value || metric,
      rating: metric.rating || this.rateMetric(metric.value),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Send to monitoring service
    this.sendToMonitoring(name, metric);
  }

  private rateMetric(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value < 1000) return 'good';
    if (value < 2500) return 'needs-improvement';
    return 'poor';
  }

  private async sendToMonitoring(name: string, metric: any) {
    // Send to your monitoring service (DataDog, New Relic, etc.)
    await fetch('/api/monitoring/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
      },
      body: JSON.stringify({
        metric: name,
        data: metric,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### **Backend Performance**

```typescript
// lib/monitoring/api-metrics.ts
import { NextRequest } from 'next/server';

interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  error?: string;
}

class ApiPerformanceTracker {
  private metrics: ApiMetric[] = [];

  trackRequest(
    req: NextRequest,
    startTime: number,
    endTime: number,
    statusCode: number,
    userId?: string,
  ) {
    const metric: ApiMetric = {
      endpoint: req.url,
      method: req.method,
      statusCode,
      responseTime: endTime - startTime,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      userId,
      userAgent: req.headers.get('user-agent'),
    };

    this.metrics.push(metric);

    // Send to monitoring service
    this.sendMetric(metric);

    // Check for performance issues
    if (metric.responseTime > 1000) {
      this.alertSlowRequest(metric);
    }
  }

  private async sendMetric(metric: ApiMetric) {
    // Send to your monitoring service
    await fetch('https://api.monitoring-service.com/metrics', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MONITORING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    });
  }

  private alertSlowRequest(metric: ApiMetric) {
    // Send alert for slow requests
    await fetch('https://api.monitoring-service.com/alerts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MONITORING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'performance',
        severity: 'warning',
        message: `Slow API response: ${metric.endpoint} took ${metric.responseTime}ms`,
        metric,
      }),
    });
  }

  getMetrics(): ApiMetric[] {
    return this.metrics;
  }
}

export const apiTracker = new ApiPerformanceTracker();
```

## 🔍 Error Tracking & Alerting

### **Comprehensive Error Monitoring**

```typescript
// lib/monitoring/error-tracking.ts
interface ErrorContext {
  userAgent: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  component?: string;
  action?: string;
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
}

interface ErrorReport {
  message: string;
  stack?: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  fingerprint?: string;
  tags?: Record<string, string>;
}

class ErrorTracker {
  private readonly errors: ErrorReport[] = [];

  captureError(error: Error, context: Partial<ErrorContext> = {}) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      code: this.extractErrorCode(error),
      severity: this.determineSeverity(error, context),
      context: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        ...context,
      },
      fingerprint: this.generateFingerprint(error),
    };

    this.errors.push(errorReport);
    this.sendToErrorService(errorReport);
    this.logToConsole(errorReport);
  }

  private extractErrorCode(error: Error): string {
    // Extract error codes from custom error classes
    if (error instanceof ValidationError) return error.code;
    if (error instanceof ApiError) return error.code;
    return 'UNKNOWN_ERROR';
  }

  private determineSeverity(
    error: Error,
    context: Partial<ErrorContext>,
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors prevent core functionality
    if (this.isCriticalError(error)) return 'critical';

    // High errors affect major features
    if (this.isHighError(error, context)) return 'high';

    // Medium errors have workarounds
    if (this.isMediumError(error)) return 'medium';

    return 'low';
  }

  private generateFingerprint(error: Error): string {
    // Generate unique fingerprint for error grouping
    const stack = error.stack || '';
    const firstLine = stack.split('\n')[0] || '';
    const cleanMessage = error.message.replace(/\d+/g, 'X');

    return `${firstLine.substring(0, 50)}:${cleanMessage.substring(0, 50)}`;
  }

  private async sendToErrorService(errorReport: ErrorReport) {
    // Send to error tracking service (Sentry, Bugsnag, etc.)
    await fetch('https://errors.monitoring-service.com/api/errors', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ERROR_TRACKING_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });
  }

  private logToConsole(errorReport: ErrorReport) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${errorReport.severity.toUpperCase()}]`, errorReport);
    }
  }

  getErrors(): ErrorReport[] {
    return this.errors;
  }
}

export const errorTracker = new ErrorTracker();
```

## 📈 Business Metrics

### **User Behavior Analytics**

```typescript
// lib/monitoring/analytics.ts
interface UserEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
  value?: number;
}

class AnalyticsTracker {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  trackEvent(event: string, properties?: Record<string, any>, value?: number) {
    const userEvent: UserEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      value,
    };

    // Send to analytics service
    this.sendEvent(userEvent);
  }

  trackPageView(page: string, title?: string) {
    this.trackEvent('page_view', {
      page,
      title,
    });
  }

  trackFeatureUsage(feature: string, action: string) {
    this.trackEvent('feature_used', {
      feature,
      action,
    });
  }

  trackError(error: Error, context?: string) {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_type: error.constructor.name,
      context,
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Get current user from auth store or localStorage
    return typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined;
  }

  private async sendEvent(event: UserEvent) {
    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    await fetch('https://analytics.monitoring-service.com/api/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ANALYTICS_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  }
}

export const analytics = new AnalyticsTracker();
```

## 🔧 System Health Monitoring

### **Infrastructure Health Checks**

```typescript
// lib/monitoring/health-check.ts
interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  timestamp: string;
  details?: Record<string, any>;
}

class HealthMonitor {
  private checks: HealthCheck[] = [];

  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test database connection
      const result = await this.queryDatabase('SELECT 1');

      return {
        service: 'database',
        status: result ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkExternalServices(): Promise<HealthCheck[]> {
    const services = ['ors-api', 'supabase', 'redis'];
    const checks: HealthCheck[] = [];

    for (const service of services) {
      const startTime = Date.now();

      try {
        const response = await fetch(`https://${service}.com/health`, {
          method: 'GET',
          timeout: 5000,
        });

        checks.push({
          service,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        checks.push({
          service,
          status: 'unhealthy',
          error: error.message,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return checks;
  }

  async getOverallHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const allChecks = await Promise.all([
      this.checkDatabase(),
      ...(await this.checkExternalServices()),
    ]);

    const unhealthyCount = allChecks.filter((check) => check.status === 'unhealthy').length;
    const degradedCount = allChecks.filter((check) => check.status === 'degraded').length;

    let status: 'healthy';
    if (unhealthyCount > 0) status = 'unhealthy';
    else if (degradedCount > 0) status = 'degraded';

    return {
      status,
      checks: allChecks,
      timestamp: new Date().toISOString(),
    };
  }

  private async queryDatabase(sql: string): Promise<any> {
    // Database query implementation
    // This would connect to your actual database
    return true;
  }
}

export const healthMonitor = new HealthMonitor();
```

## 📊 Dashboard & Alerting

### **Real-time Monitoring Dashboard**

```typescript
// Monitoring dashboard components
interface MonitoringDashboardProps {
  metrics: PerformanceMetrics[];
  errors: ErrorReport[];
  healthChecks: HealthCheck[];
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  metrics,
  errors,
  healthChecks
}) => {
  const [selectedTab, setSelectedTab] = useState<'performance' | 'errors' | 'health'>('performance');

  return (
    <div className="p-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setSelectedTab('performance')}
          className={selectedTab === 'performance' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
        >
          Performance
        </button>
        <button
          onClick={() => setSelectedTab('errors')}
          className={selectedTab === 'errors' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
        >
          Errors
        </button>
        <button
          onClick={() => setSelectedTab('health')}
          className={selectedTab === 'health' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
        >
          Health
        </button>
      </div>

      {selectedTab === 'performance' && <PerformanceMetrics metrics={metrics} />}
      {selectedTab === 'errors' && <ErrorDashboard errors={errors} />}
      {selectedTab === 'health' && <HealthDashboard checks={healthChecks} />}
    </div>
  );
};
```

### **Alert Configuration**

```typescript
// Alert thresholds and notifications
interface AlertThresholds {
  errorRate: number; // Errors per minute
  responseTime: number; // Average response time in ms
  cpuUsage: number; // CPU usage percentage
  memoryUsage: number; // Memory usage percentage
  unavailableServices: string[]; // Critical services that must be available
}

const alertThresholds: AlertThresholds = {
  errorRate: 0.01, // 1 error per 100 requests
  responseTime: 500, // 500ms average response time
  cpuUsage: 80, // 80% CPU usage
  memoryUsage: 85, // 85% memory usage
  unavailableServices: ['database', 'auth', 'api'],
};

class AlertManager {
  checkThresholds(metrics: MonitoringData) {
    const alerts = [];

    if (metrics.errorRate > alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate exceeded: ${metrics.errorRate}`,
        threshold: alertThresholds.errorRate,
      });
    }

    if (metrics.averageResponseTime > alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'medium',
        message: `Average response time exceeded: ${metrics.averageResponseTime}ms`,
        threshold: alertThresholds.responseTime,
      });
    }

    // Send alerts
    alerts.forEach((alert) => this.sendAlert(alert));
  }

  private async sendAlert(alert: Alert) {
    // Send to Slack, Discord, PagerDuty, etc.
    await fetch('https://alerts.monitoring-service.com/api/alerts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ALERT_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...alert,
        timestamp: new Date().toISOString(),
        service: 'syllabus-sync',
        environment: process.env.NODE_ENV,
      }),
    });
  }
}
```

## 🔧 Configuration

### **Environment Variables for Monitoring**

```bash
# .env.local
MONITORING_ENABLED=true
MONITORING_API_KEY=your_monitoring_service_key
ERROR_TRACKING_KEY=your_error_tracking_key
ANALYTICS_KEY=your_analytics_key
ALERT_SERVICE_KEY=your_alert_service_key

# Monitoring endpoints
MONITORING_API_URL=https://api.monitoring-service.com
ERROR_TRACKING_URL=https://errors.monitoring-service.com
ANALYTICS_URL=https://analytics.monitoring-service.com
ALERT_SERVICE_URL=https://alerts.monitoring-service.com

# Performance thresholds
PERFORMANCE_THRESHOLD_LCP=2500
PERFORMANCE_THRESHOLD_FID=100
PERFORMANCE_THRESHOLD_CLS=0.1
PERFORMANCE_THRESHOLD_RESPONSE_TIME=500

# Health check intervals
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000      # 5 seconds timeout
```

---

**Production-Ready Monitoring** 📊

_For implementation details, see [ARCHITECTURE.md](ARCHITECTURE.md) and [api.md](api.md)._
