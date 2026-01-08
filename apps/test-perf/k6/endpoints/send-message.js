import http from 'k6/http';
import { check } from 'k6';
import { v7 as uuidv7 } from 'https://cdn.jsdelivr.net/npm/uuid@11.0.3/dist/esm-browser/index.js';
import { CHAT_URL, defaultScenarios, defaultThresholds } from '../lib/config.js';
import {
  authenticateUsersWithChats,
  getAuthHeaders,
  pickRandomChat,
} from '../lib/setup.js';

export const options = {
  scenarios: defaultScenarios,
  thresholds: defaultThresholds,
};

export const setup = authenticateUsersWithChats;

export default function (data) {
  const user = data.users[__VU % data.users.length];
  const chat = pickRandomChat(user);

  const res = http.post(
    `${CHAT_URL}/rooms/${chat.roomId}/messages`,
    JSON.stringify({
      content: `k6 load test ${new Date().toISOString()}`,
      clientMsgId: uuidv7(),
    }),
    { headers: getAuthHeaders(user) }
  );

  check(res, { 'status 202': (r) => r.status === 202 });
}
