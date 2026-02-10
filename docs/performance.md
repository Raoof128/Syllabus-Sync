# Performance Guidelines & Benchmarks

**Production-Ready Performance Standards for The Syllabus Sync**

## 🎯 Performance Objectives

### **Core Performance Goals**

- **Sub-2 Second Initial Load:** First meaningful paint under 2s
- **Interactive Response:** UI interactions under 100ms
- **Smooth Animations:** 60fps maintained on all devices
- **Efficient Data Loading:** Progressive content loading with skeleton states
- **Optimal Bundle Size:** JavaScript bundles under 2.5MB compressed
- **High Lighthouse Scores:** 90+ across all categories

## 📊 Core Web Vitals Targets

### **Performance Metrics**

| Metric                             | Target | Description                   |
| ---------------------------------- | ------ | ----------------------------- |
| **LCP (Largest Contentful Paint)** | <2.5s  | Main content visible quickly  |
| **FID (First Input Delay)**        | <100ms | Page responsive to user input |
| **CLS (Cumulative Layout Shift)**  | <0.1   | Visual stability maintained   |
| **FCP (First Contentful Paint)**   | <1.8s  | Initial content appears       |
| **TTI (Time to Interactive)**      | <3.8s  | Page becomes interactive      |

### **Lighthouse Score Goals**

| Category           | Target | Current | Priority |
| ------------------ | ------ | ------- | -------- |
| **Performance**    | 90+    | 92      | High     |
| **Accessibility**  | 95+    | 98      | Critical |
| **Best Practices** | 85+    | 87      | High     |
| **SEO**            | 85+    | 89      | Medium   |

## 🚀 Bundle Optimization

### **Code Splitting Strategy**

```typescript
// Route-based code splitting
const Home = lazy(() => import('../app/home/HomeClient'));
const Calendar = lazy(() => import('../app/calendar/CalendarClient'));
const Map = lazy(() => import('../app/map/MapClient'));

// Component-level splitting with error boundaries
const AppRoutes = () => (
  <Router>
    <Suspense fallback={<PageSkeleton />}>
      <Route path="/" component={<Home />} />
      <Route path="/calendar" component={<Calendar />} />
      <Route path="/map" component={<Map />} />
    </Suspense>
  </Router>
);
```

### **Bundle Analysis Configuration**

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  openAnalyzer: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
    turbotrace: {
      // Detailed Turbopack configuration for performance
    },
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
});
```

### **Tree Shaking Configuration**

```json
// package.json
{
  "sideEffects": ["./components/ui/*.css", "./lib/styles/*"],
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./components": "./components/index.js",
    "./lib": "./lib/index.js"
  }
}
```

## 🎨 Frontend Performance

### **React Optimization Patterns**

```typescript
// Memoization for expensive calculations
const ExpensiveComponent = ({ data, filterFn }) => {
  const expensiveCalculation = useMemo(() => {
    return data.filter(filterFn).map(complexTransformation);
  }, [data, filterFn]);

  return <div>{expensiveCalculation}</div>;
};

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index]}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {Row}
    </List>
  );
};

// Component memoization
const OptimizedComponent = React.memo(({ prop1, prop2 }) => {
  // Expensive rendering logic
  return <div>{prop1} {prop2}</div>;
});
```

### **CSS Performance**

```css
/* CSS containment for performance */
.performance-card {
  contain: layout style paint;
  will-change: transform, opacity;
}

/* Hardware acceleration */
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Efficient animations */
.smooth-animation {
  animation: slideIn 0.3s ease-out;
  will-change: transform, opacity;
}
```

## 🗄️ Image & Asset Optimization

### **Next.js Image Configuration**

```typescript
// Optimized image component
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  fill?: boolean;
}

const CampusImage = ({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  placeholder = 'blur'
}: OptimizedImageProps) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={priority}
    placeholder={placeholder}
    fill={fill}
    sizes="(max-width: 400px) 100vw, (max-width: 768px) 50vw"
    style={{
      objectFit: 'cover',
      transition: 'opacity 0.3s ease'
    }}
    onLoadingComplete={() => {
      // Handle image load completion
    }}
    onError={() => {
      // Handle image errors gracefully
    }}
  />
);
```

### **Asset Compression**

```bash
# Image optimization pipeline
npm run optimize:images

# Generate WebP/AVIF formats
npm run optimize:formats

# Compress assets
npm run optimize:assets

# Analyze bundle size
npm run analyze
```

## 🔍 Database Performance

### **Query Optimization**

```sql
-- Optimized unit queries with proper indexing
EXPLAIN ANALYZE
SELECT u.id, u.code, u.name, u.color,
       jsonb_agg(DISTINCT s.day ORDER BY s.start_time) as schedule,
       COUNT(DISTINCT d.id) as deadline_count,
       MAX(u.updated_at) as last_updated
FROM units u
LEFT JOIN schedules s ON u.id = s.unit_id
LEFT JOIN deadlines d ON u.id = d.unit_id
WHERE u.user_id = $1
  AND u.is_active = true
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 50 OFFSET $2;

-- Index strategy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_user_active ON units(user_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_unit_time ON schedules(unit_id, start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deadlines_due_date ON deadlines(due_date, user_id);
```

### **Caching Strategy**

```typescript
// Multi-layer caching with Redis
interface CacheStrategy {
  redis: RedisClient;
  supabase: SupabaseClient;
}

const cacheKeys = {
  userProfiles: 'user:profile:',
  unitsList: 'units:list:',
  scheduleData: 'schedule:',
  notifications: 'notifications:',
};

class OptimizedDataService {
  async getUserProfile(userId: string) {
    // L1: Check Redis cache
    const cached = await this.cache.redis.get(`${cacheKeys.userProfiles}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // L2: Fetch from database
    const profile = await this.supabase.from('profiles').select('*').eq('user_id', userId).single();

    // L3: Cache with TTL
    await this.cache.redis.setex(
      `${cacheKeys.userProfiles}${userId}`,
      1800, // 30 minutes
      JSON.stringify(profile),
    );

    return profile;
  }
}
```

## 📈 Monitoring & Analytics

### **Real User Monitoring**

```typescript
// Performance monitoring with Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportWebVitals = (metric) => {
  // Send to analytics service
  analytics.track('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    delta: metric.delta,
    navigationType: performance.getEntriesByType('navigation')[0]?.type,
  });
};

// Initialize monitoring
if (typeof window !== 'undefined') {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}
```

### **Performance Budgets**

```json
{
  "budgets": [
    {
      "path": "/_next/static/chunks/*.js",
      "maximumSize": 244000,
      "warningThreshold": 204800
    },
    {
      "path": "/_next/static/chunks/**/*.css",
      "maximumSize": 15000,
      "warningThreshold": 12500
    }
  ]
}
```

### **Error Tracking**

```typescript
// Comprehensive error tracking
interface ErrorReport {
  error: Error;
  context: {
    userAgent: string;
    url: string;
    timestamp: string;
    userId?: string;
  };
  level: 'error' | 'warning' | 'info';
  handled: boolean;
}

const reportError = (error: Error, context: Partial<ErrorReport['context']>) => {
  const errorReport: ErrorReport = {
    error,
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      ...context,
    },
    level: 'error',
    handled: false,
  };

  // Send to error tracking service
  errorTracking.captureException(errorReport);

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Performance Error:', errorReport);
  }
};
```

## 🧪 Testing Performance

### **Load Testing Configuration**

```yaml
# Artillery configuration for API load testing
config:
  target: 'https://api.syllabus-sync.dev'
  phases:
    - duration: 60
      arrivalRate: 5 # 5 users per second
    - duration: 120
      arrivalRate: 10 # 10 users per second
    - duration: 300
      arrivalRate: 20 # 20 users per second
  payload:
    path: '/api/health'
    method: 'GET'
    weight: 1
  scenarios:
    - name: 'Student Dashboard Load'
      weight: 70
      flow:
        - get:
            url: '/api/units'
          weight: 80
        - get:
            url: '/api/deadlines'
          weight: 20
    - name: 'Unit Management'
      weight: 30
      flow:
        - post:
            url: '/api/units'
            weight: 100
```

### **Performance Testing Script**

```bash
#!/bin/bash
echo "🚀 Running Performance Tests..."

# Core Web Vitals
npm run lighthouse

# Bundle analysis
npm run analyze

# Memory usage profiling
node --inspect-brk dist/server.js

# CPU profiling
node --prof dist/server.js

echo "✅ Performance tests completed"
```

## 🎯 Continuous Optimization

### **Performance CI/CD**

```yaml
# GitHub Actions workflow step
- name: Performance Tests
  run: |
    npm run lighthouse
    npm run test:bundle-size
    npm run test:memory-usage

    # Upload performance results
    uses: actions/upload-artifact@v4
    with:
      name: performance-results
      path: |
        .lighthouseci/
        bundle-analysis.json
        memory-profile.json
```

### **Automated Monitoring**

```typescript
// Performance alerts configuration
const performanceAlerts = {
  lcpThreshold: 2.5, // 2.5 seconds
  fidThreshold: 100, // 100ms
  clsThreshold: 0.1, // Layout shift score
  errorRateThreshold: 0.01, // 1% error rate
  responseTimeThreshold: 500, // 500ms average
};

// Alert system integration
const checkPerformanceAlerts = (metrics: PerformanceMetrics) => {
  const alerts = [];

  if (metrics.lcp > performanceAlerts.lcpThreshold) {
    alerts.push({
      type: 'performance',
      metric: 'LCP',
      value: metrics.lcp,
      threshold: performanceAlerts.lcpThreshold,
    });
  }

  if (alerts.length > 0) {
    notifySlack(performanceAlerts);
  }
};
```

---

**Performance Excellence** ⚡

_For comprehensive performance monitoring, see [monitoring.md](monitoring.md)_
