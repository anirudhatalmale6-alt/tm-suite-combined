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

// Combined startup handler for TM Analytics
chrome.runtime.onInstalled.addListener(function() {
    tma_firstRun();
});
chrome.runtime.onStartup.addListener(function() {
    tma_firstRun();
});

console.log('[Combined Extension] All modules loaded');
