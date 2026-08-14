// Service worker — relaie les messages capturés vers l'API + capture CDP
// État CDP par onglet
const cdpSessions = new Map(); // tabId -> { state, debuggerAttached, sessionId, config, requestId, buffer, messageId }

// Machine d'état CDP
const CDP_STATE = {
  IDLE: 'IDLE',
  REQUEST_DETECTED: 'REQUEST_DETECTED',
  STREAMING: 'STREAMING',
  COMPLETED: 'COMPLETED',
  SENT: 'SENT'
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SEND_MESSAGE") {
    sendToApi(message.payload)
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

// ── Chrome DevTools Protocol (CDP) Implementation ─────────

async function attachDebugger(tabId, sessionId, config) {
  console.log("[AI Session Live][CDP] DEBUGGER ATTACHING - Tab:", tabId);
  
  try {
    // Vérifier si déjà attaché
    if (cdpSessions.has(tabId)) {
      const existing = cdpSessions.get(tabId);
      if (existing.debuggerAttached) {
        console.log("[AI Session Live][CDP] Debugger already attached to tab:", tabId);
        return { alreadyAttached: true };
      }
    }

    // Initialiser la session CDP
    const cdpSession = {
      state: CDP_STATE.IDLE,
      debuggerAttached: false,
      sessionId: sessionId,
      config: config,
      requestId: null,
      buffer: "",
      messageId: null,
      lastActivity: Date.now()
    };
    
    cdpSessions.set(tabId, cdpSession);

    // Attacher le debugger
    const target = { tabId };
    await chrome.debugger.attach(target, "1.3");
    cdpSession.debuggerAttached = true;
    
    console.log("[AI Session Live][CDP] DEBUGGER ATTACHED - Tab:", tabId);

    // Activer le domaine Network
    await chrome.debugger.sendCommand(target, "Network.enable");
    console.log("[AI Session Live][CDP] NETWORK ENABLED - Tab:", tabId);

    // Écouter les événements réseau
    setupNetworkListeners(tabId, target);

    return { success: true, tabId };
  } catch (error) {
    console.error("[AI Session Live][CDP] Error attaching debugger:", error);
    cdpSessions.delete(tabId);
    throw error;
  }
}

async function detachDebugger(tabId) {
  console.log("[AI Session Live][CDP] DETACHING DEBUGGER - Tab:", tabId);
  
  try {
    if (cdpSessions.has(tabId)) {
      const target = { tabId };
      await chrome.debugger.detach(target);
      cdpSessions.delete(tabId);
      console.log("[AI Session Live][CDP] DEBUGGER DETACHED - Tab:", tabId);
    }
    return { success: true };
  } catch (error) {
    console.error("[AI Session Live][CDP] Error detaching debugger:", error);
    throw error;
  }
}

function setupNetworkListeners(tabId, target) {
  console.log("[AI Session Live][CDP] Setting up network listeners - Tab:", tabId);

  // Écouter les requêtes sortantes
  chrome.debugger.onEvent.addListener((source, method, params) => {
    if (source.tabId !== tabId) return;

    if (method === "Network.requestWillBeSent") {
      handleRequestWillBeSent(tabId, params);
    } else if (method === "Network.responseReceived") {
      handleResponseReceived(tabId, params);
    } else if (method === "Network.loadingFinished") {
      handleLoadingFinished(tabId, params);
    }
  });
}

function handleRequestWillBeSent(tabId, params) {
  const cdpSession = cdpSessions.get(tabId);
  if (!cdpSession || cdpSession.state !== CDP_STATE.IDLE) return;

  const { request } = params;
  
  // Filtrer les requêtes ChatGPT API
  if (isChatGPTAPIRequest(request)) {
    console.log("[AI Session Live][CDP] REQUEST DETECTED - URL:", request.url);
    console.log("[AI Session Live][CDP] REQUEST METHOD:", request.method);
    console.log("[AI Session Live][CDP] REQUEST ID:", params.requestId);
    
    cdpSession.state = CDP_STATE.REQUEST_DETECTED;
    cdpSession.requestId = params.requestId;
    cdpSession.buffer = "";
    cdpSession.lastActivity = Date.now();
  }
}

function handleResponseReceived(tabId, params) {
  const cdpSession = cdpSessions.get(tabId);
  if (!cdpSession || cdpSession.state !== CDP_STATE.REQUEST_DETECTED) return;

  if (params.requestId !== cdpSession.requestId) return;

  const { response } = params;
  
  console.log("[AI Session Live][CDP] RESPONSE DETECTED - Status:", response.status);
  console.log("[AI Session Live][CDP] RESPONSE TYPE:", response.mimeType);
  console.log("[AI Session Live][CDP] REQUEST ID:", params.requestId);

  // Vérifier si c'est une réponse streaming
  if (response.mimeType?.includes("text/event-stream") || 
      response.mimeType?.includes("stream") ||
      response.headers?.some(h => h.name.toLowerCase() === "content-type" && h.value?.includes("stream"))) {
    
    console.log("[AI Session Live][CDP] STREAM STARTED");
    cdpSession.state = CDP_STATE.STREAMING;
    cdpSession.lastActivity = Date.now();
  }
}

function handleLoadingFinished(tabId, params) {
  const cdpSession = cdpSessions.get(tabId);
  if (!cdpSession || cdpSession.state !== CDP_STATE.STREAMING) return;

  if (params.requestId !== cdpSession.requestId) return;

  console.log("[AI Session Live][CDP] STREAM COMPLETED - Request ID:", params.requestId);
  
  // Récupérer le body de la réponse
  getResponseBody(tabId, params.requestId);
}

async function getResponseBody(tabId, requestId) {
  const cdpSession = cdpSessions.get(tabId);
  if (!cdpSession) return;

  try {
    const target = { tabId };
    const result = await chrome.debugger.sendCommand(target, "Network.getResponseBody", {
      requestId: requestId
    });

    console.log("[AI Session Live][CDP] RESPONSE BODY RECEIVED");
    console.log("[AI Session Live][CDP] BODY LENGTH:", result.body?.length || 0);
    console.log("[AI Session Live][CDP] BASE64 ENCODED:", result.base64Encoded);

    let responseBody = result.body;
    if (result.base64Encoded) {
      responseBody = atob(result.body);
    }

    // Logger le contenu brut pour analyse
    console.log("[AI Session Live][CDP] RAW RESPONSE PREVIEW:", responseBody.slice(0, 500));

    // Parser la réponse SSE
    const parsedText = parseSSEResponse(responseBody);
    
    console.log("[AI Session Live][CDP] PARSED TEXT LENGTH:", parsedText.length);
    console.log("[AI Session Live][CDP] PARSED TEXT PREVIEW:", parsedText.slice(0, 100) + "...");
    console.log("[AI Session Live][CDP] FINAL RESPONSE LENGTH:", parsedText.length);

    if (parsedText.length > 0) {
      cdpSession.state = CDP_STATE.COMPLETED;
      cdpSession.buffer = parsedText;
      
      // Envoyer la réponse au content script
      sendCDPResponseToContent(tabId, parsedText);
    } else {
      console.error("[AI Session Live][CDP] Empty parsed response");
      cdpSession.state = CDP_STATE.IDLE;
    }

  } catch (error) {
    console.error("[AI Session Live][CDP] Error getting response body:", error);
    cdpSession.state = CDP_STATE.IDLE;
  }
}

function isChatGPTAPIRequest(request) {
  const url = request.url.toLowerCase();
  const method = request.method?.toLowerCase();
  
  // Vérifier l'URL
  if (!url.includes("backend-api/conversation") && 
      !url.includes("chat/completions") &&
      !url.includes("v1/chat/completions")) {
    return false;
  }

  // Vérifier la méthode
  if (method !== "post") return false;

  // Vérifier les headers
  const contentType = request.headers?.find(h => 
    h.name.toLowerCase() === "content-type"
  );
  
  if (contentType && !contentType.value?.includes("application/json")) {
    return false;
  }

  return true;
}

function parseSSEResponse(sseText) {
  try {
    console.log("[AI Session Live][CDP] Parsing SSE response...");
    
    // ChatGPT utilise le format SSE: data: {...}
    const lines = sseText.split('\n');
    let content = '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6); // Remove "data: "
        
        // Ignorer les signaux de fin
        if (data === '[DONE]') {
          console.log("[AI Session Live][CDP] Stream termination marker found");
          continue;
        }
        
        try {
          const parsed = JSON.parse(data);
          console.log("[AI Session Live][CDP] SSE chunk parsed:", Object.keys(parsed));
          
          // Extraire le contenu selon différentes structures possibles
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
            content += parsed.choices[0].delta.content || '';
          } else if (parsed.content) {
            content += parsed.content;
          } else if (parsed.message && parsed.message.content) {
            content += parsed.message.content;
          } else if (parsed.delta && parsed.delta.content) {
            content += parsed.delta.content;
          } else if (parsed.text) {
            content += parsed.text;
          }
        } catch (e) {
          console.log("[AI Session Live][CDP] Non-JSON SSE data:", data.slice(0, 50));
          // Si ce n'est pas du JSON, ajouter directement
          if (data && data !== '[DONE]') {
            content += data;
          }
        }
      }
    }
    
    const finalText = content.trim();
    console.log("[AI Session Live][CDP] Final parsed text length:", finalText.length);
    return finalText;
  } catch (error) {
    console.error("[AI Session Live][CDP] Error parsing SSE response:", error);
    // Fallback: retourner le texte brut
    return sseText;
  }
}

async function sendCDPResponseToContent(tabId, text) {
  const cdpSession = cdpSessions.get(tabId);
  if (!cdpSession) return;

  try {
    console.log("[AI Session Live][CDP] SENDING RESPONSE - Tab:", tabId);
    console.log("[AI Session Live][CDP] SENDING RESPONSE LENGTH:", text.length);

    // Générer un ID de message unique
    const messageId = `cdp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    cdpSession.messageId = messageId;

    // Envoyer au content script
    await chrome.tabs.sendMessage(tabId, {
      type: "CDP_ASSISTANT_RESPONSE",
      sessionId: cdpSession.sessionId,
      tabId: tabId,
      text: text,
      messageId: messageId
    });

    cdpSession.state = CDP_STATE.SENT;
    console.log("[AI Session Live][CDP] RESPONSE SENT");

  } catch (error) {
    console.error("[AI Session Live][CDP] Error sending response to content:", error);
    cdpSession.state = CDP_STATE.COMPLETED; // Retenter plus tard
  }
}

// ── Gestion du cycle de vie des onglets ───────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  if (cdpSessions.has(tabId)) {
    console.log("[AI Session Live][CDP] Tab closed, cleaning up - Tab:", tabId);
    detachDebugger(tabId).catch(err => {
      console.error("[AI Session Live][CDP] Error detaching on tab close:", err);
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Nettoyer si l'onglet navigue vers une autre page
  if (changeInfo.status === "complete" && cdpSessions.has(tabId)) {
    const url = tab.url?.toLowerCase();
    if (!url.includes("chatgpt.com") && !url.includes("chat.openai.com")) {
      console.log("[AI Session Live][CDP] Tab navigated away, detaching - Tab:", tabId);
      detachDebugger(tabId).catch(err => {
        console.error("[AI Session Live][CDP] Error detaching on navigation:", err);
      });
    }
  }
});

// ── Notify content scripts when sharing is toggled from popup ──

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