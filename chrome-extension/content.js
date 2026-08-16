/**
 * Content script — capture les messages ChatGPT et Claude.ai
 * Utilise MutationObserver + debounce pour les réponses streaming
 */

(function () {
  "use strict";

  const DEBOUNCE_MS = 1500;
  const sentMessages = new Set();
  const pendingAssistant = new Map(); // element -> { timer, lastText, role }

  let isCapturing = false;
  let config = {};
  let processedIds = new Set();
  let currentUserId = null;
  let pollTimer = null;
  let lastProcessedMessageId = null;
  let ourCapturedMessages = new Set(); // Pour éviter la boucle d'auto-injection
  let lastAssistantText = ""; // Pour le debugging de visibilité

  // ── Debugging visibility tracking ──────────────────────────
  
  document.addEventListener("visibilitychange", () => {
    console.log("[E-ONEZEN] Visibility changed:", document.visibilityState);
  });

  function logVisibilityState(context) {
    console.log("[E-ONEZEN]", context, "- Onglet visible:", !document.hidden);
    console.log("[E-ONEZEN]", context, "- VisibilityState:", document.visibilityState);
    console.log("[E-ONEZEN]", context, "- Dernier message assistant:", lastAssistantText.slice(0, 50) + "...");
    console.log("[E-ONEZEN]", context, "- Timestamp:", Date.now());
  }

  // ── Platform detection ────────────────────────────────────

  function getPlatform() {
    const host = window.location.hostname;
    if (host.includes("claude.ai")) return "claude";
    if (host.includes("chatgpt.com") || host.includes("chat.openai.com"))
      return "chatgpt";
    if (host.includes("gemini.google.com") || host.includes("aistudio.google.com"))
      return "gemini";
    return null;
  }

  // ── Message extraction ──────────────────────────────────────

  function extractChatGPTMessages() {
    const results = [];

    // ChatGPT uses data-message-author-role attributes
    document
      .querySelectorAll("[data-message-author-role]")
      .forEach((el) => {
        const roleAttr = el.getAttribute("data-message-author-role");
        const role = roleAttr === "user" ? "utilisateur" : "assistant";

        const textEl =
          el.querySelector(".markdown, .whitespace-pre-wrap, [class*='markdown']") ||
          el;
        const text = getCleanText(textEl);
        if (!text) return;

        results.push({ element: el, text, role });
      });

    // Fallback: conversation turn containers
    if (results.length === 0) {
      document
        .querySelectorAll("article[data-testid^='conversation-turn']")
        .forEach((el) => {
          const isUser = el.querySelector("[data-message-author-role='user']");
          const role = isUser ? "utilisateur" : "assistant";
          const textEl = el.querySelector(".markdown, .whitespace-pre-wrap") || el;
          const text = getCleanText(textEl);
          if (!text) return;
          results.push({ element: el, text, role });
        });
    }

    return results;
  }

  function extractClaudeMessages() {
    const results = [];

    console.log("[AI Session Live] 🔍 Extraction Claude messages...");

    // Claude user messages - sélecteurs mis à jour
    document
      .querySelectorAll("[data-testid='user-message'], .font-user-message, .prose p")
      .forEach((el) => {
        const text = getCleanText(el);
        if (text && text.length > 1) {
          console.log("[AI Session Live] 📝 Claude user message trouvé:", text.slice(0, 50));
          results.push({ element: el, text, role: "utilisateur" });
        }
      });

    // Claude assistant messages - sélecteurs améliorés
    document
      .querySelectorAll(
        "[data-testid='assistant-message'], .font-claude-message, .prose, .markdown"
      )
      .forEach((el) => {
        // Avoid nested prose inside user messages
        if (el.closest("[data-testid='user-message']")) return;
        const text = getCleanText(el);
        if (text && text.length > 1) {
          console.log("[AI Session Live] 🤖 Claude assistant message trouvé:", text.slice(0, 50));
          results.push({ element: el, text, role: "assistant" });
        }
      });

    // Fallback: message group containers
    if (results.length === 0) {
      console.log("[AI Session Live] ⚠️ Fallback extraction Claude");
      document
        .querySelectorAll(".group\\/conversation-turn, [class*='Message'], article")
        .forEach((el, i) => {
          const text = getCleanText(el);
          if (!text || text.length < 2) return;
          const role = i % 2 === 0 ? "utilisateur" : "assistant";
          console.log("[AI Session Live] 🔄 Fallback Claude message:", role, text.slice(0, 30));
          results.push({ element: el, text, role });
        });
    }

    console.log("[AI Session Live] 📊 Claude messages extraits:", results.length);
    return results;
  }

  function extractGeminiMessages() {
    const results = [];

    console.log("[AI Session Live] 🔍 Extraction Gemini messages...");

    // Gemini user messages - sélecteurs mis à jour pour Gemini actuel
    document
      .querySelectorAll("[data-test-id='user-turn'], .user-message, .model-input-user-query, .qe-user-query, [data-test-id*='user']")
      .forEach((el) => {
        const text = getCleanText(el);
        if (text && text.length > 1) {
          console.log("[AI Session Live] 📝 Gemini user message trouvé:", text.slice(0, 50));
          results.push({ element: el, text, role: "utilisateur" });
        }
      });

    // Gemini assistant messages - sélecteurs mis à jour pour Gemini actuel
    document
      .querySelectorAll("[data-test-id='model-turn'], .model-response, .markdown, .response-content, .model-annotation, [data-test-id*='model']")
      .forEach((el) => {
        // Avoid nested elements inside user messages
        if (el.closest("[data-test-id='user-turn']") || el.closest(".user-message") || el.closest("[data-test-id*='user']")) return;
        const text = getCleanText(el);
        if (text && text.length > 1) {
          console.log("[AI Session Live] 🤖 Gemini assistant message trouvé:", text.slice(0, 50));
          results.push({ element: el, text, role: "assistant" });
        }
      });

    // Fallback: Try generic message containers
    if (results.length === 0) {
      console.log("[AI Session Live] ⚠️ Fallback extraction Gemini");
      document
        .querySelectorAll(".conversation-turn, .message-container, [class*='Turn'], article, .response")
        .forEach((el, i) => {
          const text = getCleanText(el);
          if (!text || text.length < 2) return;
          const role = i % 2 === 0 ? "utilisateur" : "assistant";
          console.log("[AI Session Live] 🔄 Fallback Gemini message:", role, text.slice(0, 30));
          results.push({ element: el, text, role });
        });
    }

    console.log("[AI Session Live] 📊 Gemini messages extraits:", results.length);
    return results;
  }

  function getCleanText(el) {
    const clone = el.cloneNode(true);
    clone
      .querySelectorAll("button, svg, img, nav, script, style")
      .forEach((n) => n.remove());
    return clone.textContent?.trim() || "";
  }

  function getMessageHash(text, role) {
    return `${role}:${text.slice(0, 200)}:${text.length}`;
  }

  // ── Send logic with debounce for streaming ────────────────

  function handleMessage(element, text, role) {
    const hash = getMessageHash(text, role);

    if (role === "utilisateur") {
      if (sentMessages.has(hash)) return;
      sentMessages.add(hash);
      
      // Marquer ce message comme "notre capture" pour éviter la boucle
      ourCapturedMessages.add(hash);
      
      sendMessage(text, role);
      return;
    }

    // Assistant: debounce — wait for text to stop changing
    const existing = pendingAssistant.get(element);

    if (existing) {
      clearTimeout(existing.timer);
      existing.lastText = text;
    }

    // Log pour debugging de visibilité
    lastAssistantText = text;
    logVisibilityState("Assistant message détecté");

    const entry = {
      lastText: text,
      timer: setTimeout(() => {
        const finalText = entry.lastText;
        const finalHash = getMessageHash(finalText, role);
        pendingAssistant.delete(element);

        if (sentMessages.has(finalHash)) return;
        sentMessages.add(finalHash);
        
        logVisibilityState("Assistant message finalisé (envoi)");
        sendMessage(finalText, role);
      }, DEBOUNCE_MS),
    };

    pendingAssistant.set(element, entry);
  }

  function sendMessage(contenu, role) {
    if (!isCapturing || !config.sessionId) {
      console.log("[AI Session Live] ❌ Message non envoyé - capture inactive ou no session");
      return;
    }

    // Vérification supplémentaire pour éviter la pollution entre sessions
    const data = chrome.storage.local.get(["sessionId"]);
    if (data.sessionId && data.sessionId !== config.sessionId) {
      console.log("[AI Session Live] ❌ Session mismatch detected - stopping send");
      stopCapture();
      return;
    }

    console.log("[AI Session Live] 📤 Envoi message:", role, contenu.slice(0, 80) + "...", "userId:", currentUserId, "sessionId:", config.sessionId);

    chrome.runtime.sendMessage({
      type: "SEND_MESSAGE",
      payload: {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        sessionId: config.sessionId,
        contenu,
        role,
        userId: currentUserId,
      },
    });
  }

  // ── DOM Observer ────────────────────────────────────────────

  function scanMessages() {
    if (!isCapturing) return;

    const platform = getPlatform();
    let messages;
    
    if (platform === "claude") {
      messages = extractClaudeMessages();
    } else if (platform === "gemini") {
      messages = extractGeminiMessages();
    } else {
      messages = extractChatGPTMessages();
    }

    // Log pour debugging
    if (messages.length > 0) {
      logVisibilityState(`ScanMessages - ${messages.length} messages trouvés`);
    }

    messages.forEach(({ element, text, role }) => {
      handleMessage(element, text, role);
    });
  }

  let observer = null;

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(() => {
      scanMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    scanMessages();

    if (!pollTimer) {
      pollTimer = setInterval(pollForMessages, 2000);
    }
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    pendingAssistant.forEach((entry) => clearTimeout(entry.timer));
    pendingAssistant.clear();
  }

  // ── Polling pour les messages à injecter ─────────────────────

  function pollForMessages() {
    console.log("[AI Session Live] POLLING CHECK - isCapturing:", isCapturing, "sessionId:", config.sessionId, "userId:", currentUserId);
    
    if (!isCapturing || !config.sessionId || !currentUserId) {
      console.log("[AI Session Live] POLLING SKIPPED - conditions not met");
      return;
    }

    // Vérifier que la session est toujours active (éviter de poller une ancienne session)
    chrome.storage.local.get(["active", "sessionId"], (data) => {
      if (!data.active || data.sessionId !== config.sessionId) {
        console.log("[AI Session Live] POLLING STOPPED - session inactive or changed");
        stopCapture();
        return;
      }

      // Continuer le polling seulement si la session est valide
      const apiUrl = new URL(config.apiUrl);
      const appUrl = `${apiUrl.protocol}//${apiUrl.host}`;

      const pollUrl =
        `${appUrl}/api/poll-messages` +
        `?session_id=${encodeURIComponent(config.sessionId)}` +
        `&user_id=${encodeURIComponent(currentUserId)}`;

      console.log("[AI Session Live] POLLING URL:", pollUrl);

      fetch(pollUrl)
        .then(response => {
          console.log("[AI Session Live] POLLING STATUS:", response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return response.json();
        })
        .then(data => {

          console.log("[AI Session Live] POLLING RESPONSE:", data);

          if (!Array.isArray(data.messages)) {
            console.log("[AI Session Live] NO MESSAGES ARRAY");
            return;
          }

          console.log("[AI Session Live] MESSAGES COUNT:", data.messages.length);
          
          data.messages.forEach(message => {

            console.log("[AI Session Live] MESSAGE RECEIVED:", message);

            // Ignorer nos propres messages
            if (
              String(message.auteur_id) ===
              String(currentUserId)
            ) {
              console.log("[AI Session Live] SKIPPED (own message):", message.auteur_id, "==", currentUserId);
              return;
          }

          // Vérifier que le message appartient à la bonne session
          if (String(message.session_id) !== String(config.sessionId)) {
            console.log("[AI Session Live] SKIPPED (wrong session):", message.session_id, "!=", config.sessionId);
            return;
          }

          // Vérifier si c'est un message que NOUS avons capturé (boucle d'auto-injection)
          const messageHash = getMessageHash(message.contenu, message.role);
          if (ourCapturedMessages.has(messageHash)) {
            console.log("[AI Session Live] SKIPPED (our captured message - avoiding loop):", message.contenu);
            return;
          }

          // Seulement les messages utilisateur
          if (message.role !== "utilisateur") {
            console.log("[AI Session Live] SKIPPED (role):", message.role);
            return;
          }

          // Éviter les doublons
          if (
            lastProcessedMessageId &&
            String(message.id) ===
            String(lastProcessedMessageId)
          ) {
            console.log("[AI Session Live] SKIPPED (already processed):", message.id);
            return;
          }

          console.log("[AI Session Live] INJECTING MESSAGE FROM:", message.auteur_id, ":", message.contenu);

          const success =
            injectTextIntoChatGPT(message.contenu);

          if (success) {
            lastProcessedMessageId = message.id;
            console.log("[AI Session Live] MARKED AS PROCESSED:", message.id);
          }
        });
      })
      .catch(error => {
        console.error("[AI Session Live] POLLING ERROR:", error);
      });
    });
  }

  // ── Injection dans ChatGPT ───────────────────────────────────

  function findAIComposer() {
    const platform = getPlatform();
    
    // Sélecteurs spécifiques pour ChatGPT
    const chatgptSelectors = [
      '#prompt-textarea',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    // Sélecteurs spécifiques pour Claude
    const claudeSelectors = [
      'div[contenteditable="true"][data-placeholder="true"]',
      'div[contenteditable="true"][data-testid]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    // Sélecteurs spécifiques pour Gemini
    const geminiSelectors = [
      'div[contenteditable="true"][data-testid="user-input"]',
      'div[contenteditable="true"][data-placeholder*="Message"]',
      'div[contenteditable="true"][data-placeholder*="Enter"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][class*="input"]',
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];

    let selectors;
    if (platform === "claude") {
      selectors = claudeSelectors;
    } else if (platform === "gemini") {
      selectors = geminiSelectors;
    } else {
      selectors = chatgptSelectors;
    }

    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (element) {
        console.log(
          "[AI Session Live] ✅ Composer trouvé avec:",
          selector,
          element,
          "platform:",
          platform
        );

        return element;
      }
    }

    console.error(
      "[AI Session Live] ❌ Aucun composer trouvé pour",
      platform
    );

    return null;
  }

  function injectTextIntoChatGPT(text) {
    const platform = getPlatform();
    const composer = findAIComposer();

    if (!composer) {
      console.error(
        "[AI Session Live] ❌ Compositeur introuvable pour",
        platform
      );
      return false;
    }

    console.log(
      "[AI Session Live] 📝 Injection :",
      text,
      "platform:",
      platform
    );

    composer.focus();

    // ─────────────────────────────────────────────
    // CAS 1 : contenteditable
    // ─────────────────────────────────────────────
    if (composer.getAttribute("contenteditable") === "true") {
      // Méthode modern pour Gemini et Claude
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      selection.removeAllRanges();
      selection.addRange(range);
      
      composer.textContent = text;
      
      // Événements pour React/Gemini
      composer.dispatchEvent(new Event("input", { bubbles: true }));
      composer.dispatchEvent(new Event("change", { bubbles: true }));
      
      console.log("[AI Session Live] ✅ Injection contenteditable (", platform, ")");
      
      // Laisser le framework mettre à jour son état
      setTimeout(() => {
        sendMessageButton();
      }, 300);
      
      return true;
    }

    // ─────────────────────────────────────────────
    // CAS 2 : textarea (ChatGPT)
    // ─────────────────────────────────────────────
    if (composer.tagName === "TEXTAREA") {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;

      nativeInputValueSetter.call(composer, text);

      composer.dispatchEvent(new Event("input", { bubbles: true }));
      composer.dispatchEvent(new Event("change", { bubbles: true }));

      console.log("[AI Session Live] ✅ Injection textarea");

      setTimeout(() => {
        sendMessageButton();
      }, 300);

      return true;
    }

    // ─────────────────────────────────────────────
    // CAS 3 : input type text
    // ─────────────────────────────────────────────
    if (composer.tagName === "INPUT" && composer.type === "text") {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;

      nativeInputValueSetter.call(composer, text);

      composer.dispatchEvent(new Event("input", { bubbles: true }));
      composer.dispatchEvent(new Event("change", { bubbles: true }));

      console.log("[AI Session Live] ✅ Injection input text");

      setTimeout(() => {
        sendMessageButton();
      }, 300);

      return true;
    }

    console.error("[AI Session Live] ❌ Type d'élément non supporté:", composer.tagName);
    return false;
  }

  function sendMessageButton() {
    const platform = getPlatform();
    
    // Sélecteurs spécifiques pour ChatGPT
    const chatgptSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'button svg[data-icon="send"]',
      'button[class*="send"]',
      'button:has(svg)'
    ];

    // Sélecteurs spécifiques pour Claude
    const claudeSelectors = [
      'button[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      'button[type="submit"]',
      'button:has(svg)',
      'button[class*="send"]'
    ];

    // Sélecteurs spécifiques pour Gemini
    const geminiSelectors = [
      'button[aria-label="Send message"]',
      'button[aria-label*="send"]',
      'button[data-testid="send-button"]',
      'button[type="submit"]',
      'button:has(svg[data-icon="send"])',
      'button:has(svg)',
      'button[class*="send"]',
      'button:has([class*="send"])',
      'button svg'
    ];

    let selectors;
    if (platform === "claude") {
      selectors = claudeSelectors;
    } else if (platform === "gemini") {
      selectors = geminiSelectors;
    } else {
      selectors = chatgptSelectors;
    }

    let sendButton = null;
    let foundSelector = null;

    for (const selector of selectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        
        for (const button of buttons) {
          if (
            button &&
            !button.disabled &&
            button.getAttribute("aria-disabled") !== "true" &&
            button.offsetParent !== null // Bouton visible
          ) {
            sendButton = button;
            foundSelector = selector;
            console.log(
              "[AI Session Live] ✅ Bouton trouvé:",
              selector,
              "platform:",
              platform
            );
            break;
          }
        }
        
        if (sendButton) break;
      } catch (e) {
        // Sélecteur invalide, continuer
        continue;
      }
    }

    if (!sendButton) {
      console.error(
        "[AI Session Live] ❌ Bouton Send introuvable pour",
        platform
      );
      
      // Log pour debug : lister tous les boutons
      const allButtons = document.querySelectorAll('button');
      console.log("[AI Session Live] 📋 Boutons disponibles:", 
        Array.from(allButtons).map(b => ({
          text: b.textContent?.slice(0, 20),
          disabled: b.disabled,
          ariaLabel: b.getAttribute('aria-label'),
          dataTestid: b.getAttribute('data-testid')
        }))
      );
      
      return false;
    }

    // Méthode 1: Click simple
    try {
      sendButton.click();
      console.log(
        "[AI Session Live] 🚀 Click Send exécuté (méthode 1, platform:",
        platform,
        ")"
      );
    } catch (e) {
      // Méthode 2: Simuler les événements de souris
      console.log("[AI Session Live] 🔄 Tentative méthode 2");
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      
      sendButton.dispatchEvent(mouseDownEvent);
      setTimeout(() => {
        sendButton.dispatchEvent(mouseUpEvent);
        sendButton.dispatchEvent(clickEvent);
        console.log(
          "[AI Session Live] 🚀 Click Send exécuté (méthode 2, platform:",
          platform,
          ")"
        );
      }, 50);
    }

    return true;
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async function startCapture() {
    console.log("[AI Session Live] 🚀 Démarrage de la capture...");
    
    const data = await chrome.storage.local.get([
      "active",
      "sessionId",
      "apiUrl",
      "apiKey",
      "userId",
    ]);

    // Vérifier que la capture est toujours active
    if (!data.active) {
      console.log("[AI Session Live] ❌ Capture non active, abandon");
      return;
    }

    // Vérifier qu'on a une configuration valide
    if (!data.sessionId || !data.apiUrl || !data.apiKey) {
      console.log("[AI Session Live] ❌ Configuration invalide", data);
      return;
    }

    // Vérifier que l'URL de session correspond au sessionId stocké
    const currentUrl = window.location.href;
    const currentSessionId = currentUrl.match(/\/session\/([a-f0-9-]+)/i)?.[1];
    
    if (data.sessionId && currentSessionId && data.sessionId !== currentSessionId) {
      console.log("[AI Session Live] ❌ Session ID mismatch:", data.sessionId, "vs", currentSessionId);
      console.log("[AI Session Live] ⚠️ Arrêt de la capture (session changée)");
      stopCapture();
      return;
    }

    console.log("[AI Session Live] 📦 Configuration chargée:", data);

    config = {
      sessionId: data.sessionId,
      apiUrl: data.apiUrl,
      apiKey: data.apiKey,
      userId: data.userId,
    };

    currentUserId = data.userId;

    // Nettoyer les sets pour éviter les boucles entre sessions
    sentMessages.clear();
    ourCapturedMessages.clear();
    processedIds.clear();
    lastProcessedMessageId = null;

    console.log("[AI Session Live] ⚙️ Config finale:", {
      sessionId: config.sessionId,
      apiUrl: config.apiUrl,
      userId: currentUserId,
      platform: getPlatform()
    });

    isCapturing = true;
    startObserver();

    // Demander l'attachement CDP pour capture en arrière-plan
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "ATTACH_CDP",
        payload: {
          tabId: await getCurrentTabId(),
          sessionId: data.sessionId,
          config: config
        }
      }).catch(err => {
        console.log("[AI Session Live] CDP attach failed (normal if not supported):", err);
      });
    }

    console.log(
      "[AI Session Live] ✅ Capture démarrée —",
      getPlatform(),
      "session:",
      config.sessionId,
      "userId:",
      currentUserId
    );
  }

  function stopCapture() {
    isCapturing = false;
    stopObserver();
    
    // Nettoyer les sets
    sentMessages.clear();
    ourCapturedMessages.clear();
    processedIds.clear();
    lastProcessedMessageId = null;
    lastAssistantText = "";
    
    // Détacher CDP si attaché
    if (chrome.runtime && chrome.runtime.sendMessage) {
      getCurrentTabId().then(tabId => {
        if (tabId) {
          chrome.runtime.sendMessage({
            type: "DETACH_CDP",
            payload: { tabId }
          }).catch(err => {
            console.log("[AI Session Live] CDP detach failed:", err);
          });
        }
      });
    }
    
    // Réinitialiser la configuration locale
    config = {};
    currentUserId = null;
    
    console.log("[AI Session Live] Capture arrêtée et sets nettoyés");
  }

async function getCurrentTabId() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id || null;
  } catch {
    return null;
  }
}

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "START_CAPTURE") startCapture();
    if (message.type === "STOP_CAPTURE") stopCapture();
    
    if (message.type === "INJECT_TEXT") {
      injectTextIntoChatGPT(message.text);
    }
    
    if (message.type === "TEST_INJECTION") {
      // Test manuel avec logs détaillés
      console.log("[AI Session Live] 🧪 Test d'injection manuel");
      console.log("[AI Session Live] 🧪 Platform:", getPlatform());
      const result = injectTextIntoChatGPT("TEST MULTIPLAYER");
      console.log("[AI Session Live] 🧪 Résultat test:", result);
    }
    
    if (message.type === "TEST_BUTTON") {
      // Test uniquement le bouton d'envoi
      console.log("[AI Session Live] 🧪 Test bouton d'envoi");
      console.log("[AI Session Live] 🧪 Platform:", getPlatform());
      const result = sendMessageButton();
      console.log("[AI Session Live] 🧪 Résultat test bouton:", result);
    }
  });

  // Auto-start if already active when page loads
  chrome.storage.local.get(["active"], (data) => {
    if (data.active) startCapture();
  });

  // Écouter les messages de l'application web pour arrêter la capture
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "AI_SESSION_LEAVE") {
      console.log("[AI Session Live] Signal de départ de session reçu");
      stopCapture();
    }
  });
})();