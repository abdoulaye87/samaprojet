-- ============================================
-- SCHÉMA SUPABASE — Simulation Économique GLM5
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. TABLE AGENTS
CREATE TABLE IF NOT EXISTS agents (
  id               SERIAL PRIMARY KEY,
  prenom           TEXT NOT NULL,
  balance          NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
  dette            NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  investissement_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLE TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  agent_id   INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('achat','vente','pret','remboursement','depot','retrait','crash','inflation')),
  montant    NUMERIC(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE PRÊTS (LOANS)
CREATE TABLE IF NOT EXISTS loans (
  id           SERIAL PRIMARY KEY,
  agent_id     INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  montant      NUMERIC(12, 2) NOT NULL,
  taux_interet NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  statut       TEXT NOT NULL DEFAULT 'en cours' CHECK (statut IN ('en cours','remboursé')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE MARCHÉ
CREATE TABLE IF NOT EXISTS market (
  id         SERIAL PRIMARY KEY,
  produit    TEXT NOT NULL UNIQUE,
  prix       NUMERIC(12, 2) NOT NULL,
  prix_base  NUMERIC(12, 2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLE LOGS (JOURNAL)
CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  periode    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLE ÉCONOMIE (État global)
CREATE TABLE IF NOT EXISTS economy (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  periode          INTEGER NOT NULL DEFAULT 1,
  inflation_cumul  NUMERIC(8, 6) NOT NULL DEFAULT 0.00,
  inflation_rate   NUMERIC(5, 4) NOT NULL DEFAULT 0.02,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Marché initial
INSERT INTO market (produit, prix, prix_base) VALUES
  ('Riz',    500,  500),
  ('Huile',  800,  800),
  ('Ciment', 3000, 3000),
  ('Farine', 400,  400),
  ('Sucre',  600,  600)
ON CONFLICT (produit) DO NOTHING;

-- État économie initial
INSERT INTO economy (id, periode, inflation_cumul, inflation_rate)
VALUES (1, 1, 0, 0.02)
ON CONFLICT (id) DO NOTHING;

-- Agents de démo
INSERT INTO agents (prenom, balance, dette, investissement_total) VALUES
  ('Aminata', 2500, 0,    300),
  ('Moussa',  1800, 500,  0),
  ('Fatou',   3200, 0,    800),
  ('Ibrahima', 900, 1200, 0),
  ('Rokhaya', 4100, 200,  1500)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) — Optionnel
-- Activer si vous utilisez l'auth Supabase
-- ============================================

-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE market ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Appliquer l'inflation sur le marché
CREATE OR REPLACE FUNCTION apply_inflation(rate NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE market
  SET prix = prix * (1 + rate),
      updated_at = NOW();

  UPDATE economy
  SET inflation_cumul = (1 + inflation_cumul) * (1 + rate) - 1,
      periode = periode + 1,
      updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les intérêts sur les dettes
CREATE OR REPLACE FUNCTION apply_interests()
RETURNS VOID AS $$
BEGIN
  UPDATE loans
  SET montant = montant * (1 + taux_interet)
  WHERE statut = 'en cours';

  UPDATE agents a
  SET dette = (
    SELECT COALESCE(SUM(montant), 0)
    FROM loans l
    WHERE l.agent_id = a.id AND l.statut = 'en cours'
  );
END;
$$ LANGUAGE plpgsql;

-- Crash économique
CREATE OR REPLACE FUNCTION crash_economy()
RETURNS TABLE(agent_id INTEGER, prenom TEXT, perte NUMERIC) AS $$
DECLARE
  rec RECORD;
  loss_rate NUMERIC;
  lost_amount NUMERIC;
BEGIN
  FOR rec IN SELECT id, prenom, balance FROM agents LOOP
    loss_rate := random() * 0.5;
    lost_amount := rec.balance * loss_rate;

    UPDATE agents SET balance = balance - lost_amount WHERE id = rec.id;

    INSERT INTO transactions(agent_id, type, montant, description)
    VALUES (rec.id, 'crash', lost_amount, 'Crash économique - perte ' || ROUND(loss_rate*100,1) || '%');

    agent_id := rec.id;
    prenom := rec.prenom;
    perte := lost_amount;
    RETURN NEXT;
  END LOOP;

  -- Perturber les prix du marché
  UPDATE market
  SET prix = prix * (0.7 + random() * 0.3),
      updated_at = NOW();

  INSERT INTO logs(message, type, periode)
  SELECT 'CRASH ÉCONOMIQUE déclenché', 'crash', periode FROM economy WHERE id = 1;
END;
$$ LANGUAGE plpgsql;
