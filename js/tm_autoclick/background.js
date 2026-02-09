// Auto-allow notifications for Ticketmaster sites so the browser prompt never appears
const TM_PATTERNS = [
  "https://*.ticketmaster.com/*",
  "http://*.ticketmaster.com/*",
  "https://*.ticketmaster.co.uk/*",
  "http://*.ticketmaster.co.uk/*",
  "https://*.livenation.com/*",
  "http://*.livenation.com/*"
];

function setNotificationPermissions() {
  for (const pattern of TM_PATTERNS) {
    try {
      chrome.contentSettings.notifications.set({
        primaryPattern: pattern,
        setting: "allow"
      });
    } catch (e) {
      console.log("TM Auto Accept: Could not set notification for " + pattern);
    }
  }
  console.log("TM Auto Accept: Notification permissions set to Allow for TM sites");
}

// Set on install
chrome.runtime.onInstalled.addListener(function() {
  setNotificationPermissions();
});

// Set on startup
chrome.runtime.onStartup.addListener(function() {
  setNotificationPermissions();
});
