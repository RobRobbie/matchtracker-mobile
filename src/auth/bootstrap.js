import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const gate = document.querySelector('#authGate');
const form = document.querySelector('#loginForm');
const message = document.querySelector('#authMessage');
const accountBar = document.querySelector('#accountBar');
const syncStatus = document.querySelector('#syncStatus');
const signedInAs = document.querySelector('#signedInAs');
const signOutButton = document.querySelector('#signOutButton');
let client;
let syncing = false;
let activeUserId = null;
let pendingSync = false;
let syncTimer;
let loadedScripts = false;

const LEGACY_KEYS = ['lastMatch', 'matchLog', 'seasonStats'];
const STORAGE_MARKER = 'matchtracker.cloud.owner';
const DIRTY_MARKER = 'matchtracker.cloud.dirty';

function appKeys() {
  const keys = new Set(LEGACY_KEYS);
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith('matchtracker.') && key !== STORAGE_MARKER && key !== DIRTY_MARKER) keys.add(key);
  }
  return [...keys];
}

function snapshot() {
  return Object.fromEntries(appKeys().flatMap(key => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
}

function restore(data) {
  for (const key of appKeys()) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(data || {})) {
    if (key.startsWith('matchtracker.') || LEGACY_KEYS.includes(key)) localStorage.setItem(key, String(value));
  }
}

function setMessage(text, isError = true) {
  message.textContent = text;
  message.style.color = isError ? '#9d2525' : '#23643e';
}

async function saveCloudState(userId) {
  if (!userId) return;
  if (syncing) { pendingSync = true; return; }
  syncing = true;
  syncStatus.textContent = 'Saving…';
  try {
    const { error } = await client.from('user_app_state').upsert(
      { user_id: userId, data: snapshot(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) throw error;
    Storage.prototype.removeItem.call(localStorage, DIRTY_MARKER);
    syncStatus.textContent = 'Saved';
  } catch (error) {
    console.error('MatchTracker cloud save failed', error);
    syncStatus.textContent = 'Save failed — check connection';
  } finally {
    syncing = false;
    if (pendingSync) {
      pendingSync = false;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => saveCloudState(activeUserId), 100);
    }
  }
}

function watchLocalChanges(userId) {
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;
  const isAppKey = key => (key?.startsWith('matchtracker.') && key !== STORAGE_MARKER && key !== DIRTY_MARKER) || LEGACY_KEYS.includes(key);
  Storage.prototype.setItem = function (key, value) {
    originalSet.call(this, key, value);
    if (this === localStorage && isAppKey(key) && !syncing) {
      originalSet.call(localStorage, DIRTY_MARKER, '1');
      clearTimeout(syncTimer);
      syncStatus.textContent = 'Unsaved changes';
      syncTimer = setTimeout(() => saveCloudState(activeUserId), 700);
    }
  };
  Storage.prototype.removeItem = function (key) {
    originalRemove.call(this, key);
    if (this === localStorage && isAppKey(key) && !syncing) {
      originalSet.call(localStorage, DIRTY_MARKER, '1');
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => saveCloudState(activeUserId), 700);
    }
  };
}

const appScripts = [
  'src/services/storage.js', 'app-mobile.js', 'src/features/home/home.js',
  'src/features/preseason/preseason.js', 'src/core/match/match-model.js',
  'src/services/preseason/preseason-match-service.js',
  'src/features/preseason/new-preseason-match.js',
  'src/features/preseason/squad-selection.js',
  'src/features/preseason/starting-xi.js', 'src/features/match/live-match.js',
  'src/features/squad/squad.js', 'src/features/opponents/opponents.js',
  'src/ui/screens/screen-manager.js'
];

async function loadApp() {
  if (loadedScripts) return;
  for (const src of appScripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/${src}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.appendChild(script);
    });
  }
  loadedScripts = true;
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

async function enterApp(session) {
  const userId = session.user.id;
  activeUserId = null;
  const previousOwner = localStorage.getItem(STORAGE_MARKER);
  const hasLocalUnsavedChanges = previousOwner === userId && localStorage.getItem(DIRTY_MARKER) === '1';
  if (previousOwner && previousOwner !== userId) {
    for (const key of appKeys()) localStorage.removeItem(key);
    localStorage.removeItem(DIRTY_MARKER);
  }
  const { data: stored, error } = await client.from('user_app_state')
    .select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (stored?.data && !hasLocalUnsavedChanges) {
    restore(stored.data);
    Storage.prototype.removeItem.call(localStorage, DIRTY_MARKER);
  } else if (!stored?.data) {
    await saveCloudState(userId);
  }
  localStorage.setItem(STORAGE_MARKER, userId);
  await loadApp();
  activeUserId = userId;
  watchLocalChanges(userId);
  if (stored?.data && hasLocalUnsavedChanges) await saveCloudState(userId);
  signedInAs.textContent = session.user.email;
  accountBar.style.display = 'block';
  gate.hidden = true;
  document.body.classList.add('mt-authenticated');
}

async function initializeAuth() {
  if (!supabaseUrl || !supabaseKey) {
    setMessage('Setup needed: add the Supabase URL and publishable key to the deployment settings.');
    form.querySelectorAll('input, button').forEach(input => { input.disabled = true; });
  } else {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      try { await enterApp(session); } catch (error) { setMessage(`Could not load your private data: ${error.message}`); }
    }
  }
}

initializeAuth();

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return;
  const button = document.querySelector('#loginButton');
  button.disabled = true;
  setMessage('Signing in…', false);
  const { data, error } = await client.auth.signInWithPassword({
    email: document.querySelector('#loginEmail').value.trim(),
    password: document.querySelector('#loginPassword').value
  });
  if (error) setMessage('Sign-in failed. Check your email and password, or ask the owner to invite you.');
  else {
    try { await enterApp(data.session); }
    catch (loadError) { setMessage(`Could not open the app: ${loadError.message}`); }
  }
  button.disabled = false;
});

signOutButton.addEventListener('click', async () => {
  clearTimeout(syncTimer);
  if (activeUserId) await saveCloudState(activeUserId);
  activeUserId = null;
  await client.auth.signOut();
  document.body.classList.remove('mt-authenticated');
  accountBar.style.display = 'none';
  gate.hidden = false;
  setMessage('You have signed out.', false);
});

client?.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    document.body.classList.remove('mt-authenticated');
    accountBar.style.display = 'none';
    gate.hidden = false;
  }
});

