# API Documentation Standards

**Professional API Documentation Guidelines for Development Teams**

## 🎯 Documentation Philosophy

### **Developer-First Approach**

- **Self-Documenting Code:** Clear function signatures and examples
- **Interactive Examples:** Working code samples for all endpoints
- **Progressive Disclosure:** Start with basics, advanced concepts in depth
- **Multi-Language Support:** TypeScript, cURL, Postman examples

### **Quality Standards**

- **Always Current:** Documentation matches actual implementation
- **Version Controlled:** Document each API version with changelog links
- **Testing Verified:** All examples tested and working
- **Security Focused:** Authentication, authorization, and data protection highlighted

## 📋 Template Structure

### **API Endpoint Documentation**

````markdown
# [GET] /api/users/{id}

## Overview

Retrieves a specific user's profile information.

## Authentication

**Required:** `Authorization: Bearer <token>`  
**Scopes:** `users:read` for user data

## Request Parameters

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `id`      | string | Yes      | User unique identifier                            |
| `include` | string | No       | Include additional data (`profile`,`preferences`) |

### Request Example

#### **TypeScript**

```typescript
import { apiRequest } from '@/lib/api';

interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

const getUser = async (userId: string): Promise<UserResponse> => {
  return await apiRequest<UserResponse>(`/api/users/${userId}`, {
    method: 'GET',
    requiresAuth: true,
  });
};
```
````

#### **cURL**

```bash
curl -X GET "https://api.syllabus-sync.dev/api/users/user_123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"include": "profile,preferences"}'
```

#### **JavaScript (Browser)**

```javascript
// Using fetch API
const getUser = async (userId, token) => {
  const response = await fetch(`https://api.syllabus-sync.dev/api/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// Usage
const user = await getUser('user_123', 'your-jwt-token');
```

## Response Format

### **Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john.doe@mq.edu.au",
    "avatarUrl": "https://storage.syllabus-sync.dev/avatars/user_123.jpg",
    "createdAt": "2026-01-15T10:30:00Z",
    "preferences": {
      "theme": "light",
      "notifications": true,
      "language": "en"
    }
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "version": "v1.0.0",
    "requestId": "req_abc123"
  }
}
```

### **Error Response**

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 'user_123' not found",
    "details": {
      "userId": "user_123",
      "timestamp": "2026-01-15T10:30:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Status Codes

| Code  | Message           | Description                       |
| ----- | ----------------- | --------------------------------- |
| `200` | OK                | Request successful                |
| `201` | Created           | Resource successfully created     |
| `400` | Bad Request       | Invalid request parameters        |
| `401` | Unauthorized      | Missing or invalid authentication |
| `403` | Forbidden         | Insufficient permissions          |
| `404` | Not Found         | Resource does not exist           |
| `422` | Validation Error  | Request body validation failed    |
| `429` | Too Many Requests | Rate limit exceeded               |
| `500` | Server Error      | Internal server error             |

## Error Handling

### **Standardized Error Objects**

```typescript
// API Error Response Interface
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

// Client-Side Error Handling
const handleApiError = (error: ApiError) => {
  switch (error.code) {
    case 'USER_NOT_FOUND':
      showToast('User not found', 'error');
      break;
    case 'INVALID_CREDENTIALS':
      showToast('Invalid email or password', 'error');
      break;
    case 'RATE_LIMITED':
      showToast('Too many requests. Please try again later', 'warning');
      break;
    default:
      showToast('An unexpected error occurred', 'error');
      break;
  }
};
```

## 🔒 Security Documentation

### **Authentication Flows**

````markdown
## JWT Token Authentication

### Token Structure

```json
{
  "header": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "payload": {
    "sub": "user_123",
    "email": "john.doe@mq.edu.au",
    "role": "student",
    "permissions": ["read:profile", "write:deadlines"],
    "iat": 1642694400,
    "exp": 1642780800
  },
  "signature": "signature_hash_here"
}
```
````

### Authentication Endpoints

| Method | Endpoint                   | Description                     |
| ------ | -------------------------- | ------------------------------- |
| `POST` | `/api/auth/login`          | Email/password authentication   |
| `POST` | `/api/auth/passkey/verify` | WebAuthn passkey authentication |
| `POST` | `/api/auth/refresh`        | JWT token refresh               |
| `POST` | `/api/auth/logout`         | Session termination             |

### Authorization

```typescript
// Permission-based access control
interface UserPermissions {
  units: ['read', 'write', 'delete'];
  deadlines: ['read', 'write', 'delete'];
  calendar: ['read', 'write'];
  profile: ['read', 'write'];
  admin: []; // Super admin privileges
}

// Middleware usage
const checkPermission = (requiredPermission: string) => {
  return (req: NextRequest) => {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = decodeJWT(token);

    return decoded.permissions.includes(requiredPermission);
  };
};
```

### Rate Limiting

```typescript
// Rate limiting configuration
const rateLimits = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: false,
  },
  '/api/units': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },
  '/api/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    skipSuccessfulRequests: true,
  },
};
```

## 📊 Performance & Monitoring

### **Request/Response Metrics**

```typescript
// API performance tracking
interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

// Middleware implementation
const withMetrics = (handler: Function) => {
  return async (req: NextRequest) => {
    const startTime = Date.now();

    try {
      const result = await handler(req);
      const endTime = Date.now();

      // Log metrics
      await logApiMetrics({
        endpoint: req.url,
        method: req.method,
        responseTime: endTime - startTime,
        statusCode: result.status,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const endTime = Date.now();

      await logApiMetrics({
        endpoint: req.url,
        method: req.method,
        responseTime: endTime - startTime,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      throw error;
    }
  };
};
```

## 🌐 Internationalization

### **Multi-Language Error Responses**

```typescript
const getLocalizedError = (errorCode: string, language: string = 'en'): ApiError => {
  const errorMessages = {
    en: {
      USER_NOT_FOUND: 'User not found',
      INVALID_CREDENTIALS: 'Invalid email or password',
      RATE_LIMITED: 'Too many requests. Please try again later',
    },
    es: {
      USER_NOT_FOUND: 'Usuario no encontrado',
      INVALID_CREDENTIALS: 'Correo o contraseña inválidos',
      RATE_LIMITED: 'Demasiadas solicitudes. Inténtalo más tarde',
    },
    zh: {
      USER_NOT_FOUND: '找不到用户',
      INVALID_CREDENTIALS: '邮箱或密码无效',
      RATE_LIMITED: '请求过多，请稍后再试',
    },
  };

  return {
    code: errorCode,
    message: errorMessages[language]?.[errorCode] || errorMessages.en[errorCode],
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
};
```

## 📝 Versioning Strategy

### **Semantic Versioning**

- **Major (X.0.0):** Breaking changes, new major features
- **Minor (X.1.0):** New features, backward compatible
- **Patch (X.0.1):** Bug fixes, security patches

### **Version Headers**

```http
API-Version: v1.0.0
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
```

### **Deprecation Process**

```typescript
// Endpoint deprecation
const deprecatedEndpoints = {
  '/api/legacy/users': {
    deprecatedSince: 'v1.0.0',
    removalDate: '2026-06-01',
    alternative: '/api/users',
    migrationGuide: 'https://docs.syllabus-sync.dev/migration-v1.0.0',
  },
};

// Middleware to handle deprecation
const handleDeprecatedEndpoint = (req: NextRequest) => {
  const deprecated = deprecatedEndpoints[req.url];

  if (deprecated) {
    return NextResponse.json(
      {
        error: {
          code: 'ENDPOINT_DEPRECATED',
          message: `Endpoint deprecated since ${deprecated.deprecatedSince}`,
          details: {
            removalDate: deprecated.removalDate,
            alternative: deprecated.alternative,
            migrationGuide: deprecated.migrationGuide,
          },
        },
      },
      {
        status: 301,
        headers: {
          Sunset: deprecated.removalDate,
          Alternative: deprecated.alternative,
          Link: deprecated.migrationGuide,
        },
      },
    );
  }
};
```

## 🧪 Testing Guidelines

### **API Testing Strategy**

```typescript
// Test utilities for API testing
interface ApiTest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  assertions: Array<{
    status: number;
    body?: any;
    headers?: Record<string, string>;
  }>;
}

// Example test suite
describe('User API', () => {
  it('should retrieve user profile', async () => {
    const mockUser = createMockUser();
    const response = await apiRequest(`/api/users/${mockUser.id}`);

    expect(response.success).toBe(true);
    expect(response.data.id).toBe(mockUser.id);
    expect(response.data.email).toBe(mockUser.email);
  });

  it('should return 404 for non-existent user', async () => {
    const response = await apiRequest('/api/users/non_existent');

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('USER_NOT_FOUND');
    expect(response.status).toBe(404);
  });
});
```

---

**Professional API Documentation** 🔌

_For interactive API explorer, see [https://api.syllabus-sync.dev/explorer](https://api.syllabus-sync.dev/explorer)_
