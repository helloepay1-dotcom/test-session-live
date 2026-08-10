"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { getOrCreateUser } from "@/lib/user";
import { pickColor } from "@/lib/colors";
import {
  Session,
  Message,
  Participant,
  Intervention,
  InterventionType,
} from "@/lib/types";
import MessageFeed from "@/components/MessageFeed";
import ParticipantList from "@/components/ParticipantList";
import InterventionPanel from "@/components/InterventionPanel";
import MessageInput from "@/components/MessageInput";
import ZeroSetupCapture from "@/components/ZeroSetupCapture";
import SimpleCapture from "@/components/SimpleCapture";
import TestCapture from "@/components/TestCapture";
import SimulatedChat from "@/components/SimulatedChat";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const userRef = useRef(getOrCreateUser());
  const participantIdRef = useRef<string | null>(null);
  const supabaseRef = useRef(createBrowserClient());

  const currentUserId = userRef.current.id;
  const me = participants.find((p) => p.user_id === currentUserId);
  const hasHand = me?.a_la_main ?? false;

  const participantsMap = useMemo(() => {
    const map = new Map<string, { nom: string; couleur: string }>();
    participants.forEach((p) =>
      map.set(p.user_id, { nom: p.nom, couleur: p.couleur })
    );
    return map;
  }, [participants]);

  // ── Join session & load initial data ──────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current;
    const user = userRef.current;

    async function init() {
      try {
        const { data: sess, error: sessErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessErr || !sess) {
          setError("Session introuvable");
          setLoading(false);
          return;
        }
        setSession(sess);

        const [msgRes, partRes, intRes] = await Promise.all([
          supabase
            .from("messages")
            .select("*")
            .eq("session_id", sessionId)
            .order("date_creation"),
          supabase
            .from("participants")
            .select("*")
            .eq("session_id", sessionId),
          supabase
            .from("interventions")
            .select("*")
            .eq("session_id", sessionId)
            .order("date_creation"),
        ]);

        setMessages(msgRes.data ?? []);
        setInterventions(intRes.data ?? []);
        
        console.log("[Session] Messages chargés:", msgRes.data?.length);
        console.log("[Session] Interventions chargées:", intRes.data?.length);

        const existingParts = partRes.data ?? [];
        const existing = existingParts.find((p) => p.user_id === user.id);

        if (existing) {
          participantIdRef.current = existing.id;
          await supabase
            .from("participants")
            .update({ en_ligne: true })
            .eq("id", existing.id);
          setParticipants(
            existingParts.map((p) =>
              p.id === existing.id ? { ...p, en_ligne: true } : p
            )
          );
        } else {
          const { data: newPart, error: partErr } = await supabase
            .from("participants")
            .insert({
              session_id: sessionId,
              user_id: user.id,
              nom: user.nom,
              couleur: pickColor(existingParts.length),
              en_ligne: true,
              a_la_main: false,
            })
            .select()
            .single();

          if (partErr) throw partErr;
          participantIdRef.current = newPart.id;
          setParticipants([...existingParts, newPart]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [sessionId]);

  // ── Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current;

    const msgChannel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[Session] Nouveau message reçu:", payload.new);
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    const partChannel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setParticipants((prev) => {
              const exists = prev.some((p) => p.id === (payload.new as Participant).id);
              return exists ? prev : [...prev, payload.new as Participant];
            });
          } else if (payload.eventType === "UPDATE") {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Participant).id
                  ? (payload.new as Participant)
                  : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== (payload.old as Participant).id)
            );
          }
        }
      )
      .subscribe();

    const intChannel = supabase
      .channel(`interventions:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interventions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setInterventions((prev) => [...prev, payload.new as Intervention]);
          } else if (payload.eventType === "UPDATE") {
            setInterventions((prev) =>
              prev.map((i) =>
                i.id === (payload.new as Intervention).id
                  ? (payload.new as Intervention)
                  : i
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(partChannel);
      supabase.removeChannel(intChannel);
    };
  }, [sessionId]);

  // ── Presence: mark offline on leave ───────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current;

    function markOffline() {
      if (participantIdRef.current) {
        supabase
          .from("participants")
          .update({ en_ligne: false })
          .eq("id", participantIdRef.current);
      }
    }

    window.addEventListener("beforeunload", markOffline);
    return () => {
      markOffline();
      window.removeEventListener("beforeunload", markOffline);
    };
  }, []);

  // ── Heartbeat presence every 30s ──────────────────────────
  useEffect(() => {
    const supabase = supabaseRef.current;
    const interval = setInterval(() => {
      if (participantIdRef.current) {
        supabase
          .from("participants")
          .update({ en_ligne: true })
          .eq("id", participantIdRef.current);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Actions ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (contenu: string, role: "utilisateur" | "assistant" = "utilisateur") => {
      // Envoyer le message à Supabase avec l'ID de l'utilisateur actuel
      await supabaseRef.current.from("messages").insert({
        session_id: sessionId,
        contenu,
        role,
        auteur_id: currentUserId,
      });
    },
    [sessionId, currentUserId]
  );

  const requestHand = useCallback(async () => {
    const supabase = supabaseRef.current;
    const currentHolder = participants.find((p) => p.a_la_main);

    if (currentHolder) {
      await supabase.from("interventions").insert({
        session_id: sessionId,
        auteur_id: currentUserId,
        contenu: `${userRef.current.nom} demande la main`,
        type: "ordre",
        statut: "en_attente",
      });
    } else if (participantIdRef.current) {
      await supabase
        .from("participants")
        .update({ a_la_main: true })
        .eq("id", participantIdRef.current);
    }
  }, [sessionId, currentUserId, participants]);

  const passHand = useCallback(
    async (target: Participant) => {
      const supabase = supabaseRef.current;
      await supabase
        .from("participants")
        .update({ a_la_main: false })
        .eq("session_id", sessionId);
      await supabase
        .from("participants")
        .update({ a_la_main: true })
        .eq("id", target.id);
    },
    [sessionId]
  );

  const submitIntervention = useCallback(
    async (contenu: string, type: InterventionType) => {
      await supabaseRef.current.from("interventions").insert({
        session_id: sessionId,
        auteur_id: currentUserId,
        contenu,
        type,
        statut: "en_attente",
      });
    },
    [sessionId, currentUserId]
  );

  const acceptIntervention = useCallback(async (id: string) => {
    await supabaseRef.current
      .from("interventions")
      .update({ statut: "acceptee" })
      .eq("id", id);
  }, []);

  const rejectIntervention = useCallback(async (id: string) => {
    await supabaseRef.current
      .from("interventions")
      .update({ statut: "rejetee" })
      .eq("id", id);
  }, []);

  const sendToInterventionAI = useCallback(async (contenu: string) => {
    try {
      const response = await fetch("/api/send-to-chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contenu,
          apiKey: process.env.OPENAI_API_KEY,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Envoyer la réponse AI comme un message dans la conversation
        await sendMessage(data.response, "assistant");
      } else {
        console.error("Erreur API OpenAI:", await response.json());
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : String(error);
      console.error("Erreur d'envoi à ChatGPT:", message);
    }
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Chargement de la session...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-accent hover:underline text-sm">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm shrink-0"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold text-zinc-100 truncate">
              {session?.titre}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                Live
              </span>
              <span>·</span>
              <span>{session?.outil_ia}</span>
            </div>
          </div>
        </div>
        <button
          onClick={copyLink}
          className="px-3 py-1.5 text-xs glass rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          {copied ? "Copié !" : "Partager le lien"}
        </button>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — participants */}
        <aside className="w-56 shrink-0 border-r border-surface-border hidden md:flex flex-col">
          <ParticipantList
            participants={participants}
            currentUserId={currentUserId}
            hasHand={hasHand}
            onRequestHand={requestHand}
            onPassHand={passHand}
          />
        </aside>

        {/* Center — messages */}
        <main className="flex-1 flex flex-col min-w-0">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-40">💬</div>
                <p className="text-zinc-400 mb-2">Commencez la conversation...</p>
                <p className="text-sm text-zinc-600">
                  Écrivez votre message ci-dessous pour démarrer une conversation avec ChatGPT.
                </p>
              </div>
            </div>
          )}
          <MessageFeed messages={messages} participantsMap={participantsMap} />
          <MessageInput hasHand={hasHand} onSend={sendMessage} />
        </main>

        {/* Right — interventions */}
        <aside className="w-64 shrink-0 border-l border-surface-border hidden lg:flex flex-col">
          <InterventionPanel
            interventions={interventions}
            hasHand={hasHand}
            onSubmit={submitIntervention}
            onAccept={acceptIntervention}
            onReject={rejectIntervention}
          />
        </aside>
      </div>
    </div>
  );
}
