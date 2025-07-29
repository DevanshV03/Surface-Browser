import { useState, useEffect, useRef } from "react";
import { DEFAULT_TAB_DATA } from "../config/constants";

function useTabs(callbacks = {}) {
    const [tabs, setTabs] = useState([{
        id: 1,
        title: DEFAULT_TAB_DATA.TITLE,
        favicon: DEFAULT_TAB_DATA.FAVICON,
        url: DEFAULT_TAB_DATA.URL,
        webviewId: 'webview-1'
    }]);

    const [activeTabId, setActiveTabId] = useState(1);
    const isExternalSwitch = useRef(false);

    useEffect(() => {
        console.log('useEffect triggered - activeTabId:', activeTabId, 'isExternal:', isExternalSwitch.current);

        if (callbacks.onTabSwitch && !isExternalSwitch.current) {
            const activeTab = tabs.find(tab => tab.id === activeTabId);

            
            if (activeTab) {
                console.log('Calling onTabSwitch with:', activeTabId, activeTab);
                callbacks.onTabSwitch(activeTabId, activeTab);
            } else {
                console.log('Tab not found in React state - skipping callback for:', activeTabId);
            }
        }
        isExternalSwitch.current = false; // Reset flag
    }, [activeTabId, tabs]);



    const addTab = () => {
        console.log('ADD TAB CALLED!');
        console.trace(); // This will show you the call stack

        const newTab = {
            id: Date.now(),
            title: DEFAULT_TAB_DATA.TITLE,
            favicon: DEFAULT_TAB_DATA.FAVICON,
            url: DEFAULT_TAB_DATA.URL,
            webviewId: `webview-${Date.now()}`
        };
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(newTab.id);

        if (callbacks.onTabAdd) {
            callbacks.onTabAdd(newTab.id, newTab);
        }
    };

    const removeTab = (tabId) => {
        setTabs(prevTabs => {
            const filteredTabs = prevTabs.filter(tab => tab.id !== tabId);

            if (filteredTabs.length === 0) {
                const newTab = {
                    id: Date.now(),
                    title: DEFAULT_TAB_DATA.TITLE,
                    favicon: DEFAULT_TAB_DATA.FAVICON,
                    url: DEFAULT_TAB_DATA.URL,
                    webviewId: `webview-${Date.now()}`
                };
                setActiveTabId(newTab.id);
                return [newTab];
            }

            if (tabId === activeTabId) {
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

    // Add external switch function for bookmarks
    const switchToExternalTab = (tabId) => {
        isExternalSwitch.current = true; // Mark as external
        setActiveTabId(tabId);
    };

    const updateTab = (tabId, updates) => {
        setTabs(prevTabs =>
            prevTabs.map(tab =>
                tab.id === tabId ? { ...tab, ...updates } : tab
            )
        );
    };

    return [tabs, activeTabId, addTab, removeTab, switchToTab, updateTab, switchToExternalTab];
}

export default useTabs;
