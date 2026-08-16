-- ============================================================
-- Migration: Ajouter le champ sent_at à la table messages
-- Exécutez ce script dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Ajouter la colonne sent_at si elle n'existe pas déjà
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Créer un index pour optimiser les requêtes sur sent_at
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
