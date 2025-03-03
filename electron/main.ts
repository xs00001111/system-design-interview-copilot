import { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register keyboard shortcuts
  globalShortcut.register('CommandOrControl+B', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  globalShortcut.register('CommandOrControl+H', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    mainWindow?.webContents.send('screenshot-sources', sources);
  });

  globalShortcut.register('CommandOrControl+Enter', () => {
    mainWindow?.webContents.send('process-screenshots');
  });

  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) {
      mainWindow.setPosition(0, 0);
      mainWindow.setSize(1200, 800);
      mainWindow.show();
    }
  });

  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });

  // Arrow key window movement
  const moveStep = 50;
  globalShortcut.register('CommandOrControl+Up', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y - moveStep);
    }
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y + moveStep);
    }
  });

  globalShortcut.register('CommandOrControl+Left', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x - moveStep, y);
    }
  });

  globalShortcut.register('CommandOrControl+Right', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + moveStep, y);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC communication for audio recording
ipcMain.on('start-recording', (event) => {
  event.reply('start-recording-browser');
});

ipcMain.on('stop-recording', (event) => {
  event.reply('stop-recording-browser');
});

// Handle screenshot related IPC events
ipcMain.on('capture-screenshot', async (event) => {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
  event.reply('screenshot-captured', sources);
});
