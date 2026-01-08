import { SignUpSchema } from '@chatbox/contracts'
import { createZodDto } from 'nestjs-zod'

export class SignUpDto extends createZodDto(SignUpSchema) {}
