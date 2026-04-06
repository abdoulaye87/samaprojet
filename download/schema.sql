-- ============================================================
-- Sama Économie V1 — Supabase SQL Schema
-- ============================================================

-- Drop all old tables (V0 schema)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS market CASCADE;
DROP TABLE IF EXISTS economy CASCADE;
DROP TABLE IF EXISTS "Loan" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Agent" CASCADE;

-- ============================================================
-- New tables
-- ============================================================

CREATE TABLE IF NOT EXISTS "User" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,
  cash       DOUBLE PRECISION NOT NULL DEFAULT 5000,
  type       TEXT NOT NULL DEFAULT 'player',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Business" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"  UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  revenue    DOUBLE PRECISION NOT NULL,
  cost       DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fromUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "toUserId"   UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  amount      DOUBLE PRECISION NOT NULL,
  type        TEXT NOT NULL,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_business_ownerId ON "Business"("ownerId");
CREATE INDEX IF NOT EXISTS idx_transaction_fromUserId ON "Transaction"("fromUserId");
CREATE INDEX IF NOT EXISTS idx_transaction_toUserId ON "Transaction"("toUserId");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_type ON "User"(type);

-- ============================================================
-- Trigger: auto-link new Supabase Auth user to User table
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, cash, type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    5000,
    'player'
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
-- Seed: 2 agent accounts with businesses
-- ============================================================
INSERT INTO "User" (id, name, email, cash, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Boutique Central', NULL, 50000, 'agent'),
  ('a0000000-0000-0000-0000-000000000002', 'Marché Fresh', NULL, 30000, 'agent')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Business" (id, "ownerId", name, revenue, cost) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Boutique Central', 5000, 2000),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Marché Fresh', 3000, 1200)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Row Level Security: DÉSACTIVÉ
-- Prisma se connecte via DATABASE_URL sans contexte auth.uid()
-- L'authentification est gérée par les API routes (vérification token Supabase)
-- ============================================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Business" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
