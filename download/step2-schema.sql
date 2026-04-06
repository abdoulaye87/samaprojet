-- Utilisateurs
CREATE TABLE IF NOT EXISTS "User" (
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
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Loan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  interest_rate DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  total_due DOUBLE PRECISION NOT NULL,
  remaining DOUBLE PRECISION NOT NULL,
  monthly_payment DOUBLE PRECISION NOT NULL,
  months_remaining INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  auto_approved BOOLEAN NOT NULL DEFAULT TRUE,
  admin_approved BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES "Loan"(id) ON DELETE SET NULL,
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
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ProjectExpense" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT TRUE,
  revealed_at INT DEFAULT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "GameEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  project_id UUID REFERENCES "Project"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  month INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Asset" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  purchase_price DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION NOT NULL,
  image TEXT,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'owned',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "MarketPrice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  price DOUBLE PRECISION NOT NULL,
  change_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Shop" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT DEFAULT 'Dakar',
  rating FLOAT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  sales_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Product" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  stock INT NOT NULL DEFAULT 999,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Service" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES "Shop"(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  availability TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Demand" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  budget DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'open',
  responses_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Proposal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES "Demand"(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  product_id UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  service_id UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  price DOUBLE PRECISION NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  product_id UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  service_id UUID REFERENCES "Service"(id) ON DELETE SET NULL,
  demand_id UUID REFERENCES "Demand"(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "FeedPost" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "FeedLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS "FeedComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Review" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  order_id UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, created_at)
);

CREATE TABLE IF NOT EXISTS "Challenge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  stake DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "P2PLoan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  interest_rate DOUBLE PRECISION NOT NULL,
  total_due DOUBLE PRECISION NOT NULL,
  remaining DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ProfileView" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "GameSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_agent ON "User"(is_agent);
CREATE INDEX IF NOT EXISTS idx_user_credit_score ON "User"(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_cash ON "User"(cash DESC);
CREATE INDEX IF NOT EXISTS idx_loan_user ON "Loan"(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_status ON "Loan"(status);
CREATE INDEX IF NOT EXISTS idx_asset_user ON "Asset"(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_owner ON "Shop"(owner_id);
CREATE INDEX IF NOT EXISTS idx_product_shop ON "Product"(shop_id);
CREATE INDEX IF NOT EXISTS idx_service_shop ON "Service"(shop_id);
CREATE INDEX IF NOT EXISTS idx_demand_user ON "Demand"(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_demand ON "Proposal"(demand_id);
CREATE INDEX IF NOT EXISTS idx_feed_created ON "FeedPost"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_created ON "Transaction"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(user_id, "read");

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
  INSERT INTO public."FeedPost" (user_id, type, title, description)
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

