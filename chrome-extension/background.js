// Service worker — relaie les messages capturés vers l'API + interception réseau
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

  if (message.type === "GET_NETWORK_CONFIG") {
    // Renvoyer la configuration réseau au content script
    chrome.storage.local.get(["sessionId", "apiUrl", "apiKey", "active"], (data) => {
      sendResponse({ 
        success: true, 
        config: {
          sessionId: data.sessionId,
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
          active: data.active
        }
      });
    });
    return true;
  }
});

// ── INTERCEPTION RÉSEAU POUR CHATGPT ─────────────────────────────

const activeStreams = new Map(); // tabId -> { buffer, config, lastActivity }

// Intercepter les réponses de l'API ChatGPT
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Détecter les requêtes vers l'API ChatGPT
    if (details.url.includes("backend-api/conversation") || 
        details.url.includes("chat/completions")) {
      console.log("[AI Session Live] NETWORK CAPTURE STARTED - URL:", details.url);
      console.log("[AI Session Live] REQUEST BODY LENGTH:", details.requestBody?.raw?.length || 0);
    }
  },
  { urls: ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://*.openai.com/*"] },
  ["requestBody"]
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    // Détecter les réponses streaming de ChatGPT
    if (details.url.includes("backend-api/conversation") || 
        details.url.includes("chat/completions")) {
      
      const contentType = details.responseHeaders?.find(h => 
        h.name.toLowerCase() === "content-type"
      );
      
      if (contentType?.value?.includes("text/event-stream") || 
          contentType?.value?.includes("stream")) {
        console.log("[AI Session Live] RESPONSE DETECTED - Streaming response");
        console.log("[AI Session Live] Content-Type:", contentType?.value);
        
        // Initialiser le buffer pour cet onglet
        if (!activeStreams.has(details.tabId)) {
          const streamBuffer = {
            buffer: "",
            config: null,
            lastActivity: Date.now(),
            messageCount: 0
          };
          activeStreams.set(details.tabId, streamBuffer);
          
          // Récupérer la configuration de capture
          chrome.storage.local.get(["sessionId", "apiUrl", "apiKey", "active"], (data) => {
            if (data.active && data.sessionId) {
              streamBuffer.config = {
                sessionId: data.sessionId,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey
              };
              console.log("[AI Session Live] Network config loaded for tab:", details.tabId);
            }
          });
        }
      }
    }
  },
  { urls: ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://*.openai.com/*"] },
  ["responseHeaders"]
);

// Intercepter les chunks de réponse
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes("backend-api/conversation") || 
        details.url.includes("chat/completions")) {
      console.log("[AI Session Live] STREAM FINISHED - Tab:", details.tabId);
      
      const streamBuffer = activeStreams.get(details.tabId);
      if (streamBuffer && streamBuffer.buffer) {
        console.log("[AI Session Live] FINAL ASSISTANT RESPONSE:", streamBuffer.buffer.slice(0, 100) + "...");
        console.log("[AI Session Live] STREAM BUFFER LENGTH:", streamBuffer.buffer.length);
        
        // Envoyer la réponse complète au content script
        chrome.tabs.sendMessage(details.tabId, {
          type: "NETWORK_RESPONSE_COMPLETE",
          payload: {
            text: streamBuffer.buffer,
            config: streamBuffer.config
          }
        }).catch(err => {
          console.error("[AI Session Live] Error sending network response to content script:", err);
        });
        
        // Nettoyer le buffer
        activeStreams.delete(details.tabId);
      }
    }
  },
  { urls: ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://*.openai.com/*"] }
);

// Nettoyer les buffers quand un onglet est fermé
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeStreams.has(tabId)) {
    console.log("[AI Session Live] Cleaning up stream buffer for closed tab:", tabId);
    activeStreams.delete(tabId);
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
