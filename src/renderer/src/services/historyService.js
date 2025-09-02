export class HistoryService{
    constructor(surfaceBrowser){
        this.browser = surfaceBrowser;
        this.isHistoryPanelOpen = false;
    }

    updateReactState(){
        window.dispatchEvent(new CustomEvent('historyPanelStateChange',{
            detail: {isOpen: this.isHistoryPanelOpen}
        }));
    }
    

    openHistoryPanel(){
        this.isHistoryPanelOpen = true;
        this.updateReactState();
        console.log('Opening History panel');
    }
    closeHistoryPanel(){
        this.isHistoryPanelOpen = false;
        this.updateReactState();
        console.log('Closing the history panel');
    }
}