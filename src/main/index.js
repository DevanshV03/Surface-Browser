const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

class BookmarkManager {
  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'bookmarks.json');
  }

  saveBookmarkTab(tab) {
    const current = this.loadBookmarkTabs();
    const exists = current.find(t => t.url === tab.url);
    if (exists) return exists;

    let toBookmark = {
      bookmarkId: `bookmark-${Date.now()}`,
      url: tab.url,
      title: tab.title,
      favicon: tab.favicon,
      timestamp: Date.now()
    }

    current.push(toBookmark);
    fs.writeFileSync(this.dataPath, JSON.stringify({ bookmarks: current }, null, 2));

    return toBookmark;
  }

  loadBookmarkTabs() {
    if (!fs.existsSync(this.dataPath)) return [];
    return JSON.parse(fs.readFileSync(this.dataPath)).bookmarks || [];
  }
  deleteBookmark(bookmarkId) {
    const current = this.loadBookmarkTabs();
    const filteredBookmarks = current.filter(bookmark => bookmark.bookmarkId !== bookmarkId);

    // Only write if something was actually removed
    if (filteredBookmarks.length !== current.length) {
      fs.writeFileSync(this.dataPath, JSON.stringify({ bookmarks: filteredBookmarks }, null, 2));
      console.log(`Bookmark ${bookmarkId} deleted successfully`);
      return true; // Success
    }

    console.log(`Bookmark ${bookmarkId} not found`);
    return false; // Not found
  }
}

class SurfaceBrowser {
  // Checks for the development environment
  constructor() {
    this.mainWindow = null;
    this.isDevMode = process.argv.includes('--dev') || !app.isPackaged;
    this.bookmarkManager = new BookmarkManager();
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      //Window sizing
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,

      //Titlebar Styling
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
      frame: false,
      transparent: false,
      backgroundColor: '#1a1a1a',

      //smooth window behaviour
      show: false,
      vibrancy: 'ultra-dark',

      //Security Configurations
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, '../preload/index.js')
          : path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        webviewTag: true,
        devTools: true,
      }

    });
    if (app.isPackaged) {
      // Production: Load built HTML file
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      this.mainWindow.webContents.on('before-input-event',(event,input)=>{
        if(input.key === 'F12'){
          this.mainWindow.webContents.openDevTools();
        }
      });
    } else {
      // Development: Load Vite dev server
      this.mainWindow.loadURL('http://localhost:5173');
    }

    //If dev mode is enabled then open the dev tools
    if (this.isDevMode) {
      this.mainWindow.webContents.openDevTools();
    }

    //Smooth Window animations and appearances
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();

      if (process.platform === 'win32') {
        this.mainWindow.setOpacity(0);
        let opacity = 0;
        const fadeIn = setInterval(() => {
          opacity += 0.05;
          this.mainWindow.setOpacity(opacity);
          if (opacity >= 1) {
            clearInterval(fadeIn);
          }
        }, 16);
      }
    });

    //window events
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    console.log("Bookmark Manager Created Successfully");
    console.log("Bookmark file path:", this.bookmarkManager.dataPath);
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
  setupIpcHandlers() {
    ipcMain.handle('window-minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });

    ipcMain.handle('window-maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.restore();
        }
        else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.handle('window-close', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });

    ipcMain.handle('add-bookmark', (event, tabData) => {
      const savedBookmark = surfaceBrowser.bookmarkManager.saveBookmarkTab(tabData);
      return savedBookmark;
    });

    ipcMain.handle('load-bookmarks', () => {
      return surfaceBrowser.bookmarkManager.loadBookmarkTabs();
    })

    ipcMain.handle('delete-bookmark', (event, bookmarkId) => {
      const success = surfaceBrowser.bookmarkManager.deleteBookmark(bookmarkId);
      return { success, bookmarkId };
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

