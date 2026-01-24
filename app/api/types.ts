# API Route Type Definitions

**Centralized Type Definitions for Next.js 16 API Routes**

## 🎯 Overview

This file centralizes all type definitions used across our API routes to ensure consistency and reduce duplication. These types are imported and used throughout the API layer for type safety and developer experience.

## 📋 Core Type System

### **Request Types**
```typescript
// Standard Next.js request with our app-specific extensions
interface NextRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Headers;
  body?: any;
  query?: URLSearchParams;
  cookies?: any;
}

// Enhanced request with authentication context
interface AuthenticatedRequest extends NextRequest {
  userId: string;
  user: User;
  sessionId: string;
}

// Public request (no authentication required)
interface PublicRequest extends Omit<NextRequest, 'userId' | 'sessionId'> {}
```

### **Response Types**
```typescript
// Base response wrapper
interface BaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ResponseMeta;
}

// Success response with data
interface SuccessResponse<T> extends BaseApiResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ErrorResponse extends BaseApiResponse<null> {
  success: false;
  error: ApiError;
}

// Paginated response
interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}
```

### **Entity Types**
```typescript
// Common base entity
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

// User entity
interface User extends BaseEntity {
  email: string;
  fullName: string;
  studentId?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
}

// Unit entity
interface Unit extends BaseEntity {
  code: string;
  name: string;
  color: string;
  credits: number;
  lecturer?: Lecturer;
  schedule?: Schedule[];
  location?: Location;
  isActive: boolean;
}

// Deadline entity
interface Deadline extends BaseEntity {
  title: string;
  description: string;
  unitCode: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'assignment' | 'exam' | 'project';
  completed: boolean;
  userId: string;
}

// Event entity
interface Event extends BaseEntity {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: Location;
  isAllDay: boolean;
  userId: string;
}

// Notification entity
interface Notification extends BaseEntity {
  type: 'deadline' | 'event' | 'system' | 'class';
  title: string;
  message: string;
  read: boolean;
  userId: string;
  metadata?: Record<string, any>;
}

// Supporting entities
interface Lecturer extends BaseEntity {
  name: string;
  email: string;
  department?: string;
}

interface Location {
  building: string;
  room?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  unitId: string;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: NotificationPreferences;
  language: string;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  deadlines: boolean;
  events: boolean;
  class: boolean;
  system: boolean;
}
```

### **Error Types**
```typescript
// Standardized error format
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Response metadata
interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version?: string;
  pagination?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### **Configuration Types**
```typescript
// Configuration for route handlers
interface RouteHandlerConfig {
  authentication?: {
    required?: boolean;
    roles?: string[];
  };
  validation?: {
    schema?: ZodSchema;
  };
  rateLimit?: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
  };
  cors?: {
    origins?: string[];
    credentials?: boolean;
  };
  logging?: {
    enabled?: boolean;
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

---

**Centralized Type System** 🔧

*Import these types in all API route files to ensure consistency across your entire API layer.*