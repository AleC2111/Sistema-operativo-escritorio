// Vista: Editor de Texto / Bloc de Notas (notepad.exe)
import { sounds } from '../../assets/audio/soundEffects.js';
import { notificationManager } from '../kernel/notificationManager.js';
import { windowManager } from '../desktop/windowManager.js';
import { renderFileExplorerView } from './fileExplorerView.js';

// Bus de comunicación robusto (elimina condición de carrera)
const notepadBus = {
  _active: null,
  _pending: null,

  setActive(api) {
    this._active = api;
    if (this._pending) {
      const { filename, content } = this._pending;
      this._pending = null;
      api.loadFile(filename, content);
    }
  },

  clearActive() {
    this._active = null;
  },

  openFile(filename, content) {
    if (this._active) {
      this._active.loadFile(filename, content);
    } else {
      this._pending = { filename, content };
    }
  }
};

export function openNotepadWithFile(filename, content) {
  notepadBus.openFile(filename, content);
}

export function renderNotepadView(container) {
  container.innerHTML = `
    <div style="background:#ffffff; height:100%; display:flex; flex-direction:column; overflow:hidden;">
      <!-- Barra de menús clásica -->
      <div style="display:flex; gap:14px; font-size:11px; color:#1e293b; background:#f0f4f9; border-bottom:1px solid #c9d7e5; padding:4px 10px; position:relative;">
        <span class="np-menu-item" style="cursor:pointer; padding:2px 5px; border-radius:2px;" id="np-menu-archivo">Archivo</span>
        <span class="np-menu-item" style="cursor:pointer; padding:2px 5px; border-radius:2px;" id="np-menu-edicion">Edición</span>
        <span class="np-menu-item" style="cursor:pointer; padding:2px 5px; border-radius:2px;" id="np-menu-formato">Formato</span>
        <span class="np-menu-item" style="cursor:pointer; padding:2px 5px; border-radius:2px;" id="np-menu-ver">Ver</span>
        <span class="np-menu-item" style="cursor:pointer; padding:2px 5px; border-radius:2px;" id="np-menu-ayuda">Ayuda</span>
      </div>

      <!-- Barra de acciones rápidas -->
      <div style="display:flex; gap:6px; padding:4px 10px; background:#fafcfe; border-bottom:1px solid #e2e8f0; align-items:center;">
        <button class="aero-btn" id="np-btn-new">📄 Nuevo</button>
        <button class="aero-btn" id="np-btn-open">📂 Abrir muestra</button>
        <button class="aero-btn" id="np-btn-open-explorer">📁 Abrir explorador</button>
        <button class="aero-btn primary" id="np-btn-save">💾 Guardar</button>
        <span style="flex:1;"></span>
        <span id="np-filename" style="font-size:11px; color:#1e3a5a; font-weight:600;">Sin título.txt</span>
      </div>

      <!-- Área de edición -->
      <textarea id="np-textarea" spellcheck="false" style="
        flex:1; border:none; outline:none; padding:10px 14px;
        font-family:'Consolas','Courier New',monospace; font-size:12px;
        line-height:1.6; resize:none; color:#1e293b; background:#ffffff;
      "># Notas de la Cátedra de Sistemas Operativos - 8vo Semestre

1. Conceptos Fundamentales:
   - Procesos y Hilos: PCB (Process Control Block), estados y cambios de contexto.
   - Planificación de CPU: Criterios de equidad, algoritmos Round Robin, FCFS y SJF.
   - Sincronización: Sección crítica, exclusión mutua, semáforos de Dijkstra.
   - Gestión de Memoria: Memoria contigua vs Paginación pura.
   - Fragmentación:
     * Externa: Huecos libres no contiguos en memoria física.
     * Interna: Espacio sobrante dentro de marcos de tamaño fijo.</textarea>

      <!-- Barra de estado -->
      <div style="background:#f1f5f9; border-top:1px solid #cbd5e1; padding:3px 12px; font-size:10px; color:#475569; display:flex; justify-content:space-between;">
        <span id="np-status-pos">Lín 1, Col 1</span>
        <span id="np-status-chars">Caracteres: 0</span>
        <span>100%</span>
        <span>Windows (CRLF)</span>
        <span>UTF-8</span>
      </div>
    </div>
  `;

  const textarea    = container.querySelector('#np-textarea');
  const statusPos   = container.querySelector('#np-status-pos');
  const statusChars = container.querySelector('#np-status-chars');
  const filenameLabel = container.querySelector('#np-filename');
  const menuArchivo = container.querySelector('#np-menu-archivo');

  const updateStatus = () => {
    const text  = textarea.value;
    const slice = text.slice(0, textarea.selectionStart).split('\n');
    statusPos.textContent   = `Lín ${slice.length}, Col ${slice[slice.length - 1].length + 1}`;
    statusChars.textContent = `Caracteres: ${text.length}`;
  };

  const loadFile = (name, content) => {
    filenameLabel.textContent = name;
    textarea.value = content;
    updateStatus();
    sounds.playClick();
  };

  // Registrar en el bus — si hay un archivo pendiente se cargará automáticamente
  notepadBus.setActive({ loadFile });

  textarea.addEventListener('input',  updateStatus);
  textarea.addEventListener('keyup',  updateStatus);
  textarea.addEventListener('click',  updateStatus);

  // Botones
  container.querySelector('#np-btn-new').addEventListener('click', () => {
    if (confirm('¿Desea crear un nuevo documento en blanco?')) {
      textarea.value = '';
      filenameLabel.textContent = 'Documento_Nuevo.txt';
      updateStatus();
      sounds.playClick();
    }
  });

  container.querySelector('#np-btn-open').addEventListener('click', () => {
    loadFile('kernel_config.sys',
      `[BOOT_CONFIG]\nCPU_CORES=4\nMEMORY_PAGES=32\nPAGE_SIZE=32KB\nSCHEDULER_DEFAULT=ROUND_ROBIN\nQUANTUM=3\nIO_INTERRUPT_ENABLED=TRUE`
    );
  });

  container.querySelector('#np-btn-open-explorer').addEventListener('click', () => {
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

  container.querySelector('#np-btn-save').addEventListener('click', () => {
    sounds.playClick();
    const cur = filenameLabel.textContent.replace(' ✔', '');
    filenameLabel.textContent = `${cur} ✔`;
    notificationManager.success('Archivo Guardado', `El archivo "${cur}" se ha guardado exitosamente`);
    setTimeout(() => { filenameLabel.textContent = cur; }, 2000);
  });

  // Menú Archivo - mostrar opciones
  menuArchivo.addEventListener('click', (e) => {
    e.stopPropagation();
    sounds.playClick();
    const menuRect = menuArchivo.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Crear menú desplegable si no existe
    let dropdown = container.querySelector('#np-archivo-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'np-archivo-dropdown';
      dropdown.style.cssText = `
        position: absolute;
        top: ${menuRect.bottom - containerRect.top + 2}px;
        left: ${menuRect.left - containerRect.left}px;
        background: #ffffff;
        border: 1px solid #94a3b8;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 150px;
        z-index: 1000;
        display: none;
      `;
      dropdown.innerHTML = `
        <div class="np-dropdown-item" data-action="new" style="padding:6px 12px; cursor:pointer; font-size:11px; color:#1e293b;">Nuevo</div>
        <div class="np-dropdown-item" data-action="open" style="padding:6px 12px; cursor:pointer; font-size:11px; color:#1e293b;">Abrir muestra</div>
        <div class="np-dropdown-item" data-action="save" style="padding:6px 12px; cursor:pointer; font-size:11px; color:#1e293b;">Guardar</div>
        <div style="border-top:1px solid #e2e8f0; margin:4px 0;"></div>
        <div class="np-dropdown-item" data-action="exit" style="padding:6px 12px; cursor:pointer; font-size:11px; color:#e53e3e;">Salir</div>
      `;
      container.querySelector('.np-menu-item').parentElement.appendChild(dropdown);

      // Event listeners para items del menú
      dropdown.querySelectorAll('.np-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          if (action === 'new') {
            container.querySelector('#np-btn-new').click();
          } else if (action === 'open') {
            container.querySelector('#np-btn-open').click();
          } else if (action === 'save') {
            container.querySelector('#np-btn-save').click();
          } else if (action === 'exit') {
            const winEl = container.closest('.aero-window');
            if (winEl) {
              const closeBtn = winEl.querySelector('.win-btn-close');
              if (closeBtn) closeBtn.click();
            }
          }
          dropdown.style.display = 'none';
        });

        item.addEventListener('mouseenter', () => {
          item.style.background = '#e2e8f0';
        });
        item.addEventListener('mouseleave', () => {
          item.style.background = '#ffffff';
        });
      });
    }

    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
  });

  // Cerrar menú al hacer clic fuera
  container.addEventListener('click', () => {
    const dropdown = container.querySelector('#np-archivo-dropdown');
    if (dropdown) dropdown.style.display = 'none';
  });

  updateStatus();

  return () => {
    notepadBus.clearActive();
  };
}
