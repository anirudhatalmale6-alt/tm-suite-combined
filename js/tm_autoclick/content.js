// TM Auto Accept - Auto-clicks Accept/Allow popups on Ticketmaster
(function() {
  'use strict';

  const BUTTON_TEXTS = [
    'accept all',
    'accept all cookies',
    'allow',
    'allow all',
    'i accept',
    'agree',
    'got it'
  ];

  // Selectors for known cookie/consent buttons
  const BUTTON_SELECTORS = [
    '#onetrust-accept-btn-handler',
    '.onetrust-accept-btn-handler',
    '#accept-cookie-banner',
    '[data-testid="accept-all"]',
    '[data-testid="accept-cookies"]',
    '[id*="accept"][id*="cookie"]',
    '[id*="accept"][id*="btn"]',
    '[class*="accept-all"]',
    '[class*="acceptAll"]',
    '[class*="cookie-accept"]',
    '[aria-label*="Accept All"]',
    '[aria-label*="Accept all"]',
    '[aria-label*="Allow"]'
  ];

  let clicked = false;

  function findAndClick() {
    if (clicked) return true;
    if (!document.body) return false;

    // Try known selectors first
    for (const sel of BUTTON_SELECTORS) {
      try {
        const btns = document.querySelectorAll(sel);
        for (const btn of btns) {
          const text = (btn.textContent || '').trim().toLowerCase();
          if (!text.includes('reject') && !text.includes('decline') && !text.includes('manage')) {
            btn.click();
            clicked = true;
            return true;
          }
        }
      } catch (e) {}
    }

    // Search all buttons and links by text content
    const elements = document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"], a.btn, span[role="button"]');
    for (const el of elements) {
      const text = (el.textContent || el.value || '').trim().toLowerCase();
      for (const target of BUTTON_TEXTS) {
        if (text === target || text.includes(target)) {
          // Skip if it also contains reject/decline words
          if (text.includes('reject') || text.includes('decline') || text.includes('manage')) continue;
          el.click();
          clicked = true;
          return true;
        }
      }
    }

    return false;
  }

  // Keep checking every 500ms until found or timeout
  const interval = setInterval(function() {
    if (findAndClick()) {
      clearInterval(interval);
    }
  }, 500);

  // Stop interval after 120 seconds
  setTimeout(function() {
    clearInterval(interval);
  }, 120000);

  // Watch for DOM changes (banners that load late)
  function startObserver() {
    if (!document.body && !document.documentElement) {
      setTimeout(startObserver, 100);
      return;
    }

    const observer = new MutationObserver(function() {
      if (clicked) {
        observer.disconnect();
        return;
      }
      setTimeout(function() {
        if (findAndClick()) {
          observer.disconnect();
        }
      }, 300);
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(function() {
      observer.disconnect();
    }, 120000);
  }

  startObserver();

})();
