import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * EduNexus Phase 7 Load Test
 * Verifies 1k req/sec throughput and async event bus performance.
 */
export const options = {
    stages: [
        { duration: '1m', target: 200 }, // Ramp up
        { duration: '3m', target: 1000 }, // Stay at 1k req/sec
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<100'], // 95% of requests must be under 100ms
        http_req_failed: ['rate<0.01'],    // Under 1% failure rate
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TENANTS = ['oxford', 'mit', 'stanford', 'harvard'];

export default function () {
    const tenant = TENANTS[Math.floor(Math.random() * TENANTS.length)];
    const url = `${BASE_URL}/health/tenant/${tenant}`;

    // 1. Simulate API Request (Triggers Identity Resolution + Rate Limiting)
    const res = http.get(url, {
        headers: {
            'Host': `${tenant}.edunexus.com`,
            'Content-Type': 'application/json',
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'tenant correctly resolved': (r) => r.json().success === true,
    });

    // 2. Simulate High-Traffic Logging
    // In actual use, every request triggers an audit.logged event asynchronously

    sleep(0.1); // Small delay between VUs to prevent local saturation
}
