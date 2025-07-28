// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electronAPI',{
    //exposing window control APIs
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    addBookmark: (tabData) => ipcRenderer.invoke('add-bookmark', tabData),
    loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),


    //Getting system information
    platform: process.platform,
    versions: process.versions
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('preload script loaded');
});