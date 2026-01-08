import http from 'k6/http';
import { check } from 'k6';
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

  const res = http.get(`${CHAT_URL}/rooms/${chat.roomId}/messages?limit=20`, {
    headers: getAuthHeaders(user),
  });

  check(res, { 'status 200': (r) => r.status === 200 });
}
