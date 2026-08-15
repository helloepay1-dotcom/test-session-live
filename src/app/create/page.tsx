"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { getOrCreateUser } from "@/lib/user";
import { pickColor } from "@/lib/colors";

const OUTILS = [
  { id: "chatgpt", label: "ChatGPT", emoji: "💬" },
  { id: "claude", label: "Claude", emoji: "🤖" },
  { id: "gemini", label: "Gemini", emoji: "✨" },
  { id: "autre", label: "Autre", emoji: "🔮" },
];

export default function CreateSessionPage() {
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [outil, setOutil] = useState("chatgpt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedExt, setCopiedExt] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const user = getOrCreateUser();

      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          titre: titre.trim(),
          hote_id: user.id,
          outil_ia: outil,
          statut: "actif",
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: participantError } = await supabase
        .from("participants")
        .insert({
          session_id: session.id,
          user_id: user.id,
          nom: user.nom,
          couleur: pickColor(0),
          en_ligne: true,
          a_la_main: true,
        });

      if (participantError) throw participantError;

      const link = `${window.location.origin}/session/${session.id}`;
      setCreatedLink(link);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création. Vérifiez votre connexion Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyExtUrl() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopiedExt(true);
    setTimeout(() => setCopiedExt(false), 2000);
  }

  async function copyApiUrl() {
    const apiUrl = `${window.location.origin}/api/receive-message`;
    await navigator.clipboard.writeText(apiUrl);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  }

  async function copyApiKey() {
    const apiKey = process.env.NEXT_PUBLIC_API_SECRET_KEY || "ai-session-live-2026-secret";
    await navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  if (createdLink) {
    const apiUrl = `${window.location.origin}/api/receive-message`;
    const apiKey = process.env.NEXT_PUBLIC_API_SECRET_KEY || "ai-session-live-2026-secret";

    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-8">
        <div className="max-w-lg w-full glass rounded-2xl p-8 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Session créée !</h2>
            <p className="text-sm text-zinc-400">
              Configurez votre extension avec ces informations
            </p>
          </div>

          {/* Lien de session pour l'équipe */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              🔗 Lien pour l'équipe
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={createdLink}
                className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border rounded-lg text-sm transition-colors"
              >
                {copied ? "✓" : "Copier"}
              </button>
            </div>
          </div>

          {/* Configuration extension */}
          <div className="bg-surface-overlay/50 border border-surface-border rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">⚙️ Configuration Extension</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  URL de la session
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={createdLink}
                    className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
                  />
                  <button
                    onClick={copyExtUrl}
                    className="px-3 py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border rounded-lg text-sm transition-colors"
                  >
                    {copiedExt ? "✓" : "Copier"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  URL de l'API
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={apiUrl}
                    className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
                  />
                  <button
                    onClick={copyApiUrl}
                    className="px-3 py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border rounded-lg text-sm transition-colors"
                  >
                    {copiedApi ? "✓" : "Copier"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Clé API
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
                  />
                  <button
                    onClick={copyApiKey}
                    className="px-3 py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border rounded-lg text-sm transition-colors"
                  >
                    {copiedKey ? "✓" : "Copier"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                // Ouvrir l'outil IA choisi
                if (outil === "chatgpt") {
                  window.open("https://chatgpt.com", "_blank");
                } else if (outil === "claude") {
                  window.open("https://claude.ai", "_blank");
                } else if (outil === "gemini") {
                  window.open("https://gemini.google.com", "_blank");
                }
                router.push(createdLink.replace(window.location.origin, ""));
              }}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
            >
              {outil === "chatgpt" ? "🚀 Ouvrir ChatGPT et rejoindre" : 
               outil === "claude" ? "🚀 Ouvrir Claude et rejoindre" :
               outil === "gemini" ? "🚀 Ouvrir Gemini et rejoindre" :
               "🚀 Rejoindre la session"}
            </button>
            
            <button
              onClick={() => {
                router.push(createdLink.replace(window.location.origin, ""));
              }}
              className="w-full py-3 bg-surface-overlay hover:bg-surface-border border border-surface-border text-zinc-300 font-medium rounded-xl transition-colors"
            >
              Rejoindre sans ouvrir l'outil IA
            </button>
            
            <Link
              href="/sessions"
              className="block w-full py-3 text-center text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
            >
              Voir mes sessions →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-8">
      <div className="max-w-lg w-full glass rounded-2xl p-8 animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Créer une session</h1>
          <p className="text-sm text-zinc-400">
            Commencez une collaboration en temps réel
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Titre de la session
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Réunion marketing"
              className="w-full bg-surface-overlay border border-surface-border rounded-lg px-4 py-3 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Outil IA
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTILS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutil(o.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    outil === o.id
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface-overlay border-surface-border text-zinc-400 hover:border-surface-border"
                  }`}
                >
                  <div className="text-lg mb-1">{o.emoji}</div>
                  <div className="text-xs">{o.label}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "🚀 Créer la session"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/sessions"
            className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            ← Retour aux sessions
          </Link>
        </div>
      </div>
    </div>
  );
}