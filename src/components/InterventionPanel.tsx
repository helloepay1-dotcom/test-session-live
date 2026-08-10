"use client";

import { useState } from "react";
import { Intervention, InterventionType } from "@/lib/types";

interface InterventionPanelProps {
  interventions: Intervention[];
  hasHand: boolean;
  onSubmit: (contenu: string, type: InterventionType) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const TYPE_LABELS: Record<InterventionType, string> = {
  suggestion: "💡 Suggestion",
  correction: "✏️ Correction",
  ordre: "📋 Ordre",
};

const TYPE_COLORS: Record<InterventionType, string> = {
  suggestion: "border-blue-500/20 bg-blue-500/5",
  correction: "border-amber-500/20 bg-amber-500/5",
  ordre: "border-purple-500/20 bg-purple-500/5",
};

export default function InterventionPanel({
  interventions,
  hasHand,
  onSubmit,
  onAccept,
  onReject,
}: InterventionPanelProps) {
  const [contenu, setContenu] = useState("");
  const [type, setType] = useState<InterventionType>("suggestion");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pending = interventions.filter((i) => i.statut === "en_attente");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) return;
    onSubmit(contenu.trim(), type);
    setContenu("");
  }

  async function handleSendToChatGPT(interventionContent: string, id: string) {
    // Envoyer le message à l'extension Chrome pour injection automatique
    try {
      // Utiliser l'API Chrome Runtime pour communiquer avec l'extension
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Tenter de communiquer avec l'extension
        // Note: ceci ne fonctionnera que si l'extension est installée
        console.log("Tentative d'envoi à l'extension Chrome");
        
        // Pour l'instant, fallback sur le copier-coller
        await navigator.clipboard.writeText(interventionContent);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        // Fallback: copier dans le presse-papier
        await navigator.clipboard.writeText(interventionContent);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : String(error);
      console.error("Erreur d'envoi à l'extension:", message);
      // Fallback: copier dans le presse-papier
      await navigator.clipboard.writeText(interventionContent);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Interventions
          {pending.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent/20 text-accent normal-case">
              {pending.length}
            </span>
          )}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {interventions.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">
            Aucune intervention pour l&apos;instant
          </p>
        )}

        {interventions.map((intervention) => (
          <div
            key={intervention.id}
            className={`p-3 rounded-xl border text-sm animate-slide-up ${TYPE_COLORS[intervention.type]} ${
              intervention.statut !== "en_attente" ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-zinc-400">
                {TYPE_LABELS[intervention.type]}
              </span>
              {intervention.statut === "acceptee" && (
                <span className="text-[10px] text-green-400">Acceptée</span>
              )}
              {intervention.statut === "rejetee" && (
                <span className="text-[10px] text-red-400">Ignorée</span>
              )}
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed mb-2">
              {intervention.contenu}
            </p>

            <div className="flex gap-1.5">
              {intervention.statut === "en_attente" && hasHand && (
                <>
                  <button
                    onClick={() => onAccept(intervention.id)}
                    className="flex-1 py-1 text-[10px] font-medium rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => onReject(intervention.id)}
                    className="flex-1 py-1 text-[10px] font-medium rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    Ignorer
                  </button>
                </>
              )}
              
              {intervention.statut === "en_attente" && hasHand && (
                <button
                  onClick={() => handleSendToChatGPT(intervention.contenu, intervention.id)}
                  className="flex-1 py-1 text-[10px] font-medium rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                  title="Envoyer à ChatGPT (injection automatique)"
                >
                  🤖
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-border space-y-2">
        <div className="flex gap-1">
          {(Object.keys(TYPE_LABELS) as InterventionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1 text-[10px] rounded-md transition-colors ${
                type === t
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {TYPE_LABELS[t].split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Proposer une intervention..."
            className="flex-1 bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <button
            type="submit"
            disabled={!contenu.trim()}
            className="px-3 py-2 bg-surface-overlay hover:bg-surface-border border border-surface-border rounded-lg text-xs text-zinc-300 disabled:opacity-40 transition-colors"
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}
