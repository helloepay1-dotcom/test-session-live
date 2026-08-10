"use client";

import { useState } from "react";

interface SimulatedChatProps {
  sessionId: string;
  onMessage: (content: string, role: "utilisateur" | "assistant") => void;
}

export default function SimulatedChat({ sessionId, onMessage }: SimulatedChatProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const simulatedResponses = [
    "C'est une excellente question ! Laissez-moi vous expliquer...",
    "Je comprends votre point de vue. Voici ce que je propose...",
    "Intéressant ! Permettez-moi de détailler cela...",
    "Vous avez raison ! Voici une solution possible...",
  ];

  async function sendMessage() {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsProcessing(true);
    
    onMessage(userMessage, "utilisateur");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomResponse = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
    onMessage(randomResponse + " " + userMessage, "assistant");
    
    setIsProcessing(false);
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
        <span className="text-lg">💬</span>
        Simuler une conversation
      </h3>

      <p className="text-sm text-zinc-300 mb-3">
        Écrivez votre message et l'IA simulée répondra automatiquement.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={isProcessing}
          className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isProcessing ? "⏳" : "📤"}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-purple-500/20">
        <p className="text-xs text-zinc-500">
          💡 Ceci simule une conversation IA pour tester la collaboration.
        </p>
      </div>
    </div>
  );
}