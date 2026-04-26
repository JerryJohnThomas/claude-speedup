const toggle = document.getElementById('toggle');
const keepLast = document.getElementById('keepLast');
const dot = document.getElementById('dot');
const status = document.getElementById('status');

chrome.storage.local.get(['enabled', 'keepTurns'], (data) => {
  if (typeof data.enabled !== 'undefined') {
    toggle.checked = data.enabled;
    dot.className = 'dot' + (data.enabled ? '' : ' off');
  }
  if (typeof data.keepTurns !== 'undefined') {
    keepLast.value = data.keepTurns;
  }
});

function sendToTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      status.textContent = 'No active tab found';
      status.className = 'status error';
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, msg, () => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Reload the Claude tab first';
        status.className = 'status error';
      } else {
        status.textContent = 'Applied!';
        status.className = 'status';
        setTimeout(() => {
          status.textContent = 'Lightning mode active';
          status.className = 'status';
        }, 1200);
      }
    });
  });
}

toggle.addEventListener('change', () => {
  const val = toggle.checked;
  dot.className = 'dot' + (val ? '' : ' off');
  status.textContent = val ? 'Lightning mode active' : 'Disabled';
  status.className = 'status';
  sendToTab({ type: 'SET_ENABLED', value: val });
});

keepLast.addEventListener('change', () => {
  sendToTab({ type: 'SET_KEEP_TURNS', value: parseInt(keepLast.value) });
});