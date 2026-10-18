const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow = null;

// Elimina headers que bloquean la carga de sitios en el <webview>
function setupSessionHeaders() {
  // Aplica tanto a la sesión por defecto como a la partición del navegador
  const sessions = [session.defaultSession, session.fromPartition('persist:browser')];
  sessions.forEach(sess => {
    sess.webRequest.onHeadersReceived((details, callback) => {
      const headers = { ...details.responseHeaders };
      // Eliminar X-Frame-Options para permitir cargar en webview
      delete headers['x-frame-options'];
      delete headers['X-Frame-Options'];
      // Eliminar Content-Security-Policy restrictivas
      delete headers['content-security-policy'];
      delete headers['Content-Security-Policy'];
      delete headers['content-security-policy-report-only'];
      delete headers['Content-Security-Policy-Report-Only'];
      callback({ responseHeaders: headers });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1080,
    minHeight: 700,
    title: 'AeroOS - Simulador de Sistema Operativo',
    icon: path.join(__dirname, 'assets', 'icons', 'windows7.png'),
    frame: true,
    backgroundColor: '#0c2e4e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupSessionHeaders();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC communication endpoints
ipcMain.handle('system:getInfo', () => {
  return {
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Simulated Core i7',
    totalMemory: Math.round(os.totalmem() / (1024 * 1024)),
    platform: process.platform,
    arch: process.arch
  };
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});
