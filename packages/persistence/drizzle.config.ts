import type { Config } from 'drizzle-kit'
import { getServerConfig } from '@chatbox/config/server'

const config = getServerConfig()

export default {
  dialect: 'postgresql',
  schema: './src/schema/tables.ts',
  out: './migrations',
  dbCredentials: {
    url: config.PERSISTENCE_STORAGE_URL,
  },
} satisfies Config
