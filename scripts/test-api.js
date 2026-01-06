#!/usr/bin/env node

/**
 * API Testing Script for Syllabus Sync
 *
 * This script tests all API endpoints to ensure they work correctly
 * with the new backend API patterns.
 *
 * Usage: node scripts/test-api.js [baseUrl]
 * Example: node scripts/test-api.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Mock authentication token (replace with real token in production)
const AUTH_TOKEN = process.env.SUPABASE_ANON_KEY || 'mock-token-for-testing';

const API_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

function maskToken(token) {
  if (!token) return '[none]';
  if (typeof token !== 'string') return '[REDACTED]';
  if (token.length <= 12) return '[REDACTED]';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: API_HEADERS,
    ...options,
  };

  console.log(`\n📡 ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (response.ok) {
      console.log(`✅ ${response.status} - Success`);
      return { success: true, status: response.status, data };
    } else {
      console.log(`❌ ${response.status} - ${data?.error?.message || 'Unknown error'}`);
      return { success: false, status: response.status, data };
    }
  } catch (error) {
    console.log(`💥 Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function assertSuccess(result, description) {
  if (result.success) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${result.error || 'Request failed'}`);
    return false;
  }
}

function assertResponseFormat(result, expectedFields = []) {
  if (!result.success || !result.data) return false;

  const hasRequiredFields = ['success', 'data', 'meta'].every((field) => field in result.data);
  const hasTimestamp = result.data.meta?.timestamp;
  const hasExpectedFields = expectedFields.every((field) => field in result.data.data);

  return hasRequiredFields && hasTimestamp && hasExpectedFields;
}

// ============================================================================
// TEST CASES
// ============================================================================

async function testHealthCheck() {
  console.log('\n🏥 Testing API Health Check...');

  const result = await makeRequest('/api/health');
  if (result.success) {
    console.log('✅ API is healthy');
  } else {
    console.log('⚠️  Health check endpoint not found (expected for now)');
  }
}

async function testUnitsAPI() {
  console.log('\n📚 Testing Units API...');

  // Test GET units (should return empty or existing units)
  const getUnitsResult = await makeRequest('/api/units');
  assertSuccess(getUnitsResult, 'GET /api/units returns data');

  if (getUnitsResult.success) {
    const isValidFormat = assertResponseFormat(getUnitsResult, ['length']);
    console.log(`${isValidFormat ? '✅' : '❌'} Response format is valid`);
  }

  // Test POST unit (create new unit)
  const newUnit = {
    code: 'TEST101',
    name: 'Test Unit for API Testing',
    color: '#FF6B6B',
    location: {
      building: 'Test Building',
      room: 'T101',
    },
    schedule: [
      {
        day: 'Monday',
        startTime: '10:00',
        endTime: '12:00',
      },
    ],
  };

  const createUnitResult = await makeRequest('/api/units', {
    method: 'POST',
    body: JSON.stringify(newUnit),
  });

  let createdUnitId = null;
  if (assertSuccess(createUnitResult, 'POST /api/units creates unit')) {
    createdUnitId = createUnitResult.data?.data?.id;
    const isValidFormat = assertResponseFormat(createUnitResult);
    console.log(`${isValidFormat ? '✅' : '❌'} Response format is valid`);
  }

  // Test validation errors
  const invalidUnit = {
    code: 'invalid',
    name: '',
    color: 'not-a-color',
  };

  const invalidResult = await makeRequest('/api/units', {
    method: 'POST',
    body: JSON.stringify(invalidUnit),
  });

  if (!invalidResult.success && invalidResult.status === 400) {
    console.log('✅ Validation correctly rejects invalid data');
  } else {
    console.log('❌ Validation should reject invalid data');
  }

  // Test GET specific unit (if we created one)
  if (createdUnitId) {
    const getUnitResult = await makeRequest(`/api/units/${createdUnitId}`);
    assertSuccess(getUnitResult, `GET /api/units/${createdUnitId} returns unit`);

    // Test PUT update
    const updateData = {
      name: 'Updated Test Unit Name',
    };

    const updateResult = await makeRequest(`/api/units/${createdUnitId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    assertSuccess(updateResult, `PUT /api/units/${createdUnitId} updates unit`);
  }
}

async function testDeadlinesAPI() {
  console.log('\n⏰ Testing Deadlines API...');

  // Test GET deadlines
  const getDeadlinesResult = await makeRequest('/api/deadlines');
  assertSuccess(getDeadlinesResult, 'GET /api/deadlines returns data');

  // Test POST deadline
  const newDeadline = {
    title: 'Test Deadline',
    description: 'Testing deadline creation',
    unitCode: 'TEST101',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    completed: false,
  };

  const createDeadlineResult = await makeRequest('/api/deadlines', {
    method: 'POST',
    body: JSON.stringify(newDeadline),
  });

  assertSuccess(createDeadlineResult, 'POST /api/deadlines creates deadline');
}

async function testNotificationsAPI() {
  console.log('\n🔔 Testing Notifications API...');

  // Test GET notifications
  const getNotificationsResult = await makeRequest('/api/notifications');
  assertSuccess(getNotificationsResult, 'GET /api/notifications returns data');

  // Test POST notification
  const newNotification = {
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'system',
    read: false,
  };

  const createNotificationResult = await makeRequest('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(newNotification),
  });

  assertSuccess(createNotificationResult, 'POST /api/notifications creates notification');

  // Test mark all read
  const markReadResult = await makeRequest('/api/notifications/mark-all-read', {
    method: 'PUT',
  });

  assertSuccess(markReadResult, 'PUT /api/notifications/mark-all-read works');
}

async function testEventsAPI() {
  console.log('\n📅 Testing Events API...');

  const getEventsResult = await makeRequest('/api/events');
  assertSuccess(getEventsResult, 'GET /api/events returns data');
}

async function testRateLimiting() {
  console.log('\n🛡️  Testing Rate Limiting...');

  // Make multiple requests quickly
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('/api/units'));
  }

  const results = await Promise.all(promises);
  const rateLimited = results.some((result) => !result.success && result.status === 429);

  if (rateLimited) {
    console.log('✅ Rate limiting is working');
  } else {
    console.log('⚠️  Rate limiting not triggered (may be expected in test environment)');
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');

  // Test 404
  const notFoundResult = await makeRequest('/api/nonexistent');
  if (notFoundResult.status === 404) {
    console.log('✅ 404 errors handled correctly');
  } else {
    console.log('❌ 404 errors not handled properly');
  }

  // Test invalid JSON
  const invalidJsonResult = await makeRequest('/api/units', {
    method: 'POST',
    body: 'invalid json',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!invalidJsonResult.success) {
    console.log('✅ Invalid JSON handled correctly');
  } else {
    console.log('❌ Invalid JSON should be rejected');
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Syllabus Sync API Tests');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${maskToken(AUTH_TOKEN)}`);

  const startTime = Date.now();

  try {
    await testHealthCheck();
    await testUnitsAPI();
    await testDeadlinesAPI();
    await testNotificationsAPI();
    await testEventsAPI();
    await testRateLimiting();
    await testErrorHandling();

    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(50));
    console.log(`✅ All tests completed in ${duration}ms`);
    console.log('Check the output above for detailed results.');
  } catch (error) {
    console.error('\n💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, makeRequest, maskToken };
