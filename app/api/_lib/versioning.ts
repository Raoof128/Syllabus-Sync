import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// API VERSIONING
// ============================================================================

/**
 * Supported API versions
 */
export const API_VERSIONS = {
  V1: 'v1',
  CURRENT: 'v1', // Points to current stable version
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

/**
 * Extract API version from request
 * Supports both URL path versioning (/api/v1/...) and header versioning
 */
export const getApiVersion = (request: NextRequest): ApiVersion => {
  // Check URL path first (e.g., /api/v1/users)
  const urlVersion = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//)?.[1];
  if (urlVersion && Object.values(API_VERSIONS).includes(urlVersion as ApiVersion)) {
    return urlVersion as ApiVersion;
  }

  // Check Accept header (e.g., application/vnd.api.v1+json)
  const acceptHeader = request.headers.get('accept') || '';
  const headerVersion = acceptHeader.match(/application\/vnd\.api\.(\w+)\+json/)?.[1];
  if (headerVersion && Object.values(API_VERSIONS).includes(`v${headerVersion}` as ApiVersion)) {
    return `v${headerVersion}` as ApiVersion;
  }

  // Check custom header
  const customVersion = request.headers.get('x-api-version');
  if (customVersion && Object.values(API_VERSIONS).includes(customVersion as ApiVersion)) {
    return customVersion as ApiVersion;
  }

  // Default to current version
  return API_VERSIONS.CURRENT;
};

/**
 * Check if requested API version is supported
 */
export const isVersionSupported = (version: string): version is ApiVersion => {
  return Object.values(API_VERSIONS).includes(version as ApiVersion);
};

/**
 * API versioning middleware
 */
export const apiVersioning = (supportedVersions: ApiVersion[] = [API_VERSIONS.CURRENT]) => {
  return async (
    request: NextRequest,
    handler: (version: ApiVersion) => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    const version = getApiVersion(request);

    if (!supportedVersions.includes(version)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSUPPORTED_VERSION',
            message: `API version '${version}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            supportedVersions,
          },
        },
        { status: 400 },
      );
    }

    // Add version header to response
    const response = await handler(version);
    const newResponse = new NextResponse(response.body, response);
    newResponse.headers.set('X-API-Version', version);

    return newResponse;
  };
};

/**
 * Version-specific route builder
 */
export const createVersionedRoute = (versions: Record<ApiVersion, () => Promise<NextResponse>>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    return apiVersioning(Object.keys(versions) as ApiVersion[])(request, (version) => {
      return versions[version]();
    });
  };
};

// ============================================================================
// DEPRECATED ENDPOINT HANDLING
// ============================================================================

/**
 * Mark endpoint as deprecated
 */
export const deprecated = (
  message: string = 'This endpoint is deprecated and will be removed in a future version.',
  removalVersion?: string,
) => {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    console.warn(`Deprecated endpoint called: ${request.method} ${request.nextUrl.pathname}`);

    const response = await handler();
    const newResponse = new NextResponse(response.body, response);

    // Add deprecation headers
    newResponse.headers.set('X-Deprecated', 'true');
    newResponse.headers.set('X-Deprecation-Message', message);
    if (removalVersion) {
      newResponse.headers.set('X-Removal-Version', removalVersion);
    }

    return newResponse;
  };
};
