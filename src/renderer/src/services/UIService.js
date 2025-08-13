import React from "react";
import TabSidebar from '../components/TabSidebar';
import HistoryPanel from "../components/HistoryPanel";
import { createRoot } from 'react-dom/client';
export class UIService{
    constructor(surfaceBrowser){
        this.browser = surfaceBrowser;
    }

    mountReactComponents(){
        this.mountReactTabs();
        this.mountHistoryPanel();
    }


    mountReactTabs() {
    const mountPoint = document.querySelector('#react-tab-mount');
    if (mountPoint) {
      const root = createRoot(mountPoint);
      const tabSidebarElement = React.createElement(TabSidebar, {
        onTabSwitch: this.browser.handleTabSwitch.bind(this.browser),
        onTabAdd: this.browser.handleTabAdd.bind(this.browser),
        onTabRemove: this.browser.handleTabRemove.bind(this.browser),

        registerUpdateTab: fn => { this.browser.reactUpdateTab = fn; }
      });
      root.render(tabSidebarElement); // Use the element with props
      console.log('React TabSidebar mounted successfully');
    }
  }

  mountHistoryPanel(){
    const mountPoint = document.querySelector('#history-panel-mount');
    if(mountPoint){
      const root = createRoot(mountPoint);
      this.historyPanelRoot = root;
      this.renderHistoryPanel(false);
      window.addEventListener('historyPanelStateChange',(event)=>{
        this.renderHistoryPanel(event.detail.isOpen);
      });
      console.log('History Panel React Component mounted successfully');
    }
  }
  renderHistoryPanel(isOpen) {
  const historyPanel = React.createElement(HistoryPanel, {
    isOpen: isOpen,
    onClose: () => this.browser.historyService.closeHistoryPanel()
  });
  this.historyPanelRoot.render(historyPanel);
}

}