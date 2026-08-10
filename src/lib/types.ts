export type SessionStatut = "actif" | "termine";
export type MessageRole = "utilisateur" | "assistant";
export type InterventionType = "suggestion" | "correction" | "ordre";
export type InterventionStatut = "en_attente" | "acceptee" | "rejetee";

export interface Session {
  id: string;
  titre: string;
  hote_id: string;
  outil_ia: string;
  statut: SessionStatut;
  date_creation: string;
}

export interface Message {
  id: string;
  session_id: string;
  contenu: string;
  role: MessageRole;
  auteur_id: string | null;
  date_creation: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  nom: string;
  couleur: string;
  en_ligne: boolean;
  a_la_main: boolean;
}

export interface Intervention {
  id: string;
  session_id: string;
  auteur_id: string;
  contenu: string;
  type: InterventionType;
  statut: InterventionStatut;
  date_creation: string;
}

export interface LocalUser {
  id: string;
  nom: string;
}
