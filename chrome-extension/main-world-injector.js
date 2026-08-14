/**
 * Script injecté dans le MAIN world de ChatGPT
 * Objectif : Diagnostiquer si ChatGPT utilise fetch() et si le streaming continue en background
 */

(function() {
  'use strict';

  console.log('[AI Session Live][MAIN WORLD] Script injecté dans le MAIN world');
  console.log('[AI Session Live][MAIN WORLD] Visibility actuelle:', document.visibilityState);

  let chunkCount = 0;
  let currentRequestId = null;
  let streamActive = false;

  // Surcharger window.fetch
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    const options = args[1] || {};

    console.log('[AI Session Live][MAIN WORLD] FETCH INTERCEPTED');
    console.log('[AI Session Live][MAIN WORLD] URL:', url);
    console.log('[AI Session Live][MAIN WORLD] METHOD:', options.method || 'GET');
    console.log('[AI Session Live][MAIN WORLD] Visibility:', document.visibilityState);

    // Appel original
    const response = await originalFetch(...args);

    console.log('[AI Session Live][MAIN WORLD] RESPONSE STATUS:', response.status);
    console.log('[AI Session Live][MAIN WORLD] HAS BODY:', !!response.body);

    // Vérifier si c'est une requête ChatGPT API
    if (isChatGPTAPIRequest(url)) {
      console.log('[AI Session Live][MAIN WORLD] 🔍 Requête ChatGPT API détectée');
      
      if (response.body) {
        console.log('[AI Session Live][MAIN WORLD] ✅ Response.body disponible');
        
        // Générer un ID de requête
        currentRequestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log('[AI Session Live][MAIN WORLD] Request ID:', currentRequestId);

        // Tenter le stream
        try {
          const [branch1, branch2] = response.body.tee();
          console.log('[AI Session Live][MAIN WORLD] Stream tenté avec succès');

          // Branch 1 : ChatGPT consomme normalement
          const clonedResponse = new Response(branch1, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });

          // Branch 2 : Nous lisons
          streamActive = true;
          chunkCount = 0;
          
          readStream(branch2, currentRequestId);

          return clonedResponse;
        } catch (error) {
          console.error('[AI Session Live][MAIN WORLD] ❌ Erreur stream.tee():', error);
          return response;
        }
      } else {
        console.log('[AI Session Live][MAIN WORLD] ❌ Response.body non disponible');
      }
    }

    return response;
  };

  function isChatGPTAPIRequest(url) {
    if (typeof url !== 'string') return false;
    const urlLower = url.toLowerCase();
    return urlLower.includes('backend-api/conversation') || 
           urlLower.includes('chat/completions') ||
           urlLower.includes('v1/chat/completions');
  }

  async function readStream(stream, requestId) {
    console.log('[AI Session Live][MAIN WORLD] 📖 Lecture du stream démarrée');
    console.log('[AI Session Live][MAIN WORLD] Visibility:', document.visibilityState);

    try {
      const reader = stream.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[AI Session Live][MAIN WORLD] STREAM FINISHED');
          console.log('[AI Session Live][MAIN WORLD] Total chunks:', chunkCount);
          console.log('[AI Session Live][MAIN WORLD] Visibility finale:', document.visibilityState);
          
          streamActive = false;
          
          // Notifier le content script
          window.postMessage({
            type: 'AI_SESSION_LIVE_STREAM_FINISHED',
            requestId: requestId,
            chunkCount: chunkCount,
            visibility: document.visibilityState
          }, '*');
          
          break;
        }

        chunkCount++;
        console.log('[AI Session Live][MAIN WORLD] CHUNK #' + chunkCount + ' RECEIVED');
        console.log('[AI Session Live][MAIN WORLD] Chunk size:', value?.length || 0);
        console.log('[AI Session Live][MAIN WORLD] Visibility:', document.visibilityState);
        
        // Convertir en texte pour voir le contenu
        const textDecoder = new TextDecoder();
        const chunkText = textDecoder.decode(value);
        console.log('[AI Session Live][MAIN WORLD] Chunk preview:', chunkText.slice(0, 100));

        // Envoyer le chunk au content script
        window.postMessage({
          type: 'AI_SESSION_LIVE_STREAM_CHUNK',
          requestId: requestId,
          chunkNumber: chunkCount,
          chunkText: chunkText,
          visibility: document.visibilityState
        }, '*');
      }
    } catch (error) {
      console.error('[AI Session Live][MAIN WORLD] ❌ Erreur lecture stream:', error);
      streamActive = false;
    }
  }

  // Suivi des changements de visibilité
  document.addEventListener('visibilitychange', () => {
    console.log('[AI Session Live][MAIN WORLD] Visibility changed:', document.visibilityState);
    console.log('[AI Session Live][MAIN WORLD] Stream actif:', streamActive);
  });

  console.log('[AI Session Live][MAIN WORLD] Diagnostic prêt - Surcharge fetch active');
})();