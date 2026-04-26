// Claude Speed Fix - content.js v4
// Fixes: observer throttling, correct turns->wrappers math, restore on change

const CONFIG = {
  KEEP_TURNS: 4,   // user-facing "turns" (each turn = 1 user + 1 assistant = 2 wrappers)
  CONTAINER_SELECTOR: '.flex-1.flex.flex-col.px-4',
  WRAPPER_SELECTOR: '[data-test-render-count]',
};

const detached = new Map(); // placeholder -> real node
let enabled = true;
let applyTimer = null;
let observing = false;

chrome.storage.local.get(['enabled', 'keepTurns'], (data) => {
  if (typeof data.enabled !== 'undefined') enabled = data.enabled;
  if (typeof data.keepTurns !== 'undefined') CONFIG.KEEP_TURNS = data.keepTurns;
  scheduleApply(800);
});

function getContainer() {
  return document.querySelector(CONFIG.CONTAINER_SELECTOR);
}

function getLiveWrappers() {
  const container = getContainer();
  if (!container) return [];
  return Array.from(container.querySelectorAll(`:scope > ${CONFIG.WRAPPER_SELECTOR}`));
}

function applyDetach() {
  if (!enabled) return;
  const wrappers = getLiveWrappers();
  if (wrappers.length === 0) return;

  // Each "turn" = 2 wrappers (user bubble + assistant bubble)
  const keepWrappers = CONFIG.KEEP_TURNS * 2;
  const cutoff = wrappers.length - keepWrappers;
  if (cutoff <= 0) return;

  wrappers.forEach((el, i) => {
    if (i >= cutoff) return; // keep these
    if (detached.has(el)) return; // already detached

    const height = el.getBoundingClientRect().height || 150;
    const ph = document.createElement('div');
    ph.dataset.claudeSpeedfix = 'placeholder';
    ph.style.cssText = `height:${height}px;min-height:${height}px;flex-shrink:0;contain:strict;`;
    el.parentNode.insertBefore(ph, el);
    el.parentNode.removeChild(el);
    detached.set(ph, el);
  });
}

function restoreAll() {
  detached.forEach((realNode, ph) => {
    if (ph.parentNode) {
      ph.parentNode.insertBefore(realNode, ph);
      ph.parentNode.removeChild(ph);
    }
  });
  detached.clear();
}

function scheduleApply(delay = 1500) {
  clearTimeout(applyTimer);
  applyTimer = setTimeout(applyDetach, delay);
}

// Throttled observer — only watch for new top-level wrappers, not every DOM change
function startObserver() {
  if (observing) return;
  const container = getContainer();
  if (!container) {
    // Container not ready yet, retry
    setTimeout(startObserver, 500);
    return;
  }
  observing = true;

  let lastCount = 0;
  const observer = new MutationObserver(() => {
    const wrappers = getLiveWrappers();
    if (wrappers.length !== lastCount) {
      lastCount = wrappers.length;
      scheduleApply(1500); // wait for streaming to settle
    }
  });

  // Only watch direct children of the message container, not the whole body
  observer.observe(container, { childList: true });
}

// Wait for container to appear then start
function init() {
  if (getContainer()) {
    startObserver();
    scheduleApply(800);
  } else {
    setTimeout(init, 500);
  }
}

init();

// Messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SET_ENABLED') {
    enabled = msg.value;
    chrome.storage.local.set({ enabled });
    if (enabled) {
      scheduleApply(100);
    } else {
      clearTimeout(applyTimer);
      restoreAll();
    }
    sendResponse({ ok: true });
  }

  if (msg.type === 'SET_KEEP_TURNS') {
    CONFIG.KEEP_TURNS = msg.value;
    chrome.storage.local.set({ keepTurns: msg.value });
    restoreAll();
    scheduleApply(100);
    sendResponse({ ok: true });
  }
});