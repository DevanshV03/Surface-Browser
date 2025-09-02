// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer} = require('electron');
/*eslint-disable*/

contextBridge.exposeInMainWorld('electronAPI',{
    //exposing window control APIs
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    addBookmark: (tabData) => ipcRenderer.invoke('add-bookmark', tabData),
    loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),
    deleteBookmark: (bookmarkId)=> ipcRenderer.invoke('delete-bookmark', bookmarkId),
    addHistoryEntry: (historyData) => ipcRenderer.invoke('addHistoryEntry', historyData),
    loadHistoryData: (limit) => ipcRenderer.invoke('loadHistoryData', limit),
    copyUrlToClipboard: (url) => ipcRenderer.invoke('copyUrl-clipboard', url),
    createOAuthPopup: (url, options) =>ipcRenderer.invoke('create-oauth-popup', url, options),
    openExternal:(url)=>ipcRenderer.invoke('open-external', url),

    //Getting system information
    platform: process.platform,
    versions: process.versions
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('preload script loaded');
});