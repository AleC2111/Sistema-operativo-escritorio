// Vista: Explorador de Archivos de Windows (explorer.exe)
import { sounds } from '../../assets/audio/soundEffects.js';
import { openNotepadWithFile } from './notepadView.js';
import { openPhotoViewerWithFile } from './photoViewerView.js';
import { userManager } from '../kernel/userManager.js';
import { windowManager } from '../desktop/windowManager.js';
import { renderNotepadView } from './notepadView.js';
import { renderPhotoViewerView } from './photoViewerView.js';

export function renderFileExplorerView(container) {
  const fileSystem = {
    'C:': [
      { name: 'Archivos de Programa', type: 'folder', size: '2.4 GB', date: '12/10/2026' },
      { name: 'Windows', type: 'folder', size: '14.2 GB', date: '12/10/2026' },
      { name: 'Usuarios', type: 'folder', size: '1.8 GB', date: '12/10/2026' },
      { name: 'pagefile.sys', type: 'file', icon: '⚙️', size: '2,048 KB', date: '12/10/2026', content: '[ARCHIVO DE PAGINACIÓN]\nMemoria virtual del sistema operativo.\nConfiguración: 2048 KB reservados para swap.' },
      { name: 'bootmgr', type: 'file', icon: '📄', size: '384 KB', date: '12/10/2026', content: '[BOOT MANAGER]\nGestor de arranque de AeroOS.\nCargando kernel desde sector 0...' }
    ],
    'C:\\Archivos de Programa': [
      { name: 'Simulador SO', type: 'folder', size: '120 MB', date: '12/10/2026' },
      { name: 'Calculadora Aero', type: 'folder', size: '15 MB', date: '12/10/2026' },
      { name: 'Reproductor Multimedia', type: 'folder', size: '45 MB', date: '12/10/2026' }
    ],
    'C:\\Windows': [
      { name: 'System32', type: 'folder', size: '3.1 GB', date: '12/10/2026' },
      { name: 'explorer.exe', type: 'file', icon: '🗂️', size: '2,810 KB', date: '12/10/2026' },
      { name: 'notepad.exe', type: 'file', icon: '📝', size: '190 KB', date: '12/10/2026' },
      { name: 'calc.exe', type: 'file', icon: '🧮', size: '920 KB', date: '12/10/2026' }
    ],
    'C:\\Usuarios': [
      { name: 'Estudiante', type: 'folder', size: '1.8 GB', date: '12/10/2026' },
      { name: 'Profesor', type: 'folder', size: '2.1 GB', date: '12/10/2026' },
      { name: 'Administrador', type: 'folder', size: '3.5 GB', date: '12/10/2026' }
    ],
    'C:\\Usuarios\\Estudiante\\Documentos': [
      { name: 'Proyecto_Final_SO.docx', type: 'file', icon: '📄', size: '450 KB', date: '12/10/2026', content: 'PROYECTO FINAL - SISTEMAS OPERATIVOS\n=====================================\n\nTema: Simulación de Sistemas Operativos\nEstudiante: 8vo Semestre\n\n1. Introducción\n   Este proyecto simula un sistema operativo completo con:\n   - Gestión de procesos\n   - Planificación de CPU\n   - Gestión de memoria\n   - Sincronización\n   - Sistema de archivos\n\n2. Arquitectura\n   El sistema utiliza Electron para crear una interfaz\n   gráfica tipo Windows 7 Aero.' },
      { name: 'Algoritmos_Planificacion.pdf', type: 'file', icon: '📑', size: '1,240 KB', date: '12/10/2026', content: '[DOCUMENTO PDF SIMULADO]\n\nALGORITMOS DE PLANIFICACIÓN DE CPU\n=================================\n\n1. FCFS (First-Come, First-Served)\n   - El primero en llegar es el primero en servirse\n   - No expulsivo\n   - Puede causar efecto convoy\n\n2. SJF (Shortest Job First)\n   - La ráfaga más corta primero\n   - Óptimo para tiempo de espera promedio\n   - Puede causar inanición\n\n3. Round Robin\n   - Quantum fijo (ej: 3ms)\n   - Rotación circular\n   - Expulsivo, justo para sistemas de tiempo compartido' },
      { name: 'Notas_Examen.txt', type: 'file', icon: '📝', size: '12 KB', date: '12/10/2026', content: 'NOTAS PARA EL EXAMEN DE SISTEMAS OPERATIVOS\n===========================================\n\nPREGUNTAS CLAVE:\n\n1. ¿Qué es un PCB?\n   Process Control Block - Bloque de Control de Proceso\n   Contiene: PID, estado, registros, contador de programa\n\n2. Diferencia entre paginación y segmentación\n   - Paginación: división en páginas de tamaño fijo\n   - Segmentación: división en segmentos lógicos de tamaño variable\n\n3. ¿Qué es deadlock?\n   Situación donde dos o más procesos esperan indefinidamente\n   recursos que están retenidos por otros procesos.\n\n4. Condiciones de Coffman para deadlock:\n   - Exclusión mutua\n   - Retención y espera\n   - No expropiación\n   - Espera circular' }
    ],
    'C:\\Usuarios\\Estudiante\\Imágenes': [
      {
        name: 'Diagrama_Buses.png',
        type: 'file',
        icon: '🖼️',
        size: '2,100 KB',
        date: '12/10/2026',
        isImage: true,
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
        name: 'Memoria_Paginada.jpg',
        type: 'file',
        icon: '🖼️',
        size: '1,450 KB',
        date: '12/10/2026',
        isImage: true,
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
        name: 'Aero_Wallpaper.png',
        type: 'file',
        icon: '🖼️',
        size: '3,800 KB',
        date: '12/10/2026',
        isImage: true,
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
    ],
    'C:\\Usuarios\\Estudiante\\Música': [
      { name: 'Aero_Dreamscape.mp3', type: 'file', icon: '🎵', size: '4,100 KB', date: '12/10/2026' },
      { name: 'Retro_Chiptune_Beat.mp3', type: 'file', icon: '🎵', size: '3,200 KB', date: '12/10/2026' }
    ],
    'C:\\Usuarios\\Profesor\\Documentos': [
      { name: 'Syllabus_2026.pdf', type: 'file', icon: '📑', size: '1,800 KB', date: '12/10/2026', content: '[SYLLABUS - SISTEMAS OPERATIVOS]\n\n8vo Semestre - 2026\n\nTemario:\n1. Procesos y Planificación\n2. Gestión de Memoria\n3. Sincronización\n4. Sistemas de Archivos\n5. Seguridad' },
      { name: 'Calificaciones.xlsx', type: 'file', icon: '📊', size: '45 KB', date: '12/10/2026', content: '[HOJA DE CÁLCULO]\nEstudiante\tNota\n--------------\t----\nJuan Pérez\t85\nMaría García\t92\nCarlos López\t78' }
    ],
    'C:\\Usuarios\\Profesor\\Imágenes': [
      {
        name: 'Diagrama_Arquitectura.png',
        type: 'file',
        icon: '🖼️',
        size: '1,800 KB',
        date: '12/10/2026',
        isImage: true,
        svg: `
          <svg viewBox="0 0 600 380" width="100%" height="100%">
            <rect width="600" height="380" fill="#1a1a2e" rx="8" />
            <text x="300" y="35" fill="#e94560" font-size="16" font-weight="bold" text-anchor="middle">DIAGRAMA DE ARQUITECTURA DE CAPAS</text>
            <!-- Capa de Usuario -->
            <rect x="150" y="60" width="300" height="50" fill="#16213e" stroke="#e94560" stroke-width="2" rx="4" />
            <text x="300" y="90" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">Aplicaciones de Usuario</text>
            <!-- Capa de Servicios -->
            <rect x="150" y="125" width="300" height="50" fill="#0f3460" stroke="#4a90e2" stroke-width="2" rx="4" />
            <text x="300" y="155" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">Servicios del Sistema</text>
            <!-- Capa de Kernel -->
            <rect x="150" y="190" width="300" height="50" fill="#1a1a2e" stroke="#4ade80" stroke-width="2" rx="4" />
            <text x="300" y="220" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">Kernel / Núcleo</text>
            <!-- Capa de Hardware -->
            <rect x="150" y="255" width="300" height="50" fill="#16213e" stroke="#f59e0b" stroke-width="2" rx="4" />
            <text x="300" y="285" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">Hardware</text>
            <!-- Flechas -->
            <line x1="300" y1="110" x2="300" y2="125" stroke="#ffffff" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="300" y1="175" x2="300" y2="190" stroke="#ffffff" stroke-width="2" marker-end="url(#arrow)" />
            <line x1="300" y1="240" x2="300" y2="255" stroke="#ffffff" stroke-width="2" marker-end="url(#arrow)" />
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#ffffff" />
              </marker>
            </defs>
            <text x="300" y="340" fill="#94a3b8" font-size="10" text-anchor="middle">Flujo de llamadas al sistema (syscalls)</text>
          </svg>
        `
      }
    ],
    'C:\\Usuarios\\Administrador\\Documentos': [
      { name: 'Configuracion.ini', type: 'file', icon: '⚙️', size: '2 KB', date: '08/10/2026', content: '[SYSTEM_CONFIG]\nKernel_Version=1.0\nMemory_Paging=Enabled\nCPU_Scheduler=RoundRobin\nSecurity_Level=High' },
      { name: 'Logs_Sistema.log', type: 'file', icon: '📋', size: '15 KB', date: '12/10/2026', content: '[SYSTEM LOG]\n2026-10-12 08:00:00 - System started\n2026-10-12 08:00:05 - Kernel loaded\n2026-10-12 08:00:10 - Services initialized\n2026-10-12 09:30:00 - User login: Estudiante\n2026-10-12 10:15:00 - Process created: notepad.exe' }
    ],
    'C:\\Windows\\System32': [
      { name: 'drivers', type: 'folder', size: '850 MB', date: '12/10/2026' },
      { name: 'kernel32.dll', type: 'file', icon: '🔧', size: '1,240 KB', date: '08/10/2026', content: '[KERNEL32.DLL]\nCore kernel functions for process management,\nmemory allocation, and system calls.' },
      { name: 'ntdll.dll', type: 'file', icon: '🔧', size: '980 KB', date: '08/10/2026', content: '[NTDLL.DLL]\nNative API layer for Windows NT subsystem.' },
      { name: 'hal.dll', type: 'file', icon: '🔧', size: '450 KB', date: '08/10/2026', content: '[HAL.DLL]\nHardware Abstraction Layer - interface between\nkernel and hardware devices.' }
    ]
  };

  let currentPath = 'C:';
  let selectedFile = null;

  container.innerHTML = `
    <div style="background: #ffffff; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Barra superior de navegación y dirección -->
      <div style="display: flex; gap: 8px; align-items: center; padding: 6px 10px; background: #eef4fb; border-bottom: 1px solid #c0d1e3;">
        <button class="aero-btn" id="exp-back-btn" title="Atrás">◀</button>
        <button class="aero-btn" id="exp-up-btn" title="Subir nivel">▲</button>
        <div style="flex: 1; height: 24px; background: #ffffff; border: 1px solid #7c9bb8; border-radius: 3px; display: flex; align-items: center; padding: 0 8px; font-size: 11px; gap: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
          <span>💻</span>
          <span id="exp-address-bar" style="color: #1e3a5a; font-weight: 600;">C:</span>
        </div>
        <button class="aero-btn primary" id="exp-open-action-btn">Ejecutar / Abrir</button>
        <div style="width: 130px; height: 24px; background: #ffffff; border: 1px solid #7c9bb8; border-radius: 3px; display: flex; align-items: center; padding: 0 8px; font-size: 11px;">
          <input id="exp-search-input" type="text" placeholder="Buscar..." style="width: 100%; border: none; outline: none; font-size: 11px;" />
        </div>
      </div>

      <!-- Cuerpo: árbol lateral y lista de archivos -->
      <div style="flex: 1; display: flex; overflow: hidden;">
        <!-- Árbol izquierdo -->
        <div style="width: 180px; background: #f8fafc; border-right: 1px solid #d4e0ec; padding: 8px; overflow-y: auto; font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
          <div style="font-weight: 700; color: #1e3a5a; margin-bottom: 4px;">Favoritos</div>
          <div class="exp-tree-item" data-path="C:\\Usuarios\\Estudiante\\Documentos" style="padding: 3px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>📄</span> Documentos
          </div>
          <div class="exp-tree-item" data-path="C:\\Usuarios\\Estudiante\\Imágenes" style="padding: 3px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🖼️</span> Imágenes
          </div>
          <div class="exp-tree-item" data-path="C:\\Usuarios\\Estudiante\\Música" style="padding: 3px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>🎵</span> Música
          </div>
          <div style="height: 1px; background: #cbd5e1; margin: 6px 0;"></div>
          <div style="font-weight: 700; color: #1e3a5a; margin-bottom: 4px;">Equipo</div>
          <div class="exp-tree-item selected" data-path="C:" style="padding: 3px 6px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #cce8ff; font-weight: 600;">
            <span>💽</span> Disco Local (C:)
          </div>
          <div class="exp-tree-item" data-path="C:\\Archivos de Programa" style="padding: 3px 6px 3px 18px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>📁</span> Archivos Prog.
          </div>
          <div class="exp-tree-item" data-path="C:\\Windows" style="padding: 3px 6px 3px 18px; border-radius: 3px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>📁</span> Windows
          </div>
        </div>

        <!-- Lista derecha de archivos -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div class="aero-table-container" style="flex: 1; border: none;">
            <table class="aero-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th style="width: 100px;">Fecha mod.</th>
                  <th style="width: 90px;">Tipo</th>
                  <th style="width: 80px; text-align: right;">Tamaño</th>
                </tr>
              </thead>
              <tbody id="exp-file-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Barra de estado inferior -->
      <div style="background: #f1f5f9; border-top: 1px solid #cbd5e1; padding: 4px 12px; font-size: 11px; color: #475569; display: flex; justify-content: space-between;">
        <span id="exp-status-count">5 elementos</span>
        <span id="exp-selected-label">Haga doble clic para abrir cualquier archivo o carpeta</span>
      </div>
    </div>
  `;

  const addressEl = container.querySelector('#exp-address-bar');
  const tbodyEl = container.querySelector('#exp-file-tbody');
  const statusCountEl = container.querySelector('#exp-status-count');
  const selectedLabel = container.querySelector('#exp-selected-label');
  const openActionBtn = container.querySelector('#exp-open-action-btn');

  const executeItem = (item) => {
    if (item.type === 'folder') {
      const newPath = currentPath === 'C:' ? `C:\\${item.name}` : `${currentPath}\\${item.name}`;
      if (fileSystem[newPath]) {
        currentPath = newPath;
        selectedFile = null;
        renderFiles();
        sounds.playClick();
      }
    } else {
      // Abre en la aplicación asociada según el tipo de archivo
      const name = item.name.toLowerCase();

      if (item.isImage || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.svg') || name.endsWith('.gif')) {
        // Primero registrar el archivo en el bus, luego abrir la ventana
        openPhotoViewerWithFile(item.name, item.svg || '');
        // Verificar si ya hay una ventana del visor de fotos abierta
        const existingWindows = windowManager.getWindows();
        const photoWindow = existingWindows.find(w => w.id === 'photo-viewer');

        if (photoWindow) {
          // Traer la ventana existente al frente
          windowManager.focusWindow('photo-viewer');
        } else {
          // Abrir nueva ventana del visor de fotos
          windowManager.createWindow({
            id: 'photo-viewer',
            title: 'Visor de Fotos',
            icon: '🖼️',
            width: 620,
            height: 450,
            x: 200,
            y: 70,
            renderContent: (container) => {
              return renderPhotoViewerView(container);
            }
          });
        }
        sounds.playClick();
      } else if (name.endsWith('.txt') || name.endsWith('.docx') || name.endsWith('.sys') || name.endsWith('.pdf') || name === 'bootmgr') {
        const textContent = item.content ||
          `// Archivo: ${item.name}\n// Tamaño: ${item.size} | Fecha: ${item.date}\n\n[SISTEMA DE ARCHIVOS AeroOS]\nEste archivo fue abierto exitosamente.\nSus bloques de datos fueron leídos desde el disco por el manejador de I/O.\n\nContenido:\n${'─'.repeat(40)}\n${item.name.replace(/\.[^/.]+$/, '')} — cargado en RAM en dirección 0x0040A200.\nEstado: Listo para edición.`;
        // Primero registrar el archivo en el bus, luego abrir la ventana
        openNotepadWithFile(item.name, textContent);
        // Verificar si ya hay una ventana del bloc de notas abierta
        const existingWindows = windowManager.getWindows();
        const notepadWindow = existingWindows.find(w => w.id === 'notepad');

        if (notepadWindow) {
          // Traer la ventana existente al frente
          windowManager.focusWindow('notepad');
        } else {
          // Abrir nueva ventana del bloc de notas
          windowManager.createWindow({
            id: 'notepad',
            title: 'Bloc de notas',
            icon: '📝',
            width: 580,
            height: 420,
            x: 160,
            y: 80,
            renderContent: (container) => {
              return renderNotepadView(container);
            }
          });
        }
        sounds.playClick();
      } else if (name.endsWith('.mp3')) {
        sounds.playClick();
        alert('El reproductor multimedia se abriría aquí con: ' + item.name);
      } else if (name === 'calc.exe') {
        sounds.playClick();
        alert('La calculadora se abriría');
      } else if (name === 'notepad.exe') {
        sounds.playClick();
        alert('El bloc de notas se abriría');
      } else if (name === 'explorer.exe') {
        sounds.playClick();
        alert('El explorador ya está abierto');
      }
    }
  };

  const renderFiles = () => {
    addressEl.textContent = currentPath;
    tbodyEl.innerHTML = '';

    // Verificar si el usuario tiene permiso para acceder a System32
    const currentUser = userManager.getCurrentUser();
    if (currentPath.includes('System32') && currentUser && !currentUser.permissions.canAccessSystem32) {
      tbodyEl.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#dc2626;">⛔ Acceso denegado: No tiene permisos para acceder a System32</td></tr>';
      statusCountEl.textContent = '0 elementos';
      return;
    }

    // Mostrar archivos personales del usuario actual
    let items = fileSystem[currentPath] || [];
    if (currentPath === 'C:\\Usuarios' && currentUser) {
      // Filtrar solo el usuario actual
      items = items.filter(item => item.name === currentUser.name);
    }

    statusCountEl.textContent = `${items.length} elemento${items.length === 1 ? '' : 's'}`;

    items.forEach(item => {
      const tr = document.createElement('tr');
      const isFolder = item.type === 'folder';
      const icon = isFolder ? '📁' : (item.icon || '📄');

      tr.innerHTML = `
        <td style="cursor: pointer;">
          <span style="font-size: 14px; margin-right: 6px;">${icon}</span>
          <b>${item.name}</b>
        </td>
        <td style="color: #64748b;">${item.date}</td>
        <td style="color: #64748b;">${isFolder ? 'Carpeta de archivos' : 'Archivo de sistema'}</td>
        <td style="text-align: right; color: #475569;">${item.size}</td>
      `;

      // Selección al hacer un clic
      tr.addEventListener('click', () => {
        tbodyEl.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        selectedFile = item;
        selectedLabel.textContent = `Seleccionado: ${item.name} (${item.size})`;
        sounds.playClick();
      });

      // Doble clic abre la carpeta o ejecuta el archivo en su aplicación
      tr.addEventListener('dblclick', () => {
        executeItem(item);
      });

      tbodyEl.appendChild(tr);
    });
  };

  openActionBtn.addEventListener('click', () => {
    if (selectedFile) {
      executeItem(selectedFile);
    } else {
      sounds.playError();
      alert('Seleccione un archivo o carpeta para abrir.');
    }
  });

  container.querySelector('#exp-up-btn').addEventListener('click', () => {
    if (currentPath !== 'C:') {
      currentPath = 'C:';
      selectedFile = null;
      renderFiles();
      sounds.playClick();
    }
  });

  container.querySelector('#exp-back-btn').addEventListener('click', () => {
    if (currentPath !== 'C:') {
      currentPath = 'C:';
      selectedFile = null;
      renderFiles();
      sounds.playClick();
    }
  });

  container.querySelectorAll('.exp-tree-item').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('.exp-tree-item').forEach(i => {
        i.classList.remove('selected');
        i.style.background = 'transparent';
        i.style.fontWeight = 'normal';
      });
      item.classList.add('selected');
      item.style.background = '#cce8ff';
      item.style.fontWeight = 'bold';

      const path = item.getAttribute('data-path');
      if (path && fileSystem[path]) {
        currentPath = path;
        selectedFile = null;
        renderFiles();
        sounds.playClick();
      }
    });
  });

  renderFiles();
}
