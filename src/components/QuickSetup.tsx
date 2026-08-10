"use client";

import { useState } from "react";

interface QuickSetupProps {
  sessionId: string;
  onSetupComplete: () => void;
}

export default function QuickSetup({ sessionId, onSetupComplete }: QuickSetupProps) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const sessionUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/session/${sessionId}`
    : "";

  const apiUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/receive-message`
    : "";

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
      <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
        <span className="text-lg">⚡</span>
        Configuration rapide
      </h3>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Suivez ces 3 étapes pour capturer automatiquement vos conversations IA :
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">1</span>
              <p className="text-sm text-zinc-300">
                <a 
                  href="https://chrome.google.com/webstore/detail/ai-session-live-capture/YOUR_EXTENSION_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Installez l'extension Chrome
                </a>
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">2</span>
              <p className="text-sm text-zinc-300">
                Cliquez sur le bouton "Configurer automatiquement" ci-dessous
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">3</span>
              <p className="text-sm text-zinc-300">
                Ouvrez ChatGPT ou Claude.ai - la capture démarre automatiquement
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Configurer automatiquement
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            L'extension va être configurée avec ces paramètres :
          </p>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-surface-overlay rounded px-3 py-2">
              <span className="text-zinc-400">URL session</span>
              <button
                onClick={() => copyToClipboard(sessionUrl)}
                className="text-accent hover:underline truncate max-w-[200px]"
              >
                {copied ? "Copié !" : sessionUrl.slice(0, 30) + "..."}
              </button>
            </div>
            
            <div className="flex justify-between items-center bg-surface-overlay rounded px-3 py-2">
              <span className="text-zinc-400">URL API</span>
              <button
                onClick={() => copyToClipboard(apiUrl)}
                className="text-accent hover:underline truncate max-w-[200px]"
              >
                {copied ? "Copié !" : apiUrl.slice(0, 30) + "..."}
              </button>
            </div>
            
            <div className="flex justify-between items-center bg-surface-overlay rounded px-3 py-2">
              <span className="text-zinc-400">Clé API</span>
              <span className="text-zinc-500">ai-session-live-2026-secret</span>
            </div>
          </div>

          <button
            onClick={() => {
              // Ouvrir ChatGPT avec auto-configuration
              window.open('https://chatgpt.com', '_blank');
              onSetupComplete();
            }}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            🚀 Ouvrir ChatGPT et démarrer
          </button>
          
          <button
            onClick={() => setStep(1)}
            className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Retour
          </button>
        </div>
      )}
    </div>
  );
}