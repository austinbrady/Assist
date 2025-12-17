/**
 * Options Page Script
 */

// Load settings
async function loadSettings() {
  const result = await chrome.storage.sync.get([
    'apiConfig',
    'autoContext',
    'contextDetailLevel',
    'showWidget',
    'enableAutofill',
    'autofillConfidence',
    'socialMediaAssistance',
    'messagingHelp',
    'videoAnalysis',
    'gamingAssistance',
  ]);

  // Backend config
  const apiConfig = result.apiConfig || {};
  (document.getElementById('localBackendUrl') as HTMLInputElement).value = 
    apiConfig.localBackendUrl || 'http://localhost:4202';
  (document.getElementById('cloudBackendUrl') as HTMLInputElement).value = 
    apiConfig.cloudBackendUrl || '';
  (document.getElementById('connectionPreference') as HTMLSelectElement).value = 
    apiConfig.connectionPreference || 'local-first';

  // Context settings
  (document.getElementById('autoContext') as HTMLInputElement).checked = 
    result.autoContext !== false;
  (document.getElementById('contextDetailLevel') as HTMLSelectElement).value = 
    result.contextDetailLevel || 'standard';
  (document.getElementById('showWidget') as HTMLInputElement).checked = 
    result.showWidget !== false;

  // Autofill settings
  (document.getElementById('enableAutofill') as HTMLInputElement).checked = 
    result.enableAutofill !== false;
  const confidence = result.autofillConfidence || 90;
  (document.getElementById('autofillConfidence') as HTMLInputElement).value = 
    confidence.toString();
  document.getElementById('confidenceValue')!.textContent = `${confidence}%`;

  // Activity settings
  (document.getElementById('socialMediaAssistance') as HTMLInputElement).checked = 
    result.socialMediaAssistance !== false;
  (document.getElementById('messagingHelp') as HTMLInputElement).checked = 
    result.messagingHelp !== false;
  (document.getElementById('videoAnalysis') as HTMLInputElement).checked = 
    result.videoAnalysis !== false;
  (document.getElementById('gamingAssistance') as HTMLInputElement).checked = 
    result.gamingAssistance !== false;
}

// Save settings
async function saveSettings() {
  const apiConfig = {
    localBackendUrl: (document.getElementById('localBackendUrl') as HTMLInputElement).value,
    cloudBackendUrl: (document.getElementById('cloudBackendUrl') as HTMLInputElement).value,
    connectionPreference: (document.getElementById('connectionPreference') as HTMLSelectElement).value,
  };

  const settings = {
    apiConfig,
    autoContext: (document.getElementById('autoContext') as HTMLInputElement).checked,
    contextDetailLevel: (document.getElementById('contextDetailLevel') as HTMLSelectElement).value,
    showWidget: (document.getElementById('showWidget') as HTMLInputElement).checked,
    enableAutofill: (document.getElementById('enableAutofill') as HTMLInputElement).checked,
    autofillConfidence: parseInt((document.getElementById('autofillConfidence') as HTMLInputElement).value),
    socialMediaAssistance: (document.getElementById('socialMediaAssistance') as HTMLInputElement).checked,
    messagingHelp: (document.getElementById('messagingHelp') as HTMLInputElement).checked,
    videoAnalysis: (document.getElementById('videoAnalysis') as HTMLInputElement).checked,
    gamingAssistance: (document.getElementById('gamingAssistance') as HTMLInputElement).checked,
  };

  await chrome.storage.sync.set(settings);

  // Update API client config
  await chrome.runtime.sendMessage({
    type: 'UPDATE_CONFIG',
    payload: apiConfig,
  });

  showStatus('Settings saved successfully!', 'success');
}

// Test connection
async function testConnection() {
  const statusDiv = document.getElementById('connectionStatus')!;
  statusDiv.innerHTML = '<div class="status info">Testing connection...</div>';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_CONNECTION',
    });

    if (response && response.status && response.status.connected) {
      statusDiv.innerHTML = `<div class="status success">Connected to ${response.status.backend} backend!</div>`;
    } else {
      statusDiv.innerHTML = '<div class="status error">Not connected. Please check your backend settings.</div>';
    }
  } catch (error) {
    statusDiv.innerHTML = '<div class="status error">Error testing connection. Please check your settings.</div>';
  }
}

// Reset to defaults
async function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) {
    return;
  }

  await chrome.storage.sync.clear();
  await loadSettings();
  showStatus('Settings reset to defaults!', 'success');
}

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info') {
  const statusDiv = document.getElementById('saveStatus')!;
  statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
  setTimeout(() => {
    statusDiv.innerHTML = '';
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  document.getElementById('saveSettings')!.addEventListener('click', saveSettings);
  document.getElementById('resetSettings')!.addEventListener('click', resetSettings);
  document.getElementById('testConnection')!.addEventListener('click', testConnection);

  // Update confidence value display
  const confidenceSlider = document.getElementById('autofillConfidence') as HTMLInputElement;
  const confidenceValue = document.getElementById('confidenceValue')!;
  confidenceSlider.addEventListener('input', () => {
    confidenceValue.textContent = `${confidenceSlider.value}%`;
  });
});
