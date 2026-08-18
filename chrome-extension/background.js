// Service worker — relaie les messages capturés vers l'API
// CDP désactivé - l'extraction DOM fonctionne déjà pour ChatGPT, Claude et Gemini

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_MESSAGE") {
    sendToApi(message.payload)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.type === "POLL_MESSAGES") {
    pollMessagesFromApi(message.payload, sender)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.type === "INJECT_INTERVENTION") {
    const interventionText = message.text;
    
    chrome.tabs.query({ url: "*://chatgpt.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        const chatGPTTab = tabs[0];
        
        chrome.tabs.update(chatGPTTab.id, { active: true }, () => {
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

  // CDP handlers désactivés - l'extraction DOM fonctionne déjà
  /*
  if (message.type === "ATTACH_CDP") {
    // Demande d'attachement CDP depuis content script
    const { tabId, sessionId, config } = message.payload;
    attachDebugger(tabId, sessionId, config)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "DETACH_CDP") {
    // Demande de détachement CDP
    const { tabId } = message.payload;
    detachDebugger(tabId)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  */
});

// ── API vers Vercel (existante) ─────────────────────────────

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

async function pollMessagesFromApi(payload, sender) {
  const { apiUrl, sessionId, userId } = payload;

  const baseUrl = new URL(apiUrl);
  const pollUrl =
    `${baseUrl.protocol}//${baseUrl.host}/api/poll-messages` +
    `?session_id=${encodeURIComponent(sessionId)}` +
    `&user_id=${encodeURIComponent(userId)}`;

  const response = await fetch(pollUrl);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  // Envoyer les messages au content script qui a demandé le polling
  if (sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "POLL_MESSAGES_RESULT",
      messages: data.messages || []
    });
  }

  return data;
}
