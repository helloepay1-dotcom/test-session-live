-- ============================================================
-- AI Session Live — Schéma Supabase
-- Exécutez ce script dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Table sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre         TEXT NOT NULL,
  hote_id       TEXT NOT NULL,
  outil_ia      TEXT NOT NULL DEFAULT 'chatgpt',
  statut        TEXT NOT NULL DEFAULT 'actif'
                CHECK (statut IN ('actif', 'termine')),
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  contenu       TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('utilisateur', 'assistant')),
  auteur_id     TEXT,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

-- ── Table participants ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  nom           TEXT NOT NULL,
  couleur       TEXT NOT NULL DEFAULT '#6366f1',
  en_ligne      BOOLEAN NOT NULL DEFAULT true,
  a_la_main     BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);

-- ── Table interventions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS interventions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  auteur_id     TEXT NOT NULL,
  contenu       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'suggestion'
                CHECK (type IN ('suggestion', 'correction', 'ordre')),
  statut        TEXT NOT NULL DEFAULT 'en_attente'
                CHECK (statut IN ('en_attente', 'acceptee', 'rejetee')),
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventions_session ON interventions(session_id);

-- ── Activer Realtime ────────────────────────────────────────
-- REPLICA IDENTITY FULL permet à Realtime de diffuser les UPDATE/DELETE
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE participants REPLICA IDENTITY FULL;
ALTER TABLE interventions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE interventions;

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Politiques permissives (app sans auth — à renforcer en production)
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (true);

CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "participants_select" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update" ON participants FOR UPDATE USING (true);
CREATE POLICY "participants_delete" ON participants FOR DELETE USING (true);

CREATE POLICY "interventions_select" ON interventions FOR SELECT USING (true);
CREATE POLICY "interventions_insert" ON interventions FOR INSERT WITH CHECK (true);
CREATE POLICY "interventions_update" ON interventions FOR UPDATE USING (true);
