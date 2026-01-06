# Syllabus Sync API Documentation

## Overview

The Syllabus Sync API provides RESTful endpoints for managing academic units, deadlines, notifications, and events. All endpoints require authentication and return consistent JSON responses.

## Authentication

All API endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": <response_data>,
  "meta": {
    "timestamp": "2024-01-03T10:30:00.000Z",
    "requestId": "req_1704275400000_abc123",
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "code": ["Unit code must be in format AAA123"]
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-03T10:30:00.000Z"
  }
}
```

## Error Codes

- `BAD_REQUEST`: Invalid request format or parameters
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `DATABASE_ERROR`: Database operation failed

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- 100 requests per 15 minutes per IP address
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the window resets

## Units API

### GET /api/units

List units with their schedules.

**Query Parameters:**

- `search` (optional): Search in unit code or name
- `limit` (optional): Maximum results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (`code`, `name`, `created_at`; default: `created_at`)
- `sortOrder` (optional): Sort order (`asc`, `desc`; default: `desc`)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "CSC101",
      "name": "Introduction to Computer Science",
      "color": "#3B82F6",
      "location": {
        "building": "Engineering Building",
        "room": "E101"
      },
      "schedule": [
        {
          "id": "uuid",
          "day": "Monday",
          "startTime": "09:00",
          "endTime": "11:00"
        }
      ],
      "createdAt": "2024-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

### POST /api/units

Create a new unit with schedule.

**Request Body:**

```json
{
  "code": "CSC101",
  "name": "Introduction to Computer Science",
  "color": "#3B82F6",
  "location": {
    "building": "Engineering Building",
    "room": "E101"
  },
  "schedule": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "11:00"
    },
    {
      "day": "Wednesday",
      "startTime": "09:00",
      "endTime": "11:00"
    }
  ]
}
```

**Response:** Created unit object with schedule.

### GET /api/units/[id]

Get a specific unit by ID.

**Response:** Unit object with schedule.

### PUT /api/units/[id]

Update a specific unit.

**Request Body:** Partial unit object (same as POST).

**Response:** Updated unit object.

### DELETE /api/units/[id]

Delete a specific unit.

**Response:** Empty success response.

## Deadlines API

### GET /api/deadlines

List deadlines with filtering and pagination.

**Query Parameters:**

- `unitCode` (optional): Filter by unit code
- `completed` (optional): Filter by completion status
- `upcoming` (optional): Get only upcoming deadlines (true/false)
- `limit`, `offset`, `sortBy`, `sortOrder`: Same as units

### POST /api/deadlines

Create a new deadline.

**Request Body:**

```json
{
  "title": "Assignment 1",
  "description": "Database design assignment",
  "unitCode": "CSC101",
  "dueDate": "2024-02-15T23:59:59.000Z",
  "completed": false
}
```

## Notifications API

### GET /api/notifications

List notifications with filtering.

**Query Parameters:**

- `type` (optional): Filter by notification type (`deadline`, `event`, `class`, `system`)
- `read` (optional): Filter by read status
- `limit`, `offset`: Pagination

### POST /api/notifications

Create a notification.

### PUT /api/notifications/mark-all-read

Mark all notifications as read.

## Events API

### GET /api/events

List upcoming events.

**Query Parameters:**

- `limit`, `offset`: Pagination

## Versioning

The API supports versioning via:

- URL path: `/api/v1/units`
- Accept header: `application/vnd.api.v1+json`
- Custom header: `X-API-Version: v1`

Current stable version: `v1`

## SDKs and Examples

### JavaScript/TypeScript

```javascript
// Create a unit
const response = await fetch('/api/units', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    code: 'CSC101',
    name: 'Introduction to Computer Science',
    color: '#3B82F6',
    location: { building: 'Eng', room: '101' },
    schedule: [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
      },
    ],
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Unit created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Support

For API support or questions, please refer to the application documentation or contact the development team.
