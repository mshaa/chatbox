import { persistenceConfig, type PersistenceConfig } from '@chatbox/nest-infra'
import * as schema from '@chatbox/persistence/schema'
import { Inject, Injectable, InjectionToken, OnApplicationShutdown } from '@nestjs/common'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { Sql } from 'postgres'

export const DrizzleProviderToken: InjectionToken = Symbol('DRIZZLE_CLIENT')

export type DrizzleDatabase = PostgresJsDatabase<typeof schema>

@Injectable()
export class DrizzleService implements OnApplicationShutdown {
  public readonly db: PostgresJsDatabase<typeof schema>
  public readonly client: Sql

  constructor(
    @Inject(persistenceConfig.KEY)
    config: PersistenceConfig,
  ) {
    this.client = postgres(config.storageUrl, {
      max: config.poolMax,
      ssl: false,
    })
    this.db = drizzle(this.client, { schema, logger: config.loggerEnabled })
  }

  async onApplicationShutdown() {
    await this.client.end()
  }
}

export const DrizzleProvider = {
  provide: DrizzleProviderToken,
  useFactory: (drizzleService: DrizzleService) => drizzleService.db,
  inject: [DrizzleService],
}