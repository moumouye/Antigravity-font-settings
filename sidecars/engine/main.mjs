import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getProfileDir() {
  const platform = process.platform;
  const home = homedir();
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Antigravity');
  } else if (platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'Antigravity');
  } else {
    return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'Antigravity');
  }
}

const PROFILE_DIR = getProfileDir();
const DATA_DIR = process.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR || join(__dirname, 'data');
const PREFS_FILE = join(DATA_DIR, 'preferences.json');
const CLIENT_DIR = join(__dirname, 'client');

async function loadPrefs() {
  try {
    if (existsSync(PREFS_FILE)) {
      const data = await readFile(PREFS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch {}
  return {
    sidebarFontSize: 14,
    mainFontSize: 15,
    codeFontSize: 13,
    lineHeight: 1.6,
    customThoughtFontSize: false,
    thoughtFontSize: 13,
    fontFamily: '',
    codeFontFamily: '',
    language: 'en'
  };
}

async function savePrefs(prefs) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(PREFS_FILE, JSON.stringify(prefs, null, 2), 'utf8');
  } catch (err) {
    console.error('[Font Engine] Failed to save preferences:', err);
  }
}

function buildWrappedScript(injectScript, savedPrefs) {
  return `
    try {
      localStorage.setItem('antigravity_font_settings_v1', ${JSON.stringify(JSON.stringify(savedPrefs))});
    } catch {}
    ${injectScript}
  `;
}

class CdpClient {
  constructor(wsUrl, onBinding, onNavigated) {
    this.wsUrl = wsUrl;
    this.onBinding = onBinding;
    this.onNavigated = onNavigated;
    this.nextId = 1;
    this.pending = new Map();
    this.ws = null;
    this.closed = false;
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || 'CDP Error'));
          else resolve(msg.result);
        } else if (msg.method === 'Runtime.bindingCalled') {
          if (msg.params?.name === '__agyFontSavePrefs') {
            this.onBinding?.(msg.params.payload);
          }
        } else if (msg.method === 'Page.loadEventFired' || msg.method === 'Page.frameNavigated') {
          this.onNavigated?.();
        }
      } catch {}
    });

    this.ws.addEventListener('close', () => {
      this.closed = true;
      for (const { reject } of this.pending.values()) {
        reject(new Error('CDP socket closed'));
      }
      this.pending.clear();
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timeout')), 5000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', (err) => {
        clearTimeout(timer);
        reject(err);
      }, { once: true });
    });
  }

  send(method, params = {}) {
    if (this.closed || !this.ws || this.ws.readyState !== 1) {
      return Promise.reject(new Error('CDP disconnected'));
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  close() {
    this.closed = true;
    if (this.ws) this.ws.close();
  }
}

let activeSessions = new Map();

async function getDevToolsPort() {
  const portFile = join(PROFILE_DIR, 'DevToolsActivePort');
  if (!existsSync(portFile)) return null;
  const content = await readFile(portFile, 'utf8');
  const port = parseInt(content.trim().split(/\r?\n/)[0], 10);
  return Number.isInteger(port) && port > 0 ? port : null;
}

async function discoverPages(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const list = await res.json();
    return list.filter(t => t.type === 'page' && t.url && (t.url.includes('127.0.0.1') || t.url.includes('localhost')));
  } catch {
    return [];
  }
}

async function attachToPage(target, injectScript, savedPrefs) {
  let client;
  const onReload = async () => {
    try {
      const wrapped = buildWrappedScript(injectScript, savedPrefs);
      await client?.send('Runtime.addBinding', { name: '__agyFontSavePrefs' });
      await client?.send('Page.addScriptToEvaluateOnNewDocument', { source: wrapped });
      await client?.send('Runtime.evaluate', { expression: wrapped });
    } catch {}
  };

  client = new CdpClient(target.webSocketDebuggerUrl, async (payload) => {
    try {
      const parsed = JSON.parse(payload);
      await savePrefs(parsed);
      console.log('[Font Engine] Saved updated preferences');
    } catch {}
  }, onReload);

  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Runtime.addBinding', { name: '__agyFontSavePrefs' });

  const wrappedScript = buildWrappedScript(injectScript, savedPrefs);
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: wrappedScript });
  await client.send('Runtime.evaluate', { expression: wrappedScript });
  return client;
}

async function buildInjectScript() {
  const stylesPath = join(CLIENT_DIR, 'styles.css');
  const i18nPath = join(CLIENT_DIR, 'i18n.js');
  const panelPath = join(CLIENT_DIR, 'panel.js');

  if (existsSync(stylesPath) && existsSync(i18nPath) && existsSync(panelPath)) {
    const styles = await readFile(stylesPath, 'utf8');
    const i18n = await readFile(i18nPath, 'utf8');
    const panel = await readFile(panelPath, 'utf8');

    const cleanI18n = i18n.replace(/^export\s+/gm, '');
    const cleanPanel = panel.replace(/^export\s+/gm, '');

    return `(() => {
  // 1. Client Stylesheet
  const CLIENT_STYLES = ${JSON.stringify(styles)};

  // 2. Client I18N Module
  ${cleanI18n}

  // 3. Client Panel & Controller
  ${cleanPanel}

  // 4. Client Entry Execution
  function __agyRunClient() {
    if (typeof initClient === 'function') {
      initClient(CLIENT_STYLES, DEFAULT_PREFS, getTexts);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __agyRunClient, { once: true });
  } else {
    __agyRunClient();
  }
})();\n`;
  }

  return '';
}

let lastScriptContent = '';

async function tick() {
  try {
    const port = await getDevToolsPort();
    if (!port) return;

    const pages = await discoverPages(port);
    const activeUrls = new Set(pages.map(p => p.webSocketDebuggerUrl));

    // Cleanup disconnected
    for (const [url, client] of activeSessions.entries()) {
      if (!activeUrls.has(url) || client.closed) {
        client.close();
        activeSessions.delete(url);
      }
    }

    if (pages.length === 0) return;

    const injectScript = await buildInjectScript();
    if (!injectScript) return;

    const savedPrefs = await loadPrefs();
    const scriptChanged = (injectScript !== lastScriptContent);
    if (scriptChanged) {
      lastScriptContent = injectScript;
    }

    for (const page of pages) {
      if (!activeSessions.has(page.webSocketDebuggerUrl)) {
        try {
          const client = await attachToPage(page, injectScript, savedPrefs);
          activeSessions.set(page.webSocketDebuggerUrl, client);
          console.log('[Font Engine] Attached to renderer:', page.id);
        } catch (err) {
          console.error('[Font Engine] Failed to attach to page:', err.message);
        }
      } else {
        const client = activeSessions.get(page.webSocketDebuggerUrl);
        let isAlive = false;
        try {
          const checkRes = await client.send('Runtime.evaluate', {
            expression: 'Boolean(window.__agyFontSettingsCleanup && document.getElementById("agy-font-settings-style"))',
            returnByValue: true
          });
          isAlive = Boolean(checkRes?.result?.value);
        } catch {
          isAlive = false;
        }

        if (!isAlive || scriptChanged) {
          try {
            const wrappedScript = buildWrappedScript(injectScript, savedPrefs);
            await client.send('Page.enable');
            await client.send('Runtime.enable');
            await client.send('Runtime.addBinding', { name: '__agyFontSavePrefs' });
            await client.send('Page.addScriptToEvaluateOnNewDocument', { source: wrappedScript });
            await client.send('Runtime.evaluate', { expression: wrappedScript });
            if (!isAlive) {
              console.log('[Font Engine] Re-injected font settings into renderer (context restored):', page.id);
            } else {
              console.log('[Font Engine] Hot-reloaded updated script into renderer:', page.id);
            }
          } catch (err) {
            console.error('[Font Engine] Failed to update page:', err.message);
          }
        }
      }
    }
  } catch (err) {
    // Ignore routine discovery errors while app is starting
  }
}

console.log('[Font Engine] Starting Antigravity Font Settings Engine...');
tick();
setInterval(tick, 3000);
