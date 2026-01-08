import { SignInSchema } from '@chatbox/contracts'
import { createZodDto } from 'nestjs-zod'

export class SignInDto extends createZodDto(SignInSchema) {}
