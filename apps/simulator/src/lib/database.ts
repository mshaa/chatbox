import { drizzle } from 'drizzle-orm/postgres-js'
import postgres, { Sql } from 'postgres'
import * as schema from '@chatbox/persistence/schema'
import { getSimulatorAppConfig } from '../config/simulator.config'

let db: ReturnType<typeof drizzle> | null = null
let client: Sql | null = null

export function getDatabase() {
  if (!db) {
    const config = getSimulatorAppConfig()
    client = postgres(config.databaseUrl, {
      prepare: false,
    })
    db = drizzle(client, { schema })
  }
  return db
}

export async function closeDatabase() {
  if (client) {
    await client.end()
    db = null
    client = null
  }
}
