-- ============================================================
-- PARTIE 1 : SAMA ÉCONOMIE V2 — Création des tables
-- Exécuter d'abord celui-ci, puis la Partie 2
-- ============================================================

-- CLEANUP V1 + V2
DROP TABLE IF EXISTS "FeedComment" CASCADE;
DROP TABLE IF EXISTS "FeedLike" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Challenge" CASCADE;
DROP TABLE IF EXISTS "P2PLoan" CASCADE;
DROP TABLE IF EXISTS "ProfileView" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Proposal" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Demand" CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Shop" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "MarketPrice" CASCADE;
DROP TABLE IF EXISTS "Asset" CASCADE;
DROP TABLE IF EXISTS "GameEvent" CASCADE;
DROP TABLE IF EXISTS "ProjectExpense" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "Loan" CASCADE;
DROP TABLE IF EXISTS "GameSettings" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Business" CASCADE;
DROP TABLE IF EXISTS "agents" CASCADE;
DROP TABLE IF EXISTS "loans" CASCADE;
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  avatar TEXT DEFAULT '/avatars/default.png',
  location TEXT DEFAULT 'Dakar',
  bio TEXT,
  cash DOUBLE PRECISION NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'player',
  is_agent BOOLEAN NOT NULL DEFAULT FALSE,
  agent_personality TEXT DEFAULT 'econome',
  credit_score INT NOT NULL DEFAULT 750,
  total_profit DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_debt DOUBLE PRECISION NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  games_lost INT NOT NULL DEFAULT 0,
  is_bankrupt BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  profile_views INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Loan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  interest_rate DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  total_due DOUBLE PRECISION NOT NULL,
  remaining DOUBLE PRECISION NOT NULL,
  monthly_payment DOUBLE PRECISION NOT NULL,
  months_remaining INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  auto_approved BOOLEAN NOT NULL DEFAULT TRUE,
  admin_approved BOOLEAN,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  loanId UUID REFERENCES "Loan"(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  budget DOUBLE PRECISION NOT NULL,
  initial_cash DOUBLE PRECISION NOT NULL,
  current_cash DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_revenue DOUBLE PRECISION NOT NULL DEFAULT 0,
  monthly_expense DOUBLE PRECISION NOT NULL DEFAULT 0,
  months_elapsed INT NOT NULL DEFAULT 0,
  total_months INT NOT NULL DEFAULT 12,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "ProjectExpense" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT TRUE,
  revealed_at INT DEFAULT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "GameEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  projectId UUID REFERENCES "Project"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  month INT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Asset" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  purchase_price DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION NOT NULL,
  image TEXT,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'owned',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "MarketPrice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  price DOUBLE PRECISION NOT NULL,
  change_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId UUID REFERENCES "User"(id) ON DELETE SET NULL,
  toUserId UUID REFERENCES "User"(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Shop" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ownerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT DEFAULT 'Dakar',
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  sales_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Product" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopId UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  ownerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  stock INT NOT NULL DEFAULT 999,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Service" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopId UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  ownerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Demand" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  budget DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'open',
  responses_count INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Proposal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demandId UUID NOT NULL REFERENCES "Demand"(id) ON DELETE CASCADE,
  fromUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  productId UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  serviceId UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  price DOUBLE PRECISION NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  sellerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  productId UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  serviceId UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  demandId UUID REFERENCES "Demand"(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "FeedPost" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "FeedLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(postId, userId)
);

CREATE TABLE "FeedComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Review" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  toUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  orderId UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(fromUserId, toUserId, "createdAt")
);

CREATE TABLE "Challenge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  toUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  stake DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  winnerId UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "P2PLoan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lenderId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  borrowerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  interest_rate DOUBLE PRECISION NOT NULL,
  total_due DOUBLE PRECISION NOT NULL,
  remaining DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "ProfileView" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  viewedId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "GameSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_is_agent ON "User"(is_agent);
CREATE INDEX idx_user_credit_score ON "User"(credit_score DESC);
CREATE INDEX idx_user_cash ON "User"(cash DESC);
CREATE INDEX idx_loan_user ON "Loan"(userId);
CREATE INDEX idx_loan_status ON "Loan"(status);
CREATE INDEX idx_asset_user ON "Asset"(userId);
CREATE INDEX idx_shop_owner ON "Shop"(ownerId);
CREATE INDEX idx_product_shop ON "Product"(shopId);
CREATE INDEX idx_service_shop ON "Service"(shopId);
CREATE INDEX idx_demand_user ON "Demand"(userId);
CREATE INDEX idx_proposal_demand ON "Proposal"(demandId);
CREATE INDEX idx_feed_created ON "FeedPost"("createdAt" DESC);
CREATE INDEX idx_transaction_created ON "Transaction"("createdAt" DESC);
CREATE INDEX idx_notification_user ON "Notification"(userId, "read");

-- RLS désactivé
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

-- TRIGGER auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, cash, type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), NEW.email, 0, 'player');
  INSERT INTO public."FeedPost" (userId, type, title, description)
  VALUES (NEW.id, 'inscription', COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)) || ' a rejoint Sama Économie !', 'Un nouvel entrepreneur arrive.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED: Admin
INSERT INTO "User" (id, name, email, type, is_agent, cash, credit_score)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Abdoulaye Gueye', 'Abdoulayegueye87@gmail.com', 'admin', FALSE, 1000000, 1000) ON CONFLICT (id) DO NOTHING;

-- SEED: Paramètres
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

-- SEED: Prix du marché
INSERT INTO "MarketPrice" (category, price, change_pct) VALUES
  ('or', 35000, 0),
  ('diamant', 500000, 0),
  ('immobilier', 15000000, 0),
  ('vehicule', 3000000, 0),
  ('luxe', 200000, 0)
ON CONFLICT (category) DO NOTHING;

-- IMPORTANT : Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- FIN PARTIE 1 : Exécuter maintenant la PARTIE 2 (données agents)
