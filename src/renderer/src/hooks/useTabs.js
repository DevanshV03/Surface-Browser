import { useState, useEffect } from "react";

function useTabs(callbacks = {}){
    const [tabs, setTabs] = useState([{
        id: 1,
        title: 'New Tab',
        favicon: '🌐',
        url: 'https://www.google.com',
        webviewId: 'webview-1'
    }]);

    const [activeTabId, setActiveTabId] = useState(1);
    
    // Notify vanilla JS when active tab changes
    useEffect(() => {
        if (callbacks.onTabSwitch) {
            const activeTab = tabs.find(tab => tab.id === activeTabId);
            callbacks.onTabSwitch(activeTabId, activeTab);
        }
    }, [activeTabId, tabs]);
    
    const addTab = () => {
        const newTab = {
            id: Date.now(),
            title: 'New Tab',
            favicon: '🌐',
            url: 'https://www.google.com',
            webviewId: `webview-${Date.now()}`
        };
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(newTab.id);
        
        // Notify vanilla JS about new tab
        if (callbacks.onTabAdd) {
            callbacks.onTabAdd(newTab.id, newTab);
        }
    };

    const removeTab = (tabId) => {
        setTabs(prevTabs => {
            const filteredTabs = prevTabs.filter(tab => tab.id !== tabId);

            if(filteredTabs.length === 0){
                const newTab = {
                    id: Date.now(),
                    title: 'New Tab',
                    favicon: '🌐',
                    url: 'https://www.google.com',
                    webviewId: `webview-${Date.now()}`
                };
                setActiveTabId(newTab.id);
                return [newTab];
            }
            
            if(tabId === activeTabId){
                setActiveTabId(filteredTabs[0].id);
            }

            return filteredTabs;
        });
        
        // Notify vanilla JS about tab removal
        if (callbacks.onTabRemove) {
            callbacks.onTabRemove(tabId);
        }
    };

    const switchToTab = (tabId) => {
        setActiveTabId(tabId);
    };

    const updateTab = (tabId, updates) => {
        setTabs(prevTabs => 
            prevTabs.map(tab => 
                tab.id === tabId ? { ...tab, ...updates } : tab
            )
        );
    };

    return [tabs, activeTabId, addTab, removeTab, switchToTab, updateTab];
}

export default useTabs;
