// Artillery custom processor for Syllabus Sync API testing
// Handles authentication token management and response processing

module.exports = {
  // Process incoming responses
  processResponse: (req, res, metrics) => {
    const { statusCode } = res;

    if (statusCode >= 200 && statusCode < 300) {
      metrics.success++;

      // Record response time
      const responseTime = Date.now() - req.startTime;
      metrics.responseTimes.push(responseTime);
    } else {
      metrics.errors++;
    }

    return {
      statusCode,
      responseTime: Date.now() - req.startTime,
      timestamp: new Date().toISOString(),
    };
  },

  // Setup initial metrics collection
  beforeScenario: (scenario, events) => {
    events.onStart = () => {
      console.log(`🚀 Starting scenario: ${scenario.name}`);
    };

    events.onRequest = (req, res) => {
      req.startTime = Date.now();
      console.log(`📤 ${req.method} ${req.url}`);
    };

    events.onResponse = (req, res, metrics) => {
      const processed = module.exports.processResponse(req, res, metrics);
      console.log(
        `📥 ${req.method} ${req.url} - ${processed.statusCode} (${processed.responseTime}ms)`,
      );
    };

    events.onComplete = (scenario, events, metrics) => {
      const duration = Date.now() - scenario.startTime;
      const avgResponseTime =
        metrics.responseTimes.length > 0
          ? metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
            metrics.responseTimes.length
          : 0;

      const requestsPerSecond = metrics.success / (duration / 1000);

      console.log(`✅ Scenario completed: ${scenario.name}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`   Requests: ${metrics.success}`);
      console.log(`   Errors: ${metrics.errors}`);
      console.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);

      // Performance evaluation
      if (avgResponseTime > 300) {
        console.log(`⚠️  High response time: ${avgResponseTime}ms`);
      }

      if (metrics.errors > 0) {
        console.log(
          `❌ Error rate: ${((metrics.errors / metrics.success) * 100).toFixed(2)}%`,
        );
      }
    };
  },

  // Generate CSRF token for protected requests
  createCSRFToken: () => {
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
  },

  // Generate random data for testing
  generateRandomUnit: () => {
    return {
      id: `unit-${Date.now()}`,
      code: `COMP${Math.floor(Math.random() * 9999)}`,
      name: `Load Test Unit ${Date.now()}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      description: `Load test unit generated at ${new Date().toISOString()}`,
      location: {
        building: "C5C",
        room: `${Math.floor(Math.random() * 300) + 1}`,
      },
    };
  },

  generateRandomDeadline: () => {
    const now = new Date();
    const dueDate = new Date(
      now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
    ); // Random date in next 7 days
    const priorities = ["Low", "Medium", "High", "Urgent"];
    const types = ["Assignment", "Exam", "Quiz", "Presentation"];

    return {
      id: `deadline-${Date.now()}`,
      title: `Load Test Deadline ${Date.now()}`,
      description: `Load test deadline generated at ${now.toISOString()}`,
      due_date: dueDate.toISOString(),
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type: types[Math.floor(Math.random() * types.length)],
      completed: false,
      unit_code: "COMP2310",
    };
  },

  getRandomUnitId: () => {
    // This would typically query from actual data
    // For load testing, we'll use a predefined UUID
    return "123e4567-e89b-12d3-a456-426614174000";
  },

  getRandomDeadlineId: () => {
    return "123e4567-e89b-12d3-a456-426614174001";
  },
};
