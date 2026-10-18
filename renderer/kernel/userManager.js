// Gestor de Usuarios y Sesiones del Sistema Operativo
export const UserRole = {
  STUDENT: 'Estudiante',
  TEACHER: 'Profesor',
  ADMIN: 'Administrador'
};

export class UserManager {
  constructor() {
    this.currentUser = null;
    console.log('UserManager inicializado');
    this.users = [
      {
        id: 'student',
        name: 'Estudiante',
        role: UserRole.STUDENT,
        avatar: 'ES',
        password: 'student',
        wallpaper: 'wallpaper-aurora',
        permissions: {
          canAccessSystem32: false,
          canChangeSystemSettings: false,
          canManageUsers: false,
          canKillSystemProcesses: false
        },
        personalFiles: [
          { name: 'Tarea_SO.pdf', type: 'Documento PDF', size: '2.5 MB', date: '12/10/2026' },
          { name: 'Notas_Clase.txt', type: 'Documento de texto', size: '15 KB', date: '12/10/2026' },
          { name: 'Proyecto_Python.py', type: 'Archivo Python', size: '8 KB', date: '11/10/2026' }
        ]
      },
      {
        id: 'teacher',
        name: 'Profesor',
        role: UserRole.TEACHER,
        avatar: 'PR',
        password: 'teacher',
        wallpaper: 'wallpaper-nature',
        permissions: {
          canAccessSystem32: false,
          canChangeSystemSettings: true,
          canManageUsers: false,
          canKillSystemProcesses: true
        },
        personalFiles: [
          { name: 'Syllabus_2026.pdf', type: 'Documento PDF', size: '1.8 MB', date: '10/10/2026' },
          { name: 'Calificaciones.xlsx', type: 'Hoja de cálculo', size: '45 KB', date: '12/10/2026' },
          { name: 'Presentacion.pptx', type: 'Presentación', size: '5.2 MB', date: '11/10/2026' },
          { name: 'Recursos_Teaching/', type: 'Carpeta', size: '-', date: '10/10/2026' }
        ]
      },
      {
        id: 'admin',
        name: 'Administrador',
        role: UserRole.ADMIN,
        avatar: 'AD',
        password: 'admin',
        wallpaper: 'wallpaper-dark',
        permissions: {
          canAccessSystem32: true,
          canChangeSystemSettings: true,
          canManageUsers: true,
          canKillSystemProcesses: true
        },
        personalFiles: [
          { name: 'System32/', type: 'Carpeta del Sistema', size: '-', date: '08/10/2026' },
          { name: 'Configuracion.ini', type: 'Archivo de configuración', size: '2 KB', date: '08/10/2026' },
          { name: 'Logs_Sistema/', type: 'Carpeta', size: '-', date: '08/10/2026' },
          { name: 'Backup_Completo.zip', type: 'Archivo comprimido', size: '450 MB', date: '09/10/2026' }
        ]
      }
    ];
    this.isLocked = false;
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(cb => cb(event, data));
  }

  login(userId, password) {
    console.log('userManager.login llamado con:', userId, password);
    const user = this.users.find(u => u.id === userId);
    console.log('Usuario encontrado:', user);
    console.log('Comparación de contraseñas:', user?.password, '===', password, '=', user?.password === password);

    if (user && user.password === password) {
      this.currentUser = user;
      this.notify('login', user);
      console.log('Login exitoso para:', user.name);
      return true;
    }
    console.log('Login fallido');
    return false;
  }

  logout() {
    const prevUser = this.currentUser;
    this.currentUser = null;
    this.notify('logout', prevUser);
  }

  lock() {
    this.isLocked = true;
    this.notify('lock', this.currentUser);
  }

  unlock(userId, password) {
    const user = this.users.find(u => u.id === userId);
    if (user && user.password === password) {
      this.isLocked = false;
      this.currentUser = user;
      this.notify('unlock', user);
      return true;
    }
    return false;
  }

  hasPermission(permission) {
    if (!this.currentUser) return false;
    return this.currentUser.permissions[permission] === true;
  }

  getUserPersonalFiles() {
    if (!this.currentUser) return [];
    return this.currentUser.personalFiles;
  }

  getUserWallpaper() {
    if (!this.currentUser) return 'wallpaper-aurora';
    return this.currentUser.wallpaper;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAllUsers() {
    return this.users;
  }
}

export const userManager = new UserManager();
