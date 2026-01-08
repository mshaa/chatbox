import { API_ROUTES } from '@chatbox/contracts'
import { getSeedData, seed } from '@chatbox/persistence/seed'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { v7 } from 'uuid'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { IdentityModule } from '../src/identity.module'

describe('Identity (e2e)', () => {
  let app: INestApplication
  let seedData: Awaited<ReturnType<typeof getSeedData>>

  beforeAll(async () => {
    seedData = await seed()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IdentityModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    await app.listen(0)
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /auth/signup -> should sign up a new user and return an access token', async () => {
    const username = `test-signup-user-${v7()}`
    const password = 'password'

    const response = await request(app.getHttpServer())
      .post(API_ROUTES.AUTH.SIGNUP)
      .send({ username, password })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()
    expect(response.body.data).toHaveProperty('access_token')
    expect(typeof response.body.data.access_token).toBe('string')
  })

  it('POST /auth/signin -> should log in an existing seed user and return an access token', async () => {
    const userToLogin = seedData.users[0]
    const password = 'password'

    const response = await request(app.getHttpServer())
      .post(API_ROUTES.AUTH.SIGNIN)
      .send({ username: userToLogin.username, password })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()
    expect(response.body.data).toHaveProperty('access_token')
    expect(typeof response.body.data.access_token).toBe('string')
  })

  it('POST /auth/signin -> should fail to log in with an incorrect password', async () => {
    const userToLogin = seedData.users[1]

    await request(app.getHttpServer())
      .post(API_ROUTES.AUTH.SIGNIN)
      .send({ username: userToLogin.username, password: 'wrongpassword' })
      .expect(401)
  })

  it('POST /auth/signup -> should fail to sign up a user that already exists', async () => {
    const userToLogin = seedData.users[2]
    const password = 'password'

    await request(app.getHttpServer())
      .post(API_ROUTES.AUTH.SIGNUP)
      .send({ username: userToLogin.username, password })
      .expect(401)
  })
})
