// Vista: Visualizador de Fotos de Windows (photoviewer.exe)
import { sounds } from '../../assets/audio/soundEffects.js';
import { windowManager } from '../desktop/windowManager.js';
import { renderFileExplorerView } from './fileExplorerView.js';

// Gestor de comunicación entre app.js y el módulo activo
const photoViewerBus = {
  _active: null,          // referencia al visor activo
  _pending: null,         // {filename, svgOrUrl} esperando
  _listeners: [],         // callbacks que se llaman cuando hay un pending

  setActive(api) {
    this._active = api;
    // Si había una foto pendiente, cargarla ahora
    if (this._pending) {
      const { filename, svgOrUrl } = this._pending;
      this._pending = null;
      api.loadPhoto(filename, svgOrUrl);
    }
  },

  clearActive() {
    this._active = null;
  },

  openPhoto(filename, svgOrUrl) {
    if (this._active) {
      this._active.loadPhoto(filename, svgOrUrl);
    } else {
      // Guardar como pendiente; se cargará cuando el visor se registre
      this._pending = { filename, svgOrUrl };
    }
  }
};

// Función exportada que usa app.js
export function openPhotoViewerWithFile(filename, svgOrUrl) {
  photoViewerBus.openPhoto(filename, svgOrUrl);
}

export function renderPhotoViewerView(container) {
  const defaultPhotos = [
    {
      id: 1,
      title: 'Diagrama_Buses.png',
      date: '12/10/2026',
      size: '1920x1080',
      svg: `
        <svg viewBox="0 0 600 380" width="100%" height="100%">
          <rect width="600" height="380" fill="#0b1b2b" rx="8" />
          <text x="300" y="35" fill="#38bdf8" font-size="16" font-weight="bold" text-anchor="middle">ARQUITECTURA DEL SISTEMA OPERATIVO</text>
          <!-- CPU -->
          <rect x="40" y="70" width="140" height="120" fill="#1e3a5f" stroke="#38bdf8" stroke-width="2" rx="6" />
          <text x="110" y="100" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">CPU Core</text>
          <text x="110" y="125" fill="#94a3b8" font-size="10" text-anchor="middle">ALU &amp; Registros</text>
          <rect x="55" y="145" width="110" height="30" fill="#0284c7" rx="3" />
          <text x="110" y="165" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">Unidad de Control</text>
          <!-- MMU / RAM -->
          <rect x="230" y="70" width="140" height="120" fill="#1e3a5f" stroke="#4ade80" stroke-width="2" rx="6" />
          <text x="300" y="100" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">MMU &amp; RAM</text>
          <text x="300" y="125" fill="#94a3b8" font-size="10" text-anchor="middle">1024 KB Paginados</text>
          <rect x="245" y="145" width="110" height="30" fill="#16a34a" rx="3" />
          <text x="300" y="165" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">Tabla de Páginas</text>
          <!-- Dispositivos I/O -->
          <rect x="420" y="70" width="140" height="120" fill="#1e3a5f" stroke="#f59e0b" stroke-width="2" rx="6" />
          <text x="490" y="100" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">Controlador I/O</text>
          <text x="490" y="125" fill="#94a3b8" font-size="10" text-anchor="middle">Disco / PIC IRQ</text>
          <rect x="435" y="145" width="110" height="30" fill="#d97706" rx="3" />
          <text x="490" y="165" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">Buffers &amp; DMA</text>
          <!-- BUSES -->
          <line x1="30" y1="240" x2="570" y2="240" stroke="#facc15" stroke-width="5" />
          <text x="300" y="232" fill="#facc15" font-size="11" font-weight="bold" text-anchor="middle">BUS DE DIRECCIONES (ADDRESS BUS)</text>
          <line x1="30" y1="280" x2="570" y2="280" stroke="#38bdf8" stroke-width="7" />
          <text x="300" y="273" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">BUS DE DATOS (DATA BUS)</text>
          <line x1="30" y1="320" x2="570" y2="320" stroke="#f87171" stroke-width="4" stroke-dasharray="6" />
          <text x="300" y="313" fill="#f87171" font-size="11" font-weight="bold" text-anchor="middle">BUS DE CONTROL (SIGNALS &amp; INTERRUPTS)</text>
        </svg>
      `
    },
    {
      id: 2,
      title: 'Memoria_Paginada.jpg',
      date: '12/10/2026',
      size: '1920x1080',
      svg: `
        <svg viewBox="0 0 600 380" width="100%" height="100%">
          <rect width="600" height="380" fill="#0f172a" rx="8" />
          <text x="300" y="40" fill="#60a5fa" font-size="16" font-weight="bold" text-anchor="middle">ESQUEMA DE PAGINACIÓN Y MARCOS FÍSICOS</text>
          <rect x="60" y="80" width="180" height="260" fill="#1e293b" stroke="#38bdf8" stroke-width="2" rx="4" />
          <text x="150" y="105" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">Páginas de Proceso</text>
          <rect x="80" y="125" width="140" height="40" fill="#0284c7" rx="3" />
          <text x="150" y="150" fill="#fff" font-size="11" text-anchor="middle">Página 0 (32 KB)</text>
          <rect x="80" y="175" width="140" height="40" fill="#0284c7" rx="3" />
          <text x="150" y="200" fill="#fff" font-size="11" text-anchor="middle">Página 1 (32 KB)</text>
          <rect x="80" y="225" width="140" height="40" fill="#0284c7" rx="3" />
          <text x="150" y="250" fill="#fff" font-size="11" text-anchor="middle">Página 2 (32 KB)</text>
          <line x1="250" y1="210" x2="350" y2="210" stroke="#facc15" stroke-width="3" stroke-dasharray="4" />
          <text x="300" y="200" fill="#facc15" font-size="10" font-weight="bold" text-anchor="middle">MMU</text>
          <rect x="360" y="80" width="180" height="260" fill="#1e293b" stroke="#4ade80" stroke-width="2" rx="4" />
          <text x="450" y="105" fill="#4ade80" font-size="12" font-weight="bold" text-anchor="middle">Marcos Físicos (RAM)</text>
          <rect x="380" y="125" width="140" height="40" fill="#16a34a" rx="3" />
          <text x="450" y="150" fill="#fff" font-size="11" text-anchor="middle">Marco 4 [Pág 0]</text>
          <rect x="380" y="175" width="140" height="40" fill="#16a34a" rx="3" />
          <text x="450" y="200" fill="#fff" font-size="11" text-anchor="middle">Marco 7 [Pág 1]</text>
          <rect x="380" y="225" width="140" height="40" fill="#dc2626" rx="3" />
          <text x="450" y="245" fill="#fff" font-size="10" text-anchor="middle">Marco 12 [Pág 2]</text>
          <text x="450" y="258" fill="#fecaca" font-size="8" text-anchor="middle">Frag. Interna: 14KB</text>
        </svg>
      `
    },
    {
      id: 3,
      title: 'Aero_Wallpaper.png',
      date: '12/10/2026',
      size: '1920x1080',
      svg: `
        <svg viewBox="0 0 600 380" width="100%" height="100%">
          <defs>
            <radialGradient id="aeroGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="50%" stop-color="#0284c7" />
              <stop offset="100%" stop-color="#082f49" />
            </radialGradient>
          </defs>
          <rect width="600" height="380" fill="url(#aeroGrad)" rx="8" />
          <circle cx="300" cy="190" r="100" fill="#ffffff" opacity="0.12" />
          <text x="300" y="200" fill="#ffffff" font-size="28" font-weight="bold" text-anchor="middle" opacity="0.9">AeroOS</text>
        </svg>
      `
    }
  ];

  let currentPhotos = [...defaultPhotos];
  let currentIndex  = 0;
  let zoomLevel     = 1.0;
  let rotationDeg   = 0;
  let slideInterval = null;

  container.innerHTML = `
    <div style="background:#e9eef4; height:100%; display:flex; flex-direction:column; overflow:hidden;">
      <!-- Barra superior -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; background:#f8fafc; border-bottom:1px solid #cbd5e1; font-size:11px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="aero-btn" id="photo-btn-open-explorer" title="Abrir explorador de archivos">📁</button>
          <span id="photo-title" style="font-weight:700; color:#1e3a5a;"></span>
        </div>
        <span id="photo-meta" style="color:#64748b;"></span>
      </div>

      <!-- Lienzo de imagen -->
      <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#222933; position:relative;">
        <div id="photo-render-wrapper"
          style="max-width:95%; max-height:95%; display:flex; align-items:center; justify-content:center; transition:transform 0.25s ease; transform-origin:center;">
        </div>
      </div>

      <!-- Barra de herramientas -->
      <div style="background:linear-gradient(to bottom,#edf2f7,#d8e2ec); border-top:1px solid #b8cadc; padding:6px 12px; display:flex; align-items:center; justify-content:center; gap:10px;">
        <button class="aero-btn" id="photo-btn-zoom-out" title="Alejar" style="font-size:13px; font-weight:700;">−</button>
        <button class="aero-btn" id="photo-btn-zoom-in"  title="Acercar" style="font-size:13px; font-weight:700;">+</button>
        <button class="aero-btn" id="photo-btn-prev" title="Imagen anterior" style="width:32px; height:32px; border-radius:50%; font-size:14px;">◀</button>
        <button class="aero-btn primary" id="photo-btn-play" title="Presentación" style="width:36px; height:36px; border-radius:50%; font-size:15px;">▶</button>
        <button class="aero-btn" id="photo-btn-next" title="Imagen siguiente" style="width:32px; height:32px; border-radius:50%; font-size:14px;">▶</button>
        <button class="aero-btn" id="photo-btn-rot-left"  title="Girar izquierda">↶</button>
        <button class="aero-btn" id="photo-btn-rot-right" title="Girar derecha">↷</button>
        <button class="aero-btn" id="photo-btn-fit" title="Ajustar a pantalla">⊡</button>
      </div>
    </div>
  `;

  const titleEl   = container.querySelector('#photo-title');
  const metaEl    = container.querySelector('#photo-meta');
  const wrapperEl = container.querySelector('#photo-render-wrapper');
  const playBtn   = container.querySelector('#photo-btn-play');

  const applyTransform = () => {
    wrapperEl.style.transform = `scale(${zoomLevel}) rotate(${rotationDeg}deg)`;
  };

  const updatePhoto = () => {
    const cur = currentPhotos[currentIndex];
    if (!cur) return;
    titleEl.textContent = cur.title;
    metaEl.textContent  = `${cur.size || '1920x1080'} | ${cur.date || '12/10/2026'} | ${currentIndex + 1} de ${currentPhotos.length}`;

    if (cur.svg) {
      wrapperEl.innerHTML = cur.svg;
    } else if (cur.url) {
      wrapperEl.innerHTML = `<img src="${cur.url}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:4px; display:block;" />`;
    }
    applyTransform();
  };

  // ── API pública que usa el bus ──
  const loadPhoto = (filename, svgOrUrl) => {
    const lname = (filename || '').toLowerCase();
    const foundIdx = currentPhotos.findIndex(p => p.title.toLowerCase() === lname);
    if (foundIdx !== -1) {
      currentIndex = foundIdx;
    } else {
      const isSvg = typeof svgOrUrl === 'string' && svgOrUrl.trimStart().startsWith('<svg');
      currentPhotos.unshift({
        id: currentPhotos.length + 1,
        title: filename,
        date:  '12/10/2026',
        size:  '1920x1080',
        svg:   isSvg ? svgOrUrl : null,
        url:   !isSvg ? svgOrUrl : null
      });
      currentIndex = 0;
    }
    zoomLevel    = 1.0;
    rotationDeg  = 0;
    updatePhoto();
    sounds.playClick();
  };

  // Registrar en el bus
  photoViewerBus.setActive({ loadPhoto });

  // ── Botones ──
  container.querySelector('#photo-btn-open-explorer').addEventListener('click', () => {
    sounds.playClick();
    // Buscar si ya hay una ventana del explorador abierta
    const existingWindows = windowManager.getWindows();
    const explorerWindow = existingWindows.find(w => w.id === 'explorer');

    if (explorerWindow) {
      // Traer la ventana existente al frente
      windowManager.focusWindow('explorer');
    } else {
      // Abrir nueva ventana del explorador
      windowManager.createWindow({
        id: 'explorer',
        title: 'Explorador',
        icon: '📁',
        width: 660,
        height: 440,
        x: 120,
        y: 60,
        renderContent: (container) => {
          return renderFileExplorerView(container);
        }
      });
    }
  });

  container.querySelector('#photo-btn-prev').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
    zoomLevel = 1.0; rotationDeg = 0; updatePhoto(); sounds.playClick();
  });
  container.querySelector('#photo-btn-next').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % currentPhotos.length;
    zoomLevel = 1.0; rotationDeg = 0; updatePhoto(); sounds.playClick();
  });
  container.querySelector('#photo-btn-zoom-in').addEventListener('click', () => {
    zoomLevel = Math.min(4.0, zoomLevel + 0.25); applyTransform();
  });
  container.querySelector('#photo-btn-zoom-out').addEventListener('click', () => {
    zoomLevel = Math.max(0.2, zoomLevel - 0.25); applyTransform();
  });
  container.querySelector('#photo-btn-rot-right').addEventListener('click', () => {
    rotationDeg = (rotationDeg + 90) % 360; applyTransform();
  });
  container.querySelector('#photo-btn-rot-left').addEventListener('click', () => {
    rotationDeg = (rotationDeg - 90 + 360) % 360; applyTransform();
  });
  container.querySelector('#photo-btn-fit').addEventListener('click', () => {
    zoomLevel = 1.0; rotationDeg = 0; applyTransform();
  });

  playBtn.addEventListener('click', () => {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
      playBtn.textContent = '▶';
    } else {
      playBtn.textContent = '⏸';
      slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % currentPhotos.length;
        zoomLevel = 1.0; rotationDeg = 0; updatePhoto();
      }, 3000);
    }
  });

  // Zoom con rueda del ratón
  wrapperEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomLevel = e.deltaY < 0
      ? Math.min(4.0, zoomLevel + 0.1)
      : Math.max(0.2, zoomLevel - 0.1);
    applyTransform();
  }, { passive: false });

  updatePhoto();

  // Devolver cleanup
  return () => {
    if (slideInterval) clearInterval(slideInterval);
    photoViewerBus.clearActive();
  };
}
