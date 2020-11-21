const { app, BrowserWindow, screen, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const electron = require('electron');
const remote = require('electron').remote;
const url = require('url');
const path = require('path');
const { dialog } = require('electron');

let mainWindow;
let width;

function createWindow () {

  display = electron.screen.getPrimaryDisplay();
  width = display.bounds.width;

  mainWindow = new BrowserWindow({
    width: 300,
    height: 470,
    icon: __dirname + '/images/ePrompto_png.png',
    titleBarStyle: 'hiddenInset',
    //frame: false,
    x: width - 370,
        y: 250,
    webPreferences: {
            nodeIntegration: true
        }
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});