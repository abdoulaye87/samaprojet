-- ============================================
-- Simulation Économique GLM5 — Supabase (PostgreSQL) Schema
-- ============================================

-- Extension for UUID generation (optional, used for future enhancements)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: Agent
-- ============================================
CREATE TABLE IF NOT EXISTS "Agent" (
  "id" SERIAL PRIMARY KEY,
  "prenom" TEXT NOT NULL,
  "balance" NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
  "dette" NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  "investissementTotal" NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: Transaction
-- ============================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" SERIAL PRIMARY KEY,
  "agentId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "montant" NUMERIC(15, 2) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Transaction_type_check" CHECK (
    "type" IN ('achat', 'vente', 'pret', 'remboursement', 'depot', 'retrait', 'crash', 'inflation')
  )
);

-- ============================================
-- TABLE: Loan
-- ============================================
CREATE TABLE IF NOT EXISTS "Loan" (
  "id" SERIAL PRIMARY KEY,
  "agentId" INTEGER NOT NULL,
  "montant" NUMERIC(15, 2) NOT NULL,
  "tauxInteret" NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  "statut" TEXT NOT NULL DEFAULT 'en cours',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Loan_statut_check" CHECK (
    "statut" IN ('en cours', 'rembourse')
  )
);

-- ============================================
-- TABLE: MarketItem
-- ============================================
CREATE TABLE IF NOT EXISTS "MarketItem" (
  "id" SERIAL PRIMARY KEY,
  "produit" TEXT NOT NULL UNIQUE,
  "prix" NUMERIC(15, 2) NOT NULL,
  "prixBase" NUMERIC(15, 2) NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: Economy
-- ============================================
CREATE TABLE IF NOT EXISTS "Economy" (
  "id" SERIAL PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
  "periode" INTEGER NOT NULL DEFAULT 1,
  "inflationCumul" NUMERIC(10, 4) NOT NULL DEFAULT 0.00,
  "inflationRate" NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: EventLog
-- ============================================
CREATE TABLE IF NOT EXISTS "EventLog" (
  "id" SERIAL PRIMARY KEY,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "periode" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================
ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE;

ALTER TABLE "Loan"
  ADD CONSTRAINT "Loan_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "Transaction_agentId_idx" ON "Transaction"("agentId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Loan_agentId_idx" ON "Loan"("agentId");
CREATE INDEX IF NOT EXISTS "Loan_statut_idx" ON "Loan"("statut");
CREATE INDEX IF NOT EXISTS "EventLog_createdAt_idx" ON "EventLog"("createdAt" DESC);

-- ============================================
-- INITIAL SEED DATA
-- ============================================

-- Agents initiaux
INSERT INTO "Agent" ("prenom", "balance", "dette") VALUES
  ('Aminata', 2500.00, 0.00),
  ('Moussa', 1800.00, 500.00),
  ('Fatou', 3200.00, 0.00),
  ('Ibrahima', 900.00, 1200.00),
  ('Rokhaya', 4100.00, 200.00)
ON CONFLICT DO NOTHING;

-- Produits du marché
INSERT INTO "MarketItem" ("produit", "prix", "prixBase") VALUES
  ('Riz', 500.00, 500.00),
  ('Huile', 800.00, 800.00),
  ('Ciment', 3000.00, 3000.00),
  ('Farine', 400.00, 400.00),
  ('Sucre', 600.00, 600.00)
ON CONFLICT DO NOTHING;

-- État initial de l'économie
INSERT INTO "Economy" ("id", "periode", "inflationCumul", "inflationRate") VALUES
  (1, 1, 0.00, 0.02)
ON CONFLICT DO NOTHING;

-- ============================================
-- SQL FUNCTIONS
-- ============================================

-- Fonction: Appliquer l'inflation
-- Augmente les prix du marché selon le taux d'inflation, incrémente la période
CREATE OR REPLACE FUNCTION apply_inflation(rate NUMERIC DEFAULT NULL)
RETURNS TABLE(
  item_produit TEXT,
  ancien_prix NUMERIC,
  nouveau_prix NUMERIC,
  nouvelle_periode INTEGER,
  nouveau_inflation_cumul NUMERIC
) AS $$
DECLARE
  current_rate NUMERIC;
  current_economy RECORD;
BEGIN
  -- Récupérer le taux actuel si non fourni
  IF rate IS NOT NULL THEN
    current_rate := rate;
  ELSE
    SELECT * INTO current_economy FROM "Economy" WHERE "id" = 1;
    current_rate := current_economy."inflationRate";
  END IF;

  -- Mettre à jour l'économie
  UPDATE "Economy"
  SET
    "periode" = "periode" + 1,
    "inflationCumul" = "inflationCumul" + current_rate,
    "updatedAt" = NOW()
  WHERE "id" = 1;

  -- Retourner les prix avant/après pour chaque produit
  RETURN QUERY
  UPDATE "MarketItem"
  SET
    "prix" = ROUND("prix" * (1 + current_rate), 2),
    "updatedAt" = NOW()
  FROM (SELECT "periode", "inflationCumul" FROM "Economy" WHERE "id" = 1) AS e
  RETURNING
    "MarketItem"."produit" AS item_produit,
    ("MarketItem"."prix" / (1 + current_rate)) AS ancien_prix,
    "MarketItem"."prix" AS nouveau_prix,
    e."periode" AS nouvelle_periode,
    e."inflationCumul" AS nouveau_inflation_cumul;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Appliquer les intérêts sur les prêts en cours
CREATE OR REPLACE FUNCTION apply_interests()
RETURNS TABLE(
  loan_id INTEGER,
  agent_prenom TEXT,
  ancien_montant NUMERIC,
  nouveau_montant NUMERIC,
  taux NUMERIC
) AS $$
BEGIN
  -- Appliquer les intérêts sur les prêts en cours
  RETURN QUERY
  UPDATE "Loan"
  SET "montant" = ROUND("montant" * (1 + "tauxInteret"), 2)
  FROM "Agent" ON "Agent"."id" = "Loan"."agentId"
  WHERE "Loan"."statut" = 'en cours'
  RETURNING
    "Loan"."id" AS loan_id,
    "Agent"."prenom" AS agent_prenom,
    ("Loan"."montant" / (1 + "Loan"."tauxInteret")) AS ancien_montant,
    "Loan"."montant" AS nouveau_montant,
    "Loan"."tauxInteret" AS taux;

  -- Recalculer la dette totale de chaque agent à partir des prêts actifs
  -- (exécuté en une seule passe pour performance)
  PERFORM
    update_agent_debts();
END;
$$ LANGUAGE plpgsql;

-- Fonction utilitaire: Mettre à jour la dette de chaque agent
CREATE OR REPLACE FUNCTION update_agent_debts()
RETURNS VOID AS $$
BEGIN
  -- Réinitialiser toutes les dettes
  UPDATE "Agent" SET "dette" = 0.00;

  -- Recalculer à partir des prêts en cours
  UPDATE "Agent" a
  SET "dette" = COALESCE((
    SELECT SUM(l."montant")
    FROM "Loan" l
    WHERE l."agentId" = a."id" AND l."statut" = 'en cours'
  ), 0.00);
END;
$$ LANGUAGE plpgsql;

-- Fonction: Crash économique aléatoire
-- Perte de 0-50% sur les soldes, perturbation des prix (70-100% du prix actuel)
CREATE OR REPLACE FUNCTION crash_economy()
RETURNS TABLE(
  agent_prenom TEXT,
  perte_pourcentage NUMERIC,
  solde_avant NUMERIC,
  solde_apres NUMERIC,
  item_produit TEXT,
  prix_avant NUMERIC,
  prix_apres NUMERIC
) AS $$
DECLARE
  random_pct NUMERIC;
  price_factor NUMERIC;
BEGIN
  -- Appliquer une perte aléatoire de 0 à 50% sur chaque agent
  RETURN QUERY
  UPDATE "Agent"
  SET "balance" = ROUND("balance" * (1 - (RANDOM() * 0.50)::NUMERIC), 2)
  RETURNING
    "Agent"."prenom" AS agent_prenom,
    0.00 AS perte_pourcentage,  -- sera recalculé côté applicatif
    0.00 AS solde_avant,
    "Agent"."balance" AS solde_apres,
    ''::TEXT AS item_produit,
    0.00 AS prix_avant,
    0.00 AS prix_apres;

  -- Perturber les prix du marché (entre 70% et 100% du prix actuel)
  RETURN QUERY
  UPDATE "MarketItem"
  SET
    "prix" = ROUND("prix" * (0.70 + (RANDOM() * 0.30)::NUMERIC), 2),
    "updatedAt" = NOW()
  RETURNING
    ''::TEXT AS agent_prenom,
    0.00 AS perte_pourcentage,
    0.00 AS solde_avant,
    0.00 AS solde_apres,
    "MarketItem"."produit" AS item_produit,
    0.00 AS prix_avant,
    "MarketItem"."prix" AS prix_apres;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (commenté — désactivé par défaut)
-- ============================================
/*
-- Activer RLS sur toutes les tables
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Economy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventLog" ENABLE ROW LEVEL SECURITY;

-- Politiques pour les lectures publiques (dashboard)
CREATE POLICY "Lecture publique agents" ON "Agent"
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique transactions" ON "Transaction"
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique prêts" ON "Loan"
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique marché" ON "MarketItem"
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique économie" ON "Economy"
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique logs" ON "EventLog"
  FOR SELECT USING (true);

-- Politiques pour les opérations d'écriture (authentifié uniquement)
CREATE POLICY "Écriture agents" ON "Agent"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Écriture transactions" ON "Transaction"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Écriture prêts" ON "Loan"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Écriture marché" ON "MarketItem"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Écriture économie" ON "Economy"
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Écriture logs" ON "EventLog"
  FOR ALL USING (auth.role() = 'authenticated');
*/
