import http from 'k6/http';
import { check } from 'k6';
import { v7 as uuidv7 } from 'https://cdn.jsdelivr.net/npm/uuid@11.0.3/dist/esm-browser/index.js';
import { CHAT_URL, defaultScenarios, jsonHeaders } from './lib/config.js';
import {
  authenticateUsersWithChats,
  getAuthHeaders,
  pickRandomChat,
} from './lib/setup.js';

export const options = {
  scenarios: defaultScenarios,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
    'http_reqs{scenario:load_10}': ['rate>0'],
    'http_reqs{scenario:load_40}': ['rate>0'],
    'http_reqs{scenario:load_60}': ['rate>0'],

    'http_req_failed{scenario:load_10}': ['rate<0.05'],
    'http_req_failed{scenario:load_40}': ['rate<0.05'],
    'http_req_failed{scenario:load_60}': ['rate<0.05'],

    'http_req_duration{step:get_user_chats}': ['p(95)<500'],
    'http_req_duration{step:get_members}': ['p(95)<500'],
    'http_req_duration{step:get_messages}': ['p(95)<500'],
    'http_req_duration{step:send_message}': ['p(95)<500'],
    'http_req_duration{step:mark_read}': ['p(95)<500'],
  },
};

export const setup = authenticateUsersWithChats;

export default function (data) {
  const user = data.users[__VU % data.users.length];
  const authHeaders = getAuthHeaders(user);

  // Get user chats
  let res = http.get(`${CHAT_URL}/users/me/chats`, {
    headers: authHeaders,
    tags: { step: 'get_user_chats' },
  });
  check(res, { 'user chats: status 200': (r) => r.status === 200 });

  // Pick arbitrary room from pre-fetched chats
  const chat = pickRandomChat(user);
  const roomId = chat.roomId;
  const lastReadMessageId = chat.lastReadMessageId;

  // Get room members
  res = http.get(`${CHAT_URL}/rooms/${roomId}/members`, {
    headers: authHeaders,
    tags: { step: 'get_members' },
  });
  check(res, { 'members: status 200': (r) => r.status === 200 });

  // Send message
  const clientMsgId = uuidv7();
  res = http.post(
    `${CHAT_URL}/rooms/${roomId}/messages`,
    JSON.stringify({
      content: `k6 load test ${new Date().toISOString()}`,
      clientMsgId,
    }),
    { headers: authHeaders, tags: { step: 'send_message' } }
  );
  check(res, { 'send message: status 202': (r) => r.status === 202 });

  // Get messages
  res = http.get(`${CHAT_URL}/rooms/${roomId}/messages?limit=20`, {
    headers: authHeaders,
    tags: { step: 'get_messages' },
  });
  check(res, { 'messages: status 200': (r) => r.status === 200 });

  const items = res.json('data.items') || [];
  const lastMessageId = items.length > 0 ? items[0].messageId : null;

  // Mark as read 
  if (lastMessageId && lastMessageId !== lastReadMessageId) {
    res = http.post(
      `${CHAT_URL}/rooms/${roomId}/read`,
      JSON.stringify({ messageId: lastMessageId }),
      { headers: authHeaders, tags: { step: 'mark_read' } }
    );
    check(res, { 'mark read: status 200': (r) => r.status === 200 });
  }
}
