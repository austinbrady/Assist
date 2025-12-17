/**
 * Popup Script
 */

async function checkConnection() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONNECTION_STATUS',
    });

    const statusDiv = document.getElementById('status')!;
    if (response && response.status && response.status.connected) {
      statusDiv.className = 'status connected';
      statusDiv.textContent = `Connected to ${response.status.backend} backend`;
    } else {
      statusDiv.className = 'status disconnected';
      statusDiv.textContent = 'Not connected';
    }
  } catch (error) {
    const statusDiv = document.getElementById('status')!;
    statusDiv.className = 'status disconnected';
    statusDiv.textContent = 'Error checking connection';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkConnection();

  document.getElementById('openOptions')!.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('toggleWidget')!.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_WIDGET',
      });
    }
  });
});
