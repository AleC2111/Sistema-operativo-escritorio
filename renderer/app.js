// Orquestador Principal del Sistema Operativo AeroOS
import { windowManager } from './desktop/windowManager.js';
import { taskbar } from './desktop/taskbar.js';
import { startMenu } from './desktop/startMenu.js';
import { gadgets } from './desktop/gadgets.js';
import { simEngine } from './kernel/simulationEngine.js';
import { processManager } from './kernel/processManager.js';
import { userManager } from './kernel/userManager.js';
import { notificationManager } from './kernel/notificationManager.js';
import { sounds } from '../assets/audio/soundEffects.js';
import { renderLoginScreen, showLockScreen } from './modules/loginView.js';

// Vistas del Núcleo y Arquitectura
import { renderTaskManagerView } from './modules/taskManagerView.js';
import { renderProcessStateView } from './modules/processStateView.js';
import { renderMemoryView } from './modules/memoryView.js';
import { renderSyncView } from './modules/syncView.js';
import { renderHardwareView } from './modules/hardwareView.js';
import { renderKernelFlowView } from './modules/kernelFlowView.js';
import { renderTerminalView } from './modules/terminalView.js';

// Vistas de Aplicaciones de Escritorio
import { renderCalculatorView } from './modules/calculatorView.js';
import { renderNotepadView, openNotepadWithFile } from './modules/notepadView.js';
import { renderFileExplorerView } from './modules/fileExplorerView.js';
import { renderBrowserView } from './modules/browserView.js';
import { renderMediaPlayerView } from './modules/mediaPlayerView.js';
import { renderPhotoViewerView, openPhotoViewerWithFile } from './modules/photoViewerView.js';
import { renderWallpaperView } from './modules/wallpaperView.js';
import { renderSpaceInvadersView } from './modules/spaceInvadersView.js';

// Registro Central de Aplicaciones
const OS_APPLICATIONS = [
  {
    id: 'process-state',
    title: 'Planificador CPU',
    description: 'Transición de estados, algoritmos RR/FCFS/SJF y Gantt',
    icon: '📊',
    width: 660,
    height: 480,
    x: 40,
    y: 30,
    render: renderProcessStateView
  },
  {
    id: 'task-manager',
    title: 'Adm. de Tareas',
    description: 'Monitoreo de PCB, prioridades y osciloscopio de recursos',
    icon: '📈',
    width: 680,
    height: 460,
    x: 380,
    y: 70,
    render: renderTaskManagerView
  },
  {
    id: 'memory-manager',
    title: 'Gestor Memoria',
    description: 'Particiones contiguas, fragmentación interna/externa y compactación',
    icon: '🧠',
    width: 680,
    height: 480,
    x: 100,
    y: 60,
    render: renderMemoryView
  },
  {
    id: 'sync-lab',
    title: 'Sincronización',
    description: 'Productor-Consumidor, Filósofos y detector de Deadlocks',
    icon: '🔒',
    width: 680,
    height: 460,
    x: 180,
    y: 90,
    render: renderSyncView
  },
  {
    id: 'hardware-manager',
    title: 'Hardware y Disp.',
    description: 'Núcleos de CPU, disco SATA, Plug & Play USB y PIC IRQ',
    icon: '⚙️',
    width: 720,
    height: 490,
    x: 140,
    y: 50,
    render: renderHardwareView
  },
  {
    id: 'kernel-flow',
    title: 'Flujo del Kernel',
    description: 'Transiciones Ring 3 a Ring 0, syscalls y log del núcleo',
    icon: '🌐',
    width: 680,
    height: 440,
    x: 220,
    y: 100,
    render: renderKernelFlowView
  },
  {
    id: 'terminal',
    title: 'Consola CMD',
    description: 'Línea de comandos interactiva para control del SO',
    icon: '💻',
    width: 620,
    height: 380,
    x: 260,
    y: 130,
    render: renderTerminalView
  },
  {
    id: 'calc',
    title: 'Calculadora',
    description: 'Calculadora aritmética estándar con teclado digital',
    icon: '🧮',
    width: 280,
    height: 380,
    x: 420,
    y: 110,
    render: renderCalculatorView
  },
  {
    id: 'notepad',
    title: 'Bloc de notas',
    description: 'Editor de texto simple con contador de líneas y caracteres',
    icon: '📝',
    width: 580,
    height: 420,
    x: 160,
    y: 80,
    render: renderNotepadView
  },
  {
    id: 'explorer',
    title: 'Explorador',
    description: 'Explorador de archivos, carpetas y almacenamiento en disco',
    icon: '📁',
    width: 660,
    height: 440,
    x: 120,
    y: 60,
    render: renderFileExplorerView
  },
  {
    id: 'browser',
    title: 'Navegador',
    description: 'Navegador web real con Chromium WebView',
    icon: '🌍',
    width: 900,
    height: 600,
    x: 80,
    y: 40,
    render: renderBrowserView
  },
  {
    id: 'media-player',
    title: 'Reproductor',
    description: 'Windows Media Player con visualizador espectral animado',
    icon: '🎵',
    width: 480,
    height: 390,
    x: 320,
    y: 90,
    render: renderMediaPlayerView
  },
  {
    id: 'photo-viewer',
    title: 'Visor de Fotos',
    description: 'Visualizador de diagramas de arquitectura y wallpapers',
    icon: '🖼️',
    width: 620,
    height: 450,
    x: 200,
    y: 70,
    render: renderPhotoViewerView
  },
  {
    id: 'personalization',
    title: 'Personalizar',
    description: 'Galería y selector de fondos de pantalla para el escritorio',
    icon: '🎨',
    width: 560,
    height: 420,
    x: 240,
    y: 100,
    render: renderWallpaperView
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    description: 'Clásico arcade de invasores espaciales. ¡Destruye las oleadas de aliens!',
    icon: '👾',
    width: 580,
    height: 560,
    x: 150,
    y: 40,
    render: renderSpaceInvadersView
  }
];

class OperatingSystemApp {
  constructor() {
    this.appMap = new Map();
    OS_APPLICATIONS.forEach(app => this.appMap.set(app.id, app));

    // Iconos del escritorio usando coordenadas de cuadrícula (gridCol, gridRow)
    this.desktopIcons = [
      { id: 'process-state',   title: 'Planificador',  icon: '📊', type: 'app', gridCol: 0, gridRow: 0 },
      { id: 'task-manager',    title: 'Adm. Tareas',   icon: '📈', type: 'app', gridCol: 0, gridRow: 1 },
      { id: 'memory-manager',  title: 'Memoria',       icon: '🧠', type: 'app', gridCol: 0, gridRow: 2 },
      { id: 'sync-lab',        title: 'Sinc.',         icon: '🔒', type: 'app', gridCol: 0, gridRow: 3 },
      { id: 'hardware-manager',title: 'Hardware',      icon: '⚙️', type: 'app', gridCol: 0, gridRow: 4 },
      { id: 'kernel-flow',     title: 'Kernel',        icon: '🌐', type: 'app', gridCol: 0, gridRow: 5 },
      { id: 'terminal',        title: 'Consola',       icon: '💻', type: 'app', gridCol: 0, gridRow: 6 },

      { id: 'explorer',        title: 'Explorador',   icon: '📁', type: 'app', gridCol: 1, gridRow: 0 },
      { id: 'browser',         title: 'Navegador',    icon: '🌍', type: 'app', gridCol: 1, gridRow: 1 },
      { id: 'notepad',         title: 'Bloc Notas',   icon: '📝', type: 'app', gridCol: 1, gridRow: 2 },
      { id: 'calc',            title: 'Calculadora',  icon: '🧮', type: 'app', gridCol: 1, gridRow: 3 },
      { id: 'photo-viewer',    title: 'Visor Fotos',  icon: '🖼️', type: 'app', gridCol: 1, gridRow: 4 },
      { id: 'media-player',    title: 'Reproductor',  icon: '🎵', type: 'app', gridCol: 1, gridRow: 5 },
      { id: 'space-invaders',  title: 'Space Inv.',   icon: '👾', type: 'app', gridCol: 1, gridRow: 6 },

      { id: 'personalization', title: 'Personalizar', icon: '🎨', type: 'app', gridCol: 2, gridRow: 0 },

      // Archivos interactivos en el escritorio
      {
        id: 'file-notes', title: 'Notas_SO.txt', icon: '📄', type: 'file', gridCol: 2, gridRow: 1,
        fileData: {
          name: 'Notas_SO.txt', type: 'Documento de texto', size: '18 KB', date: '12/10/2026',
          content: `APUNTES - Sistemas Operativos (8vo Semestre)\n${'='.repeat(45)}\n\n1. PROCESOS\n   - Estado: Nuevo, Listo, Ejecutando, Bloqueado, Terminado\n   - PCB: Program Counter, Registros, PID, Estado, Prioridad\n   - Cambio de Contexto: salva/restaura estado del CPU\n\n2. PLANIFICACIÓN DE CPU\n   - FCFS: primero en llegar, primero en servirse (no expulsivo)\n   - SJF: rafaga más corta primero (puede causar inanición)\n   - Round Robin: quantum fijo, rotación circular (expulsivo)\n   - Por Prioridades: nivel asociado a cada proceso\n\n3. SINCRONIZACIÓN\n   - Región crítica: sección de código con acceso exclusivo\n   - Mutex/Semaforos: primitivas de sincronización\n   - Deadlock: espera circular entre procesos\n   - Condiciones Coffman: Exclusión Mutua, Retención y Espera,\n     No Expropiación, Espera Circular\n\n4. GESTIÓN DE MEMORIA\n   - Paginación: divide mem. lógica en páginas (tamaño fijo)\n   - Fragmentación Interna: espacio sobrante en marco/página\n   - Fragmentación Externa: huecos libres no contiguos\n   - TLB: caché de tabla de páginas (Translation Lookaside Buffer)`
        }
      },
      {
        id: 'file-diagram', title: 'Buses_SO.png', icon: '🖼️', type: 'file', gridCol: 2, gridRow: 2,
        fileData: {
          name: 'Diagrama_Buses.png',
          type: 'Imagen PNG',
          size: '2,100 KB',
          date: '12/10/2026',
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
        }
      }
    ];

    this.selectedIconId = null;
  }

  init() {
    const desktopEl = document.getElementById('desktop');
    const snapPreviewEl = document.getElementById('snap-preview');
    const desktopIconsEl = document.getElementById('desktop-icons');
    const desktopGadgetsEl = document.getElementById('desktop-gadgets');
    const startMenuEl = document.getElementById('start-menu');
    const startBtnEl = document.getElementById('start-button');
    const taskbarAppsEl = document.getElementById('taskbar-apps');
    const clockEl = document.getElementById('tray-clock');
    const soundToggleEl = document.getElementById('tray-sound-btn');
    const showDesktopBtnEl = document.getElementById('show-desktop-btn');
    const contextMenuEl = document.getElementById('desktop-context-menu');

    // 0. Inicializar gestor de notificaciones
    notificationManager.init();

    // 0.5 Mostrar pantalla de login primero
    const loginContainer = document.createElement('div');
    loginContainer.id = 'login-container';
    document.body.appendChild(loginContainer);
    console.log('Login container creado, renderizando login screen...');
    renderLoginScreen(loginContainer);

    // Suscribirse al evento de login
    userManager.subscribe((event, data) => {
      if (event === 'login') {
        // Continuar con la inicialización del sistema después del login
        this.initializeSystem(desktopEl, snapPreviewEl, desktopIconsEl, desktopGadgetsEl,
          startMenuEl, startBtnEl, taskbarAppsEl, clockEl, soundToggleEl,
          showDesktopBtnEl, contextMenuEl);
        // Actualizar UI con usuario actual
        this.updateUserUI(data);
        // Remover login screen
        setTimeout(() => {
          if (loginContainer.parentNode) {
            loginContainer.parentNode.removeChild(loginContainer);
          }
        }, 500);
      } else if (event === 'lock') {
        showLockScreen(loginContainer);
      } else if (event === 'unlock') {
        // Remover lock screen
        const lockScreen = loginContainer.querySelector('#lock-screen');
        if (lockScreen) {
          lockScreen.style.display = 'none';
        }
      }
    });

    // 0.6 Configurar atajo Win+L para bloquear pantalla
    document.addEventListener('keydown', (e) => {
      if (e.key === 'l' && e.metaKey) {
        e.preventDefault();
        userManager.lock();
      }
    });
  }

  initializeSystem(desktopEl, snapPreviewEl, desktopIconsEl, desktopGadgetsEl,
    startMenuEl, startBtnEl, taskbarAppsEl, clockEl, soundToggleEl,
    showDesktopBtnEl, contextMenuEl) {
    // 1. Inicializar Gestor de Ventanas
    windowManager.init(desktopEl, snapPreviewEl, (windowsList, activeId) => {
      taskbar.updateWindows(windowsList, activeId);
    });

    // 2. Inicializar Barra de Tareas
    taskbar.init({
      taskbarAppsElement: taskbarAppsEl,
      startButtonElement: startBtnEl,
      clockElement: clockEl,
      soundToggleElement: soundToggleEl,
      showDesktopButtonElement: showDesktopBtnEl,
      onStartClick: () => startMenu.toggle()
    });

    // 3. Inicializar Menú Inicio
    startMenu.init(
      startMenuEl,
      OS_APPLICATIONS,
      (appId) => this.launchApp(appId),
      (appId) => this.addAppToDesktop(appId)
    );

    // Enlaces directos del panel derecho del menú inicio
    const rightPanelLinks = {
      'menu-btn-docs': 'notepad',
      'menu-btn-pics': 'photo-viewer',
      'menu-btn-music': 'media-player',
      'menu-btn-team': 'explorer',
      'menu-btn-panel': 'personalization',
      'menu-btn-cli': 'terminal'
    };
    Object.entries(rightPanelLinks).forEach(([btnId, appId]) => {
      const el = document.getElementById(btnId);
      if (el) {
        el.addEventListener('click', () => {
          startMenu.close();
          this.launchApp(appId);
        });
      }
    });

    // 4. Inicializar Gadgets
    gadgets.init(desktopGadgetsEl);

    // 5. Renderizar Iconos de Escritorio Libres
    this.renderDesktopIcons(desktopIconsEl);

    // 6. Menú Contextual del Escritorio
    this.setupContextMenu(desktopEl, contextMenuEl);

    // 7. Iniciar Motor Central de Simulación
    simEngine.init();

    // 8. Abrir ventanas iniciales por defecto
    setTimeout(() => {
      this.launchApp('process-state');
      this.launchApp('task-manager');
      sounds.playStartup();
      const user = userManager.getCurrentUser();
      if (user) {
        notificationManager.success('Sistema Iniciado', `Bienvenido, ${user.name}`);
      }
    }, 300);
  }

  updateUserUI(user) {
    // Actualizar avatar y nombre en el menú inicio
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    if (userAvatar) userAvatar.textContent = user.avatar;
    if (userName) userName.textContent = user.name;

    // Cambiar wallpaper según usuario
    const desktop = document.getElementById('desktop');
    if (desktop) {
      desktop.className = user.wallpaper;
    }
  }

  launchApp(appId) {
    const app = this.appMap.get(appId);
    if (!app) return;

    windowManager.createWindow({
      id: app.id,
      title: app.title,
      icon: app.icon,
      width: app.width,
      height: app.height,
      x: app.x,
      y: app.y,
      renderContent: (container) => {
        // Devolver el cleanup para que windowManager lo llame al cerrar
        return app.render(container);
      }
    });
  }

  // Apertura dinámica y robusta de archivos
  // El bus de comunicación (notepadBus / photoViewerBus) almacena el pendiente
  // y lo entrega tan pronto el módulo se registre — sin setTimeout frágil.
  openFile(file) {
    sounds.playClick();
    const name = file.name.toLowerCase();

    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.svg') || name.endsWith('.gif')) {
      // Primero registrar el pendiente en el bus, LUEGO lanzar la app
      // (si ya está abierta, se cargará de inmediato; si no, cuando se inicialice)
      openPhotoViewerWithFile(file.name, file.svg || '');
      this.launchApp('photo-viewer');
    } else if (name.endsWith('.txt') || name.endsWith('.docx') || name.endsWith('.sys') || name.endsWith('.pdf') || name === 'bootmgr') {
      const textContent = file.content ||
        `// Archivo: ${file.name}\n// Tamaño: ${file.size || '12 KB'} | Fecha: ${file.date || '12/10/2026'}\n\n[SISTEMA DE ARCHIVOS AeroOS]\nEste archivo fue abierto exitosamente.\nSus bloques de datos fueron leídos desde el disco por el manejador de I/O.\n\nContenido:\n${'─'.repeat(40)}\n${file.name.replace(/\.[^/.]+$/, '')} — cargado en RAM en dirección 0x0040A200.\nEstado: Listo para edición.`;
      // Igual: primero el bus, luego la ventana
      openNotepadWithFile(file.name, textContent);
      this.launchApp('notepad');
    } else if (name.endsWith('.mp3')) {
      this.launchApp('media-player');
    } else if (name === 'calc.exe') {
      this.launchApp('calc');
    } else if (name === 'notepad.exe') {
      this.launchApp('notepad');
    } else if (name === 'explorer.exe') {
      this.launchApp('explorer');
    }
  }

  // ───── Sistema de Cuadrícula para Iconos del Escritorio ─────
  // Celda: CELL_W x CELL_H píxeles
  // Columnas: desde el borde izquierdo (GRID_MARGIN) hacia la derecha
  static get CELL_W() { return 90; }
  static get CELL_H() { return 88; }
  static get GRID_MARGIN() { return 12; }
  static get GRID_COLS() { return 3; } // columnas de iconos en la zona izquierda

  // Convierte coordenadas de pantalla a índice de celda [col, row]
  _screenToCell(x, y) {
    const col = Math.round((x - OperatingSystemApp.GRID_MARGIN) / OperatingSystemApp.CELL_W);
    const row = Math.round((y - 10) / OperatingSystemApp.CELL_H);
    return [
      Math.max(0, col),
      Math.max(0, row)
    ];
  }

  // Convierte índice de celda a coordenadas de pantalla (top-left del icono)
  _cellToScreen(col, row) {
    return {
      x: OperatingSystemApp.GRID_MARGIN + col * OperatingSystemApp.CELL_W,
      y: 10 + row * OperatingSystemApp.CELL_H
    };
  }

  // Encuentra la celda libre más cercana a [col, row]
  _nearestFreeCell(col, row, excludeId) {
    const occupied = new Set(
      this.desktopIcons
        .filter(i => i.id !== excludeId)
        .map(i => `${i.gridCol},${i.gridRow}`)
    );
    // Buscar en espiral creciente
    for (let radius = 0; radius < 20; radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          if (Math.abs(dc) !== radius && Math.abs(dr) !== radius) continue;
          const nc = col + dc, nr = row + dr;
          if (nc < 0 || nr < 0) continue;
          const maxRow = Math.floor((window.innerHeight - 80) / OperatingSystemApp.CELL_H);
          if (nr > maxRow) continue;
          if (!occupied.has(`${nc},${nr}`)) return [nc, nr];
        }
      }
    }
    return [col, row];
  }

  // Asigna posiciones de cuadrícula a los iconos que aún no la tienen
  _assignGridPositions() {
    const usedCells = new Set();
    this.desktopIcons.forEach(item => {
      if (item.gridCol !== undefined && item.gridRow !== undefined) {
        usedCells.add(`${item.gridCol},${item.gridRow}`);
      }
    });
    this.desktopIcons.forEach(item => {
      if (item.gridCol === undefined || item.gridRow === undefined) {
        // Asignar próxima celda libre
        let col = 0, row = 0;
        while (usedCells.has(`${col},${row}`)) {
          row++;
          const maxRow = Math.floor((window.innerHeight - 80) / OperatingSystemApp.CELL_H);
          if (row > maxRow) { row = 0; col++; }
        }
        item.gridCol = col;
        item.gridRow = row;
        usedCells.add(`${col},${row}`);
      }
    });
  }

  // Renderizar iconos del escritorio con cuadrícula y snap
  renderDesktopIcons(container) {
    if (!container) return;
    this._assignGridPositions();
    container.innerHTML = '';

    this.desktopIcons.forEach(item => {
      const { x, y } = this._cellToScreen(item.gridCol, item.gridRow);
      item.x = x; item.y = y;

      const iconEl = document.createElement('div');
      iconEl.className = 'desktop-icon';
      iconEl.id = `icon-${item.id}`;
      iconEl.style.left = `${x}px`;
      iconEl.style.top  = `${y}px`;
      iconEl.innerHTML = `
        <div class="desktop-icon-img">${item.icon}</div>
        <span class="desktop-icon-label">${item.title}</span>
      `;

      // ── Arrastre con snap a cuadrícula al soltar ──
      let isDragging = false;
      let startX = 0, startY = 0;
      let startLeft = x, startTop = y;
      let totalDist = 0;
      let ghostEl = null;

      iconEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        startLeft = item.x;  startTop  = item.y;
        totalDist = 0;

        container.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        iconEl.classList.add('selected');
        this.selectedIconId = item.id;

        const onMouseMove = (mv) => {
          if (!isDragging) return;
          const dx = mv.clientX - startX;
          const dy = mv.clientY - startY;
          totalDist += Math.hypot(dx, dy);

          if (totalDist > 5 && !ghostEl) {
            // Crear fantasma visual
            ghostEl = iconEl.cloneNode(true);
            ghostEl.style.opacity = '0.55';
            ghostEl.style.pointerEvents = 'none';
            ghostEl.style.zIndex = '99999';
            container.appendChild(ghostEl);
            iconEl.style.opacity = '0.3';
          }

          if (ghostEl) {
            const nx = Math.max(0, Math.min(window.innerWidth - OperatingSystemApp.CELL_W, startLeft + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - OperatingSystemApp.CELL_H - 40, startTop + dy));
            ghostEl.style.left = `${nx}px`;
            ghostEl.style.top  = `${ny}px`;
          }
        };

        const onMouseUp = (mu) => {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup',   onMouseUp);

          if (ghostEl) {
            ghostEl.remove(); ghostEl = null;
            iconEl.style.opacity = '1';

            // Snap al celda más cercana libre
            const dropX = startLeft + (mu.clientX - startX);
            const dropY = startTop  + (mu.clientY - startY);
            const [dc, dr] = this._screenToCell(dropX, dropY);
            const [fc, fr] = this._nearestFreeCell(dc, dr, item.id);
            item.gridCol = fc; item.gridRow = fr;
            const pos = this._cellToScreen(fc, fr);
            item.x = pos.x; item.y = pos.y;
            iconEl.style.left = `${pos.x}px`;
            iconEl.style.top  = `${pos.y}px`;
            sounds.playClick();
          } else if (totalDist < 6) {
            sounds.playClick();
          }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup',   onMouseUp);
      });

      // Doble clic para ejecutar
      iconEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (item.type === 'app') this.launchApp(item.id);
        else if (item.type === 'file' && item.fileData) this.openFile(item.fileData);
      });

      iconEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showIconContextMenu(item, e.clientX, e.clientY);
      });

      container.appendChild(iconEl);
    });
  }

  showIconContextMenu(iconItem, clientX, clientY) {
    let menu = document.getElementById('icon-context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'icon-context-menu';
      menu.style.cssText = [
        'position:absolute', 'min-width:185px', 'background:#fbfbfb',
        'border:1px solid #97a6b5', 'border-radius:4px',
        'box-shadow:3px 5px 18px rgba(0,0,0,0.38)', 'z-index:100010',
        'font-size:11px', 'padding:4px 0', 'font-family:Segoe UI,sans-serif'
      ].join(';');
      document.body.appendChild(menu);
    }

    const isOnDesktop = this.desktopIcons.some(i => i.id === iconItem.id);

    menu.style.display = 'flex';
    menu.style.flexDirection = 'column';
    menu.style.left = `${Math.min(window.innerWidth - 200, clientX)}px`;
    menu.style.top  = `${Math.min(window.innerHeight - 130, clientY)}px`;

    const divider = `<div style="height:1px; background:#e2e8f0; margin:3px 4px;"></div>`;
    const itemStyle = 'padding:6px 14px; cursor:pointer; display:flex; align-items:center; gap:8px;';

    menu.innerHTML = `
      <div class="ctx-item" id="icon-ctx-open"   style="${itemStyle} font-weight:700;">▶ Abrir</div>
      ${divider}
      ${isOnDesktop
        ? `<div class="ctx-item" id="icon-ctx-remove" style="${itemStyle} color:#dc2626;">❌ Quitar del escritorio</div>`
        : `<div class="ctx-item" id="icon-ctx-add"    style="${itemStyle} color:#0a6640;">📌 Colocar en escritorio</div>`
      }
    `;

    const closeMenu = () => {
      menu.style.display = 'none';
      document.removeEventListener('mousedown', closeMenu);
    };
    setTimeout(() => document.addEventListener('mousedown', closeMenu), 10);

    menu.querySelector('#icon-ctx-open').addEventListener('click', () => {
      closeMenu();
      if (iconItem.type === 'app') this.launchApp(iconItem.id);
      else if (iconItem.type === 'file' && iconItem.fileData) this.openFile(iconItem.fileData);
    });

    const removeBtn = menu.querySelector('#icon-ctx-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        closeMenu();
        this.removeDesktopIcon(iconItem.id);
      });
    }

    const addBtn = menu.querySelector('#icon-ctx-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        closeMenu();
        this.addAppToDesktop(iconItem.id);
      });
    }
  }

  removeDesktopIcon(iconId) {
    this.desktopIcons = this.desktopIcons.filter(i => i.id !== iconId);
    this.renderDesktopIcons(document.getElementById('desktop-icons'));
    sounds.playClick();
  }

  addAppToDesktop(appId) {
    const app = this.appMap.get(appId);
    if (!app) return;

    // Verificar si ya existe en el escritorio
    const exists = this.desktopIcons.some(i => i.id === appId);
    if (exists) {
      alert(`El icono de "${app.title}" ya se encuentra en el escritorio.`);
      return;
    }

    // Calcular posición disponible
    let targetX = 275;
    let targetY = 15;
    while (this.desktopIcons.some(i => Math.abs(i.x - targetX) < 60 && Math.abs(i.y - targetY) < 60)) {
      targetY += 80;
      if (targetY > window.innerHeight - 150) {
        targetY = 15;
        targetX += 85;
      }
    }

    this.desktopIcons.push({
      id: app.id,
      title: app.title,
      icon: app.icon,
      type: 'app',
      x: targetX,
      y: targetY
    });

    this.renderDesktopIcons(document.getElementById('desktop-icons'));
    sounds.playClick();
    alert(`Icono de "${app.title}" colocado en el escritorio.`);
  }

  setupContextMenu(desktopEl, contextMenuEl) {
    if (!contextMenuEl) return;

    desktopEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.aero-window') || e.target.closest('#taskbar') ||
          e.target.closest('#start-menu')  || e.target.closest('.desktop-icon')) {
        return;
      }
      e.preventDefault();
      contextMenuEl.style.display = 'flex';
      contextMenuEl.style.left = `${Math.min(window.innerWidth - 200, e.clientX)}px`;
      contextMenuEl.style.top  = `${Math.min(window.innerHeight - 260, e.clientY)}px`;
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('#desktop-context-menu')) {
        contextMenuEl.style.display = 'none';
      }
    });

    const ctxRefresh = document.getElementById('ctx-refresh');
    if (ctxRefresh) {
      ctxRefresh.addEventListener('click', () => {
        sounds.playClick();
        this.renderDesktopIcons(document.getElementById('desktop-icons'));
        contextMenuEl.style.display = 'none';
      });
    }

    const ctxNewProc = document.getElementById('ctx-new-proc');
    if (ctxNewProc) {
      ctxNewProc.addEventListener('click', () => {
        const pcb = processManager.createProcess('nuevo_proceso.exe', 6, 128, 'Normal', false);
        sounds.playClick();
        alert(`Proceso creado: PID ${pcb.pid} (nuevo_proceso.exe)`);
        contextMenuEl.style.display = 'none';
      });
    }

    const ctxTaskmgr = document.getElementById('ctx-taskmgr');
    if (ctxTaskmgr) {
      ctxTaskmgr.addEventListener('click', () => {
        this.launchApp('task-manager');
        contextMenuEl.style.display = 'none';
      });
    }

    const ctxPersonalize = document.getElementById('ctx-personalize');
    if (ctxPersonalize) {
      ctxPersonalize.addEventListener('click', () => {
        this.launchApp('personalization');
        contextMenuEl.style.display = 'none';
      });
    }

    // ── Submenú «Colocar app en escritorio» ──
    const ctxAddApp = document.getElementById('ctx-add-app');
    if (ctxAddApp) {
      ctxAddApp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showAddToDesktopPicker(contextMenuEl);
      });
    }
  }

  // Muestra un picker con las apps que aún no están en el escritorio
  showAddToDesktopPicker(parentMenu) {
    let picker = document.getElementById('add-to-desktop-picker');
    if (picker) picker.remove();

    const missing = OS_APPLICATIONS.filter(
      app => !this.desktopIcons.some(i => i.id === app.id)
    );

    if (missing.length === 0) {
      parentMenu.style.display = 'none';
      alert('Todas las aplicaciones ya están en el escritorio.');
      return;
    }

    picker = document.createElement('div');
    picker.id = 'add-to-desktop-picker';
    picker.style.cssText = [
      'position:absolute', 'background:#fbfbfb', 'border:1px solid #97a6b5',
      'border-radius:4px', 'box-shadow:3px 5px 18px rgba(0,0,0,0.38)',
      'z-index:100020', 'font-size:11px', 'padding:4px 0',
      'max-height:300px', 'overflow-y:auto', 'min-width:200px',
      'font-family:Segoe UI,sans-serif'
    ].join(';');

    const rect = parentMenu.getBoundingClientRect();
    picker.style.left = `${Math.min(window.innerWidth - 220, rect.right + 4)}px`;
    picker.style.top  = `${rect.top}px`;

    const header = document.createElement('div');
    header.style.cssText = 'padding:6px 14px; font-weight:700; color:#1e3a5a; border-bottom:1px solid #e2e8f0; margin-bottom:2px;';
    header.textContent = 'Agregar al escritorio:';
    picker.appendChild(header);

    missing.forEach(app => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:5px 14px; cursor:pointer; display:flex; align-items:center; gap:8px;';
      item.innerHTML = `<span style="font-size:14px;">${app.icon}</span><span>${app.title}</span>`;
      item.addEventListener('mouseenter', () => { item.style.background = '#dbeafe'; });
      item.addEventListener('mouseleave', () => { item.style.background = ''; });
      item.addEventListener('click', () => {
        picker.remove();
        parentMenu.style.display = 'none';
        this.addAppToDesktop(app.id);
      });
      picker.appendChild(item);
    });

    document.body.appendChild(picker);

    // Cerrar picker al hacer clic fuera
    const closePicker = (ev) => {
      if (!picker.contains(ev.target) && !parentMenu.contains(ev.target)) {
        picker.remove();
        parentMenu.style.display = 'none';
        document.removeEventListener('mousedown', closePicker);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', closePicker), 10);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const osApp = new OperatingSystemApp();
  window.osApp = osApp;
  window.openOSFile = (file) => osApp.openFile(file);
  osApp.init();
});
