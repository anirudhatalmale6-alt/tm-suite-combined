// Content script for whoerip.com - auto opens Distribte popup
// This runs when the profile opens and whoerip.com loads

(function() {
  // Only run once per session
  if (sessionStorage.getItem('distribte_auto_triggered')) return;
  sessionStorage.setItem('distribte_auto_triggered', 'true');

  console.log('[Distribte AutoTrigger] Profile opened, will open popup in 2 seconds...');

  function sendOpenPopup(retries) {
    chrome.runtime.sendMessage({ action: 'openPopupTab' }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('[Distribte AutoTrigger] Message failed:', chrome.runtime.lastError.message);
        if (retries > 0) {
          console.log('[Distribte AutoTrigger] Retrying in 2 seconds... (' + retries + ' retries left)');
          setTimeout(function() { sendOpenPopup(retries - 1); }, 2000);
        }
      } else {
        console.log('[Distribte AutoTrigger] Popup tab opened successfully');
      }
    });
  }

  // Wait for page to load, then send message to open popup
  setTimeout(function() {
    sendOpenPopup(3);
  }, 2000);
})();
