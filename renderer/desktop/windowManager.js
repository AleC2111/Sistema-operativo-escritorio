// Gestor de Ventanas Aero Glass (Window Manager)
import { sounds } from '../../assets/audio/soundEffects.js';

export class WindowManager {
  constructor() {
    this.windows = new Map();
    this.activeWindowId = null;
    this.topZIndex = 100;
    this.desktopEl = null;
    this.snapPreviewEl = null;
    this.taskbarUpdateCallback = null;
  }

  init(desktopElement, snapPreviewElement, onTaskbarUpdate) {
    this.desktopEl = desktopElement;
    this.snapPreviewEl = snapPreviewElement;
    this.taskbarUpdateCallback = onTaskbarUpdate;

    // Deseleccionar ventanas al hacer clic en el escritorio vacío
    this.desktopEl.addEventListener('mousedown', (e) => {
      if (e.target === this.desktopEl) {
        this.deactivateAllWindows();
      }
    });
  }

  createWindow({ id, title, icon, width = 640, height = 450, x = null, y = null, renderContent }) {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      if (win.isMinimized) {
        this.restoreWindow(id);
      } else {
        this.focusWindow(id);
      }
      return win;
    }

    const defaultX = x !== null ? x : 50 + (this.windows.size * 30) % 250;
    const defaultY = y !== null ? y : 40 + (this.windows.size * 30) % 180;

    const winEl = document.createElement('div');
    winEl.className = 'aero-window active';
    winEl.id = `win-${id}`;
    winEl.style.width = `${width}px`;
    winEl.style.height = `${height}px`;
    winEl.style.left = `${defaultX}px`;
    winEl.style.top = `${defaultY}px`;
    winEl.style.zIndex = ++this.topZIndex;

    winEl.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title-left">
          <div class="window-icon">${icon}</div>
          <span class="window-title">${title}</span>
        </div>
        <div class="window-controls">
          <button class="win-btn win-btn-min" title="Minimizar">
            <svg viewBox="0 0 10 10"><rect y="8" width="10" height="2"/></svg>
          </button>
          <button class="win-btn win-btn-max" title="Maximizar">
            <svg class="icon-max" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
          </button>
          <button class="win-btn win-btn-close" title="Cerrar">
            <svg viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.8"/></svg>
          </button>
        </div>
      </div>
      <div class="window-content" id="content-${id}"></div>
      <div class="resize-handle resize-n"></div>
      <div class="resize-handle resize-s"></div>
      <div class="resize-handle resize-e"></div>
      <div class="resize-handle resize-w"></div>
      <div class="resize-handle resize-ne"></div>
      <div class="resize-handle resize-nw"></div>
      <div class="resize-handle resize-se"></div>
      <div class="resize-handle resize-sw"></div>
    `;

    this.desktopEl.appendChild(winEl);

    const winData = {
      id,
      title,
      icon,
      element: winEl,
      isMinimized: false,
      isMaximized: false,
      prevBounds: { x: defaultX, y: defaultY, width, height }
    };

    this.windows.set(id, winData);

    // Renderizar contenido y guardar función de limpieza si la hay
    const contentEl = winEl.querySelector(`#content-${id}`);
    if (renderContent) {
      const cleanup = renderContent(contentEl, winData);
      winData.cleanup = typeof cleanup === 'function' ? cleanup : null;
    }

    // Eventos de la ventana
    this.setupWindowInteractions(winData);
    this.focusWindow(id);
    sounds.playClick();

    if (this.taskbarUpdateCallback) {
      this.taskbarUpdateCallback(Array.from(this.windows.values()), this.activeWindowId);
    }

    return winData;
  }

  setupWindowInteractions(win) {
    const { element, id } = win;
    const titlebar = element.querySelector('.window-titlebar');

    // Clic para enfocar
    element.addEventListener('mousedown', () => {
      this.focusWindow(id);
    });

    // Botones de control
    element.querySelector('.win-btn-min').addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeWindow(id);
    });

    element.querySelector('.win-btn-max').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(id);
    });

    element.querySelector('.win-btn-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(id);
    });

    // Doble clic en barra de título para maximizar
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-controls')) return;
      this.toggleMaximize(id);
    });

    // Arrastre de ventana con Aero Snap
    this.setupDragging(win, titlebar);

    // Redimensionamiento
    this.setupResizing(win);
  }

  setupDragging(win, titlebar) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;
    let snapType = null; // 'top', 'left', 'right'

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      if (win.isMaximized) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = win.element.offsetLeft;
      initialY = win.element.offsetTop;

      document.body.style.cursor = 'move';
      this.focusWindow(win.id);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = initialX + dx;
      let newY = Math.max(0, initialY + dy);

      win.element.style.left = `${newX}px`;
      win.element.style.top = `${newY}px`;

      // Comprobar Aero Snap Triggers
      if (e.clientY <= 5) {
        snapType = 'top';
        this.showSnapPreview(0, 0, '100%', 'calc(100vh - 40px)');
      } else if (e.clientX <= 5) {
        snapType = 'left';
        this.showSnapPreview(0, 0, '50%', 'calc(100vh - 40px)');
      } else if (e.clientX >= window.innerWidth - 6) {
        snapType = 'right';
        this.showSnapPreview('50%', 0, '50%', 'calc(100vh - 40px)');
      } else {
        snapType = null;
        this.hideSnapPreview();
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.cursor = 'default';
      this.hideSnapPreview();

      if (snapType === 'top') {
        this.maximizeWindow(win.id);
      } else if (snapType === 'left') {
        this.snapWindow(win.id, 0, 0, window.innerWidth / 2, window.innerHeight - 40);
      } else if (snapType === 'right') {
        this.snapWindow(win.id, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight - 40);
      } else {
        win.prevBounds.x = win.element.offsetLeft;
        win.prevBounds.y = win.element.offsetTop;
      }
      snapType = null;
    });
  }

  showSnapPreview(left, top, width, height) {
    if (!this.snapPreviewEl) return;
    this.snapPreviewEl.style.display = 'block';
    this.snapPreviewEl.style.left = typeof left === 'number' ? `${left}px` : left;
    this.snapPreviewEl.style.top = typeof top === 'number' ? `${top}px` : top;
    this.snapPreviewEl.style.width = typeof width === 'number' ? `${width}px` : width;
    this.snapPreviewEl.style.height = typeof height === 'number' ? `${height}px` : height;
  }

  hideSnapPreview() {
    if (this.snapPreviewEl) {
      this.snapPreviewEl.style.display = 'none';
    }
  }

  setupResizing(win) {
    const handles = win.element.querySelectorAll('.resize-handle');
    handles.forEach(h => {
      let isResizing = false;
      let startX, startY, startWidth, startHeight, startLeft, startTop;

      h.addEventListener('mousedown', (e) => {
        if (win.isMaximized) return;
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = win.element.offsetWidth;
        startHeight = win.element.offsetHeight;
        startLeft = win.element.offsetLeft;
        startTop = win.element.offsetTop;
        e.stopPropagation();
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (h.classList.contains('resize-e') || h.classList.contains('resize-ne') || h.classList.contains('resize-se')) {
          win.element.style.width = `${Math.max(380, startWidth + dx)}px`;
        }
        if (h.classList.contains('resize-s') || h.classList.contains('resize-se') || h.classList.contains('resize-sw')) {
          win.element.style.height = `${Math.max(240, startHeight + dy)}px`;
        }
        if (h.classList.contains('resize-w') || h.classList.contains('resize-nw') || h.classList.contains('resize-sw')) {
          const newW = Math.max(380, startWidth - dx);
          if (newW > 380) {
            win.element.style.width = `${newW}px`;
            win.element.style.left = `${startLeft + dx}px`;
          }
        }
        if (h.classList.contains('resize-n') || h.classList.contains('resize-ne') || h.classList.contains('resize-nw')) {
          const newH = Math.max(240, startHeight - dy);
          if (newH > 240) {
            win.element.style.height = `${newH}px`;
            win.element.style.top = `${startTop + dy}px`;
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          win.prevBounds.width = win.element.offsetWidth;
          win.prevBounds.height = win.element.offsetHeight;
          win.prevBounds.x = win.element.offsetLeft;
          win.prevBounds.y = win.element.offsetTop;
        }
      });
    });
  }

  focusWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (win.isMinimized) {
      this.restoreWindow(id);
      return;
    }

    this.activeWindowId = id;
    this.windows.forEach(w => {
      if (w.id === id) {
        w.element.classList.remove('inactive');
        w.element.classList.add('active');
        w.element.style.zIndex = ++this.topZIndex;
      } else {
        w.element.classList.remove('active');
        w.element.classList.add('inactive');
      }
    });

    if (this.taskbarUpdateCallback) {
      this.taskbarUpdateCallback(Array.from(this.windows.values()), this.activeWindowId);
    }
  }

  deactivateAllWindows() {
    this.activeWindowId = null;
    this.windows.forEach(w => {
      w.element.classList.remove('active');
      w.element.classList.add('inactive');
    });
    if (this.taskbarUpdateCallback) {
      this.taskbarUpdateCallback(Array.from(this.windows.values()), null);
    }
  }

  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.isMinimized = true;
    win.element.classList.add('minimized');
    sounds.playClick();

    if (this.activeWindowId === id) {
      // Enfocar la siguiente ventana disponible
      const remaining = Array.from(this.windows.values()).filter(w => !w.isMinimized);
      if (remaining.length > 0) {
        this.focusWindow(remaining[remaining.length - 1].id);
      } else {
        this.activeWindowId = null;
      }
    }

    if (this.taskbarUpdateCallback) {
      this.taskbarUpdateCallback(Array.from(this.windows.values()), this.activeWindowId);
    }
  }

  restoreWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.isMinimized = false;
    win.element.classList.remove('minimized');
    this.focusWindow(id);
  }

  toggleMaximize(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (win.isMaximized) {
      this.unmaximizeWindow(id);
    } else {
      this.maximizeWindow(id);
    }
  }

  maximizeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.prevBounds = {
      x: win.element.offsetLeft,
      y: win.element.offsetTop,
      width: win.element.offsetWidth,
      height: win.element.offsetHeight
    };

    win.isMaximized = true;
    win.element.classList.add('maximized');
    this.focusWindow(id);
  }

  unmaximizeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    win.isMaximized = false;
    win.element.classList.remove('maximized');
    win.element.style.left = `${win.prevBounds.x}px`;
    win.element.style.top = `${win.prevBounds.y}px`;
    win.element.style.width = `${win.prevBounds.width}px`;
    win.element.style.height = `${win.prevBounds.height}px`;
    this.focusWindow(id);
  }

  snapWindow(id, x, y, width, height) {
    const win = this.windows.get(id);
    if (!win) return;

    win.isMaximized = false;
    win.element.classList.remove('maximized');
    win.element.style.left = `${x}px`;
    win.element.style.top = `${y}px`;
    win.element.style.width = `${width}px`;
    win.element.style.height = `${height}px`;
    this.focusWindow(id);
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (!win) return;

    // Ejecutar limpieza del módulo antes de eliminar el DOM
    if (win.cleanup) {
      try { win.cleanup(); } catch(e) {}
    }

    win.element.remove();
    this.windows.delete(id);
    sounds.playClick();

    if (this.activeWindowId === id) {
      const remaining = Array.from(this.windows.values()).filter(w => !w.isMinimized);
      if (remaining.length > 0) {
        this.focusWindow(remaining[remaining.length - 1].id);
      } else {
        this.activeWindowId = null;
      }
    }

    if (this.taskbarUpdateCallback) {
      this.taskbarUpdateCallback(Array.from(this.windows.values()), this.activeWindowId);
    }
  }

  minimizeAll() {
    this.windows.forEach(w => {
      this.minimizeWindow(w.id);
    });
  }

  getWindows() {
    return Array.from(this.windows.values());
  }
}

export const windowManager = new WindowManager();
