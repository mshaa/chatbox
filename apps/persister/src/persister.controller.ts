import { API_ROUTES } from '@chatbox/contracts'
import { Controller, Get, HttpCode } from '@nestjs/common'

@Controller()
export class PersisterController {
  @Get(API_ROUTES.HEALTH)
  @HttpCode(204)
  health(): void {
  }
}
