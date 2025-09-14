/*
  Sincronización con Dropbox (cliente)
  - Autenticación OAuth 2 con PKCE usando Dropbox JS SDK (en CDN)
  - Sube/descarga un único JSON: "/salud-backup.json"
  - Merge simple de datos: objetos por fecha (local gana) y arrays por clave compuesta
  - Sincronización automática periódica si hay token válido
*/

(function () {
  const APP_KEY = window.DROPBOX_APP_KEY || "";
  const TOKEN_KEY = "dropboxToken";
  const LAST_HASH_KEY = "dropboxLastSyncHash";
  const FILE_PATH = "/salud-backup.json"; // En apps con carpeta restringida, cae dentro de la App Folder
  const SYNC_INTERVAL_MS = 60_000; // 60s

  let dbx = null;
  let syncing = false;

  // Utilidades
  function byId(id) { return document.getElementById(id); }
  function jsonStableStringify(obj) { return JSON.stringify(obj, Object.keys(obj).sort(), 2); }
  function computeHash(obj) {
    try { return btoa(unescape(encodeURIComponent(jsonStableStringify(obj)))); } catch (_) { return String(Date.now()); }
  }
  function setStatus(text) {
    const el = byId("sync-status");
    if (el) el.textContent = text;
  }
  function asArray(x) { return Array.isArray(x) ? x : []; }
  function asObject(x) { return (x && typeof x === 'object' && !Array.isArray(x)) ? x : {}; }

  // PKCE helpers sin depender del SDK
  function base64UrlEncode(bytes) {
    let str = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(bytes))));
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function generateCodeVerifier() {
    const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const len = 64; // entre 43 y 128
    const rnd = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(rnd);
    let out = '';
    for (let i = 0; i < len; i++) out += allowed[rnd[i] % allowed.length];
    return out;
  }

  async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await (window.crypto || window.msCrypto).subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  // Obtiene todos los datos locales en un único objeto
  function getAllData() {
    try {
      // Usa getBackupData() si existe (definida en js/backup.js),
      // si no, compón manualmente para páginas donde no esté cargado backup.js
      if (typeof getBackupData === "function") return getBackupData();
    } catch (_) { /* noop */ }
    const sleep = JSON.parse(localStorage.getItem("sleepData")) || {};
    const weight = JSON.parse(localStorage.getItem("weightData")) || {};
    const tension = JSON.parse(localStorage.getItem("tensionDatos")) || [];
    const medication = JSON.parse(localStorage.getItem("medicationData")) || [];
    return { sleep, weight, tension, medication };
  }

  function saveAllData(data) {
    if (data.sleep && typeof data.sleep === "object") {
      localStorage.setItem("sleepData", JSON.stringify(data.sleep));
    }
    if (data.weight && typeof data.weight === "object") {
      localStorage.setItem("weightData", JSON.stringify(data.weight));
    }
    if (data.tension && Array.isArray(data.tension)) {
      localStorage.setItem("tensionDatos", JSON.stringify(data.tension));
    }
    if (data.medication && Array.isArray(data.medication)) {
      localStorage.setItem("medicationData", JSON.stringify(data.medication));
    }
  }

  // Merge estrategias
  function mergeObjectsByKey(localObj, remoteObj) {
    return { ...remoteObj, ...localObj }; // local gana en conflictos
  }

  function mergeArrayUnique(localArr, remoteArr, keyFn) {
    const map = new Map();
    for (const item of asArray(remoteArr)) map.set(keyFn(item), item);
    for (const item of asArray(localArr)) map.set(keyFn(item), item); // local gana
    return Array.from(map.values());
  }

  function mergeBackup(localData, remoteData) {
    if (!remoteData || typeof remoteData !== "object") return localData;
    const result = { ...localData };
    result.sleep = mergeObjectsByKey(asObject(localData.sleep), asObject(remoteData.sleep));
    result.weight = mergeObjectsByKey(asObject(localData.weight), asObject(remoteData.weight));
    result.tension = mergeArrayUnique(
      asArray(localData.tension),
      asArray(remoteData.tension),
      (x) => `${x.fecha}|${x.hora}|${x.sis}|${x.dia}|${x.pulso}|${x.comentario}`
    );
    result.medication = mergeArrayUnique(
      asArray(localData.medication),
      asArray(remoteData.medication),
      (x) => `${x.type}|${x.dose}|${x.date}|${x.time}|${x.taken ? 1 : 0}`
    );
    return result;
  }

  // Dropbox SDK helpers
  function getDbx() {
    if (!dbx) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;
      dbx = new Dropbox.Dropbox({ accessToken: token, fetch: window.fetch.bind(window) });
    }
    return dbx;
  }

  function computeRedirectUri() {
    // Puedes forzarlo desde js/config.js con window.DROPBOX_REDIRECT_URI
    if (window.DROPBOX_REDIRECT_URI) return window.DROPBOX_REDIRECT_URI;
    // URI exacta sin query ni hash; debe estar en la whitelist de Dropbox
    const href = window.location.href.split('#')[0].split('?')[0];
    return href;
  }

  async function authenticate() {
    if (!APP_KEY) {
      alert("Falta configurar DROPBOX_APP_KEY en js/config.js");
      return;
    }
    if (!(location.protocol === 'http:' || location.protocol === 'https:')) {
      alert("Dropbox OAuth requiere servir la app por http/https (no file://). Usa un servidor local o despliegue web.");
      return;
    }

    const redirectUri = computeRedirectUri();

    // Fallback sin SDK: flujo implícito
    if (typeof Dropbox === 'undefined' || typeof Dropbox.DropboxAuth === 'undefined') {
      const params = new URLSearchParams({
        client_id: APP_KEY,
        response_type: 'token',
        redirect_uri: redirectUri
      });
      window.location.href = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
      return;
    }

    // Construye la URL de autorización manualmente (más estable entre versiones SDK)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("dropboxCodeVerifier", codeVerifier);
    const scopes = (window.DROPBOX_SCOPES || 'files.content.write files.content.read').trim();
    const params = new URLSearchParams({
      client_id: APP_KEY,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      token_access_type: 'offline',
      scope: scopes
    });
    window.location.href = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  }

  async function finishAuthIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // Soporte retorno del flujo implícito (sin SDK)
    const implicitToken = hash.get('access_token');
    if (implicitToken) {
      localStorage.setItem(TOKEN_KEY, implicitToken);
      window.history.replaceState({}, document.title, computeRedirectUri());
      dbx = new (typeof Dropbox !== 'undefined' ? Dropbox.Dropbox : Object)({ accessToken: implicitToken, fetch: window.fetch?.bind(window) });
      setStatus("Conectado a Dropbox");
      return;
    }

    if (!code) return;
    try {
      const redirectUri = computeRedirectUri();
      const codeVerifier = localStorage.getItem("dropboxCodeVerifier");
      const auth = new Dropbox.DropboxAuth({ clientId: APP_KEY, fetch: window.fetch.bind(window) });
      let access_token;

      if (codeVerifier) {
        // Intentar con SDK (2 args o 3 args) y si falla, fetch manual
        try {
          if (typeof auth.setCodeVerifier === 'function') auth.setCodeVerifier(codeVerifier);
          const tokenRes2 = await auth.getAccessTokenFromCode(redirectUri, code);
          access_token = tokenRes2?.result?.access_token || tokenRes2?.access_token;
        } catch (e1) {
          try {
            const tokenRes3 = await auth.getAccessTokenFromCode(redirectUri, code, codeVerifier);
            access_token = tokenRes3?.result?.access_token || tokenRes3?.access_token;
          } catch (e2) {
            // Fallback manual HTTP
            const resp = await fetch('https://api.dropboxapi.com/oauth2/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: APP_KEY,
                code_verifier: codeVerifier,
                redirect_uri: redirectUri
              })
            });
            if (!resp.ok) {
              const txt = await resp.text();
              throw new Error(`Token HTTP ${resp.status}: ${txt}`);
            }
            const json = await resp.json();
            access_token = json.access_token;
          }
        }
      }

      localStorage.removeItem("dropboxCodeVerifier");
      if (!access_token) throw new Error('No se recibió access_token');
      localStorage.setItem(TOKEN_KEY, access_token);
      dbx = new Dropbox.Dropbox({ accessToken: access_token, fetch: window.fetch.bind(window) });
      // Limpia el querystring
      window.history.replaceState({}, document.title, redirectUri);
      setStatus("Conectado a Dropbox");
    } catch (e) {
      console.error("Error finalizando OAuth Dropbox:", e);
      alert("No se pudo conectar con Dropbox. Verifica Redirect URI y App Key.");
    }
  }

  async function downloadRemoteBackup() {
    const api = getDbx();
    if (!api) return null;
    try {
      const res = await api.filesDownload({ path: FILE_PATH });
      const blob = res.result.fileBlob || res.result.fileBinary || res.result;
      const text = await blob.text();
      return JSON.parse(text);
    } catch (e) {
      // 409 (path/not_found) es normal si aún no hay backup remoto
      console.warn('downloadRemoteBackup error:', e);
      return null;
    }
  }

  async function uploadBackup(data) {
    const api = getDbx();
    if (!api) return false;
    const contents = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    await api.filesUpload({ path: FILE_PATH, contents, mode: { ".tag": "overwrite" } });
    localStorage.setItem(LAST_HASH_KEY, computeHash(data));
    return true;
  }

  async function syncOnce() {
    if (syncing) return;
    if (!getDbx()) return;
    try {
      syncing = true;
      setStatus("Sincronizando…");

      const localData = getAllData();
      const remoteData = await downloadRemoteBackup();
      const merged = mergeBackup(localData, remoteData);

      // Si el merge cambió algo local, guarda y sube
      const beforeHash = computeHash(localData);
      const afterHash = computeHash(merged);
      if (beforeHash !== afterHash) {
        saveAllData(merged);
      }

      // Evita subir si no cambió vs. último sync
      const lastHash = localStorage.getItem(LAST_HASH_KEY);
      const currentHash = computeHash(getAllData());
      if (currentHash !== lastHash) {
        await uploadBackup(getAllData());
      }
      setStatus("Sincronizado");
    } catch (e) {
      console.error("Error de sincronización:", e);
      const msg = (e && (e.error || e.message || e.toString())) || 'desconocido';
      setStatus(`Error de sincronización: ${String(msg).slice(0, 60)}`);
    } finally {
      syncing = false;
    }
  }

  function startAutoSync() {
    // Primer intento inmediato
    syncOnce();
    // Intervalo periódico
    setInterval(syncOnce, SYNC_INTERVAL_MS);
  }

  function disconnect() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_HASH_KEY);
    dbx = null;
    setStatus("Desconectado");
  }

  // Exponer mínimamente en UI
  function wireUi() {
    const connectBtn = byId("dropbox-connect");
    const disconnectBtn = byId("dropbox-disconnect");
    if (connectBtn) connectBtn.addEventListener("click", authenticate);
    if (disconnectBtn) disconnectBtn.addEventListener("click", disconnect);

    // Mostrar estado segun token
    if (localStorage.getItem(TOKEN_KEY)) {
      setStatus("Conectado a Dropbox");
    } else {
      setStatus("Desconectado");
    }
  }

  // Inicialización
  window.addEventListener("DOMContentLoaded", async () => {
    wireUi();
    if (typeof Dropbox === "undefined") {
      setStatus("SDK de Dropbox no cargado (usando flujo alternativo)");
    }
    await finishAuthIfNeeded();
    if (localStorage.getItem(TOKEN_KEY)) {
      startAutoSync();
    }
  });
})();
