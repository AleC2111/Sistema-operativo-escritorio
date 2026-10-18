// Vista: Navegador Web Real con Motor Chromium (<webview> con partición persist)
import { sounds } from '../../assets/audio/soundEffects.js';

export function renderBrowserView(container) {
  const HOME_URL = 'https://duckduckgo.com';

  container.innerHTML = `
    <div style="background:#ffffff; height:100%; display:flex; flex-direction:column; overflow:hidden;">

      <!-- Pestañas del navegador -->
      <div class="aero-tabs" style="padding-top:4px; flex-shrink:0;">
        <div class="aero-tab active" id="browser-tab-title" style="display:flex; align-items:center; gap:6px; max-width:200px; overflow:hidden;">
          <span id="tab-favicon" style="font-size:12px;">🌍</span>
          <span id="tab-title-text" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Nueva pestaña</span>
          <span id="tab-loading-spinner" style="display:none; animation: spin 1s linear infinite; font-size:10px;">⏳</span>
        </div>
        <div class="aero-tab" id="browser-new-tab-btn" style="cursor:pointer; flex-shrink:0;" title="Nueva pestaña">+</div>
      </div>

      <!-- Barra de navegación y URL -->
      <div style="display:flex; gap:6px; align-items:center; padding:5px 10px; background:#eef3f9; border-bottom:1px solid #c9d7e5; flex-shrink:0;">
        <button class="aero-btn" id="brw-back" title="Atrás" disabled>◀</button>
        <button class="aero-btn" id="brw-forward" title="Adelante" disabled>▶</button>
        <button class="aero-btn" id="brw-refresh" title="Recargar">🔄</button>
        <button class="aero-btn" id="brw-home" title="Inicio">🏠</button>

        <div id="brw-url-bar" style="flex:1; height:26px; background:#ffffff; border:1px solid #7c9bb8; border-radius:3px; display:flex; align-items:center; padding:0 8px; font-size:11px; gap:6px; box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">
          <span id="brw-security-icon" style="font-size:12px; color:#16a34a; flex-shrink:0;">🔒</span>
          <input id="brw-url-input" type="text" value="${HOME_URL}"
            placeholder="Escriba una dirección o busque en internet..."
            style="width:100%; border:none; outline:none; font-size:11px; font-family:'Segoe UI',sans-serif; color:#1e293b;" />
        </div>
        <button class="aero-btn primary" id="brw-go" style="padding:3px 14px; font-weight:600;">Ir</button>
      </div>

      <!-- Barra de marcadores -->
      <div style="display:flex; gap:14px; padding:4px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:11px; align-items:center; flex-wrap:wrap; flex-shrink:0;">
        <span class="bookmark-link" data-url="https://duckduckgo.com" style="cursor:pointer; color:#0284c7; display:flex; align-items:center; gap:4px; white-space:nowrap;">🔍 DuckDuckGo</span>
        <span class="bookmark-link" data-url="https://es.wikipedia.org" style="cursor:pointer; color:#0284c7; display:flex; align-items:center; gap:4px; white-space:nowrap;">📖 Wikipedia</span>
        <span class="bookmark-link" data-url="https://github.com" style="cursor:pointer; color:#0284c7; display:flex; align-items:center; gap:4px; white-space:nowrap;">💻 GitHub</span>
        <span class="bookmark-link" data-url="https://www.google.com" style="cursor:pointer; color:#0284c7; display:flex; align-items:center; gap:4px; white-space:nowrap;">🌐 Google</span>
        <span class="bookmark-link" data-url="https://www.youtube.com" style="cursor:pointer; color:#0284c7; display:flex; align-items:center; gap:4px; white-space:nowrap;">▶️ YouTube</span>
      </div>

      <!-- Área principal: webview -->
      <div id="brw-webview-container" style="flex:1; display:flex; flex-direction:column; background:#ffffff; overflow:hidden; min-height:0; position:relative;">
        <!-- WebView real de Chromium -->
        <webview
          id="real-webview"
          src="${HOME_URL}"
          partition="persist:browser"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          allowpopups
          webpreferences="contextIsolation=no,nodeIntegration=no"
          style="flex:1; width:100%; height:100%; border:none; min-height:0; position:absolute; top:0; left:0; right:0; bottom:0;">
        </webview>
      </div>

      <!-- Barra de estado inferior -->
      <div id="brw-statusbar" style="background:#f1f5f9; border-top:1px solid #cbd5e1; padding:2px 12px; font-size:10px; color:#64748b; height:18px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; flex-shrink:0;"></div>
    </div>
  `;

  // Referencias
  const webview   = container.querySelector('#real-webview');
  const urlInput  = container.querySelector('#brw-url-input');
  const backBtn   = container.querySelector('#brw-back');
  const fwdBtn    = container.querySelector('#brw-forward');
  const refreshBtn= container.querySelector('#brw-refresh');
  const homeBtn   = container.querySelector('#brw-home');
  const goBtn     = container.querySelector('#brw-go');
  const tabTitle  = container.querySelector('#tab-title-text');
  const tabFavicon= container.querySelector('#tab-favicon');
  const spinner   = container.querySelector('#tab-loading-spinner');
  const statusBar = container.querySelector('#brw-statusbar');
  const secIcon   = container.querySelector('#brw-security-icon');

  // ───── Lógica de navegación ─────
  const navigateTo = (input) => {
    let target = (input || '').trim();
    if (!target) return;

    // Si parece una búsqueda (tiene espacios o no tiene punto/esquema), enviar a DuckDuckGo
    if (target.includes(' ') || (!target.includes('.') && !target.startsWith('http'))) {
      target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('file://')) {
      target = `https://${target}`;
    }

    urlInput.value = target;
    sounds.playClick();
    showLoading(target);

    // Asignar src directamente — esto es lo que funciona en webview de Electron renderer
    webview.src = target;
  };

  const showLoading = (url) => {
    spinner.style.display = 'inline';
  };

  const hideLoading = () => {
    spinner.style.display = 'none';
  };

  const updateNavButtons = () => {
    try {
      backBtn.disabled = !webview.canGoBack();
      fwdBtn.disabled  = !webview.canGoForward();
    } catch(e) {}
  };

  const updateSecurityIcon = (url) => {
    if (!url) return;
    secIcon.textContent = url.startsWith('https://') ? '🔒' : '⚠️';
    secIcon.style.color = url.startsWith('https://') ? '#16a34a' : '#d97706';
  };

  // ───── Eventos del webview ─────
  webview.addEventListener('did-start-loading', () => {
    spinner.style.display = 'inline';
  });

  // Inyectar CSS para asegurar que el contenido ocupe todo el espacio
  webview.addEventListener('dom-ready', () => {
    webview.insertCSS(`
      * {
        box-sizing: border-box !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        min-width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: auto !important;
        overflow-y: auto !important;
      }
    `);
    // Forzar recarga del zoom
    webview.setZoomLevel(0);
  });

  webview.addEventListener('did-stop-loading', () => {
    spinner.style.display = 'none';
    hideLoading();
    updateNavButtons();
  });

  webview.addEventListener('did-navigate', (e) => {
    urlInput.value = e.url || '';
    updateSecurityIcon(e.url);
    updateNavButtons();
    statusBar.textContent = '';
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    urlInput.value = e.url || '';
    updateSecurityIcon(e.url);
    updateNavButtons();
  });

  webview.addEventListener('page-title-updated', (e) => {
    const t = e.title || 'Sin título';
    tabTitle.textContent = t.length > 22 ? t.slice(0, 22) + '…' : t;
    tabFavicon.textContent = '🌍';
  });

  webview.addEventListener('page-favicon-updated', () => {
    // El favicon se actualizará en el futuro con IPC; por ahora dejamos el emoji
    tabFavicon.textContent = '🌍';
  });

  webview.addEventListener('did-fail-load', (e) => {
    // -3 = abortado (navegación cancelada), ignorar
    if (e.errorCode === -3) return;

    hideLoading();
    spinner.style.display = 'none';
    console.error('Error al cargar:', e.errorCode, e.errorDescription);
  });

  webview.addEventListener('update-target-url', (e) => {
    statusBar.textContent = e.url ? `→ ${e.url}` : '';
  });

  // ───── Botones de control ─────
  goBtn.addEventListener('click', () => navigateTo(urlInput.value));
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateTo(urlInput.value);
    if (e.key === 'Escape') urlInput.blur();
  });
  urlInput.addEventListener('focus', () => urlInput.select());

  backBtn.addEventListener('click', () => {
    if (webview.canGoBack()) { webview.goBack(); sounds.playClick(); }
  });
  fwdBtn.addEventListener('click', () => {
    if (webview.canGoForward()) { webview.goForward(); sounds.playClick(); }
  });
  refreshBtn.addEventListener('click', () => {
    webview.reload(); sounds.playClick();
  });
  homeBtn.addEventListener('click', () => navigateTo(HOME_URL));

  container.querySelector('#browser-new-tab-btn').addEventListener('click', () => {
    navigateTo(HOME_URL);
  });

  container.querySelectorAll('.bookmark-link').forEach(bm => {
    bm.addEventListener('click', () => {
      const u = bm.getAttribute('data-url');
      if (u) navigateTo(u);
    });
  });

  // Mostrar spinner al inicio
  showLoading(HOME_URL);
}
