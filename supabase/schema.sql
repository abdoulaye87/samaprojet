-- ============================================================
-- SAMA ÉCONOMIE V2 — Schéma complet
-- Simulation économique sénégalaise
-- ============================================================

-- ============================================================
-- CLEANUP V1
-- ============================================================
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Business" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- TABLES CORE
-- ============================================================

-- Utilisateurs (joueurs + agents, seul admin distingue)
CREATE TABLE IF NOT EXISTS "User" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  password_hash TEXT,  -- null pour les agents (pas d'auth)
  avatar        TEXT DEFAULT '/avatars/default.png',
  location      TEXT DEFAULT 'Dakar',
  bio           TEXT,
  cash          DOUBLE PRECISION NOT NULL DEFAULT 0,
  type          TEXT NOT NULL DEFAULT 'player',  -- player | admin
  is_agent      BOOLEAN NOT NULL DEFAULT FALSE,   -- seul admin voit ça
  agent_personality TEXT DEFAULT 'econome',        -- econome | depensier | stratege | fou
  credit_score  INT NOT NULL DEFAULT 750,           -- 0-1000
  total_profit  DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_spent   DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_debt    DOUBLE PRECISION NOT NULL DEFAULT 0,
  games_played  INT NOT NULL DEFAULT 0,
  games_won     INT NOT NULL DEFAULT 0,
  games_lost    INT NOT NULL DEFAULT 0,
  is_bankrupt   BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | suspended | banned
  profile_views INT NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

-- Prêts
CREATE TABLE IF NOT EXISTS "Loan" (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId          UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount          DOUBLE PRECISION NOT NULL,
  interest_rate   DOUBLE PRECISION NOT NULL DEFAULT 2.5,  -- pourcentage
  total_due       DOUBLE PRECISION NOT NULL,              -- amount + intérêts
  remaining       DOUBLE PRECISION NOT NULL,              -- ce qu'il reste à payer
  monthly_payment DOUBLE PRECISION NOT NULL,
  months_remaining INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',  -- active | paid | defaulted | pending_approval
  auto_approved   BOOLEAN NOT NULL DEFAULT TRUE,
  admin_approved  BOOLEAN,  -- null = auto, true/false = admin decision
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT now()
);

-- Projets (choix du joueur après prêt)
CREATE TABLE IF NOT EXISTS "Project" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId        UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  loanId        UUID REFERENCES "Loan"(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,  -- commerce, elevage, transport, agriculture, technologie, immobilier
  budget        DOUBLE PRECISION NOT NULL,
  initial_cash  DOUBLE PRECISION NOT NULL,  -- cash après déduction du prêt
  current_cash  DOUBLE PRECISION NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | succeeded | failed | abandoned
  monthly_revenue   DOUBLE PRECISION NOT NULL DEFAULT 0,
  monthly_expense   DOUBLE PRECISION NOT NULL DEFAULT 0,
  months_elapsed    INT NOT NULL DEFAULT 0,
  total_months      INT NOT NULL DEFAULT 12,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

-- Dépenses de projet (visibles progressivement)
CREATE TABLE IF NOT EXISTS "ProjectExpense" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId   UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  amount      DOUBLE PRECISION NOT NULL,
  category    TEXT NOT NULL,  -- investissement, operationnel, imprévu, taxe
  is_hidden   BOOLEAN NOT NULL DEFAULT TRUE,  -- découvert au fil du jeu
  revealed_at INT DEFAULT NULL,  -- mois où la dépense est révélée
  paid        BOOLEAN NOT NULL DEFAULT FALSE
);

-- Événements aléatoires (subis par les joueurs)
CREATE TABLE IF NOT EXISTS "GameEvent" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  projectId   UUID REFERENCES "Project"(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  impact      DOUBLE PRECISION NOT NULL,  -- positif ou négatif
  category    TEXT NOT NULL,  -- positif, negatif, neutre
  month       INT NOT NULL,  -- mois de la simulation
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Patrimoine (biens achetés : or, diamant, immobilier, véhicules, luxe)
CREATE TABLE IF NOT EXISTS "Asset" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,  -- or, diamant, immobilier, vehicule, luxe
  description TEXT,
  purchase_price  DOUBLE PRECISION NOT NULL,
  current_value   DOUBLE PRECISION NOT NULL,
  image       TEXT,
  details     JSONB DEFAULT '{}',  -- données spécifiques (superficie, carburant, etc.)
  status      TEXT NOT NULL DEFAULT 'owned',  -- owned | seized | sold
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Prix du marché (fluctuation des prix des catégories d'actifs)
CREATE TABLE IF NOT EXISTS "MarketPrice" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL UNIQUE,  -- or, diamant, immobilier, vehicule, luxe
  price       DOUBLE PRECISION NOT NULL,
  change_pct  DOUBLE PRECISION NOT NULL DEFAULT 0,  -- % de changement
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Transactions (historique de toutes les transactions)
CREATE TABLE IF NOT EXISTS "Transaction" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId  UUID REFERENCES "User"(id) ON DELETE SET NULL,
  toUserId    UUID REFERENCES "User"(id) ON DELETE SET NULL,
  amount      DOUBLE PRECISION NOT NULL,
  type        TEXT NOT NULL,  -- pret, remboursement, achat, vente, transfert, don, taxe, frais_judiciaire, jeu
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLES BOUTIQUES & MARCHÉ
-- ============================================================

-- Boutiques / Entreprises
CREATE TABLE IF NOT EXISTS "Shop" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ownerId     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,  -- boutique, entreprise, commerce, service
  location    TEXT DEFAULT 'Dakar',
  rating      FLOAT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  sales_count  INT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Produits
CREATE TABLE IF NOT EXISTS "Product" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopId      UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  ownerId     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,  -- or, diamant, immobilier, vehicule, alimentaire, materiel, luxe
  price       DOUBLE PRECISION NOT NULL,
  stock       INT NOT NULL DEFAULT 999,
  image       TEXT,
  status      TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS "Service" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopId      UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  ownerId     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,  -- transport, construction, reparation, conseil, formation, main_d_oeuvre
  price       DOUBLE PRECISION NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Demandes (publiées par joueurs/agents)
CREATE TABLE IF NOT EXISTS "Demand" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId        UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,  -- produit, service, emploi, partenariat
  budget        DOUBLE PRECISION,
  status        TEXT NOT NULL DEFAULT 'open',  -- open | in_progress | closed | expired
  responses_count INT NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

-- Propositions (réponses aux demandes)
CREATE TABLE IF NOT EXISTS "Proposal" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demandId    UUID NOT NULL REFERENCES "Demand"(id) ON DELETE CASCADE,
  fromUserId  UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  productId   UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  serviceId   UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  price       DOUBLE PRECISION NOT NULL,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Commandes
CREATE TABLE IF NOT EXISTS "Order" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyerId     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  sellerId    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  productId   UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  serviceId   UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  demandId    UUID REFERENCES "Demand"(id) ON DELETE SET NULL,
  amount      DOUBLE PRECISION NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | completed | cancelled
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLES SOCIAL
-- ============================================================

-- Feed d'actualités
CREATE TABLE IF NOT EXISTS "FeedPost" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- achat_achat, faillite, succes, pret, vente, inscription, evenement
  title       TEXT NOT NULL,
  description TEXT,
  metadata    JSONB DEFAULT '{}',  -- données additionnelles
  likes       INT NOT NULL DEFAULT 0,
  comments    INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Likes sur les posts
CREATE TABLE IF NOT EXISTS "FeedLike" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId      UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(postId, userId)
);

-- Commentaires
CREATE TABLE IF NOT EXISTS "FeedComment" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId      UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Avis entre joueurs
CREATE TABLE IF NOT EXISTS "Review" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId  UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  toUserId    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  orderId     UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(fromUserId, toUserId, "createdAt")
);

-- Défis entre joueurs
CREATE TABLE IF NOT EXISTS "Challenge" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId  UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  toUserId    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  stake       DOUBLE PRECISION NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | completed | cancelled
  winnerId    UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Prêts entre joueurs (P2P)
CREATE TABLE IF NOT EXISTS "P2PLoan" (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lenderId        UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  borrowerId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount          DOUBLE PRECISION NOT NULL,
  interest_rate   DOUBLE PRECISION NOT NULL,
  total_due       DOUBLE PRECISION NOT NULL,
  remaining       DOUBLE PRECISION NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',  -- active | repaid | defaulted
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);

-- Visites de profils
CREATE TABLE IF NOT EXISTS "ProfileView" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewerId    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  viewedId    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- info, warning, success, danger, social
  title       TEXT NOT NULL,
  message     TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Paramètres du jeu (contrôlés par admin)
CREATE TABLE IF NOT EXISTS "GameSettings" (
  id            UUID PRIMARY KEY DEFAULT DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL UNIQUE,
  value         TEXT NOT NULL,
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_type ON "User"(type);
CREATE INDEX IF NOT EXISTS idx_user_is_agent ON "User"(is_agent);
CREATE INDEX IF NOT EXISTS idx_user_credit_score ON "User"(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_cash ON "User"(cash DESC);

CREATE INDEX IF NOT EXISTS idx_loan_user ON "Loan"(userId);
CREATE INDEX IF NOT EXISTS idx_loan_status ON "Loan"(status);

CREATE INDEX IF NOT EXISTS idx_project_user ON "Project"(userId);
CREATE INDEX IF NOT EXISTS idx_project_status ON "Project"(status);

CREATE INDEX IF NOT EXISTS idx_asset_user ON "Asset"(userId);
CREATE INDEX IF NOT EXISTS idx_asset_category ON "Asset"(category);

CREATE INDEX IF NOT EXISTS idx_shop_owner ON "Shop"(ownerId);
CREATE INDEX IF NOT EXISTS idx_product_shop ON "Product"(shopId);
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"(category);
CREATE INDEX IF NOT EXISTS idx_service_shop ON "Service"(shopId);

CREATE INDEX IF NOT EXISTS idx_demand_user ON "Demand"(userId);
CREATE INDEX IF NOT EXISTS idx_demand_status ON "Demand"(status);
CREATE INDEX IF NOT EXISTS idx_proposal_demand ON "Proposal"(demandId);

CREATE INDEX IF NOT EXISTS idx_order_buyer ON "Order"(buyerId);
CREATE INDEX IF NOT EXISTS idx_order_seller ON "Order"(sellerId);

CREATE INDEX IF NOT EXISTS idx_feed_created ON "FeedPost"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(userId, read);

CREATE INDEX IF NOT EXISTS idx_transaction_from ON "Transaction"(fromUserId);
CREATE INDEX IF NOT EXISTS idx_transaction_to ON "Transaction"(toUserId);
CREATE INDEX IF NOT EXISTS idx_transaction_created ON "Transaction"("createdAt" DESC);

-- ============================================================
-- TRIGGER: auto-link auth users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, cash, type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    0,
    'player'
  );
  -- Feed post d'inscription
  INSERT INTO public."FeedPost" (userId, type, title, description)
  VALUES (
    NEW.id,
    'inscription',
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)) || ' a rejoint Sama Économie !',
    'Un nouvel entrepreneur arrive.'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: Admin user (l'utilisateur actuel)
-- ============================================================
INSERT INTO "User" (id, name, email, type, is_agent, cash, credit_score)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Abdoulaye Gueye',
  'Abdoulayegueye87@gmail.com',
  'admin',
  FALSE,
  1000000,
  1000
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Paramètres du jeu par défaut
-- ============================================================
INSERT INTO "GameSettings" (key, value) VALUES
  ('default_interest_rate', '2.5'),
  ('max_loan_amount', '5000000'),
  ('min_loan_amount', '50000'),
  ('game_duration_months', '12'),
  ('bankruptcy_threshold', '-100000'),
  ('market_tax_rate', '2'),
  ('auto_approve_loan', 'true'),
  ('agent_count_active', '300'),
  ('agent_count_dormant', '700')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: Prix du marché initiaux
-- ============================================================
INSERT INTO "MarketPrice" (category, price, change_pct) VALUES
  ('or', 35000, 0),
  ('diamant', 500000, 0),
  ('immobilier', 15000000, 0),
  ('vehicule', 3000000, 0),
  ('luxe', 200000, 0)
ON CONFLICT (category) DO NOTHING;

-- ============================================================
-- RLS: DÉSACTIVÉ (auth gérée par API routes)
-- ============================================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectExpense" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "GameEvent" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketPrice" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Demand" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposal" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedPost" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedLike" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedComment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Challenge" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "P2PLoan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfileView" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSettings" DISABLE ROW LEVEL SECURITY;
