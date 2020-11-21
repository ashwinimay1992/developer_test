const electron = require('electron');
const remote = require('electron').remote;
const url = require('url');
const path = require('path');
const { dialog } = require('electron');
const { session } = require('electron');
const AutoLaunch = require('auto-launch');
const si = require('systeminformation');
const fs = require("fs");
const log = require("electron-log");
const {app, BrowserWindow, screen, ipcMain} = electron;
const { autoUpdater } = require('electron-updater');

global.root_url = 'http://localhost/end_user_backend';

let reqPath = path.join(app.getAppPath(), '../');
const detail =  reqPath+"syskey.txt";
var csvFilename = reqPath + 'utilise.csv';
var time_file = reqPath + 'time_file.txt';

let mainWindow;

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

app.on('ready',function(){

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

        //SetCron(cookies[0].name);

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


    // session.defaultSession.clearStorageData([], function (data) {
    //     console.log(data);
    // })

     
});

function setGlobalVariable(){
  //tray.destroy();
  //tray = new Tray(iconPath);
  display = electron.screen.getPrimaryDisplay();
  width = display.bounds.width;

  si.system(function(data) {
    sys_OEM = data.manufacturer;
    sys_model = data.model;
    global.Sys_name = sys_OEM+' '+sys_model;
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
       });

  // session.defaultSession.cookies.get({ url: 'http://www.eprompto.com' })
  //   .then((cookies) => { 
  //     if(cookies.length > 0){ 
  //       require('dns').resolve('www.google.com', function(err) {
  //       if (err) {
  //          console.log("No connection");
  //          global.NetworkStatus = 'No';
  //       } else {
  //         console.log("CONNECTED");
  //         global.NetworkStatus = 'Yes';
  //          request({
  //           uri: root_url+"/main.php",
  //           method: "POST",
  //           form: {
  //             funcType: 'openFunc',
  //             sys_key: cookies[0].name
  //           }
  //         }, function(error, response, body) { 
  //           if(error){
  //             log.info('Error while fetching global data '+error);
                           
  //           }else{
  //             console.log('CONNECTED');
  //             output = JSON.parse(body); 
  //             if(output.status == 'valid'){ 
  //               asset_id = output.result[0];
  //                     client_id = output.result[1];
  //                 global.clientID = client_id;
  //                 global.NetworkStatus = 'Yes';
  //                 global.downloadURL = __dirname;
  //                 global.assetID = asset_id;
  //                 global.deviceID = output.result[3];
  //                 global.userName = output.loginPass[0];
  //                 global.loginid = output.loginPass[1];
  //                 global.sysKey = cookies[0].name;
  //                 //updateAsset(asset_id);

  //                 //SetCron(cookies[0].name);
  //                 //addAssetUtilisation(asset_id,client_id);
                  
  //             }
  //           }
            
  //         });
  //       }
  //     });

  //     //mainWindow.on('closed', () => app.quit());
  //     }
  //     else{
  //       startWindow = new BrowserWindow({
  //       width: 300,
  //       height: 400,
  //       icon: __dirname + '/images/ePrompto_png.png',
  //       //frame: false,
  //       x: width - 370,
  //           y: 310,
  //       webPreferences: {
  //               nodeIntegration: true
  //           }
  //     });

  //     startWindow.setMenuBarVisibility(false);

  //        startWindow.loadURL(url.format({
  //       pathname: path.join(__dirname,'are_you_member.html'),
  //       protocol: 'file:',
  //       slashes: true
  //     }));
  //     }
  //   }).catch((error) => {
  //     console.log(error)
  //   })    
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