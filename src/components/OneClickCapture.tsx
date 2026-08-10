"use client";

import { useState } from "react";

interface OneClickCaptureProps {
  sessionId: string;
}

export default function OneClickCapture({ sessionId }: OneClickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"chatgpt" | "claude">("chatgpt");

  const sessionUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/session/${sessionId}`
    : "";
  const apiUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/receive-message`
    : "";

  function openWithCapture() {
    // Créer une fenêtre popup avec le script de capture
    const popup = window.open(
      selectedPlatform === "chatgpt" ? "https://chatgpt.com" : "https://claude.ai",
      "ai-session-live-capture",
      "width=800,height=600"
    );

    if (popup) {
      // Attendre que la popup se charge
      setTimeout(() => {
        // Injecter le script de capture
        const script = document.createElement("script");
        script.src = `${window.location.origin}/capture-script.js`;
        script.dataset.sessionUrl = sessionUrl;
        script.dataset.apiUrl = apiUrl;
        script.dataset.apiKey = "ai-session-live-2026-secret";
        script.dataset.sessionId = sessionId;
        
        popup.document.head.appendChild(script);
        
        // Fermer la popup après 2 secondes
        setTimeout(() => {
          popup.close();
          alert("✅ Capture activée ! Retournez sur ChatGPT/Claude - les messages apparaîtront automatiquement.");
        }, 2000);
      }, 1000);
    } else {
      alert("Veuillez autoriser les popups pour cette fonctionnalité");
    }
  }

  function openDirectLink() {
    // Méthode alternative : lien direct avec paramètres
    const params = new URLSearchParams({
      session: sessionId,
      apiUrl: apiUrl,
      apiKey: "ai-session-live-2026-secret"
    });
    
    const targetUrl = selectedPlatform === "chatgpt" 
      ? `https://chatgpt.com/?${params.toString()}`
      : `https://claude.ai/?${params.toString()}`;
    
    window.open(targetUrl, "_blank");
  }

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-green-400 flex items-center gap-2">
          <span className="text-lg">🎯</span>
          Capture en 1 clic
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          {isOpen ? "▼" : "▶"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Choisissez où vous voulez discuter, puis cliquez sur le bouton. La capture démarrera automatiquement !
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform("chatgpt")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedPlatform === "chatgpt"
                  ? "bg-green-500 text-white"
                  : "bg-surface-overlay text-zinc-400 hover:text-zinc-200"
              }`}
            >
              💬 ChatGPT
            </button>
            <button
              onClick={() => setSelectedPlatform("claude")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedPlatform === "claude"
                  ? "bg-green-500 text-white"
                  : "bg-surface-overlay text-zinc-400 hover:text-zinc-200"
              }`}
            >
              🤖 Claude
            </button>
          </div>

          <button
            onClick={openWithCapture}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
          >
            🚀 Ouvrir {selectedPlatform === "chatgpt" ? "ChatGPT" : "Claude"} + Capturer
          </button>

          <div className="text-center">
            <button
              onClick={openDirectLink}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Méthode alternative (lien direct)
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <p className="text-sm text-zinc-400">
          Cliquez pour ouvrir {selectedPlatform === "chatgpt" ? "ChatGPT" : "Claude"} avec capture automatique
        </p>
      )}
    </div>
  );
}