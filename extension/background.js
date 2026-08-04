/**
 * Background Service Worker for Manifest V3 Extension
 * Bypasses Chrome Content Security Policy (CSP) & CORS for Stockfish Cloud API requests.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'evaluateFen') {
    const fen = request.fen;
    const url = 'https://lichess.org/api/cloud-eval?fen=' + encodeURIComponent(fen) + '&multiPv=1';

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('API Response Error');
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }
});
