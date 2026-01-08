export const IDENTITY_URL = __ENV.K6_IDENTITY_URL;
export const CHAT_URL = __ENV.K6_CHAT_URL;

export const SEEDED_USERS = [
  'blazing_phoenix_42',
  'coffee_coder_99',
  'midnight_owl_23',
  'pixel_surfer_88',
  'quantum_fox_17',
  'neon_drifter_55',
  'echo_wanderer_31',
  'storm_chaser_76',
  'velvet_tiger_44',
  'cosmic_pirate_62',
  'amber_knight_19',
  'shadow_rider_08',
  'turbo_penguin_33',
  'frozen_flame_71',
  'chrome_wolf_56',
  'rusty_anchor_14',
  'lunar_spark_90',
  'silver_ghost_27',
  'atomic_mango_65',
  'crimson_haze_48',
];

export const SEEDED_PASSWORD = 'password';

export const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const defaultScenarios = {
  load_10: {
    executor: 'constant-vus',
    vus: 10,
    duration: '10s',
    startTime: '0s',
  },
  load_40: {
    executor: 'constant-vus',
    vus: 40,
    duration: '20s',
    startTime: '10s',
  },
  load_60: {
    executor: 'constant-vus',
    vus: 60,
    duration: '20s',
    startTime: '30s',
  },
};

export const defaultThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<500'],
  'http_reqs{scenario:load_10}': ['rate>0'],
  'http_reqs{scenario:load_40}': ['rate>0'],
  'http_reqs{scenario:load_60}': ['rate>0'],
};
