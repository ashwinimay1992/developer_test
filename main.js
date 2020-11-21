const electron = require('electron');
const remote = require('electron').remote;
const url = require('url');
const path = require('path');
const { dialog } = require('electron');
const os = require('os');
const si = require('systeminformation');
const mysql = require('mysql');
const ip = require('ip');
const { session } = require('electron');
const osu = require('node-os-utils');
const request = require("request");
const cron = require('node-cron'); 
const fs = require("fs");
const log = require("electron-log");
const exec = require('child_process').exec;
const AutoLaunch = require('auto-launch');
const nodeDiskInfo = require('node-disk-info');
const mv = require('mv');
const uuid = require('node-machine-id');
const psList = require('ps-list');
const csv = require('csvtojson');
const serialNumber = require('serial-number');
const { autoUpdater } = require('electron-updater');

const Tray = electron.Tray;
//const iconPath = path.join(__dirname,'images/ePrompto_png.png');

global.root_url = 'http://localhost/end_user_backend';

const {app, BrowserWindow, screen, ipcMain} = electron;
//let reqPath = path.join(app.getAppPath(), '../');
// const detail =  reqPath+"syskey.txt";
// var csvFilename = reqPath + 'utilise.csv';
// var time_file = reqPath + 'time_file.txt';

let mainWindow;
let categoryWindow;
let settingWindow;
let display;
let width;
let startWindow;
let tabWindow;
let child;
let ticketIssue;

let tray = null;
let count = 0;
var crontime_array = [];

let loginWindow;
let regWindow;
let forgotWindow;
let ticketWindow;
let quickUtilWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadFile('index.html');
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