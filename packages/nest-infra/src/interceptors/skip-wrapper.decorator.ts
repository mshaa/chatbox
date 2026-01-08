import { SetMetadata } from '@nestjs/common'

export const SKIP_WRAPPER_KEY = 'skipWrapper'

/**
 * Decorator to skip the global response wrapper for specific routes
 * Use this for routes that need to return raw responses (e.g., health checks, webhooks)
 *
 * @example
 * @SkipWrapper()
 * @Get('health')
 * health() {
 *   return { status: 'ok' };
 * }
 */
export const SkipWrapper = () => SetMetadata(SKIP_WRAPPER_KEY, true)
