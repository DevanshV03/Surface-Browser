import React from 'react';
import { createRoot } from 'react-dom/client';
import TabSidebar from './components/TabSidebar';

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
    this.mountReactTabs();
    this.initializeDefaultTab(); // Add this line
  }

  // Add this method to ensure initial webview creation
  initializeDefaultTab() {
    // Create webview for the default tab immediately
    const defaultTabData = {
      id: 1,
      url: 'https://www.google.com',
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
        onTabRemove: this.handleTabRemove.bind(this)
      });
      root.render(tabSidebarElement); // Use the element with props
      console.log('React TabSidebar mounted successfully');
    }
  }

  // Handle tab switching from React components
  handleTabSwitch(tabId, tabData) {
    console.log(' Switching to tab:', tabId, tabData);
    
    // Hide all webviews
    this.webviews.forEach(webview => {
      webview.style.display = 'none';
    });
    
    // Show the active webview or create it if it doesn't exist
    let activeWebview = this.webviews.get(tabId);
    if (!activeWebview && tabData) {
      activeWebview = this.createWebviewForTab(tabId, tabData);
    }
    
    if (activeWebview) {
      activeWebview.style.display = 'flex';
      this.activeWebview = activeWebview;
      this.showWebContent();
      
      // Update URL bar with current webview URL
      setTimeout(() => {
        this.updateNavigationControls();
        if (activeWebview.src) {
          this.updateUrlBar(activeWebview.src);
        }
      }, 100);
    }
  }

  // Handle new tab creation
  handleTabAdd(tabId, tabData) {
    console.log('Creating webview for new tab:', tabId);
    this.handleTabSwitch(tabId, tabData); // Switch to the new tab
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
    const webContainer = document.getElementById('web-container');
    
    if (webContainer) {
      const webview = document.createElement('webview');
      webview.style.width = '100%';
      webview.style.height = '100%';
      webview.style.display = 'none'; // Hidden by default
      webview.src = tabData?.url || 'https://www.google.com';
      webview.id = tabData?.webviewId || `webview-${tabId}`;
      
      // Add event listeners for this specific webview
      webview.addEventListener('did-navigate', (event) => {
        if (this.activeWebview === webview) {
          this.currentUrl = event.url;
          this.updateUrlBar(event.url);
          this.updateNavigationControls();
        }
      });

      webview.addEventListener('dom-ready', () => {
        if (this.activeWebview === webview) {
          console.log('Page loaded successfully for tab:', tabId);
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
    const urlInput = document.getElementById('url-input');
    
    if (urlInput) {
      // Navigate when user presses Entertitle: {tab.title},
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
        // Looks like a domain (google.com)
        url = `https://${url}`;
      } else {
        // Looks like a search query
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    this.currentUrl = url;
    this.showWebContent();
    
    // Navigate the currently active webview
    if (this.activeWebview) {
      console.log(' Navigating active webview to:', url);
      this.activeWebview.src = url;
    } else {
      console.warn('No active webview found for navigation');
      // Create a webview for the first tab if none exists
      this.initializeDefaultTab();
      setTimeout(() => {
        if (this.activeWebview) {
          this.activeWebview.src = url;
        }
      }, 200);
    }
  }

  // Update URL bar display
  updateUrlBar(url) {
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      // Remove protocol for cleaner display
      const displayUrl = url.replace(/^https?:\/\//, '');
      urlInput.value = displayUrl;
    }
  }

  // Show web content, hide welcome screen
  showWebContent() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const webContainer = document.getElementById('web-container');
    
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (webContainer) webContainer.classList.remove('hidden');
  }

  setupWindowControls() {
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const closeBtn = document.getElementById('close-btn');

    if(minimizeBtn){
      minimizeBtn.addEventListener('click', ()=>{
        window.electronAPI?.minimizeWindow();
      }); 
    }

    if(maximizeBtn){
      maximizeBtn.addEventListener('click', () =>{
        window.electronAPI?.maximizeWindow();
      });
    }

    if(closeBtn){
      closeBtn.addEventListener('click', () =>{
        window.electronAPI?.closeWindow();
      });
    }
  }

  // Setting up the navigation controls
  setupNavigationControls(){
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');

    if(backBtn){
      backBtn.addEventListener('click',()=>{
        if(this.activeWebview && this.activeWebview.canGoBack()){
          this.activeWebview.goBack();
        }
      });
    }

    if(forwardBtn){
      forwardBtn.addEventListener('click', () =>{
        if(this.activeWebview && this.activeWebview.canGoForward()){
          this.activeWebview.goForward();
        }
      });
    }

    if(reloadBtn){
      reloadBtn.addEventListener('click', () =>{
        if(this.activeWebview){
          this.activeWebview.reload();
        }
      });
    }
  }

  // Update navigation button states based on the current active webview
  updateNavigationControls(){
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    
    if(this.activeWebview) {
      try {
        if(backBtn){
          backBtn.disabled = !this.activeWebview.canGoBack();
        }
        if(forwardBtn){
          forwardBtn.disabled = !this.activeWebview.canGoForward();
        }
      } catch (error) {
        if(backBtn) backBtn.disabled = true;
        if(forwardBtn) forwardBtn.disabled = true;
      }
    }
  }

  // Setup loading state for a specific webview
  setupLoadingStateForWebview(webview){
    if(webview){
      // Showing the loading bar once a page starts loading
      webview.addEventListener('did-start-loading', () => {
        if (this.activeWebview === webview) {
          this.showLoadingBar();
          this.setLoadingState(true);
        }
      });
      // Disables the loading state of the loading bar once the page stops loading
      webview.addEventListener('did-stop-loading', () =>{
        if (this.activeWebview === webview) {
          this.hideLoadingBar();
          this.setLoadingState(false);
        }
      });
    }
  }

  showLoadingBar(){
    const loadingBar = document.getElementById('loading-bar');
    const progressBar = document.querySelector('.loading-progress');

    if(loadingBar && progressBar){
      loadingBar.classList.remove('hidden');
      progressBar.style.width = '0%'

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if(progress>90) progress = 90;
        progressBar.style.width = `${progress}%`;

        if(progress>=90){
          clearInterval(progressInterval);
        }
      }, 100);
      this.progressInterval = progressInterval;
    }
  }

  hideLoadingBar(){
    const loadingBar = document.getElementById('loading-bar');
    const progressBar = document.querySelector('.loading-progress');

    if(this.progressInterval){
      clearInterval(this.progressInterval);
    }

    if(progressBar){
      progressBar.style.width = '100%';

      setTimeout(() => {
        if(loadingBar){
          loadingBar.classList.add('hidden');
        }
        if(progressBar){
          progressBar.style.width = '0%';
        }
      }, 200);
    }
  }

  setLoadingState(isLoading){
    const reloadBtn = document.getElementById('reload-btn');
     if (reloadBtn) {
    // Change reload button to stop button while loading
    if (isLoading) {
      reloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="6" y="6" width="4" height="4" fill="currentColor"/>
        </svg>
      `;
      reloadBtn.title = 'Stop loading';
    } else {
      reloadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 2v4l3-3-3-3zM8 14v-4l-3 3 3 3z" stroke="currentColor" stroke-width="1" fill="none"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
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
