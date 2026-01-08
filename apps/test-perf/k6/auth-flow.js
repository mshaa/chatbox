import http from 'k6/http';
import { sleep, check } from 'k6';
import { IDENTITY_URL, SEEDED_PASSWORD, jsonHeaders } from './lib/config.js';

export const options = {
  scenarios: {
    warmup: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
    load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      startTime: '10s', 
      stages: [
        { duration: '20s', target: 10 },
        { duration: '20s', target: 15 },
      ],
    },
  },
  thresholds: {
    'http_req_failed{scenario:load}': ['rate<0.01'],
    'http_req_duration{scenario:load}': ['p(95)<500'],
    'iterations{scenario:load}': ['rate>0'],
  },
};

function generateUser() {
  const id = Math.floor(Math.random() * 1000000);
  return {
    username: `perf_user_${id}_${Date.now()}`,
    password: SEEDED_PASSWORD,
  };
}

export default function () {
  const user = generateUser();

  // Sign up
  let res = http.post(`${IDENTITY_URL}/auth/signup`, JSON.stringify(user), {
    headers: jsonHeaders,
  });
  check(res, { 'signup: status 201': (r) => r.status === 201 });

  const signupBody = res.json();
  let accessToken = signupBody?.data?.access_token;
  let refreshToken = signupBody?.data?.refresh_token;

  if (!accessToken || !refreshToken) {
    console.error(`Signup failed: ${res.status} - ${res.body}`);
    return;
  }

  sleep(0.5);

  // Refresh token
  res = http.post(
    `${IDENTITY_URL}/auth/refresh`,
    JSON.stringify({ refresh_token: refreshToken }),
    { headers: jsonHeaders }
  );
  check(res, { 'refresh: status 200': (r) => r.status === 200 });

  const refreshBody = res.json();
  accessToken = refreshBody?.data?.access_token;
  refreshToken = refreshBody?.data?.refresh_token;

  if (!accessToken || !refreshToken) {
    console.error(`Refresh failed: ${res.status} - ${res.body}`);
    return;
  }

  sleep(0.5);

  // Get socket token
  res = http.post(`${IDENTITY_URL}/auth/token/chat`, null, {
    headers: { ...jsonHeaders, Authorization: `Bearer ${accessToken}` },
  });
  check(res, { 'socket token: status 200': (r) => r.status === 200 });

  sleep(0.5);

  // Logout
  res = http.post(
    `${IDENTITY_URL}/auth/logout`,
    JSON.stringify({ refresh_token: refreshToken }),
    { headers: jsonHeaders }
  );
  check(res, { 'logout: status 204': (r) => r.status === 204 });
}
