const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

class SurfaceBrowser{
  // Checks for the development environment
  constructor() {
    this.mainWindow = null;
    this.isDevMode = process.argv.includes('--dev') || !app.isPackaged;
  }

  createMainWindow(){
    this.mainWindow = new BrowserWindow({
      //Window sizing
      width:1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,

      //Titlebar Styling
      titleBarStyle: process.platform === 'darwin'? 'hiddenInset': 'hidden',
      frame:false,
      transparent:false,
      backgroundColor: '#1a1a1a',

      //smooth window behaviour
      show: false,
      vibrancy: 'ultra-dark',

      //Security Configurations
      webPreferences: {
        preload: path.join(__dirname,'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        webviewTag: true,
      }
    });
    //For loading the UI
    this.mainWindow.loadFile(path.join(__dirname,'index.html'));

    //If dev mode is enabled then open the dev tools
    if(this.isDevMode){
      this.mainWindow.webContents.openDevTools();
    }

    //Smooth Window animations and appearances
    this.mainWindow.once('ready-to-show',() =>{
      this.mainWindow.show();

      if (process.platform === 'win32'){
        this.mainWindow.setOpacity(0);
        let opacity = 0;
        const fadeIn = setInterval(()=>{
          opacity += 0.05;
          this.mainWindow.setOpacity(opacity);
          if(opacity>=1){
            clearInterval(fadeIn);
          }
        },16);
      }
    });

    //window events
    this.mainWindow.on('closed', ()=>{
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

    setupApplicationMenu() {
    // Remove default menu for cleaner look (like Arc/Zen)
    if (process.platform !== 'darwin') {
      Menu.setApplicationMenu(null);
    } else {
      // macOS requires a menu, so create minimal one
      const template = [
        {
          label: 'Surface Browser',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }
      ];
      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
  }
    setupIpcHandlers(){
      ipcMain.handle('window-minimize', ()=>{
        if(this.mainWindow){
          this.mainWindow.minimize();
        }
      });

      ipcMain.handle('window-maximize', () =>{
        if(this.mainWindow){
          if(this.mainWindow.isMaximized()){
            this.mainWindow.restore();
          }
          else{
            this.mainWindow.maximize();
          }
        }
      });

      ipcMain.handle('window-close', () => {
        if(this.mainWindow){
          this.mainWindow.close();
        }
      });
    }
}

const surfaceBrowser = new SurfaceBrowser();


// App event handlers
app.whenReady().then(() => {
  surfaceBrowser.setupApplicationMenu();
  surfaceBrowser.setupIpcHandlers();
  surfaceBrowser.createMainWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    surfaceBrowser.createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Export for other modules if needed
module.exports = { surfaceBrowser };

