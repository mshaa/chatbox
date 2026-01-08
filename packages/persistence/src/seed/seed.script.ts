import { getServerConfig } from '@chatbox/config/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema/tables'
import { getSeedData } from './seed.data'
import { getFullSeedData } from './seed-full.data'

export type SeedSource = 'default' | 'full'

const seedDataProviders: Record<SeedSource, () => ReturnType<typeof getSeedData>> = {
  default: getSeedData,
  full: getFullSeedData,
}

export const seed = async (source: SeedSource = 'default', wipe: boolean = true) => {
  const config = getServerConfig()
  const client = postgres(config.PERSISTENCE_STORAGE_URL, {
    ssl: false,
    prepare: false,
  })
  const db = drizzle(client, { schema })

  try {
    if (wipe) {
      console.log('Wiping data...')
      await db.delete(schema.roomUsers)
      await db.delete(schema.messages)
      await db.delete(schema.rooms)
      await db.delete(schema.users)
    }

    console.log(`Start seeding (source: ${source})...`)

    const provider = seedDataProviders[source]
    const seedData = await provider()

    await db.insert(schema.users).values(seedData.users)
    await db.insert(schema.rooms).values(seedData.rooms)
    await db.insert(schema.roomUsers).values(seedData.roomUsers)
    await db.insert(schema.messages).values(seedData.messages)

    console.log('Seeding finished.')
    return seedData
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  } finally {
    console.log('Closing connection.')
    await client.end()
  }
}
