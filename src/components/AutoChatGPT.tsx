"use client";

import { useState } from "react";

interface AutoChatGPTProps {
  sessionId: string;
}

export default function AutoChatGPT({ sessionId }: AutoChatGPTProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sessionUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/session/${sessionId}`
    : "";
  const apiUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/receive-message`
    : "";

  function openChatGPTWithCapture() {
    // Créer un lien spécial avec tous les paramètres
    const params = new URLSearchParams({
      ai_session: "true",
      session_id: sessionId,
      api_url: apiUrl,
      api_key: "ai-session-live-2026-secret"
    });

    // Ouvrir ChatGPT avec ces paramètres
    const chatGPTUrl = `https://chatgpt.com/?${params.toString()}`;
    window.open(chatGPTUrl, "_blank");
    
    setIsOpen(true);
  }

  function copyInstructions() {
    const instructions = `
Pour activer la capture automatique sur ChatGPT :

1. Sur l'onglet ChatGPT qui vient de s'ouvrir
2. Appuyez sur F12 (ou Cmd+Option+I sur Mac)
3. Collez ce code dans la console et appuyez sur Entrée :

(function(){
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const apiUrl = params.get('api_url');
  const apiKey = params.get('api_key');
  
  if(sessionId && apiUrl && apiKey) {
    localStorage.setItem('ai_session_live_config', JSON.stringify({
      sessionId, apiUrl, apiKey
    }));
    
    const script = document.createElement('script');
    script.src = '${window.location.origin}/capture-script.js';
    document.body.appendChild(script);
    
    console.log('✅ Capture activée ! Vos messages apparaîtront automatiquement.');
  } else {
    console.log('❌ Paramètres manquants. Utilisez le lien depuis l\'application.');
  }
})();
    `.trim();

    navigator.clipboard.writeText(instructions);
    alert("Instructions copiées ! Collez-les dans la console de ChatGPT (F12).");
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
        <span className="text-lg">🤖</span>
        ChatGPT avec capture automatique
      </h3>

      {!isOpen ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Cliquez pour ouvrir ChatGPT avec la capture pré-configurée.
          </p>

          <button
            onClick={openChatGPTWithCapture}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            🚀 Ouvrir ChatGPT + Activer capture
          </button>

          <p className="text-xs text-zinc-500 text-center">
            Vous devrez coller un code dans la console (F12) - une seule fois
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-surface-overlay rounded-lg p-3">
            <p className="text-sm font-medium text-zinc-200 mb-2">
              ✓ ChatGPT ouvert dans un nouvel onglet
            </p>
            <ol className="text-sm text-zinc-400 space-y-1">
              <li>1. Allez sur l'onglet ChatGPT</li>
              <li>2. Appuyez sur F12 (ou Cmd+Option+I sur Mac)</li>
              <li>3. Cliquez sur "Copier les instructions" ci-dessous</li>
              <li>4. Collez dans la console et appuyez sur Entrée</li>
            </ol>
          </div>

          <button
            onClick={copyInstructions}
            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📋 Copier les instructions
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}