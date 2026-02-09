// TM Cleaner Popup

document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const clearBtn = document.getElementById('clearBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Get last cleared time
  chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
    if (response && response.lastCleared) {
      const date = new Date(response.lastCleared);
      const timeStr = date.toLocaleTimeString();
      statusDiv.innerHTML = 'Last cleared: <span class="cleared">' + timeStr + '</span><br>' +
                           'Cookies removed: <strong>' + (response.cookiesCleared || 0) + '</strong>';
    } else {
      statusDiv.textContent = 'Not cleared yet this session';
    }
  });

  // Clear button (preserve login)
  clearBtn.addEventListener('click', function() {
    clearBtn.disabled = true;
    clearBtn.textContent = 'Clearing...';
    statusDiv.textContent = 'Clearing TM data (keeping login)...';

    chrome.runtime.sendMessage({ action: 'clearNow', preserveLogin: true }, function(response) {
      if (response && response.success) {
        const now = new Date();
        statusDiv.innerHTML = 'Last cleared: <span class="cleared">' + now.toLocaleTimeString() + '</span><br>' +
                             'Cookies removed: <strong>' + (response.cookiesCleared || 0) + '</strong> (login preserved)';
        clearBtn.textContent = 'Cleared! Still logged in ✓';
        setTimeout(() => {
          clearBtn.textContent = 'Clear Data (Stay Logged In)';
          clearBtn.disabled = false;
        }, 3000);
      } else {
        statusDiv.textContent = 'Error: ' + (response ? response.error : 'Unknown error');
        clearBtn.textContent = 'Try Again';
        clearBtn.disabled = false;
      }
    });
  });

  // Clear ALL button (including login)
  clearAllBtn.addEventListener('click', function() {
    if (!confirm('This will log you out of Ticketmaster. Continue?')) {
      return;
    }

    clearAllBtn.disabled = true;
    clearAllBtn.textContent = 'Clearing ALL...';
    statusDiv.textContent = 'Clearing ALL TM data including login...';

    chrome.runtime.sendMessage({ action: 'clearAll' }, function(response) {
      if (response && response.success) {
        const now = new Date();
        statusDiv.innerHTML = 'Last cleared: <span class="cleared">' + now.toLocaleTimeString() + '</span><br>' +
                             'Cookies removed: <strong>' + (response.cookiesCleared || 0) + '</strong> (logged out)';
        clearAllBtn.textContent = 'All Cleared! ✓';
        setTimeout(() => {
          clearAllBtn.textContent = 'Clear ALL (Logout Too)';
          clearAllBtn.disabled = false;
        }, 3000);
      } else {
        statusDiv.textContent = 'Error: ' + (response ? response.error : 'Unknown error');
        clearAllBtn.textContent = 'Try Again';
        clearAllBtn.disabled = false;
      }
    });
  });
});
