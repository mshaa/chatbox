import { getSimulatorConfig } from '@chatbox/config/simulator'

let _simulatorConfig: SimulatorConfig | undefined

function createSimulatorConfig() {
  const parsedConfig = getSimulatorConfig()
  return {
    identityUrl: `${parsedConfig.IDENTITY_PROTOCOL}://${parsedConfig.IDENTITY_HOST}:${parsedConfig.IDENTITY_PORT}`,
    chatUrl: `${parsedConfig.CHAT_PROTOCOL}://${parsedConfig.CHAT_HOST}:${parsedConfig.CHAT_PORT}`,
    chatWebsocketUrl: parsedConfig.CHAT_WEBSOCKET_URL,
    chatWebsocketPath: parsedConfig.CHAT_WEBSOCKET_PATH,
    databaseUrl: parsedConfig.PERSISTENCE_STORAGE_URL,

    maxBots: parsedConfig.SIMULATOR_MAX_BOTS,

    minMessageInterval: parsedConfig.SIMULATOR_MIN_MESSAGE_INTERVAL_MS,
    maxMessageInterval: parsedConfig.SIMULATOR_MAX_MESSAGE_INTERVAL_MS,

    responseChance: parsedConfig.SIMULATOR_RESPONSE_CHANCE,
    typingIndicatorChance: parsedConfig.SIMULATOR_TYPING_INDICATOR_CHANCE,

    minTypingDuration: parsedConfig.SIMULATOR_MIN_TYPING_DURATION_MS,
    maxTypingDuration: parsedConfig.SIMULATOR_MAX_TYPING_DURATION_MS,

    activeHoursStart: parsedConfig.SIMULATOR_ACTIVE_HOURS_START,
    activeHoursEnd: parsedConfig.SIMULATOR_ACTIVE_HOURS_END,

    preSelectedRoom: parsedConfig.SIMULATOR_PRE_SELECTED_ROOM,

    botDistribution: {
      activeChatter: parsedConfig.SIMULATOR_BOT_DIST_ACTIVE_CHATTER,
      casualUser: parsedConfig.SIMULATOR_BOT_DIST_CASUAL_USER,
      lurker: parsedConfig.SIMULATOR_BOT_DIST_LURKER,
      dmEnthusiast: parsedConfig.SIMULATOR_BOT_DIST_DM_ENTHUSIAST,
    },
  }
}

export function getSimulatorAppConfig(): SimulatorConfig {
  if (!_simulatorConfig) {
    _simulatorConfig = createSimulatorConfig()
  }
  return _simulatorConfig
}

export type SimulatorConfig = ReturnType<typeof createSimulatorConfig>
