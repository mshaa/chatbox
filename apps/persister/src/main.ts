import { AppLogger } from '@chatbox/nest-infra'
import { NestFactory } from '@nestjs/core'
import { PersisterModule } from './persister.module'

async function bootstrap() {
  const app = await NestFactory.create(PersisterModule, {
    bufferLogs: false,
  })
  app.useLogger(app.get(AppLogger))

  process.on('SIGINT', async () => {
    await app.close()
    process.exit(0)
  })

  await app.listen(3003)
}
void bootstrap()
