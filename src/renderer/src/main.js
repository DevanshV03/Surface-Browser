import React from 'react';
import { createRoot } from 'react-dom/client';
import TabSidebar from './components/TabSidebar';
import { DOMElements,safeGetElement } from './utils/domUtils';

// Surface Browser - URL Navigation and Web Engine
class SurfaceBrowserRenderer {
  constructor() {
    this.currentUrl = '';
    this.webviews = new Map(); // Store multiple webviews
    this.activeWebview = null;
    this.reactTabsRef = null; // Reference to React tab system
    this.init();
  }

  init() {
    this.setupUrlNavigation();
    this.setupWindowControls();
    this.setupNavigationControls();
    this.handleBookmark();
    this.mountReactTabs();
    this.initializeDefaultTab();
  }

  initializeDefaultTab() {
    // Create webview for the default tab immediately
    const defaultTabData = {
      id: 1,
      url: '',
      webviewId: 'webview-1',
      title: 'New Tab',
      favicon: '🌐'
    };

    setTimeout(() => {
      this.handleTabSwitch(1, defaultTabData);
    }, 100); // Small delay to ensure DOM is ready
  }

  mountReactTabs() {
    const mountPoint = document.querySelector('#react-tab-mount');
    if (mountPoint) {
      const root = createRoot(mountPoint);
      const tabSidebarElement = React.createElement(TabSidebar, {
        onTabSwitch: this.handleTabSwitch.bind(this),
        onTabAdd: this.handleTabAdd.bind(this),
        onTabRemove: this.handleTabRemove.bind(this),

        registerUpdateTab: fn => { this.reactUpdateTab = fn; }
      });
      root.render(tabSidebarElement); // Use the element with props
      console.log('React TabSidebar mounted successfully');
    }
  }


 // Handle tab switching from React components
handleTabSwitch(tabId, tabData) {
  console.log(' Switching to tab:', tabId, tabData);
  
  if (!tabData) {
    console.log(' Tab switch aborted - tabData is undefined for tab:', tabId);
    return;
  }
  
  this.currentTabData = tabData;

  // Hide all webviews
  this.webviews.forEach(webview => {
    webview.style.display = 'none';
  });


  const urlInput = safeGetElement(DOMElements.urlInput,'url-input');
  if (urlInput) {
    if (tabData.url && tabData.url.trim() !== '') {
      const displayUrl = tabData.url.replace(/^https?:\/\//, '');
      urlInput.value = displayUrl;
      console.log('URL bar updated to:', displayUrl);
    } else {
      urlInput.value = '';
      console.log('URL bar cleared for empty tab');
    }
  }

  // Only create/show webview if there's a valid URL
  if (tabData && tabData.url && tabData.url.trim() !== '') {
    let activeWebview = this.webviews.get(tabId);
    if (!activeWebview) {
      activeWebview = this.createWebviewForTab(tabId, tabData);
    }

    if (activeWebview) {
      activeWebview.style.display = 'flex';
      this.activeWebview = activeWebview;
      this.showWebContent(); // Hide welcome screen

      setTimeout(() => {
        this.updateNavigationControls();

        // if (activeWebview.src) {
        //   this.updateUrlBar(activeWebview.src);
        // }
      }, 100);
    }
  } else {
    // No URL - keep welcome screen visible and no active webview
    this.activeWebview = null;
    const welcomeScreen = safeGetElement(DOMElements.welcomeScreen,'welcome-screen');
    const webContainer = safeGetElement(DOMElements.webContainer,'web-container');

    if (welcomeScreen) welcomeScreen.classList.remove('hidden');
    if (webContainer) webContainer.classList.add('hidden');

    console.log('Empty tab - showing welcome screen');
  }
}



  handleBookmark() {
    const bookmarkBtn = safeGetElement(DOMElements.bookmarkBtn,'bookmark-btn');

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener("click", () => {

        console.log("bookmark button clicked");
        const tabData = {
          url: this.currentTabData.url,
          title: this.currentTabData.title,
          favicon: this.currentTabData.favicon
        };

        window.electronAPI.addBookmark(tabData);
      });
    }
  }

  // Handle new tab creation
  handleTabAdd(tabId, tabData) {
    console.log('Creating webview for new tab:', tabId);
    // If the tab has content, then it's intentional (like bookmark), so switch
  if (tabData && tabData.url && tabData.url.trim() !== '') {
    this.handleTabSwitch(tabId, tabData);
  } else {
    // Just log that a new empty tab was created, don't switch to it
    console.log('New empty tab created, staying on current tab');
  }
}

  // Handle tab removal
  handleTabRemove(tabId) {
    console.log('Removing webview for tab:', tabId);
    const webview = this.webviews.get(tabId);
    if (webview && webview.parentNode) {
      webview.parentNode.removeChild(webview);
    }
    this.webviews.delete(tabId);
  }

  // Create webview for specific tab
  createWebviewForTab(tabId, tabData) {
    const webContainer = safeGetElement(DOMElements.webContainer, 'web-container');

    if (webContainer) {
      const webview = document.createElement('webview');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'none'; // Hidden by default
      webview.src = tabData?.url || '';
      webview.id = tabData?.webviewId || `webview-${tabId}`;

      // Add event listeners for this specific webview
      webview.addEventListener('did-navigate', (event) => {
  if (this.activeWebview === webview) {
    this.currentUrl = event.url;
    if (this.currentTabData) {
      this.currentTabData = {
        ...this.currentTabData,
        url: event.url,
      };
      
      // Update React tab state when navigating
      this.reactUpdateTab?.(tabId, { url: event.url });
    }
    this.updateUrlBar(event.url);
    this.updateNavigationControls();
  }
});

      webview.addEventListener('page-title-updated', (event) => {
        if (this.activeWebview === webview) {
          if (this.currentTabData) {
            this.currentTabData = {
              ...this.currentTabData,
              title: event.title
            }
          }
        }
      });

      webview.addEventListener('dom-ready', () => {
        if (this.activeWebview === webview) {
          console.log('Page loaded successfully for tab:', tabId);


          setTimeout(() => {
            try {
              const url = new URL(webview.src);
              const possibleFavicons = [
                `${url.origin}/favicon.ico`,
                `${url.origin}/favicon.png`,
                `${url.origin}/apple-touch-icon.png`,
                `${url.origin}/android-chrome-192x192.png`
              ];

              // Use the first favicon URL (most sites have /favicon.ico)
              const faviconUrl = possibleFavicons[0];
              console.log('Using favicon URL:', faviconUrl);

              if (this.currentTabData) {
                this.currentTabData = {
                  ...this.currentTabData,
                  favicon: faviconUrl
                };
                this.reactUpdateTab?.(tabId, { favicon: faviconUrl });
                console.log('Updated favicon in currentTabData');
              }
            } catch (error) {
              console.log('could not find favicon, error:', error);
              if (this.currentTabData) {
                this.currentTabData = {
                  ...this.currentTabData,
                  favicon: '🌐'
                };
                this.reactUpdateTab?.(tabId, { favicon: '🌐' });
              }
            }
          }, 300);
          this.updateNavigationControls();
        }
      });

      this.setupLoadingStateForWebview(webview);

      // Store webview reference
      this.webviews.set(tabId, webview);
      webContainer.appendChild(webview);

      return webview;
    }
    return null;
  }

  // Handle URL input and navigation
  setupUrlNavigation() {
    const urlInput = safeGetElement(DOMElements.urlInput, 'url-input');

    if (urlInput) {
      // Navigate when user presses Entertitle: {tab.title},
      urlInput.value = '';
      urlInput.placeholder = 'Search or Enter Web Address...';
      urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const inputValue = urlInput.value.trim();
          if (inputValue) {
            this.navigateToUrl(inputValue);
          }
        }
      });

      // Select all text when URL bar is focused
      urlInput.addEventListener('focus', () => {
        urlInput.select();
      });
    }
  }

  // Navigate to URL with smart handling - now works with active webview
  navigateToUrl(input) {
    let url = input.trim();

    // Smart URL processing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = `https://${url}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    this.currentUrl = url;
    this.showWebContent();

    // Navigate the currently active webview
    if (this.activeWebview) {
      console.log('Navigating active webview to:', url);
      this.activeWebview.src = url;
    } else {
      // No active webview - create one for the current tab
      console.log('Creating webview for navigation on empty tab');

      if (this.currentTabData) {
        // Update current tab data with the new URL
        this.currentTabData = {
          ...this.currentTabData,
          url: url
        };

        // Create webview for the current tab
        const tabId = this.currentTabData.id;
        const activeWebview = this.createWebviewForTab(tabId, this.currentTabData);

        if (activeWebview) {
          activeWebview.style.display = 'flex';
          this.activeWebview = activeWebview;

          // Also update React state
          this.reactUpdateTab?.(tabId, { url: url });

          setTimeout(() => {
            this.updateNavigationControls();
          }, 100);
        }
      } else {
        console.warn('No current tab data for navigation');
        this.initializeDefaultTab();
        setTimeout(() => {
          if (this.activeWebview) {
            this.activeWebview.src = url;
          }
        }, 200);
      }
    }
  }

  // Update URL bar display
  updateUrlBar(url) {
    const urlInput = safeGetElement(DOMElements.urlInput, 'url-input');
    if (urlInput) {
      // Remove protocol for cleaner display
      const displayUrl = url.replace(/^https?:\/\//, '');
      urlInput.value = displayUrl;
    }
  }

  // Show web content, hide welcome screen
  showWebContent() {
    const welcomeScreen = safeGetElement(DOMElements.welcomeScreen, 'welcome-screen');
    const webContainer = safeGetElement(DOMElements.webContainer, 'web-container');

    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (webContainer) webContainer.classList.remove('hidden');
  }

  setupWindowControls() {
    const minimizeBtn = safeGetElement(DOMElements.minimizeBtn, 'minimize-btn');
    const maximizeBtn = safeGetElement(DOMElements.maximizeBtn, 'maximize-btn');
    const closeBtn = safeGetElement(DOMElements.closeBtn, 'close-btn');

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        window.electronAPI?.minimizeWindow();
      });
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => {
        window.electronAPI?.maximizeWindow();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.electronAPI?.closeWindow();
      });
    }
  }

  // Setting up the navigation controls
  setupNavigationControls() {
    const backBtn = safeGetElement(DOMElements.backBtn, 'back-btn');
    const forwardBtn = safeGetElement(DOMElements.forwardBtn, 'forward-btn');
    const reloadBtn = safeGetElement(DOMElements.reloadBtn, 'reload-btn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.activeWebview && this.activeWebview.canGoBack()) {
          this.activeWebview.goBack();
        }
      });
    }

    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => {
        if (this.activeWebview && this.activeWebview.canGoForward()) {
          this.activeWebview.goForward();
        }
      });
    }

    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        if (this.activeWebview) {
          this.activeWebview.reload();
        }
      });
    }
  }

  // Update navigation button states based on the current active webview
  updateNavigationControls() {
    const backBtn = safeGetElement(DOMElements.backBtn, 'back-btn');
    const forwardBtn = safeGetElement(DOMElements.forwardBtn, 'forward-btn');

    if (this.activeWebview) {
      try {
        if (backBtn) {
          backBtn.disabled = !this.activeWebview.canGoBack();
        }
        if (forwardBtn) {
          forwardBtn.disabled = !this.activeWebview.canGoForward();
        }
      } catch (error) {
        if (backBtn) backBtn.disabled = true;
        if (forwardBtn) forwardBtn.disabled = true;
      }
    }
  }

  // Setup loading state for a specific webview
  setupLoadingStateForWebview(webview) {
    if (webview) {
      // Showing the loading bar once a page starts loading
      webview.addEventListener('did-start-loading', () => {
        if (this.activeWebview === webview) {
          this.showLoadingBar();
          this.setLoadingState(true);
        }
      });
      // Disables the loading state of the loading bar once the page stops loading
      webview.addEventListener('did-stop-loading', () => {
        if (this.activeWebview === webview) {
          this.hideLoadingBar();
          this.setLoadingState(false);
        }
      });
    }
  }

  showLoadingBar() {
    const loadingBar = safeGetElement(DOMElements.loadingBar, 'loading-bar');
    const progressBar = document.querySelector('.loading-progress');

    if (loadingBar && progressBar) {
      loadingBar.classList.remove('hidden');
      progressBar.style.width = '0%'

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;

        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);
      this.progressInterval = progressInterval;
    }
  }

  hideLoadingBar() {
    const loadingBar = safeGetElement(DOMElements.loadingBar, 'loading-bar');
    const progressBar = document.querySelector('.loading-progress');

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    if (progressBar) {
      progressBar.style.width = '100%';

      setTimeout(() => {
        if (loadingBar) {
          loadingBar.classList.add('hidden');
        }
        if (progressBar) {
          progressBar.style.width = '0%';
        }
      }, 200);
    }
  }

  setLoadingState(isLoading) {
    const reloadBtn = safeGetElement(DOMElements.reloadBtn, 'reload-btn');
    if (reloadBtn) {
      // Change reload button to stop button while loading
      if (isLoading) {
        reloadBtn.innerHTML = `
        <img src = "./src/assets/close.svg"/>
      `;
        reloadBtn.title = 'Stop loading';
      } else {
        reloadBtn.innerHTML = `
        <img src="./src/assets/refresh.svg"/>
      `;
        reloadBtn.title = 'Reload page';
      }
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.surfaceBrowser = new SurfaceBrowserRenderer();
});
