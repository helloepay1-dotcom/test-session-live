// Service worker — relaie les messages capturés vers l'API
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SEND_MESSAGE") {
    sendToApi(message.payload)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.type === "INJECT_INTERVENTION") {
    // Injecter l'intervention dans ChatGPT via content script
    const interventionText = message.text;
    
    // Trouver l'onglet ChatGPT
    chrome.tabs.query({ url: "*://chatgpt.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        const chatGPTTab = tabs[0];
        
        // Activer l'onglet
        chrome.tabs.update(chatGPTTab.id, { active: true }, () => {
          // Envoyer le message au content script
          chrome.tabs.sendMessage(chatGPTTab.id, {
            type: "INJECT_TEXT",
            text: interventionText
          }, (response) => {
            sendResponse({ success: !!response });
          });
        });
      } else {
        sendResponse({ success: false, error: "Aucun onglet ChatGPT trouvé" });
      }
    });
    
    return true;
  }
});

async function sendToApi(payload) {
  const { apiUrl, apiKey, sessionId, contenu, role } = payload;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      contenu,
      role,
      api_key: apiKey,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Notify content scripts when sharing is toggled from popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.active) {
    const active = changes.active.newValue;
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: active ? "START_CAPTURE" : "STOP_CAPTURE",
            })
            .catch(() => {});
        }
      });
    });
  }
});
