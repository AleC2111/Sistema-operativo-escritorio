// Menú Inicio (Start Menu) de Windows 7
import { sounds } from '../../assets/audio/soundEffects.js';
import { simEngine } from '../kernel/simulationEngine.js';

export class StartMenu {
  constructor() {
    this.element = null;
    this.isOpen = false;
    this.onAppLaunch = null;
    this.onSendToDesktop = null;
  }

  init(startMenuElement, appItems, onAppLaunch, onSendToDesktop) {
    this.element = startMenuElement;
    this.onAppLaunch = onAppLaunch;
    this.onSendToDesktop = onSendToDesktop;

    // Renderizar lista de aplicaciones
    this.renderApps(appItems);

    // Eventos de búsqueda en tiempo real
    const searchInput = this.element.querySelector('.start-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = this.element.querySelectorAll('.start-item');
        items.forEach(item => {
          const title = item.querySelector('.start-item-title').textContent.toLowerCase();
          const desc = item.querySelector('.start-item-desc').textContent.toLowerCase();
          if (title.includes(query) || desc.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    // Botones de energía
    const restartBtn = this.element.querySelector('#start-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.close();
        sounds.playStartup();
        simEngine.reset();
      });
    }

    const shutdownBtn = this.element.querySelector('#start-shutdown-btn');
    if (shutdownBtn) {
      shutdownBtn.addEventListener('click', () => {
        this.close();
        sounds.playError();
        alert('Simulación del Sistema Operativo apagada. Haz clic en Reiniciar para iniciar un nuevo ciclo.');
        simEngine.pause();
      });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('mousedown', (e) => {
      if (this.isOpen && !this.element.contains(e.target) && !e.target.closest('#start-button')) {
        this.close();
      }
    });
  }

  renderApps(appItems) {
    const listEl = this.element.querySelector('.start-menu-left');
    if (!listEl) return;
    listEl.innerHTML = '';

    appItems.forEach(app => {
      const itemEl = document.createElement('div');
      itemEl.className = 'start-item';
      itemEl.title = `Clic izquierdo: Abrir\nClic derecho: Colocar en el escritorio`;
      itemEl.innerHTML = `
        <div class="start-item-icon">${app.icon}</div>
        <div class="start-item-text">
          <span class="start-item-title">${app.title}</span>
          <span class="start-item-desc">${app.description}</span>
        </div>
      `;

      // Clic izquierdo abre la app
      itemEl.addEventListener('click', () => {
        this.close();
        if (this.onAppLaunch) {
          this.onAppLaunch(app.id);
        }
      });

      // Clic derecho permite enviar al escritorio
      itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onSendToDesktop) {
          this.onSendToDesktop(app.id);
          this.close();
        }
      });

      listEl.appendChild(itemEl);
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.element.classList.add('open');
    const searchInput = this.element.querySelector('.start-search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  }

  close() {
    this.isOpen = false;
    this.element.classList.remove('open');
  }
}

export const startMenu = new StartMenu();
