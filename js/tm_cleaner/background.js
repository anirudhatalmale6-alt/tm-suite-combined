// TM Cleaner - Auto-clear Ticketmaster data on browser startup
// Modified: Preserves login cookies so you stay logged in
console.log('[TM Cleaner] Service worker started');

// Cookie names that are typically used for authentication (preserve these)
const AUTH_COOKIE_PATTERNS = [
  'access_token',
  'refresh_token',
  'auth_token',
  'session',
  'sessionid',
  'sid',
  'logged_in',
  'user_id',
  'uid',
  'member',
  'account',
  'identity',
  'jwt',
  'bearer',
  'oauth',
  'login',
  'token',
  'auth',
  'credential',
  '__Secure',
  '__Host',
  'remember',
  'persist'
];

// Check if a cookie is likely an auth cookie
function isAuthCookie(cookieName) {
  const nameLower = cookieName.toLowerCase();
  return AUTH_COOKIE_PATTERNS.some(pattern => nameLower.includes(pattern.toLowerCase()));
}

// Get all TM cookies
async function getTMCookies() {
  const allCookies = await chrome.cookies.getAll({});
  return allCookies.filter(cookie => {
    const domain = cookie.domain.toLowerCase();
    return domain.includes('ticketmaster') ||
           domain.includes('livenation') ||
           domain.includes('tmol');
  });
}

// Save auth cookies to storage
async function saveAuthCookies() {
  const tmCookies = await getTMCookies();
  const authCookies = tmCookies.filter(c => isAuthCookie(c.name));

  console.log('[TM Cleaner] Saving', authCookies.length, 'auth cookies');

  // Store cookies with all their properties
  const cookiesToSave = authCookies.map(c => ({
    url: (c.secure ? 'https://' : 'http://') + (c.domain.startsWith('.') ? c.domain.substring(1) : c.domain) + c.path,
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    expirationDate: c.expirationDate
  }));

  await chrome.storage.local.set({ savedAuthCookies: cookiesToSave });
  return cookiesToSave;
}

// Restore auth cookies from storage
async function restoreAuthCookies() {
  const data = await chrome.storage.local.get('savedAuthCookies');
  const savedCookies = data.savedAuthCookies || [];

  console.log('[TM Cleaner] Restoring', savedCookies.length, 'auth cookies');

  for (const cookie of savedCookies) {
    try {
      const cookieDetails = {
        url: cookie.url,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite || 'lax'
      };

      // Only set domain if it starts with a dot (for domain cookies)
      if (cookie.domain && cookie.domain.startsWith('.')) {
        cookieDetails.domain = cookie.domain;
      }

      // Only set expiration if it exists
      if (cookie.expirationDate) {
        cookieDetails.expirationDate = cookie.expirationDate;
      }

      await chrome.cookies.set(cookieDetails);
      console.log('[TM Cleaner] Restored cookie:', cookie.name);
    } catch (e) {
      console.log('[TM Cleaner] Failed to restore cookie:', cookie.name, e.message);
    }
  }
}

// Clear all Ticketmaster related data (except auth cookies)
async function clearTMData(preserveLogin = true) {
  console.log('[TM Cleaner] Clearing Ticketmaster data... preserveLogin:', preserveLogin);
  let cookiesCleared = 0;

  try {
    // Step 1: Save auth cookies if preserving login
    if (preserveLogin) {
      await saveAuthCookies();
    }

    // Step 2: Clear TM data
    const tmDomains = [
      'https://www.ticketmaster.com',
      'https://ticketmaster.com',
      'https://auth.ticketmaster.com',
      'https://identity.ticketmaster.com',
      'https://my.ticketmaster.com',
      'https://checkout.ticketmaster.com',
      'https://queue.ticketmaster.com',
      'https://am.ticketmaster.com',
      'https://www.ticketmaster.ca',
      'https://ticketmaster.ca',
      'https://www.livenation.com',
      'https://livenation.com',
      'https://concerts.livenation.com',
      'https://queue.livenation.com'
    ];

    // Clear cache, localStorage, etc. using browsingData API
    try {
      await chrome.browsingData.remove({
        origins: tmDomains
      }, {
        cache: true,
        cacheStorage: true,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        fileSystems: true
        // NOT cookies - we handle those separately
      });
      console.log('[TM Cleaner] browsingData.remove completed (cache, localStorage, etc.)');
    } catch (e) {
      console.log('[TM Cleaner] browsingData.remove error:', e.message);
    }

    // Step 3: Clear non-auth cookies manually
    try {
      const allCookies = await chrome.cookies.getAll({});
      console.log('[TM Cleaner] Total cookies in browser:', allCookies.length);

      for (const cookie of allCookies) {
        const domain = cookie.domain.toLowerCase();

        if (domain.includes('ticketmaster') ||
            domain.includes('livenation') ||
            domain.includes('queue-it') ||
            domain.includes('tmol')) {

          // Skip auth cookies if preserving login
          if (preserveLogin && isAuthCookie(cookie.name)) {
            console.log('[TM Cleaner] Preserving auth cookie:', cookie.name);
            continue;
          }

          const protocol = cookie.secure ? 'https://' : 'http://';
          let cleanDomain = domain;
          if (cleanDomain.startsWith('.')) {
            cleanDomain = cleanDomain.substring(1);
          }
          const url = protocol + cleanDomain + cookie.path;

          try {
            const removed = await chrome.cookies.remove({
              url: url,
              name: cookie.name
            });
            if (removed) {
              cookiesCleared++;
              console.log('[TM Cleaner] Removed cookie:', cookie.name, 'from', domain);
            }
          } catch (e) {
            try {
              await chrome.cookies.remove({
                url: 'https://' + cleanDomain + '/',
                name: cookie.name
              });
              cookiesCleared++;
            } catch (e2) {}
          }
        }
      }
    } catch (e) {
      console.log('[TM Cleaner] Manual cookie removal error:', e.message);
    }

    // Step 4: Restore auth cookies if preserving login
    if (preserveLogin) {
      await restoreAuthCookies();
    }

    console.log(`[TM Cleaner] Total cookies cleared: ${cookiesCleared}`);

    await chrome.storage.local.set({
      lastCleared: Date.now(),
      cookiesCleared: cookiesCleared
    });

    chrome.action.setBadgeText({ text: String(cookiesCleared) });
    chrome.action.setBadgeBackgroundColor({ color: cookiesCleared > 0 ? '#4CAF50' : '#FF9800' });

    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 5000);

    return { success: true, cookiesCleared: cookiesCleared };
  } catch (error) {
    console.error('[TM Cleaner] Error:', error);
    return { success: false, error: error.message, cookiesCleared: cookiesCleared };
  }
}

// Auto-clear on browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[TM Cleaner] Browser started - auto-clearing TM data');
  const result = await clearTMData(true); // preserve login
  console.log('[TM Cleaner] Startup clear result:', result);
});

// Also clear on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[TM Cleaner] Extension installed - clearing TM data');
  const result = await clearTMData(true); // preserve login
  console.log('[TM Cleaner] Install clear result:', result);
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clearNow') {
    const preserveLogin = request.preserveLogin !== false; // default true
    clearTMData(preserveLogin).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'clearAll') {
    // Clear everything including login
    clearTMData(false).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'getStatus') {
    chrome.storage.local.get(['lastCleared', 'cookiesCleared']).then(result => {
      sendResponse({
        lastCleared: result.lastCleared || null,
        cookiesCleared: result.cookiesCleared || 0
      });
    });
    return true;
  }
});

console.log('[TM Cleaner] Ready');
