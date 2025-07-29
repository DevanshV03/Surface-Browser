import { TIMEOUTS } from "../config/constants";
import { DOMElements, safeGetElement } from "../utils/domUtils";

export class LoadingService{
    constructor(surfaceBrowser){
        this.browser = surfaceBrowser;
    }

    //Loading State setup
    setLoadingState(isLoading){
        const reloadButton = safeGetElement(DOMElements.reloadBtn,'reload-btn');
        if(isLoading){
            reloadButton.innerHTML= `
            <img src = './src/assets/close.svg'/>
            `;
            reloadButton.title = 'Stop loading';
        }else{
            reloadButton.innerHTML=`
            <img src="./src/assets/refresh.svg"/>
            `;
            reloadButton.title = 'Reload page';
        }
    }
    //show and hide loading bar functions
    showLoadingBar(){
        const loadingBar = safeGetElement(DOMElements.loadingBar,'loading-bar');
        const progressBar = document.querySelector('.loading-progress');

        if(loadingBar && progressBar){
            loadingBar.classList.remove('hidden');
            progressBar.style.width = '0%';

            let progress = 0;
            const progressInterval = setInterval(()=>{

                progress += Math.random() * 15;

                if(progress>90) progress=90;
                progressBar.style.width = `${progress}%`;

                if(progress>=90){
                    clearInterval(progressInterval);
                }

            }, TIMEOUTS.DEFAULT_TIMEOUT);

            this.progressInterval = progressInterval;
        }
    }

    hideLoadingBar(){
        const loadingBar = safeGetElement(DOMElements.loadingBar, 'loading-bar');
        const progressBar = document.querySelector('.loading-progress');

        if(this.progressInterval){
            clearInterval(this.progressInterval);
        }

        if(progressBar){
            progressBar.style.width = '100%';

            setTimeout(()=>{
                if(loadingBar){
                    loadingBar.classList.add('hidden');
                }
                if(progressBar){
                    progressBar.style.width = '0%';
                }
        }, TIMEOUTS.MEDIUM_TIMEOUT);
        }
    }

    //Using the above functions to show and hide loading bar and set it's state based on the event of the webview
    setupWebviewLoadingState(webview){
        if(webview){
            webview.addEventListener('did-start-loading',()=>{
                if(this.browser.activeWebview === webview){
                    this.showLoadingBar();
                    this.setLoadingState(true);
                }
            });

            webview.addEventListener('did-stop-loading',()=>{
                if(this.browser.activeWebview === webview){
                this.hideLoadingBar();
                this.setLoadingState(false);
                }
            });
        }
    }
}