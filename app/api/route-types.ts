# API Route Type Definitions

**Centralized Type Definitions for Next.js 16 API Routes**

## 🎯 Overview

This file centralizes all type definitions used across our API routes to ensure consistency and reduce duplication. These types are imported and used throughout the API layer for type safety and developer experience.

## 📋 Core Type System

### Request Types
```typescript
interface NextRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Headers;
  body?: any;
  query?: URLSearchParams;
  cookies?: any;
}

interface AuthenticatedRequest extends NextRequest {
  userId: string;
  user: User;
  sessionId: string;
}

interface PublicRequest extends Omit<NextRequest, 'userId' | 'sessionId'> {}
```

### Response Types
```typescript
interface BaseApiResponse {
  success: boolean;
  data?: any;
  error?: ApiError;
  meta: ResponseMeta;
}

interface SuccessResponse extends BaseApiResponse {
  success: true;
  data: any;
}

interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: ApiError;
}

interface PaginatedResponse extends SuccessResponse {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}
```

### Entity Types
```typescript
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

interface User extends BaseEntity {
  email: string;
  fullName: string;
  studentId?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
}

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

interface Event extends BaseEntity {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: Location;
  isAllDay: boolean;
  userId: string;
}

interface Notification extends BaseEntity {
  type: 'deadline' | 'event' | 'system' | 'class';
  title: string;
  message: string;
  read: boolean;
  userId: string;
  metadata?: Record<string, any>;
}

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

### Error Types
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

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

### Configuration Types
```typescript
interface RouteHandlerConfig {
  authentication?: {
    required?: boolean;
    roles?: string[];
  };
  validation?: {
    schema?: any;
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