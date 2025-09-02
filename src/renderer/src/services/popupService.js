import { DEFAULT_TAB_DATA } from "../config/constants";
import { OAUTH_PATTERNS, OAUTH_PROVIDERS } from "../config/constants";
/*eslint-disable*/

export class PopupService {
    constructor(surfaceBrowser) {
        this.browser = surfaceBrowser;
        this.providers = OAUTH_PROVIDERS;
        this.patterns = OAUTH_PATTERNS;
    }

    isOAuthProvider(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname;

            const isProvider = Object.values(this.providers).some(provider => hostname.includes(provider));
            const isPattern = Object.values(this.patterns).some(pattern => pathname.includes(pattern));

            return isProvider || isPattern;
        } catch (e) {
            console.error("Error in isOAuthProvider", e);
            return false;
        }
    }

    isSameDomain(url) {
        try {
            const target = new URL(url).hostname;
            const current = new URL(this.browser.activeWebview?.src || '').hostname;
            return target === current;
        } catch {
            return false;
        }
    }

    async createNewTab(url) {
        try {
            if (window.surfaceBrowserTabActions?.addTab && window.surfaceBrowser?.navigateToUrl) {
                window.surfaceBrowserTabActions.addTab();
                window.surfaceBrowser.navigateToUrl(url);
            } else {
                throw new Error("Tab or Navigation System not found");
            }
        } catch (e) {
            console.error("Error in createNewTab", e);
            throw e;
        }
    }

    async createOAuthPopup(url) {
        try {
            console.log('Creating OAuth popup for:', url);

            if (window.electronAPI?.createOAuthPopup) {
                const result = await window.electronAPI.createOAuthPopup(url);

                if (result.success) {
                    console.log('OAuth popup created successfully');
                } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error('OAuth popup API not available');
            }

        } catch (error) {
            console.error('createOAuthPopup failed:', error);
            throw error;
        }
    }

    async openExternal(url){
        try{
            if(window.electronAPI?.openExternal){
                const result = await window.electronAPI.openExternal(url);
                if(!result.success){
                    throw new Error(result.error);
                }
            }else{
                throw new Error('Open External API not available');
            }
        }catch(error){
            console.error('openExternal failed:', error);
            throw error;
        }
    }

    showNotification(message){
        try{
            if(window.surfaceBrowser?.showNotification){
                window.surfaceBrowser.showNotification(message);
            }else{
                console.log(`${message}`);
            }
        }catch(error){
            console.error('showNotification failed:', error);
        }
    }


    async handleNewWindow(event) {
        const { url, disposition } = event;

        try {
            //Core Routing Logic:
            if (this.isOAuthProvider(url)) {
                event.preventDefault();
                return this.createOAuthPopup(url);
            }
            if (disposition === 'new-window') {
                event.preventDefault();
                return this.createNewTab(url);
            }
            if (disposition === 'foreground-tab') {
                event.preventDefault();
                return this.createNewTab(url);
            }
            if (this.isSameDomain(url)) {
                event.preventDefault();
                return this.createNewTab(url);
            }
            event.preventDefault();
            return this.openExternal(url);

        } catch (error) {
            //Fallback to system's default browser;
            console.error("Tab Creation Failed, Trying external browser", error);
            try {
                await this.openExternal(url);
            } catch (externalError) {
                console.error("External Open Failed,Copying to clipboard", externalError);
                window.electronAPI.copyUrlToClipboard(url);
                this.showNotification('Url Copied to Clipboard');
            }
        }
    }
}