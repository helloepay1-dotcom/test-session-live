"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import Avatar from "./Avatar";

interface MessageFeedProps {
  messages: Message[];
  participantsMap: Map<string, { nom: string; couleur: string }>;
}

export default function MessageFeed({
  messages,
  participantsMap,
}: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [groupedMessages, setGroupedMessages] = useState<Message[][]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Grouper les messages consécutifs du même auteur
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((msg, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(msg);
      } else {
        const lastMsg = currentGroup[currentGroup.length - 1];
        const sameAuthor = lastMsg.auteur_id === msg.auteur_id;
        const sameRole = lastMsg.role === msg.role;
        
        if (sameAuthor && sameRole) {
          currentGroup.push(msg);
        } else {
          groups.push(currentGroup);
          currentGroup = [msg];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    setGroupedMessages(groups);
  }, [messages]);

  const formatMessage = (text: string) => {
    // Formatage basique du texte
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code class="bg-zinc-700 px-1 rounded">$1</code>') // Code inline
      .replace(/\n/g, '<br>'); // Line breaks
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-30">💬</div>
          <p className="text-zinc-400">En attente de messages...</p>
          <p className="text-xs mt-2 text-zinc-600">
            Connectez l&apos;extension Chrome ou écrivez un message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {groupedMessages.map((group, groupIndex) => {
        const firstMsg = group[0];
        const isUser = firstMsg.role === "utilisateur";
        
        // Cas spécial pour les messages de l'extension
        const isExtension = firstMsg.auteur_id === "extension-chrome";
        const author = isExtension 
          ? { nom: "Extension Chrome", couleur: "#6366f1" }
          : (firstMsg.auteur_id ? participantsMap.get(firstMsg.auteur_id) : null);

        return (
          <div
            key={`group-${groupIndex}`}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {isUser && author ? (
              <Avatar nom={author.nom} couleur={author.couleur} size="md" />
            ) : isExtension ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-xs font-bold text-white">🔌</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover border border-accent/30 flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
            )}

            <div
              className={`max-w-[80%] flex flex-col gap-1 ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              {author && isUser && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-medium text-zinc-400">{author.nom}</span>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: author.couleur }}
                  />
                </div>
              )}

              <div className="space-y-1">
                {group.map((msg, msgIndex) => (
                  <div
                    key={msg.id}
                    className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap animate-slide-up ${
                      isUser
                        ? "bg-gradient-to-br from-accent to-accent-hover text-white rounded-2xl rounded-tr-sm shadow-lg"
                        : "glass rounded-2xl rounded-tl-sm text-zinc-200 border border-surface-border"
                    }`}
                    style={{ 
                      animationDelay: `${(groupIndex * 50 + msgIndex * 20)}ms`,
                      borderRadius: msgIndex === group.length - 1 
                        ? isUser ? '0.8rem 0.8rem 0.8rem 0' : '0.8rem 0.8rem 0.8rem 0'
                        : '0.8rem'
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.contenu) }} />
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-zinc-600 px-1 flex items-center gap-1">
                <span>{formatTime(firstMsg.date_creation)}</span>
                {group.length > 1 && (
                  <span className="text-zinc-700">({group.length} messages)</span>
                )}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
