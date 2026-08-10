"use client";

import { useState } from "react";

interface SimpleCaptureProps {
  sessionId: string;
}

export default function SimpleCapture({ sessionId }: SimpleCaptureProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"chatgpt" | "claude">("chatgpt");
  const [isConfiguring, setIsConfiguring] = useState(false);

  const sessionUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/session/${sessionId}`
    : "";
  const apiUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/receive-message`
    : "";

  function openWithInstructions() {
    // Ouvrir ChatGPT/Claude dans un nouvel onglet
    const targetUrl = selectedPlatform === "chatgpt" 
      ? "https://chatgpt.com"
      : "https://claude.ai";
    
    window.open(targetUrl, "_blank");
    
    // Afficher les instructions
    setIsConfiguring(true);
  }

  function copyConfig() {
    const configText = `
Pour activer la capture automatique :

1. Sur l'onglet ${selectedPlatform === "chatgpt" ? "ChatGPT" : "Claude"} qui vient de s'ouvrir
2. Appuyez sur F12 (ou Cmd+Option+I sur Mac) pour ouvrir la console
3. Copiez et collez ce code dans la console, puis appuyez sur Entrée :

fetch('${apiUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: '${sessionId}',
    contenu: 'Test capture',
    role: 'utilisateur',
    api_key: 'ai-session-live-2026-secret'
  })
}).then(r => r.json()).then(console.log);

4. Si vous voyez "success", la capture fonctionne !
5. Vos messages apparaîtront automatiquement ici.
    `.trim();

    navigator.clipboard.writeText(configText);
    alert("Instructions copiées ! Collez-les dans la console de ChatGPT/Claude.");
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Capture ultra-simple
      </h3>

      {!isConfiguring ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Cliquez sur le bouton, puis suivez les instructions simples qui apparaîtront.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform("chatgpt")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedPlatform === "chatgpt"
                  ? "bg-blue-500 text-white"
                  : "bg-surface-overlay text-zinc-400 hover:text-zinc-200"
              }`}
            >
              💬 ChatGPT
            </button>
            <button
              onClick={() => setSelectedPlatform("claude")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedPlatform === "claude"
                  ? "bg-blue-500 text-white"
                  : "bg-surface-overlay text-zinc-400 hover:text-zinc-200"
              }`}
            >
              🤖 Claude
            </button>
          </div>

          <button
            onClick={openWithInstructions}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            🚀 Ouvrir {selectedPlatform === "chatgpt" ? "ChatGPT" : "Claude"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-surface-overlay rounded-lg p-3">
            <p className="text-sm font-medium text-zinc-200 mb-2">
              ✓ {selectedPlatform === "chatgpt" ? "ChatGPT" : "Claude"} ouvert dans un nouvel onglet
            </p>
            <ol className="text-sm text-zinc-400 space-y-1">
              <li>1. Allez sur l'onglet qui vient de s'ouvrir</li>
              <li>2. Appuyez sur F12 (ou Cmd+Option+I sur Mac)</li>
              <li>3. Collez le code ci-dessous dans la console</li>
              <li>4. Appuyez sur Entrée</li>
            </ol>
          </div>

          <button
            onClick={copyConfig}
            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📋 Copier le code pour la console
          </button>

          <button
            onClick={() => setIsConfiguring(false)}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}