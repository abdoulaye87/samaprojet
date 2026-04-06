-- ============================================
-- SCHÉMA SUPABASE — Simulation Économique GLM5
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- ============================================
-- TABLE: agents
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id               SERIAL PRIMARY KEY,
  prenom           TEXT NOT NULL,
  balance          NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
  dette            NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  investissement_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  agent_id    INTEGER NOT NULL,
  type        TEXT NOT NULL,
  montant     NUMERIC(15, 2) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_type_check CHECK (
    type IN ('achat', 'vente', 'pret', 'remboursement', 'depot', 'retrait', 'crash', 'inflation')
  )
);

-- ============================================
-- TABLE: loans
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
  id           SERIAL PRIMARY KEY,
  agent_id     INTEGER NOT NULL,
  montant      NUMERIC(15, 2) NOT NULL,
  taux_interet NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  statut       TEXT NOT NULL DEFAULT 'en cours',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT loans_statut_check CHECK (
    statut IN ('en cours', 'remboursé')
  )
);

-- ============================================
-- TABLE: market
-- ============================================
CREATE TABLE IF NOT EXISTS market (
  id         SERIAL PRIMARY KEY,
  produit    TEXT NOT NULL UNIQUE,
  prix       NUMERIC(15, 2) NOT NULL,
  prix_base  NUMERIC(15, 2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: economy
-- ============================================
CREATE TABLE IF NOT EXISTS economy (
  id              SERIAL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  periode         INTEGER NOT NULL DEFAULT 1,
  inflation_cumul NUMERIC(10, 4) NOT NULL DEFAULT 0.00,
  inflation_rate  NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: logs
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  periode    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================
ALTER TABLE transactions
  ADD CONSTRAINT transactions_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE loans
  ADD CONSTRAINT loans_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS transactions_agent_id_idx ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS loans_agent_id_idx ON loans(agent_id);
CREATE INDEX IF NOT EXISTS loans_statut_idx ON loans(statut);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs(created_at DESC);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Agents initiaux
INSERT INTO agents (prenom, balance, dette) VALUES
  ('Aminata', 2500.00, 0.00),
  ('Moussa', 1800.00, 500.00),
  ('Fatou', 3200.00, 0.00),
  ('Ibrahima', 900.00, 1200.00),
  ('Rokhaya', 4100.00, 200.00)
ON CONFLICT DO NOTHING;

-- Produits du marché
INSERT INTO market (produit, prix, prix_base) VALUES
  ('Riz', 500.00, 500.00),
  ('Huile', 800.00, 800.00),
  ('Ciment', 3000.00, 3000.00),
  ('Farine', 400.00, 400.00),
  ('Sucre', 600.00, 600.00)
ON CONFLICT (produit) DO NOTHING;

-- État initial de l'économie
INSERT INTO economy (id, periode, inflation_cumul, inflation_rate) VALUES
  (1, 1, 0.00, 0.02)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FONCTIONS SQL
-- ============================================

-- Appliquer l'inflation sur le marché + dévaluer les soldes des agents
-- Les prix augmentent du taux d'inflation
-- Les soldes des agents diminuent de 50% du taux (dévaluation)
CREATE OR REPLACE FUNCTION apply_inflation(rate NUMERIC DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  current_rate NUMERIC;
  devaluation_rate NUMERIC;
  current_economy RECORD;
BEGIN
  -- Récupérer le taux actuel si non fourni
  IF rate IS NOT NULL THEN
    current_rate := rate;
  ELSE
    SELECT * INTO current_economy FROM economy WHERE id = 1;
    current_rate := current_economy.inflation_rate;
  END IF;

  -- La dévaluation = 50% du taux d'inflation (ex: 2% inflation → 1% dévaluation)
  devaluation_rate := current_rate * 0.5;

  -- Augmenter les prix du marché
  UPDATE market
  SET prix = ROUND(prix * (1 + current_rate), 2),
      updated_at = NOW();

  -- Dévaluer les soldes des agents (l'argent perd de la valeur)
  UPDATE agents
  SET balance = ROUND(balance * (1 - devaluation_rate), 2);

  -- Appliquer les intérêts sur les prêts en cours
  UPDATE loans
  SET montant = ROUND(montant * (1 + taux_interet), 2)
  WHERE statut = 'en cours';

  -- Recalculer les dettes des agents
  UPDATE agents a
  SET dette = COALESCE((
    SELECT SUM(l.montant)
    FROM loans l
    WHERE l.agent_id = a.id AND l.statut = 'en cours'
  ), 0.00);

  -- Mettre à jour l'état de l'économie
  UPDATE economy
  SET periode = periode + 1,
      inflation_cumul = ROUND(inflation_cumul + current_rate, 4),
      updated_at = NOW()
  WHERE id = 1;

  -- Journaliser
  INSERT INTO logs (message, type, periode)
  SELECT
    'Inflation appliquée — Taux: ' || (current_rate * 100)::TEXT || '%, Période: ' || (periode + 1)::TEXT || ', Dévaluation soldes: -' || (devaluation_rate * 100)::TEXT || '%',
    'inflation',
    periode + 1
  FROM economy WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les intérêts sur les dettes (appel séparé si besoin)
CREATE OR REPLACE FUNCTION apply_interests()
RETURNS VOID AS $$
BEGIN
  UPDATE loans
  SET montant = ROUND(montant * (1 + taux_interet), 2)
  WHERE statut = 'en cours';

  -- Recalculer les dettes des agents
  UPDATE agents a
  SET dette = COALESCE((
    SELECT SUM(l.montant)
    FROM loans l
    WHERE l.agent_id = a.id AND l.statut = 'en cours'
  ), 0.00);
END;
$$ LANGUAGE plpgsql;

-- Crash économique : perte aléatoire 0-50% + perturbation marché
CREATE OR REPLACE FUNCTION crash_economy()
RETURNS TABLE(agent_prenom TEXT, perte_pct NUMERIC, solde_avant NUMERIC, solde_apres NUMERIC) AS $$
DECLARE
  rec RECORD;
  loss_pct NUMERIC;
  solde_before NUMERIC;
  solde_after NUMERIC;
BEGIN
  -- Appliquer une perte aléatoire de 0 à 50% sur chaque agent
  FOR rec IN SELECT id, prenom, balance FROM agents LOOP
    loss_pct := ROUND((RANDOM() * 50)::NUMERIC, 1);
    solde_before := rec.balance;
    solde_after := ROUND(rec.balance * (1 - loss_pct / 100), 2);

    UPDATE agents SET balance = solde_after WHERE id = rec.id;

    INSERT INTO transactions (agent_id, type, montant, description)
    VALUES (rec.id, 'crash', solde_before - solde_after,
      'Crash économique — perte ' || loss_pct || '%');

    agent_prenom := rec.prenom;
    perte_pct := loss_pct;
    solde_avant := solde_before;
    solde_apres := solde_after;
    RETURN NEXT;
  END LOOP;

  -- Perturber les prix du marché (entre 70% et 100% du prix actuel)
  UPDATE market
  SET prix = ROUND(prix * (0.70 + (RANDOM() * 0.30)::NUMERIC), 2),
      updated_at = NOW();

  -- Journaliser le crash
  INSERT INTO logs (message, type, periode)
  SELECT 'CRASH ÉCONOMIQUE déclenché', 'crash', periode
  FROM economy WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (commenté — désactivé par défaut)
-- Activer si vous utilisez l'auth Supabase
-- ============================================
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE market ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE economy ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
