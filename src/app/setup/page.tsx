"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bookmarkletCode = mounted 
    ? `javascript:(function(){const script=document.createElement('script');script.src='${window.location.origin}/capture-script.js';document.body.appendChild(script);})();`
    : 'javascript:(function(){const script=document.createElement("script");script.src="http://localhost:3000/capture-script.js";document.body.appendChild(script);})();';

  async function copyBookmarklet() {
    await navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-border px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
              Installation en 30 secondes
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Capture automatique <span className="text-accent">sans extension</span>
            </h1>
            <p className="text-lg text-zinc-400">
              Ajoutez simplement un favori à votre navigateur. C'est tout !
            </p>
          </div>

          <div className="space-y-6">
            {/* Étape 1 */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">1</div>
                <h3 className="font-semibold text-lg">Copiez le bookmarklet</h3>
              </div>
              
              <div className="bg-surface-overlay border border-surface-border rounded-lg p-4 mb-4">
                <code className="text-xs text-zinc-400 break-all">
                  {bookmarkletCode.slice(0, 100)}...
                </code>
              </div>
              
              <button
                onClick={copyBookmarklet}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
              >
                {copied ? "✅ Copié !" : "📋 Copier le bookmarklet"}
              </button>
            </div>

            {/* Étape 2 */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">2</div>
                <h3 className="font-semibold text-lg">Créez un nouveau favori</h3>
              </div>
              
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Dans votre navigateur (Chrome, Firefox, Safari) :</p>
                <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                  <li>Faites un clic droit sur votre barre de favoris</li>
                  <li>Sélectionnez "Ajouter une page..." ou "Nouveau favori"</li>
                  <li>Collez le code bookmarklet copié</li>
                  <li>Appelez-le "🎯 Capture AI Session"</li>
                </ol>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">3</div>
                <h3 className="font-semibold text-lg">Utilisez-le sur ChatGPT ou Claude</h3>
              </div>
              
              <div className="space-y-3 text-sm text-zinc-300">
                <p>Quand vous êtes sur chatgpt.com ou claude.ai :</p>
                <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                  <li>Cliquez sur votre favori "🎯 Capture AI Session"</li>
                  <li>Entrez l'URL de votre session (une seule fois)</li>
                  <li>La capture démarre automatiquement !</li>
                </ol>
              </div>
            </div>

            {/* Avantages */}
            <div className="bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 rounded-2xl p-6">
              <h3 className="font-semibold text-accent mb-4">✨ Avantages</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Aucune installation d'extension requise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Fonctionne sur tous les navigateurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Capture automatique en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Configuration une seule fois</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Impossible de bloquer par les sites</span>
                </li>
              </ul>
            </div>

            {/* Test */}
            <div className="text-center">
              <Link
                href="/create"
                className="inline-block px-6 py-3 bg-surface-overlay hover:bg-surface-border border border-surface-border text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Créer une session de test →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}