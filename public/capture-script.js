/**
 * Script de capture automatique pour bookmarklet
 * À exécuter sur chatgpt.com ou claude.ai
 */

(function() {
  'use strict';
  
  // Configuration
  let config = {
    sessionUrl: localStorage.getItem('ai_session_live_url') || '',
    apiUrl: localStorage.getItem('ai_session_live_api') || '',
    apiKey: localStorage.getItem('ai_session_live_key') || 'ai-session-live-2026-secret'
  };
  
  const sentMessages = new Set();
  const pendingAssistant = new Map();
  const DEBOUNCE_MS = 1500;
  
  // UI de configuration
  function showConfigUI() {
    const existingUI = document.getElementById('ai-session-live-config');
    if (existingUI) {
      existingUI.remove();
      return;
    }
    
    const ui = document.createElement('div');
    ui.id = 'ai-session-live-config';
    ui.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: #0a0a0b;
      border: 1px solid #2a2a2e;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      font-family: -apple-system, sans-serif;
      color: #e4e4e7;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
    
    ui.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 16px;">🎯 AI Session Live</h3>
        <button onclick="document.getElementById('ai-session-live-config').remove()" style="background: none; border: none; color: #71717a; cursor: pointer; font-size: 20px;">×</button>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">URL de session</label>
        <input type="url" id="sessionUrlInput" value="${config.sessionUrl}" placeholder="https://votre-app.com/session/..." style="width: 100%; padding: 8px; background: #141416; border: 1px solid #2a2a2e; border-radius: 6px; color: #e4e4e7; font-size: 14px;">
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">URL API</label>
        <input type="url" id="apiUrlInput" value="${config.apiUrl}" placeholder="https://votre-app.com/api/receive-message" style="width: 100%; padding: 8px; background: #141416; border: 1px solid #2a2a2e; border-radius: 6px; color: #e4e4e7; font-size: 14px;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">Clé API</label>
        <input type="password" id="apiKeyInput" value="${config.apiKey}" style="width: 100%; padding: 8px; background: #141416; border: 1px solid #2a2a2e; border-radius: 6px; color: #e4e4e7; font-size: 14px;">
      </div>
      
      <button onclick="saveAndStart()" style="width: 100%; padding: 10px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🚀 Démarrer la capture</button>
      
      <div id="status" style="margin-top: 12px; font-size: 12px; color: #22c55e; text-align: center;"></div>
    `;
    
    document.body.appendChild(ui);
    
    // Exposer la fonction globalement
    window.saveAndStart = function() {
      config.sessionUrl = document.getElementById('sessionUrlInput').value;
      config.apiUrl = document.getElementById('apiUrlInput').value;
      config.apiKey = document.getElementById('apiKeyInput').value;
      
      localStorage.setItem('ai_session_live_url', config.sessionUrl);
      localStorage.setItem('ai_session_live_api', config.apiUrl);
      localStorage.setItem('ai_session_live_key', config.apiKey);
      
      const sessionId = config.sessionUrl.match(/\/session\/([a-f0-9-]+)/i)?.[1];
      if (!sessionId) {
        document.getElementById('status').textContent = '❌ URL de session invalide';
        document.getElementById('status').style.color = '#ef4444';
        return;
      }
      
      config.sessionId = sessionId;
      document.getElementById('status').textContent = '✅ Configuration sauvegardée ! Capture en cours...';
      
      setTimeout(() => {
        ui.remove();
        startCapture();
      }, 1500);
    };
  }
  
  // Détection de plateforme
  function getPlatform() {
    const host = window.location.hostname;
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) return 'chatgpt';
    return null;
  }
  
  // Extraction des messages
  function extractMessages() {
    const platform = getPlatform();
    const results = [];
    
    if (platform === 'chatgpt') {
      document.querySelectorAll('[data-message-author-role]').forEach(el => {
        const roleAttr = el.getAttribute('data-message-author-role');
        const role = roleAttr === 'user' ? 'utilisateur' : 'assistant';
        const textEl = el.querySelector('.markdown, .whitespace-pre-wrap') || el;
        const text = textEl.textContent?.trim() || '';
        if (text) results.push({ element: el, text, role });
      });
    } else if (platform === 'claude') {
      document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"]').forEach(el => {
        const isUser = el.getAttribute('data-testid') === 'user-message';
        const role = isUser ? 'utilisateur' : 'assistant';
        const text = el.textContent?.trim() || '';
        if (text) results.push({ element: el, text, role });
      });
    }
    
    return results;
  }
  
  // Envoi vers l'API
  async function sendMessage(contenu, role) {
    if (!config.sessionId || !config.apiUrl) return;
    
    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: config.sessionId,
          contenu,
          role,
          api_key: config.apiKey
        })
      });
      
      if (response.ok) {
        console.log('[AI Session Live] Message envoyé:', role, contenu.slice(0, 50) + '...');
      }
    } catch (error) {
      console.error('[AI Session Live] Erreur d\'envoi:', error);
    }
  }
  
  // Gestion des messages avec debounce
  function handleMessage(element, text, role) {
    const hash = `${role}:${text.slice(0, 200)}:${text.length}`;
    
    if (role === 'utilisateur') {
      if (sentMessages.has(hash)) return;
      sentMessages.add(hash);
      sendMessage(text, role);
      return;
    }
    
    // Assistant: debounce
    const existing = pendingAssistant.get(element);
    if (existing) {
      clearTimeout(existing.timer);
      existing.lastText = text;
    }
    
    const entry = {
      lastText: text,
      timer: setTimeout(() => {
        const finalHash = `${role}:${entry.lastText.slice(0, 200)}:${entry.lastText.length}`;
        pendingAssistant.delete(element);
        
        if (sentMessages.has(finalHash)) return;
        sentMessages.add(finalHash);
        sendMessage(entry.lastText, role);
      }, DEBOUNCE_MS)
    };
    
    pendingAssistant.set(element, entry);
  }
  
  // Observer pour détecter les nouveaux messages
  let observer = null;
  
  function startObserver() {
    if (observer) return;
    
    observer = new MutationObserver(() => {
      const messages = extractMessages();
      messages.forEach(({ element, text, role }) => {
        handleMessage(element, text, role);
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Scan initial
    const messages = extractMessages();
    messages.forEach(({ element, text, role }) => {
      handleMessage(element, text, role);
    });
  }
  
  function startCapture() {
    const sessionId = config.sessionUrl.match(/\/session\/([a-f0-9-]+)/i)?.[1];
    if (!sessionId) {
      showConfigUI();
      return;
    }
    
    config.sessionId = sessionId;
    startObserver();
    
    // Indicateur visuel
    const indicator = document.createElement('div');
    indicator.id = 'ai-session-live-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    indicator.textContent = '🎯 Capture active';
    indicator.onclick = showConfigUI;
    document.body.appendChild(indicator);
    
    console.log('[AI Session Live] Capture démarrée pour', getPlatform());
  }
  
  // Lancement
  if (!config.sessionUrl) {
    showConfigUI();
  } else {
    startCapture();
  }
  
  // Nettoyage au changement de page
  window.addEventListener('beforeunload', () => {
    if (observer) observer.disconnect();
    const indicator = document.getElementById('ai-session-live-indicator');
    if (indicator) indicator.remove();
  });
  
})();