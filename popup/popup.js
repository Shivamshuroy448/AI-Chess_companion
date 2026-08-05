/**
 * Extension Popup Control Script
 * Persists user configuration settings via chrome.storage.local
 */

document.addEventListener('DOMContentLoaded', () => {
  const depthInput = document.getElementById('engine-depth');
  const depthVal = document.getElementById('depth-val');
  const colorSelect = document.getElementById('arrow-color');
  const toggleExt = document.getElementById('toggle-extension');

  // Load saved settings
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['engineDepth', 'arrowColor', 'extensionEnabled'], (res) => {
      if (res.engineDepth) {
        depthInput.value = res.engineDepth;
        depthVal.textContent = res.engineDepth;
      }
      if (res.arrowColor) {
        colorSelect.value = res.arrowColor;
      }
      if (res.extensionEnabled !== undefined) {
        toggleExt.checked = res.extensionEnabled;
      }
    });
  }

  // Update depth slider UI & storage
  depthInput.addEventListener('input', (e) => {
    const val = e.target.value;
    depthVal.textContent = val;
    saveSetting('engineDepth', parseInt(val, 10));
  });

  // Update arrow color
  colorSelect.addEventListener('change', (e) => {
    saveSetting('arrowColor', e.target.value);
  });

  // Toggle extension status
  toggleExt.addEventListener('change', (e) => {
    saveSetting('extensionEnabled', e.target.checked);
  });

  function saveSetting(key, value) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: value });
    }
  }
});
