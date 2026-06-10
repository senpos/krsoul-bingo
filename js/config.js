export const STORAGE_KEYS = {
  boards: 'krsoul-bingo-boards-v3',
  activeBoard: 'krsoul-bingo-active-board-v3',
  emoteSourceCache: 'krsoul-bingo-emote-source-cache-v2',
  twitchUserId: 'krsoul-bingo-twitch-user-id-v1',
  twitchUserIds: 'krsoul-bingo-twitch-user-ids-v1',
  twitchChannelNames: 'krsoul-bingo-channel-names-v1',
  chatFontSize: 'krsoul-bingo-chat-font-size-v1',
  chatHistory: 'krsoul-bingo-chat-history-v1',
  chatHiddenBots: 'krsoul-bingo-chat-hidden-bots-v1',
  chatShowBots: 'krsoul-bingo-chat-show-bots-v1',
  chatShowBadges: 'krsoul-bingo-chat-show-badges-v1',
  chatShowTimestamps: 'krsoul-bingo-chat-show-timestamps-v1',
  audioPlaylistOpen: 'krsoul-bingo-audio-playlist-open-v1'
};

export const DEFAULT_TWITCH_USER_IDS = ['55947428'];
export const DEFAULT_TWITCH_CHANNEL_NAMES = { '55947428': 'krsoul' };
export const EMOTE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const EMOTE_CACHE_FAIL_TTL_MS = 10 * 60 * 1000;

export const DEFAULT_CHAT_HIDDEN_BOTS = [
  'streamelements', 'streamlabs', 'moobot', 'ankhbot', 'nightbot'
];

export function generateBoardId() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/*
  Twitch App Setup:
  1. Go to https://dev.twitch.tv/console/apps → Register Your Application
  2. Name: "KRSoul Bingo" (or whatever)
  3. OAuth Redirect URLs: Add your site URL(s), e.g.:
     - https://krsoul-bingo.pages.dev (production)
     - http://localhost:8788 (local dev)
  4. Category: Application Integration
  5. Client Type: **Confidential** (implicit grant works with Confidential — no secret needed in the flow)
  6. Create → copy the **Client ID** and paste it below
*/
export const TWITCH_CLIENT_ID = 'sb3vf6ecay6zupt0tnqkiqww2adm9j';

export function getTwitchRedirectUri() {
  return window.location.href.split('?')[0].split('#')[0].replace(/\/$/, '');
}

export const PARTICLE_LIMITS = {
  maxParticles: 150,
  maxParticlesBingo: 300,
  densityArea: 800
};

export const PARTICLE_THEME_OPTIONS = {
  twice: {
    particles: {
      number: { value: 100, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff7f00', '#ff007f', '#ffd3f0'] },
      shape: { type: ['circle', 'star'], stroke: { width: 0 } },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0.1, sync: false } },
      size: { value: 5, random: true, anim: { enable: true, speed: 4.0, size_min: 2, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 2.5, direction: 'none', random: true, straight: false, out_mode: 'bounce', bounce: true }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: true, mode: 'repulse' }, resize: true },
      modes: { bubble: { distance: 150, size: 10, duration: 0.4, opacity: 0.8 }, repulse: { distance: 200, duration: 0.4 } }
    },
    retina_detect: true
  },
  aespa: {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 900 } },
      color: { value: ['#00ffff', '#d900ff', '#5500ff'] },
      shape: { type: ['polygon', 'edge'], stroke: { width: 0 }, polygon: { nb_sides: 6 } },
      opacity: { value: 0.35, random: false, anim: { enable: false } },
      size: { value: 3, random: true, anim: { enable: false } },
      line_linked: { enable: true, distance: 130, color: '#00ffff', opacity: 0.25, width: 1 },
      move: { enable: true, speed: 1.5, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { grab: { distance: 220, line_linked: { opacity: 0.6 } }, push: { particles_nb: 5 } }
    },
    retina_detect: true
  },
  nmixx: {
    particles: {
      number: { value: 110, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff0055', '#0033ff', '#00ffcc', '#ffffff'] },
      shape: { type: ['polygon', 'circle', 'triangle', 'star'], stroke: { width: 0 }, polygon: { nb_sides: 5 } },
      opacity: { value: 0.4, random: true, anim: { enable: true, speed: 2.0, opacity_min: 0.1, sync: false } },
      size: { value: 4, random: true, anim: { enable: true, speed: 5.0, size_min: 1, sync: false } },
      line_linked: { enable: true, distance: 100, color: '#00ffcc', opacity: 0.15, width: 1 },
      move: { enable: true, speed: 4, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.2 }, push: { particles_nb: 8 } }
    },
    retina_detect: true
  },
  newjeans: {
    particles: {
      number: { value: 50, density: { enable: true, value_area: 800 } },
      color: { value: ['#ffee00', '#0055ff', '#ffffff'] },
      shape: { type: 'circle', stroke: { width: 0 } },
      opacity: { value: 0.4, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
      size: { value: 10, random: true, anim: { enable: true, speed: 1.0, size_min: 4, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 0.8, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: true, mode: 'repulse' }, resize: true },
      modes: { bubble: { distance: 200, size: 15, duration: 1, opacity: 0.6 }, repulse: { distance: 150, duration: 0.8 } }
    },
    retina_detect: true
  },
  lesserafim: {
    particles: {
      number: { value: 130, density: { enable: true, value_area: 800 } },
      color: { value: ['#ff0000', '#ffb3b3', '#ffffff'] },
      shape: { type: 'circle', stroke: { width: 0 } },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0.1, sync: false } },
      size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.5, sync: false } },
      line_linked: { enable: false },
      move: { enable: true, speed: 3, direction: 'top', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'window',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 120, duration: 0.3 }, push: { particles_nb: 8 } }
    },
    retina_detect: true
  }
};

export const BINGO_EMOJIS = {
  twice:      ['🎉', '🎊', '🥳', '💖', '🌟', '✨', '💫', '🎀'],
  aespa:      ['⚡', '💎', '🔮', '✨', '💜', '🌌', '🎆', '🎇'],
  nmixx:      ['🎉', '🌊', '🔥', '✨', '💎', '⭐', '🎆', '🎊'],
  newjeans:   ['🐰', '🎀', '🌸', '✨', '💫', '🎶', '🌼', '💝'],
  lesserafim: ['🔥', '⚔️', '🦅', '✨', '💫', '⭐', '🎆', '🖤'],
};

export const THEMES = Object.keys(PARTICLE_THEME_OPTIONS);
export const DEFAULT_THEME = 'nmixx';

export const DEFAULT_CARDS = [
  '💀 DeS on PC', '🩸 Bloodborne', '⚡ GoW 3', '🔥 New Fromsoft Game', '🗡️ DS2/3 Remaster',
  '⚔️ FFVII Part 3', '🚗 GTA 6', '🎭 Persona 6', '🏹 Warhorse New Game', '🎲 Divinity',
  '🪄 Hogwarts?', '🌸 Stellar Blade 2', '🗑️ 1st Party Live Service SLOP', '🌊 Horizon 3', '👫 Friend Slop Game',
  '📈 Incremental Game', '🗣️ Japanese Speaking Person', '🚀 Intergalactic Gameplay?', '🐉 Dragon\'s Dogma 2 DLC', '✨ New JRPG',
  '🤖 Astrobot 2', '🧱 Lego Slop', '🏎️ GT8', '😈 DMC', '🦕 Dino Crisis'
];
