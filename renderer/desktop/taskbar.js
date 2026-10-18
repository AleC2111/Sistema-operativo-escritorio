// Barra de Tareas (Taskbar) de Windows 7 Aero
import { windowManager } from './windowManager.js';
import { sounds } from '../../assets/audio/soundEffects.js';
import { simEngine } from '../kernel/simulationEngine.js';

export class Taskbar {
  constructor() {
    this.taskbarAppsEl = null;
    this.startBtnEl = null;
    this.clockEl = null;
    this.soundToggleEl = null;
    this.simSpeedBtnEl = null;
    this.showDesktopBtnEl = null;
  }

  init({ taskbarAppsElement, startButtonElement, clockElement, soundToggleElement, showDesktopButtonElement, onStartClick }) {
    this.taskbarAppsEl = taskbarAppsElement;
    this.startBtnEl = startButtonElement;
    this.clockEl = clockElement;
    this.soundToggleEl = soundToggleElement;
    this.showDesktopBtnEl = showDesktopButtonElement;

    // Conectar botón de inicio
    if (this.startBtnEl && onStartClick) {
      this.startBtnEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onStartClick();
        sounds.playClick();
      });
    }

    // Botón Mostrar Escritorio (Aero Peek)
    if (this.showDesktopBtnEl) {
      this.showDesktopBtnEl.addEventListener('click', () => {
        windowManager.minimizeAll();
        sounds.playClick();
      });
    }

    // Toggle de Sonido
    if (this.soundToggleEl) {
      this.soundToggleEl.addEventListener('click', () => {
        const isMuted = sounds.toggleMute();
        this.soundToggleEl.innerHTML = isMuted
          ? `<svg viewBox="0 0 16 16" width="14" height="14" fill="#ff6b6b"><path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/></svg>`
          : `<svg viewBox="0 0 16 16" width="14" height="14" fill="#ffffff"><path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.482 5.482 0 0 1 11.025 8a5.482 5.482 0 0 1-1.61 3.89l.706.706z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/></svg>`;
      });
    }

    // Iniciar reloj en tiempo real
    this.startClock();
  }

  startClock() {
    const updateTime = () => {
      if (!this.clockEl) return;
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();

      this.clockEl.innerHTML = `
        <span class="tray-clock-time">${hours}:${mins}</span>
        <span class="tray-clock-date">${day}/${month}/${year}</span>
      `;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  updateWindows(windowsList, activeWindowId) {
    if (!this.taskbarAppsEl) return;
    this.taskbarAppsEl.innerHTML = '';

    windowsList.forEach(win => {
      const itemEl = document.createElement('div');
      itemEl.className = 'taskbar-item' + (win.id === activeWindowId ? ' active' : '');
      itemEl.id = `taskbar-item-${win.id}`;

      itemEl.innerHTML = `
        <div class="taskbar-item-icon">${win.icon}</div>
        <span class="taskbar-item-title">${win.title}</span>
      `;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (win.isMinimized) {
          windowManager.restoreWindow(win.id);
        } else if (win.id === activeWindowId) {
          windowManager.minimizeWindow(win.id);
        } else {
          windowManager.focusWindow(win.id);
        }
        sounds.playClick();
      });

      this.taskbarAppsEl.appendChild(itemEl);
    });
  }
}

export const taskbar = new Taskbar();
