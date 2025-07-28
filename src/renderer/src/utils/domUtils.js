export const DOMElements = {
    //NavBar Elements
    urlInput: () => document.getElementById('url-input'),
    backBtn: () => document.getElementById('back-btn'),
    forwardBtn: () => document.getElementById('forward-btn'),
    reloadBtn: () => document.getElementById('reload-btn'),

    //URL Bar elements
    securityIcon: () => document.getElementById('security-icon'),
    bookmarkBtn: () =>  document.getElementById('bookmark-btn'),

    //Main Layout Elements
    welcomeScreen: () => document.getElementById('welcome-screen'),
    webContainer: () => document.getElementById('web-container'),
    loadingBar: () => document.getElementById('loading-bar'),

    //Window Control Elements
    forwardBtn: () => document.getElementById('forward-btn'),
    backBtn: () => document.getElementById('back-btn'),
    closeBtn: () => document.getElementById('close-btn'),
    menuBtn: () => document.getElementById('menu-btn'),
    minimizeBtn: ()=> document.getElementById('minimize-btn'),
    maximizeBtn: ()=> document.getElementById('maximize-btn'),

}

export const safeGetElement = (elementFn, elementName) =>{
    const element = elementFn();
    if(!element){
        console.warn(`Element ${elementName} not found`);
    }
    return element;
};