import http from 'k6/http';
import { check } from 'k6';
import { CHAT_URL, defaultScenarios, defaultThresholds } from '../lib/config.js';
import { authenticateUsers, getAuthHeaders } from '../lib/setup.js';

export const options = {
  scenarios: defaultScenarios,
  thresholds: defaultThresholds,
};

export const setup = authenticateUsers;

export default function (data) {
  const user = data.users[__VU % data.users.length];

  const res = http.get(`${CHAT_URL}/users/me/chats`, {
    headers: getAuthHeaders(user),
  });

  check(res, { 'status 200': (r) => r.status === 200 });
}
