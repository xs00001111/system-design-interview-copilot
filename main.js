const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register keyboard shortcuts
  globalShortcut.register('CommandOrControl+B', () => {
    if (mainWindow) mainWindow.setVisible(!mainWindow.isVisible());
  });

  globalShortcut.register('CommandOrControl+H', async () => {
    const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
    mainWindow.webContents.send('screenshot-sources', sources);
  });

  globalShortcut.register('CommandOrControl+Enter', () => {
    mainWindow.webContents.send('process-screenshots');
  });

  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) {
      mainWindow.setPosition(0, 0);
      mainWindow.setSize(1200, 800);
      mainWindow.setVisible(true);
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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
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

// Handle saving API key to .env file
ipcMain.on('save-api-key', (event, apiKey) => {
  const fs = require('fs');
  const envPath = path.join(__dirname, '.env');
  const envContent = `# OpenAI API Key\nOPENAI_API_KEY="${apiKey}"\n`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    event.reply('api-key-saved', true);
  } catch (error) {
    console.error('Error saving API key:', error);
    event.reply('api-key-saved', false);
  }
});