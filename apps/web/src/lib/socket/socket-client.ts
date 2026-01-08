import { getWebConfig } from '@chatbox/config/web'
import { ClientEvents, ServerEvents } from '@chatbox/contracts'
import { SocketOptions } from 'dgram'
import { io, ManagerOptions, Socket } from 'socket.io-client'

export function createSocketClient(
  options: Partial<ManagerOptions & SocketOptions>,
): Socket<ServerEvents, ClientEvents> {
  const config = getWebConfig()
  return io(config.NEXT_PUBLIC_WEBSOCKET_URL, {
    ...options,
    path: config.NEXT_PUBLIC_WEBSOCKET_PATH,
  })
}
