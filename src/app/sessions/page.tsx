"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { getOrCreateUser } from "@/lib/user";

interface Session {
  id: string;
  titre: string;
  outil_ia: string;
  statut: string;
  date_creation: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const supabase = createBrowserClient();
      const user = getOrCreateUser();

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("hote_id", user.id)
        .order("date_creation", { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  function getOutilEmoji(outil: string) {
    switch (outil) {
      case "chatgpt": return "💬";
      case "claude": return "🤖";
      default: return "✨";
    }
  }

  function getStatutColor(statut: string) {
    switch (statut) {
      case "actif": return "text-green-400";
      case "termine": return "text-zinc-400";
      default: return "text-zinc-300";
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <header className="border-b border-surface-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Mes Sessions</h1>
          <Link
            href="/create"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Nouvelle session
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">Aucune session</h2>
            <p className="text-zinc-400 mb-6">
              Créez votre première session de collaboration IA
            </p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-colors"
            >
              Créer une session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block bg-surface-overlay border border-surface-border rounded-xl p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getOutilEmoji(session.outil_ia)}</span>
                      <h3 className="font-semibold text-zinc-100">{session.titre}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className={getStatutColor(session.statut)}>
                        {session.statut === 'actif' ? 'Actif' : 'Terminé'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(session.date_creation)}</span>
                    </div>
                  </div>
                  <div className="text-zinc-500">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}