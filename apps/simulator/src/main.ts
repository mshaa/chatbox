import { BotManager } from './manager/bot-manager'
import { closeDatabase } from './lib/database'

const botManager = new BotManager()

async function main() {
  console.log('🤖 Chat Simulator Starting...')
  console.log('================================')

  try {
    await botManager.initialize()

    const status = botManager.getStatus()
    console.log(`\nReady to simulate with ${status.totalBots} bot(s)`)
    console.log('================================\n')

    await botManager.start()

    console.log('\n✓ All bots are now active')
    console.log('Press Ctrl+C to stop\n')
  } catch (error) {
    console.error('Failed to start bot manager:', error)
    process.exit(1)
  }
}

async function shutdown() {
  console.log('\n\n🛑 Shutting down...')

  try {
    await botManager.stop()
    await closeDatabase()
    console.log('✓ Shutdown complete')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
