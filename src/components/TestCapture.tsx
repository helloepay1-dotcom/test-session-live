"use client";

import { useState } from "react";

interface TestCaptureProps {
  sessionId: string;
  onMessage: (content: string, role: "utilisateur" | "assistant") => void;
}

export default function TestCapture({ sessionId, onMessage }: TestCaptureProps) {
  const [isSending, setIsSending] = useState(false);

  const testConversation = [
    { role: "utilisateur" as const, content: "Bonjour ! Peux-tu m'aider ?" },
    { role: "assistant" as const, content: "Bien sûr ! Comment puis-je vous aider aujourd'hui ?" },
    { role: "utilisateur" as const, content: "Je veux créer une application web" },
    { role: "assistant" as const, content: "Excellent choix ! Je peux vous aider avec ça. Quels technologies voulez-vous utiliser ?" },
  ];

  async function sendTestConversation() {
    setIsSending(true);
    
    for (const msg of testConversation) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onMessage(msg.content, msg.role);
    }
    
    setIsSending(false);
  }

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
        <span className="text-lg">🧪</span>
        Test rapide
      </h3>

      <p className="text-sm text-zinc-300 mb-3">
        Cliquez pour voir une conversation de test apparaître instantanément.
      </p>

      <button
        onClick={sendTestConversation}
        disabled={isSending}
        className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isSending ? "⏳ Envoi en cours..." : "🚀 Envoyer conversation de test"}
      </button>

      <div className="mt-3 pt-3 border-t border-green-500/20">
        <p className="text-xs text-zinc-500">
          💡 Ceci simule une conversation ChatGPT pour tester l'application.
        </p>
      </div>
    </div>
  );
}