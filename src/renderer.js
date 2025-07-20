// Surface Browser - URL Navigation and Web Engine
class SurfaceBrowserRenderer {
  constructor() {
    this.currentUrl = '';
    this.webView = null;
    this.init();
  }

  init() {
    this.setupUrlNavigation();
    this.createWebView();
    this.setupWindowControls();
    this.setupNavigationControls();
  }

  // Handle URL input and navigation
  setupUrlNavigation() {
    const urlInput = document.getElementById('url-input');
    
    if (urlInput) {
      // Navigate when user presses Enter
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

  // CreateWebView function creates the webview for rendering the websites

  createWebView() {
    const webContainer = document.getElementById('web-container');
    
    if (webContainer) {
      // Create the webview element
      this.webView = document.createElement('webview');
      this.webView.style.width = '100%';
      this.webView.style.height = '100%';
      this.webView.src = 'https://www.google.com'; // Default page
      
      // Handle webview events
      this.webView.addEventListener('did-navigate', (event) => {
        this.currentUrl = event.url;
        this.updateUrlBar(event.url);
        this.updateNavigationControls();
      });

      this.webView.addEventListener('dom-ready', () => {
        // Page finished loading
        console.log('Page loaded successfully');
        this.updateNavigationControls();
      });

      this.setupLoadingState();

      webContainer.appendChild(this.webView);
    }
  }

  // Navigate to URL with smart handling
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
    
    // Show web content and hide welcome screen
    this.showWebContent();
    
    // Navigate webview
    if (this.webView) {
      this.webView.src = url;
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

  //setting up the navigation controls
  setupNavigationControls(){
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');

    if(backBtn){
      backBtn.addEventListener('click',()=>{
      if(this.webView && this.webView.canGoBack()){
        this.webView.goBack();
      }
      });
    }

    if(forwardBtn){
      forwardBtn.addEventListener('click', () =>{
        if(this.webView && this.webView.canGoForward()){
          this.webView.goForward();
        }
      });
    }

    if(reloadBtn){
      reloadBtn.addEventListener('click', () =>{
        if(this.webView){
          this.webView.reload();
        }
      });
    }
    this.updateNavigationControls();
  }
//This is for updating the navigation button states based on the current webview
  updateNavigationControls(){
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    if(this.webView){
    if(backBtn){
      backBtn.disabled = !this.webView.canGoBack();
    }
    if(forwardBtn){
      forwardBtn.disabled = !this.webView.canGoForward();
    }
  }
  }
  //setting up the loading state so that it can be used by the showloadingbar function about it's state
  setupLoadingState(){
    if(this.webView){
      //showing the loading bar once a page starts loading
      this.webView.addEventListener('did-start-loading', () => {
        this.showLoadingBar();
        this.setLoadingState(true);
      });
      //disables the loading state of the loading bar once the page stops loading
      this.webView.addEventListener('did-stop-loading', () =>{
        this.hideLoadingBar();
        this.setLoadingState(false);
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
    const svg = reloadBtn.querySelector('svg path, svg circle');
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
