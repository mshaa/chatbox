import { AppLogger, IdentityConfig, identityConfig, SecurityConfig, securityConfig } from '@chatbox/nest-infra'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { IdentityModule } from './identity.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(IdentityModule, { bufferLogs: false, bodyParser: false })
  app.useLogger(app.get(AppLogger))

  // Trust proxy for correct client IP behind Traefik
  app.set('trust proxy', 1)

  const config = app.get<IdentityConfig>(identityConfig.KEY)
  const securityConf: SecurityConfig = app.get(securityConfig.KEY)

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  )

  app.useBodyParser('json', { limit: securityConf.bodySizeLimit })
  app.useBodyParser('urlencoded', { extended: true, limit: securityConf.bodySizeLimit })

  process.on('SIGINT', async () => {
    await app.close()
    process.exit(0)
  })

  await app.listen(config.port)
}

void bootstrap()
