const electron = require('electron');
const remote = require('electron').remote;
const url = require('url');
const path = require('path');
const { dialog } = require('electron')
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
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const Tray = electron.Tray;
const iconPath = path.join(__dirname,'images/ePrompto_png.png');

global.root_url = 'http://localhost/end_user_backend';
let reqPath = path.join(app.getAppPath(), '../');
const detail =  reqPath+"syskey.txt";
var csvFilename = reqPath + 'utilise.csv';
var time_file = reqPath + 'time_file.txt';

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
  //createWindow();

  const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    }
    
    //tray = new Tray(iconPath);

    log.transports.file.level = 'info';
    log.transports.file.maxSize = 5 * 1024 * 1024;
    log.transports.file.file = reqPath + '/log.log';
    log.transports.file.streamConfig = { flags: 'a' };
    log.transports.file.stream = fs.createWriteStream(log.transports.file.file, log.transports.file.streamConfig);
    log.transports.console.level = 'debug';
    
      session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
      .then((cookies) => {
        if(cookies.length == 0){
          if(fs.existsSync(detail)){
            fs.readFile(detail, 'utf8', function (err,data) {
            if (err) {
              return console.log(err);
            }
            
             var stats = fs.statSync(detail);
             var fileSizeInBytes = stats["size"];
             if(fileSizeInBytes > 0){
                 const cookie = {url: 'http://www.eprompto.com', name: data, value: '', expirationDate: 99999999999}
               session.defaultSession.cookies.set(cookie, (error) => {
                if (error) console.error(error)
               })
             }
          });
          }
        }else{
          if(fs.existsSync(detail)) {
             var stats = fs.statSync(detail);
           var fileSizeInBytes = stats["size"];
           if(fileSizeInBytes == 0){
                fs.writeFile(detail, cookies[0].name, function (err) { 
              if (err) return console.log(err);
            });
           }
          } else {
              fs.writeFile(detail, cookies[0].name, function (err) { 
            if (err) return console.log(err);
          });
          }
           
        }

        SetCron(cookies[0].name);

      }).catch((error) => {
        console.log(error)
      })

      let autoLaunch = new AutoLaunch({
        name: 'ePrompto',
      });
      autoLaunch.isEnabled().then((isEnabled) => {
        if (!isEnabled) autoLaunch.enable();
      });

      var now_datetime = new Date();
      var options = { hour12: false, timeZone: "Asia/Kolkata" };
      now_datetime = now_datetime.toLocaleString('en-US', options);
      var only_date = now_datetime.split(", ");

        fs.writeFile(time_file, now_datetime, function (err) { 
        if (err) return console.log(err);
      });

      setGlobalVariable();

});

function SetCron(sysKey){
  request({
    uri: root_url+"/main.php",
    method: "POST",
    form: {
      funcType: 'crontime',
      syskey: sysKey
    }
  }, function(error, response, body) {
    if(error){
      log.info('Error while fetching crontime');
    }else{
      output = JSON.parse(body);
      if(output.status == 'valid'){
          crontime_array = output.result;
          crontime_array.forEach(function(slot){ 
            cron.schedule("0 "+slot[0]+" "+slot[1]+" * * *", function() { 
            session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
              .then((cookies) => {
                if(cookies.length > 0){
                  slot_time = slot[1]+':'+slot[0];
                  //updateAssetUtilisation(slot_time);
                }
              }).catch((error) => {
                console.log(error)
              })
             }, {
               scheduled: true,
               timezone: "Asia/Kolkata" 
          });
          });
      }
    }
    
  });
}

function setGlobalVariable(){
  // tray.destroy();
  // tray = new Tray(iconPath);
  display = electron.screen.getPrimaryDisplay();
  width = display.bounds.width;

  si.system(function(data) {
    sys_OEM = data.manufacturer;
    sys_model = data.model;
    global.Sys_name = sys_OEM+' '+sys_model;
  });

  session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
    .then((cookies) => { 
      if(cookies.length > 0){ 
        require('dns').resolve('www.google.com', function(err) {
        if (err) {
           console.log("No connection");
           global.NetworkStatus = 'No';
        } else {
          console.log("CONNECTED");
          global.NetworkStatus = 'Yes';
           request({
            uri: root_url+"/main.php",
            method: "POST",
            form: {
              funcType: 'openFunc',
              sys_key: cookies[0].name
            }
          }, function(error, response, body) { 
            if(error){
              log.info('Error while fetching global data '+error);
                           
            }else{
              console.log('CONNECTED');
              output = JSON.parse(body); 
              if(output.status == 'valid'){ 
                asset_id = output.result[0];
                      client_id = output.result[1];
                  global.clientID = client_id;
                  global.NetworkStatus = 'Yes';
                  global.downloadURL = __dirname;
                  global.assetID = asset_id;
                  global.deviceID = output.result[3];
                  global.userName = output.loginPass[0];
                  global.loginid = output.loginPass[1];
                  global.sysKey = cookies[0].name;
                  //updateAsset(asset_id);

                  //SetCron(cookies[0].name);
                  //addAssetUtilisation(asset_id,client_id);
                  
              }
            }
            
          });
        }
      });


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

      mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
      });

      const gotTheLock = app.requestSingleInstanceLock();
      if (!gotTheLock) {
        app.quit();
      }

      // tray.on('click', function(e){
      //     if (mainWindow.isVisible()) {
      //       mainWindow.hide();
      //     } else {
      //       mainWindow.show();
      //     }
      // });


      mainWindow.on('close', function (e) {
        if (process.platform !== 'darwin') {
          app.quit();
        }
        // if (electron.app.isQuitting) {
        //  return
        // }
        // e.preventDefault()
        // mainWindow.hide()
        // if (child.isVisible()) {
        //     child.hide()
        //   } 
        //mainWindow = null;
       });

      //mainWindow.on('closed', () => app.quit());
      }
      else{
        startWindow = new BrowserWindow({
        width: 300,
        height: 400,
        icon: __dirname + '/images/ePrompto_png.png',
        //frame: false,
        x: width - 370,
            y: 310,
        webPreferences: {
                nodeIntegration: true
            }
      });

      startWindow.setMenuBarVisibility(false);

         startWindow.loadURL(url.format({
        pathname: path.join(__dirname,'are_you_member.html'),
        protocol: 'file:',
        slashes: true
      }));
      }
    }).catch((error) => {
      console.log(error)
    })    
}


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