import { DOMElements,safeGetElement } from "../utils/domUtils";
export class NavigationService{
    constructor(surfaceBrowser){
        this.browser = surfaceBrowser;
        this.setupEventListners();
    }

    setupEventListners(){
        this.setupBackBtn();
        this.setupForwardBtn();
        this.setupReloadBtn();
    }

    setupBackBtn(){
        const backButton = safeGetElement(DOMElements.backBtn,'back-btn');
        if(backButton){
            backButton.addEventListener('click',()=>{
                if(this.browser.activeWebview && this.browser.activeWebview.canGoBack()){
                    this.browser.activeWebview.goBack();
                }
            });
        }
    }

    setupForwardBtn(){
        const forwardButton = safeGetElement(DOMElements.forwardBtn,'forward-btn');
        if(forwardButton){
            forwardButton.addEventListener('click',()=>{
                if(this.browser.activeWebview && this.browser.activeWebview.canGoForward()){
                    this.browser.activeWebview.goForward();
                }
            });
        }
    }

    setupReloadBtn(){
        const reloadButton = safeGetElement(DOMElements.reloadBtn,'reload-btn');
        if(reloadButton){
            reloadButton.addEventListener('click',()=>{
                if(this.browser.activeWebview){
                    this.browser.activeWebview.reload();
                }
            });
        }
    }

    NavigationUpdater(){
        const backButton = safeGetElement(DOMElements.backBtn,'back-btn');
        const forwardBtn = safeGetElement(DOMElements.forwardBtn,'forward-btn');

        try{
            if(this.browser.activeWebview){
                if(backButton){
                    backButton.disabled = !this.browser.activeWebview.canGoBack();
                }
                if(forwardBtn){
                    forwardBtn.disabled = !this.browser.activeWebview.canGoForward();
                }          
            }
        }catch(error){
            if(backButton) backButton.disabled = true;
            if(forwardBtn) forwardBtn.disabled = true;
        }
    }
}

