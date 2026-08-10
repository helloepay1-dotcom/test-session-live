"use client";

import { useState } from "react";

interface ZeroSetupCaptureProps {
  sessionId: string;
  onMessage: (content: string, role: "utilisateur" | "assistant") => void;
}

export default function ZeroSetupCapture({ sessionId, onMessage }: ZeroSetupCaptureProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  async function processConversation() {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Analyser le texte collé pour détecter automatiquement les messages
    const lines = input.split('\n').filter(line => line.trim());
    let currentRole: "utilisateur" | "assistant" = "utilisateur";
    let currentMessage = "";
    
    for (const line of lines) {
      // Détection heuristique des rôles
      if (line.toLowerCase().includes("user:") || line.toLowerCase().includes("moi:")) {
        if (currentMessage) {
          onMessage(currentMessage, currentRole);
        }
        currentRole = "utilisateur";
        currentMessage = line.replace(/^(user|moi):\s*/i, "").trim();
      } else if (line.toLowerCase().includes("assistant:") || line.toLowerCase().includes("chatgpt:") || line.toLowerCase().includes("claude:")) {
        if (currentMessage) {
          onMessage(currentMessage, currentRole);
        }
        currentRole = "assistant";
        currentMessage = line.replace(/^(assistant|chatgpt|claude):\s*/i, "").trim();
      } else {
        currentMessage += (currentMessage ? "\n" : "") + line;
      }
    }
    
    if (currentMessage) {
      onMessage(currentMessage, currentRole);
    }
    
    setInput("");
    setIsProcessing(false);
  }

  return (
    <div className="bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 rounded-xl p-4">
      <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
        <span className="text-lg">✨</span>
        Capture instantanée - Zéro configuration
      </h3>
      
      <p className="text-sm text-zinc-300 mb-3">
        Copiez-collez simplement votre conversation ChatGPT/Claude ici. Notre IA détectera automatiquement les messages et les rôles.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Collez votre conversation ici...
Exemple:
User: Comment créer une application React?
Assistant: Voici les étapes pour créer une application React..."
        className="w-full h-32 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none mb-3"
      />

      <button
        onClick={processConversation}
        disabled={!input.trim() || isProcessing}
        className="w-full py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isProcessing ? "⏳ Traitement..." : "🚀 Capturer et analyser"}
      </button>

      <div className="mt-3 pt-3 border-t border-surface-border">
        <p className="text-xs text-zinc-500">
          💡 Astuce : Cette méthode ne nécessite AUCUNE installation. Parfait pour tester rapidement !
        </p>
      </div>
    </div>
  );
}