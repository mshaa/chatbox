import http from 'k6/http';
import {
  IDENTITY_URL,
  CHAT_URL,
  SEEDED_USERS,
  SEEDED_PASSWORD,
  jsonHeaders,
} from './config.js';

export function authenticateUsers() {
  const users = [];

  for (const username of SEEDED_USERS) {
    const res = http.post(
      `${IDENTITY_URL}/auth/signin`,
      JSON.stringify({ username, password: SEEDED_PASSWORD }),
      { headers: jsonHeaders }
    );

    if (res.status === 200) {
      const token = res.json('data.access_token');
      if (token) {
        users.push({ username, accessToken: token });
      }
    } else {
      console.warn(`Failed to login ${username}: ${res.status}`);
    }
  }

  if (users.length === 0) {
    throw new Error('No users authenticated');
  }

  console.log(`Setup complete: ${users.length} users authenticated`);
  return { users };
}

export function authenticateUsersWithChats() {
  const { users } = authenticateUsers();

  for (const user of users) {
    const res = http.get(`${CHAT_URL}/users/me/chats`, {
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    if (res.status === 200) {
      user.chats = res.json('data') || [];
    } else {
      console.warn(`Failed to get chats for ${user.username}: ${res.status}`);
      user.chats = [];
    }
  }

  const usersWithChats = users.filter((u) => u.chats.length > 0);
  if (usersWithChats.length === 0) {
    throw new Error('No users with chats found');
  }

  console.log(`Setup complete: ${usersWithChats.length} users with chats`);
  return { users: usersWithChats };
}

export function getAuthHeaders(user) {
  return {
    ...jsonHeaders,
    Authorization: `Bearer ${user.accessToken}`,
  };
}

export function pickRandomChat(user) {
  return user.chats[Math.floor(Math.random() * user.chats.length)];
}
