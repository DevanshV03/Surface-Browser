const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
const Database = require('better-sqlite3');


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

class HistoryStorage {
  constructor() {
    this.db = new Database(path.join(app.getPath('userData'), 'history.db'));
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history_visits(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      favicon TEXT,
      visit_time INTEGER NOT NULL,
      visit_count INTEGER DEFAULT 1
      )
      `);
  }

  addVisit(visitData) {
    const stmt = this.db.prepare(`
    INSERT OR REPLACE INTO history_visits (url, title, favicon, visit_time, visit_count)
    VALUES (?, ?, ?, ?, 1)
  `);
    return stmt.run(visitData.url, visitData.title, visitData.favicon, visitData.timestamp);
  }

  async loadHistoryData(limit = 50) {
    const stmt = this.db.prepare(`
    SELECT url, title, favicon, visit_time 
    FROM history_visits 
    ORDER BY visit_time DESC 
    LIMIT ?
    `)
    return stmt.all(limit);
  }

}

class SurfaceBrowser {
  // Checks for the development environment
  constructor() {
    this.mainWindow = null;
    this.isDevMode = process.argv.includes('--dev') || !app.isPackaged;
    this.bookmarkManager = new BookmarkManager();
    this.historyStorage = new HistoryStorage();
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
      this.mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
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
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            this.mainWindow.webContents.executeJavaScript(`
              if (window.surfaceBrowserTabActions) {
                window.surfaceBrowserTabActions.addTab();
              }
            `);
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            this.mainWindow.webContents.executeJavaScript(`
              if (window.surfaceBrowserTabActions) {
                const activeTabId = window.surfaceBrowserTabActions.getActiveTabId();
                const allTabs = window.surfaceBrowserTabActions.getAllTabs();
                if (allTabs.length > 1) {
                  window.surfaceBrowserTabActions.removeTab(activeTabId);
                }
              }
            `);
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'History',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            this.mainWindow.webContents.executeJavaScript(`
              if (window.surfaceBrowser && window.surfaceBrowser.historyService) {
                window.surfaceBrowser.historyService.isHistoryPanelOpen 
                  ? window.surfaceBrowser.historyService.closeHistoryPanel()
                  : window.surfaceBrowser.historyService.openHistoryPanel();
              }
            `);
          }
        },
        {
          label: 'Focus Address Bar',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            this.mainWindow.webContents.executeJavaScript(`
              const urlInput = document.getElementById('url-input');
              if (urlInput) {
                urlInput.focus();
                urlInput.select();
              }
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Reload Page',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            // Refresh the webview
            this.mainWindow.webContents.executeJavaScript(`
              if (window.surfaceBrowser && window.surfaceBrowser.activeWebview) {
                console.log('Reloading active webview...');
                window.surfaceBrowser.activeWebview.reload();
              } else {
                console.log('No active webview to reload');
              }
            `);
          }
        },
        {
          label: 'Hard Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            //Hard Refresh
            this.mainWindow.webContents.executeJavaScript(`
              if (window.surfaceBrowser && window.surfaceBrowser.activeWebview) {
                console.log('Hard reloading active webview...');
                window.surfaceBrowser.activeWebview.reloadIgnoringCache();
              } else {
                console.log('No active webview to hard reload');
              }
            `);
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  if (process.platform !== 'darwin') {
    this.mainWindow.setMenuBarVisibility(false);
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

    ipcMain.handle('addHistoryEntry', async (event, historyData) => {
      return this.historyStorage.addVisit(historyData);
    });
    ipcMain.handle('loadHistoryData', async (event, limit) => {
      return this.historyStorage.loadHistoryData(limit);
    });
  }
}

const surfaceBrowser = new SurfaceBrowser();


// App event handlers
app.whenReady().then(() => {
  surfaceBrowser.setupIpcHandlers();
  surfaceBrowser.createMainWindow();
  surfaceBrowser.setupApplicationMenu();
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

