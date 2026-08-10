"use client";

import { Participant } from "@/lib/types";
import Avatar from "./Avatar";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  hasHand: boolean;
  onRequestHand: () => void;
  onPassHand: (participant: Participant) => void;
}

export default function ParticipantList({
  participants,
  currentUserId,
  hasHand,
  onRequestHand,
  onPassHand,
}: ParticipantListProps) {
  const online = participants.filter((p) => p.en_ligne);
  const me = participants.find((p) => p.user_id === currentUserId);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Participants ({online.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {participants.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
              p.a_la_main ? "bg-accent/10 border border-accent/20" : "hover:bg-surface-overlay"
            }`}
          >
            <Avatar
              nom={p.nom}
              couleur={p.couleur}
              size="sm"
              enLigne={p.en_ligne}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-200 truncate">
                  {p.nom}
                  {p.user_id === currentUserId && (
                    <span className="text-zinc-500 font-normal"> (vous)</span>
                  )}
                </span>
                {p.a_la_main && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium shrink-0">
                    ✋ main
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500">
                {p.en_ligne ? "En ligne" : "Hors ligne"}
              </span>
            </div>

            {hasHand && p.user_id !== currentUserId && p.en_ligne && (
              <button
                onClick={() => onPassHand(p)}
                className="text-[10px] px-2 py-1 rounded-md bg-surface-overlay hover:bg-surface-border text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                title={`Passer la main à ${p.nom}`}
              >
                Passer
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-surface-border">
        {!hasHand && me?.en_ligne && (
          <button
            onClick={onRequestHand}
            className="w-full py-2 text-sm font-medium rounded-lg border border-surface-border hover:border-accent/50 hover:bg-accent/5 text-zinc-300 hover:text-accent transition-all"
          >
            ✋ Demander la main
          </button>
        )}
        {hasHand && (
          <div className="text-center text-xs text-accent font-medium py-2">
            Vous avez la main
          </div>
        )}
      </div>
    </div>
  );
}
