import { BaseUserFull } from '@chatbox/contracts'
import * as schema from '@chatbox/persistence/schema'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { type DrizzleDatabase, DrizzleProviderToken } from '../providers/drizzle.provider'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(@Inject(DrizzleProviderToken) private readonly db: DrizzleDatabase) {}

  async createUser(newUser: BaseUserFull): Promise<BaseUserFull> {
    this.logger.debug({ user: newUser }, 'Creating new user')
    const r = await this.db
      .insert(schema.users)
      .values({ ...newUser })
      .returning()
    this.logger.debug({ userId: r[0].userId }, 'User created')
    return r[0]
  }

  async findUserByUsername(username: string): Promise<BaseUserFull | undefined> {
    this.logger.debug({ username }, 'Finding user by username')
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.username, username),
    })
    this.logger.debug({ username, found: !!user }, 'User search by username complete')
    return user
  }

  async findUserById(userId: string): Promise<BaseUserFull | undefined> {
    this.logger.debug({ userId }, 'Finding user by ID')
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.userId, userId),
    })
    this.logger.debug({ userId, found: !!user }, 'User search by ID complete')
    return user
  }
}
