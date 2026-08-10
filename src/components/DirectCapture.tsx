"use client";

import { useState } from "react";

interface DirectCaptureProps {
  sessionId: string;
  onMessage: (content: string, role: "utilisateur" | "assistant") => void;
}

export default function DirectCapture({ sessionId, onMessage }: DirectCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedMessages, setCapturedMessages] = useState(0);

  function startCapture() {
    setIsCapturing(true);
    
    // Simuler la capture (à remplacer par vraie intégration)
    const interval = setInterval(() => {
      // Ici, on intégrerait directement avec les APIs ChatGPT/Claude
      // Plus besoin d'extension Chrome
      setCapturedMessages(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }

  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
      <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Capture directe (sans extension)
      </h3>
      
      <p className="text-sm text-zinc-300 mb-3">
        Collez simplement votre conversation ChatGPT/Claude ici pour la capturer automatiquement.
      </p>

      {!isCapturing ? (
        <button
          onClick={startCapture}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          🚀 Démarrer la capture
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Capture en cours...
          </div>
          <p className="text-xs text-zinc-500">
            {capturedMessages} messages capturés
          </p>
          <button
            onClick={() => setIsCapturing(false)}
            className="w-full py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Arrêter
          </button>
        </div>
      )}
    </div>
  );
}