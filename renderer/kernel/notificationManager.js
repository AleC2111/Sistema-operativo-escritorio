// Gestor de Notificaciones y Toast Messages
import { sounds } from '../../assets/audio/soundEffects.js';

export const NotificationType = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.notificationHistory = [];
    this.maxHistory = 50;
  }

  init() {
    // Crear contenedor de notificaciones si no existe
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  }

  show(title, message, type = NotificationType.INFO, duration = 4000) {
    this.init();

    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date()
    };

    this.notifications.push(notification);
    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > this.maxHistory) {
      this.notificationHistory.pop();
    }

    // Reproducir sonido según tipo
    this.playSound(type);

    // Crear elemento DOM
    const toast = this.createToastElement(notification, duration);
    this.container.appendChild(toast);

    // Auto-remover después de la duración
    setTimeout(() => {
      this.remove(notification.id);
    }, duration);

    return notification.id;
  }

  createToastElement(notification, duration) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${notification.type}`;
    toast.dataset.id = notification.id;

    const icons = {
      [NotificationType.SUCCESS]: '✓',
      [NotificationType.INFO]: 'ℹ',
      [NotificationType.WARNING]: '⚠',
      [NotificationType.ERROR]: '✕'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[notification.type]}</div>
      <div class="toast-content">
        <div class="toast-title">${notification.title}</div>
        <div class="toast-message">${notification.message}</div>
      </div>
      <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    // Click para cerrar manualmente
    toast.addEventListener('click', () => {
      this.remove(notification.id);
    });

    return toast;
  }

  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }

    const toast = this.container.querySelector(`[data-id="${id}"]`);
    if (toast) {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  clearAll() {
    this.notifications.forEach(n => this.remove(n.id));
  }

  playSound(type) {
    switch (type) {
      case NotificationType.SUCCESS:
        sounds.playClick();
        break;
      case NotificationType.INFO:
        // Sonido sutil de notificación
        break;
      case NotificationType.WARNING:
        sounds.playError();
        break;
      case NotificationType.ERROR:
        sounds.playError();
        break;
    }
  }

  getHistory() {
    return this.notificationHistory;
  }

  // Métodos de conveniencia para notificaciones comunes
  success(title, message) {
    return this.show(title, message, NotificationType.SUCCESS);
  }

  info(title, message) {
    return this.show(title, message, NotificationType.INFO);
  }

  warning(title, message) {
    return this.show(title, message, NotificationType.WARNING);
  }

  error(title, message) {
    return this.show(title, message, NotificationType.ERROR);
  }
}

export const notificationManager = new NotificationManager();
