// Combined Extension Background Service Worker
// Loads: Distribte + TM Analytics + TM Auto Accept + TM Cleaner

// Import jsrsasign for TM Analytics (must be before back.js)
importScripts('/js/tm_analytics/jsrsasign-rsa-min.js');

// Import Distribte background (main extension)
importScripts('/js/background_distribte.js');

// Import TM Analytics background (MV3 converted)
importScripts('/js/tm_analytics/back.js');

// Import TM Auto Accept background
importScripts('/js/tm_autoclick/background.js');

// Import TM Cleaner background
importScripts('/js/tm_cleaner/background.js');

// ============================================
// DISTRIBTE AUTO LOGIN HANDLERS
// ============================================

// Listen for openPopupTab message from auto-trigger.js content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopupTab') {
    console.log('[Distribte AutoLogin] Opening popup tab from message...');
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup_distribte.html'),
      active: true
    });
    sendResponse({ success: true });
    return true;
  }
});

// Auto open distribte popup on browser startup for login
chrome.runtime.onStartup.addListener(() => {
  console.log('[Distribte AutoLogin] Browser started, opening popup for login...');
  setTimeout(() => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup_distribte.html'),
      active: true
    });
  }, 3000);
});

// Also open on install/update for first-time setup
chrome.runtime.onInstalled.addListener(function(details) {
    tma_firstRun();
    if (details.reason === 'install') {
        console.log('[Distribte AutoLogin] Extension installed, opening popup for login...');
        setTimeout(() => {
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup_distribte.html'),
                active: true
            });
        }, 3000);
    }
});

// TM Analytics startup
chrome.runtime.onStartup.addListener(function() {
    tma_firstRun();
});

console.log('[Combined Extension] All modules loaded');
