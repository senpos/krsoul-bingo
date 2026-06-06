import { state, saveState } from './state.js';
import { TWITCH_CLIENT_ID, DEFAULT_TWITCH_USER_IDS, getTwitchRedirectUri } from './config.js';
import { scheduleEmoteRefresh, setEmoteStatus } from './emotes.js';

function ensureChannelId(user) {
  if (!user) return;
  const id = user.id;
  if (!state.twitchUserIds.includes(id)) {
    state.twitchUserIds.push(id);
  }
  if (user.login) {
    state.twitchChannelNames[id] = user.login;
  }
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateRandomString(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(bytes);
}

function storeToken(token) {
  localStorage.setItem('twitch-access-token', token);
  state.twitch.token = token;
}

function clearToken() {
  localStorage.removeItem('twitch-access-token');
  state.twitch.token = null;
  state.twitch.user = null;
}

export function isLoggedIn() {
  return !!state.twitch.token;
}

export function getAccessToken() {
  if (!state.twitch.token) {
    const stored = localStorage.getItem('twitch-access-token');
    if (stored) state.twitch.token = stored;
  }
  return state.twitch.token;
}

async function fetchUserInfo(token) {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-ID': TWITCH_CLIENT_ID
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.[0] || null;
}

function cleanUp() {
  const url = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, '');
  window.history.replaceState({}, document.title, url);
}

export async function loginWithTwitch() {
  const redirectUri = getTwitchRedirectUri();
  const stateVal = generateRandomString(32);
  sessionStorage.setItem('twitch-auth-state', stateVal);

  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'user:read:email',
    state: stateVal
  });

  window.location.href = `https://id.twitch.tv/oauth2/authorize?${params}`;
}

export function logout(app) {
  clearToken();
  state.twitchUserIds = [...DEFAULT_TWITCH_USER_IDS];
  saveState();
  if (app) {
    app.twitchToken = null;
    app.twitchUser = null;
  }
  scheduleEmoteRefresh();
}

export async function initAuth(app) {
  // Handle Implicit Grant callback — token in URL fragment
  const hashStr = window.location.hash.replace(/^#/, '');
  if (hashStr) {
    const hashParams = new URLSearchParams(hashStr);
    const accessToken = hashParams.get('access_token');
    const returnedState = hashParams.get('state');
    const storedState = sessionStorage.getItem('twitch-auth-state');

    cleanUp();

    if (accessToken && returnedState && returnedState === storedState) {
      sessionStorage.removeItem('twitch-auth-state');
      storeToken(accessToken);

      try {
        setEmoteStatus('Fetching user info...');
        const user = await fetchUserInfo(accessToken);
        if (user) {
          state.twitch.user = user;
          ensureChannelId(user);
          saveState();

          if (app) {
            app.twitchToken = accessToken;
            app.twitchUser = user;
          }
          scheduleEmoteRefresh();
          return;
        }
      } catch (err) {
        console.error('Failed to get user info:', err);
      }

      clearToken();
    }
  }

  // Check for existing stored token from localStorage
  const token = localStorage.getItem('twitch-access-token');
  if (token) {
    try {
      state.twitch.token = token;
      const user = await fetchUserInfo(token);
      if (user) {
        state.twitch.user = user;
        ensureChannelId(user);
        saveState();

        if (app) {
          app.twitchToken = token;
          app.twitchUser = user;
        }
        scheduleEmoteRefresh();
        return;
      }
    } catch {}
    clearToken();
  }
}
