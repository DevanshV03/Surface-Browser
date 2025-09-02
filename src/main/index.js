const { app, BrowserWindow, Menu, ipcMain, clipboard } = require('electron');
const path = require('node:path');
/*eslint-disable*/
const fs = require('fs');
const Database = require('better-sqlite3');
const OAUTH_PATTERNS = {
  OAUTH: '/oauth',
  OAUTH2: '/oauth2',
  AUTHORIZE: '/authorize',
  AUTH: '/auth',
  LOGIN: '/login/oauth'
};

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
    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      console.log('Global window open:', details.url);

      // renderer handles it via IPC
      this.mainWindow.webContents.executeJavaScript(`
        if (window.surfaceBrowser && window.surfaceBrowser.popupService) {
          const event = {
            url: '${details.url}',
            disposition: '${details.disposition || 'new-window'}',
            preventDefault: () => {}
          };
          window.surfaceBrowser.popupService.handleNewWindow(event);
        }
      `);

      return { action: 'deny' };
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

  createOAuthPopup(url, options = {}) {
    try {
      console.log('Creating OAuth popup for:', url);

      const popupWindow = new BrowserWindow({
        width: 500,
        height: 700,
        parent: this.mainWindow,
        frame: true,
        modal: false,
        titleBarStyle: 'default',
        alwaysOnTop: true,
        center: true,
        show: true,
        resizable: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true
        }
      });

      popupWindow.loadURL(url);

      const timeout = setTimeout(() => {
        if (!popupWindow.isDestroyed()) {
          console.log('OAuth popup timed out after 5 minutes');
          this.showInBrowserNotification('OAuth login timed out', 'warning');
          popupWindow.close();
        }
      }, 300000);
      popupWindow.on('closed', () => {
        clearTimeout(timeout);
        console.log('OAuth popup closed, timeout cleared');
    });

      // Setup postMessage listener for OAuth completion
      popupWindow.webContents.on('did-finish-load', () => {
        popupWindow.webContents.executeJavaScript(`
          window.addEventListener('message', (event) => {
            console.log('OAuth message received:', event);
            
            if (event.data && (event.data.type === 'oauth' || event.data.access_token)) {
              console.log('OAUTH_SUCCESS via postMessage');
              
              window.postMessage({
                type: 'OAUTH_COMPLETE',
                data: event.data,
                origin: event.origin
              });
            }
          });
        `);
      });

      // Listen for OAuth completion via URL navigation
      popupWindow.webContents.on('did-navigate', (event, navigationUrl) => {
        console.log('Popup navigated to:', navigationUrl);

        if (this.isOAuthCallback(navigationUrl)) {
          console.log('OAuth completed successfully');

          // Show in-browser notification instead of system notification
          this.showInBrowserNotification('OAuth authentication completed successfully!', 'success');

          // Notify main window
          this.mainWindow.webContents.send('oauth-success', {
            url: navigationUrl,
            timestamp: Date.now()
          });

          // Auto-close popup after 1 second
          setTimeout(() => {
            if (!popupWindow.isDestroyed()) {
              popupWindow.close();
            }
          }, 1000);
        }
      });

      console.log('OAuth popup created successfully');
      return popupWindow;
    } catch (error) {
      console.error("Failed to create popup window", error);
      throw error;
    }
  }

  isOAuthCallback(url) {
    try {
      // Only detect COMPLETION patterns, not initial OAuth URLs
      const callbackPatterns = [
        '/oauth/callback',
        '/auth/callback',
        '/oauth2/callback',
        '/login/callback'
      ];

      // OAuth completion URL parameters (tokens/codes received)
      const completionParams = [
        'code=',           // Authorization code received
        'access_token=',   // Direct token received  
        'error=',          // OAuth error received
        'state='           // OAuth state parameter (callback indicator)
      ];

      // Must have BOTH callback path AND completion parameters
      const hasCallbackPath = callbackPatterns.some(pattern => url.includes(pattern));
      const hasCompletionParam = completionParams.some(param => url.includes(param));

      return hasCallbackPath || hasCompletionParam;
    } catch (error) {
      console.error('Error checking OAuth callback:', error);
      return false;
    }
  }


  // Helper method - add this after isOAuthCallback
  showInBrowserNotification(message, type = 'info') {
    try {
      // Send notification to renderer process to display in browser UI
      this.mainWindow.webContents.executeJavaScript(`
        if (window.surfaceBrowser && window.surfaceBrowser.showNotification) {
          window.surfaceBrowser.showNotification('${message}', '${type}');
        } else {
          console.log('${type.toUpperCase()}: ${message}');
        }
      `);
    } catch (error) {
      console.error('Failed to show in-browser notification:', error);
    }
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
    ipcMain.handle('copyUrl-clipboard', (event, url) => {
      clipboard.writeText(url);
    });
    ipcMain.handle('create-oauth-popup', async (event, url, options = {}) => {
      try {
        const popup = this.createOAuthPopup(url, options);
        return { success: true, popupId: popup.id }
      } catch (error) {
        console.error("IPC OAuth popup creation failed", error);
        return { success: false, error: error.message }
      }
    });
    ipcMain.handle('open-external', async (event, url) => {
      const { shell } = require('electron');
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
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

