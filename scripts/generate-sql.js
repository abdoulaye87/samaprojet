// Génère 2 fichiers SQL séparés : Partie 1 (Schema) et Partie 2 (Données 300 agents)
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pickN(arr, n) { const c=[...arr];const r=[];n=Math.min(n,c.length);for(let i=0;i<n;i++){const x=rand(0,c.length-1);r.push(c.splice(x,1)[0])}return r; }
function esc(s) { return s ? s.replace(/'/g, "''") : ''; }

const FM=['Abdoulaye','Moussa','Ibrahima','Ousmane','Mamadou','Pape','Cheikh','Mbaye','Seydou','Boubacar','Amadou','Idrissa','Birame','Mouhamadou','El Hadj','Serigne','Modou','Lamine','Daouda','Yaya','Souleymane','Aliou','Babacar','Thierno','Oumar','Falilou','Samba','Moustapha','Djibril','Mansour','Bouna','Salif','Malick','Pate','Abdou','Mouctar','Bassirou','Demba','Issa'];
const FF=['Fatou','Aminata','Mariama','Awa','Khady','Ndèye','Coumba','Dieynaba','Sokhna','Rokhaya','Yacine','Adama','Bineta','Oulimata','Ndeye','Aissatou','Maimouna','Djénéba','Kine','Mariétou','Astou','Thioro','Safiétou','Nafi','Daba','Coly','Gnilane','Fama','Hawa','Oumy','Ramata','Siga','Mbegue','Mareme','Djenaba','Yaram','Ndack','Touba','Soukeyna'];
const LN=['Diop','Ndiaye','Sow','Fall','Dia','Ba','Sy','Mbaye','Gueye','Kane','Diallo','Seck','Diouf','Niang','Pouye','Sarr','Thiam','Mboup','Wade','Guissé','Cissé','Traoré','Tall','Aidara','Senghor','Dieng','Camara','Ly','Faye','Badji','Sakho','Dembélé','Konaté','Hane','Diedhiou','Sonko','Diatta','Sané','Sambou','Coly','Tendeng','Gomis','Ndong','Mané','Daff','Bâ','Wone','Ndir','Penda','Cissokho'];
const LOC=['Dakar','Pikine','Guédiawaye','Rufisque','Thiès','Saint-Louis','Kaolack','Ziguinchor','Tambacounda','Kolda','Diourbel','Louga','Diamniadio','Mbao','Parcelles Assainies','Médina','Sandaga','Plateau','Grand Yoff','Liberté','Sacr-Coeur','Mermoz','Almadies','Fann','Ngor','Bignona','Sédhiou','Kaffrine','Matam','Podor','Linguère','Dagana'];
const BIO=['Entrepreneur passionné, toujours en quête de nouvelles opportunités.','Commerçant depuis 10 ans au marché Sandaga.','Fondateur d\'une PME dans le transport de marchandises.','Investisseur dans l\'immobilier à Diamniadio.','Éleveur dans la région de Thiès, spécialisé en volailles.','Femme d\'affaires dans le commerce de détail.','Expert en agriculture irriguée dans la Vallée du Fleuve.','Propriétaire d\'un cyber café à Pikine.','Artisan bijoutier reconnu dans la Médina.','Transporteur inter-villes Dakar-Kaolack.','Fournisseur de matériel de construction.','Négociant en produits alimentaires à Sandaga.','Gérant de boutique de téléphones au Plateau.','Restaurateur à Médina, spécialité thiéboudienne.','Commerçant d\'or et bijoux à Colobane.','Marchand de tissus wax et bazin.','Tailleur de haute couture à Grand Yoff.','Mécanicien auto indépendant.','Éleveur de bovins dans le Fouta.','Peintre en bâtiment, 15 ans d\'expérience.','Pêcheur artisanal à Soumbédioune.','Agricultrice maraîchère à Sangalkam.','Commerçant de produits électroniques.','Gérant de salon de coiffure.','Menuisier spécialisé en mobilier moderne.','Plombier certifié, interventions Dakar et banlieue.','Électricien avec 8 ans d\'expérience.','Chauffeur de taxi, 5 ans de métier.','Couturière spécialisée en boubou brodé.','Vendeuse de fruits et légumes au marché Kermel.','Propriétaire d\'une quincaillerie à Guédiawaye.','Fournisseur de poissons frais de Kayar.','Technicien en climatisation et réfrigération.','Gérant d\'un pressing moderne.','Importateur de voitures d\'occasion.','Agriculteur dans le bassin arachidier de Diourbel.','Tradipraticien et vendeur de plantes médicinales.','Photographe événementiel.','Tisseur de tapis traditionnels.'];
const SN=['Boutique du Coin','Épicerie Moderne','Alimentation Générale','Chez Papa','Boutique Sénégal','Marché Frais','Dakar Store','Sandaga Shop','Gold & Bijoux','Transport Express','BTP Sénégal','Agri Plus','Tech Zone','Cyber Connect','Auto Plus','Immobilier du Soleil','Meubles & Déco','Couture Élégance','Resto du Terroir','Boulangerie Moderne','Quincaillerie du Nord','Poissonnerie Fraîche','Boucherie Premium','Fruits & Légumes','Electro Men','Fashion Style','Sport & Loisirs','Peinture & Décoration','Plomberie Service','Cuir & Maroquinerie','Parfumerie Luxe','Librairie du Savoir','Clinique Mobile','Maison Connectée','Salon Béauté Prestige','Pressing Express','Santé & Bien-être','Bric-à-brac Sénégal','Teranga Telecom','Sahel Digital','Minoterie du Nord','Savonnerie Artisanale','Poterie de Colobane','Atelier Mécanique Diop','Garage Auto Mbaye'];
const SC=['boutique','entreprise','commerce','service'];
const PROD=[{n:'Lingot or 10g',c:'or',a:350000,b:400000},{n:'Lingot or 50g',c:'or',a:1500000,b:1800000},{n:'Bracelet or 18k',c:'or',a:150000,b:250000},{n:'Chaîne or massif',c:'or',a:200000,b:350000},{n:'Bague or blanc',c:'or',a:120000,b:200000},{n:'Pendentif or',c:'or',a:80000,b:180000},{n:'Bague diamant 1ct',c:'diamant',a:500000,b:2000000},{n:'Collier diamant',c:'diamant',a:1000000,b:5000000},{n:'Bracelet diamant',c:'diamant',a:800000,b:3000000},{n:'Terrain 200m2 Diamniadio',c:'immobilier',a:5000000,b:15000000},{n:'Case 3 pièces Pikine',c:'immobilier',a:3000000,b:8000000},{n:'Villa 5 pièces Almadies',c:'immobilier',a:25000000,b:80000000},{n:'Appartement Fann',c:'immobilier',a:8000000,b:20000000},{n:'Local commercial Sandaga',c:'immobilier',a:10000000,b:30000000},{n:'Moto Java',c:'vehicule',a:350000,b:500000},{n:'Mercedes Classe C',c:'vehicule',a:8000000,b:15000000},{n:'Toyota Hilux',c:'vehicule',a:15000000,b:25000000},{n:'Minibus 18 places',c:'vehicule',a:8000000,b:12000000},{n:'Dacia Logan',c:'vehicule',a:5000000,b:8000000},{n:'Riz 50kg',c:'alimentaire',a:25000,b:40000},{n:'Huile arachide 5L',c:'alimentaire',a:8000,b:15000},{n:'Poisson fumé 10kg',c:'alimentaire',a:15000,b:30000},{n:'Sucre 25kg',c:'alimentaire',a:18000,b:28000},{n:'Lait en poudre',c:'alimentaire',a:5000,b:12000},{n:'Ciment 50 sacs',c:'materiel',a:250000,b:350000},{n:'Groupe électrogène',c:'materiel',a:200000,b:500000},{n:'Fer à béton tonne',c:'materiel',a:350000,b:500000},{n:'Parpaing 1000',c:'materiel',a:80000,b:150000},{n:'Montre Rolex',c:'luxe',a:2000000,b:8000000},{n:'iPhone 15 Pro',c:'luxe',a:600000,b:900000},{n:'Costume italien',c:'luxe',a:100000,b:300000},{n:'Sac Louis Vuitton',c:'luxe',a:500000,b:2000000},{n:'Boubou brodé grand soir',c:'luxe',a:50000,b:200000},{n:'Parfum Chanel N5',c:'luxe',a:80000,b:150000}];
const SERV=[{n:'Transport Dakar-Thiès',c:'transport',a:3000,b:5000},{n:'Transport marchandises Dakar-Kaolack',c:'transport',a:50000,b:200000},{n:'Déménagement local',c:'transport',a:50000,b:150000},{n:'Course en ville',c:'transport',a:1500,b:5000},{n:'Construction maison R+1',c:'construction',a:5000000,b:20000000},{n:'Maçonnerie',c:'construction',a:200000,b:500000},{n:'Peinture bâtiment',c:'construction',a:100000,b:300000},{n:'Carrelage',c:'construction',a:150000,b:400000},{n:'Plomberie',c:'construction',a:50000,b:200000},{n:'Réparation téléphone',c:'reparation',a:5000,b:30000},{n:'Réparation climatisation',c:'reparation',a:25000,b:75000},{n:'Réparation voiture',c:'reparation',a:20000,b:200000},{n:'Réparation ordinateur',c:'reparation',a:10000,b:50000},{n:'Conseil juridique',c:'conseil',a:50000,b:200000},{n:'Comptabilité',c:'conseil',a:100000,b:500000},{n:'Conseil en investissement',c:'conseil',a:75000,b:300000},{n:'Formation couture',c:'formation',a:50000,b:200000},{n:'Formation informatique',c:'formation',a:30000,b:100000},{n:'Cours de langue',c:'formation',a:15000,b:50000},{n:'Manoeuvre journalier',c:'main_d_oeuvre',a:5000,b:10000},{n:'Couturier traditionnel',c:'main_d_oeuvre',a:15000,b:50000},{n:'Cuisinier événementiel',c:'main_d_oeuvre',a:25000,b:75000},{n:'Garde malade',c:'main_d_oeuvre',a:10000,b:25000}];
const ASSETS=[{n:'Lingot or 10g',c:'or',a:350000,b:400000},{n:'Bracelet or 18k',c:'or',a:150000,b:250000},{n:'Chaîne or massif',c:'or',a:200000,b:350000},{n:'Bague diamant 1ct',c:'diamant',a:500000,b:2000000},{n:'Collier diamant',c:'diamant',a:1000000,b:5000000},{n:'Terrain Diamniadio',c:'immobilier',a:5000000,b:15000000},{n:'Villa Almadies',c:'immobilier',a:25000000,b:80000000},{n:'Case Pikine',c:'immobilier',a:3000000,b:8000000},{n:'Appartement Plateau',c:'immobilier',a:10000000,b:25000000},{n:'Toyota Hilux',c:'vehicule',a:15000000,b:25000000},{n:'Mercedes Classe C',c:'vehicule',a:8000000,b:15000000},{n:'Moto Java',c:'vehicule',a:350000,b:500000},{n:'Montre Rolex',c:'luxe',a:2000000,b:8000000},{n:'iPhone 15 Pro',c:'luxe',a:600000,b:900000},{n:'Sac Louis Vuitton',c:'luxe',a:500000,b:2000000},{n:'Boubou brodé',c:'luxe',a:50000,b:200000}];
const FT=[{t:'inscription',f:n=>`${n} a rejoint Sama Économie !`},{t:'achat',f:n=>`${n} vient d'acheter un bien sur le marché`},{t:'succes',f:n=>`${n} a réussi son projet !`},{t:'pret',f:n=>`${n} a obtenu un prêt`},{t:'vente',f:n=>`${n} vend un bien au meilleur prix`},{t:'faillite',f:n=>`${n} est en difficulté financière...`},{t:'challenge',f:n=>`${n} a lancé un défi`},{t:'boutique',f:n=>`${n} a ouvert une boutique`}];
const DT=['Cherche terrain à bâtir à Diamniadio','Besoin de transport marchandises vers Kaolack','Recherche maçon expérimenté','Cherche fournisseur de ciment en gros','Besoin d\'un mécanicien fiable','Recherche climaticien','Cherche coursier pour livraisons','Besoin de matériel de pêche','Recherche bailleur pour local commercial','Cherche peintre pour façade','Besoin d\'une Toyota Hilux','Recherche grossiste produits alimentaires','Cherche électricien pour installation solaire','Besoin de service de déménagement','Recherche artisan bijoutier','Cherche cuisinier pour mariage','Besoin de 50 sacs de ciment','Recherche chauffeur privé','Cherche location groupe électrogène','Besoin d\'expert comptable','Recherche fournisseur tissu wax','Cherche carreleur pour 150m2','Besoin de main d\'oeuvre pour récolte','Recherche adjudicateur marché public','Cherche partenaire agribusiness','Besoin de formation informatique','Recherche imprimeur cartes de visite','Cherche plombier','Besoin location voiture une semaine','Recherche tisseur tapis traditionnels'];
const COM=['Trop bien ! Continue comme ça !','Bonne chance pour ton projet !','Intéressant, je vais suivre ça.','Conseil : étudie bien ton marché.','J\'ai fait pareil et j\'ai réussi !','Attention aux dépenses imprévues...','Va voir sur le marché, il y a de bonnes affaires.','Que Dieu t\'aide dans ton business.','Je peux te proposer mes services.','Tu gères ! Un vrai entrepreneur.'];
const REV=['Très bon partenaire, fiable et ponctuel.','Service correct, rien à redire.','Pas satisfait du délai de livraison.','Excellent rapport qualité-prix.','Je recommande vivement !','Professionnel et sérieux.','Un peu cher mais la qualité est là.','Bonne communication tout au long.','Service médiocre, je ne recommande pas.','Un vrai entrepreneur !'];

// ==================== PARTIE 1 : SCHEMA ====================
const part1 = `-- ============================================================
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
`;

// ==================== PARTIE 2 : DONNÉES ====================
let part2 = `-- ============================================================
-- PARTIE 2 : SAMA ÉCONOMIE V2 — Insertion des 300 agents + données
-- Exécuter APRÈS la Partie 1
-- ============================================================

`;

// Generate agents
const agents = [];
const usedEmails = new Set();
for (let i = 0; i < 300; i++) {
  const isF = Math.random() > 0.52;
  const fn = isF ? pick(FF) : pick(FM);
  const ln = pick(LN);
  const name = `${fn} ${ln}`;
  const loc = pick(LOC);
  let email;
  do { email = `${fn.toLowerCase().replace(/\s/g,'')}.${ln.toLowerCase()}${rand(1,999)}@agent.sama.sn`; } while (usedEmails.has(email));
  usedEmails.add(email);
  const r = Math.random();
  const pers = r < 0.40 ? 'econome' : r < 0.65 ? 'depensier' : r < 0.85 ? 'stratege' : 'fou';
  const cash = pers==='econome'?rand(100000,5000000):pers==='depensier'?rand(0,8000000):pers==='stratege'?rand(500000,10000000):rand(0,12000000);
  const cs = pers==='econome'?rand(700,1000):pers==='stratege'?rand(650,950):pers==='depensier'?rand(400,800):rand(200,700);
  const gp = rand(1,20);
  const gw = pers==='stratege'?rand(1,gp):pers==='econome'?rand(0,Math.floor(gp*0.7)):rand(0,Math.floor(gp*0.5));
  agents.push({id:uuidv4(),name,email,loc,pers,cash,cs,gp,gw,gl:gp-gw,bank:pers==='fou'&&Math.random()<0.15,tp:rand(0,pers==='stratege'?5000000:2000000),ts:rand(100000,pers==='depensier'?10000000:3000000),td:rand(0,pers==='fou'?5000000:1000000),pv:rand(0,500)});
}

// Insert agents
part2 += 'INSERT INTO "User" (id, name, email, cash, type, is_agent, agent_personality, avatar, location, bio, credit_score, total_profit, total_spent, total_debt, games_played, games_won, games_lost, is_bankrupt, profile_views, status) VALUES\n';
part2 += agents.map(a=>`('${a.id}','${esc(a.name)}','${a.email}',${a.cash},'player',true,'${a.pers}','/avatars/default.png','${a.loc}','${esc(pick(BIO))}',${a.cs},${a.tp},${a.ts},${a.td},${a.gp},${a.gw},${a.gl},${a.bank},${a.pv},'active')`).join(',\n');
part2 += ';\n\n';

// Shops, Products, Services
const shops=[],products=[],services=[];
for (const ag of agents) {
  if (Math.random() < 0.65) {
    const sid = uuidv4();
    shops.push({id:sid,aid:ag.id,name:`${pick(SN)} - ${ag.name.split(' ')[1]}`.trim(),loc:ag.loc,an:ag.name});
    for (const p of pickN(PROD,rand(2,6))) products.push({id:uuidv4(),sid,aid:ag.id,name:p.n,cat:p.c,price:rand(p.a,p.b)});
    for (const s of pickN(SERV,rand(1,4))) services.push({id:uuidv4(),sid,aid:ag.id,name:s.n,cat:s.c,price:rand(s.a,s.b)});
  }
}

part2 += `INSERT INTO "Shop" (id, "ownerId", name, description, category, location, rating, review_count, sales_count, status) VALUES\n`;
part2 += shops.map(s=>`('${s.id}','${s.aid}','${esc(s.name)}','Boutique de ${esc(s.an)} à ${s.loc}','${pick(SC)}','${s.loc}',${randFloat(2.5,5)},${rand(0,50)},${rand(0,200)},'active')`).join(',\n');
part2 += ';\n\n';

part2 += `INSERT INTO "Product" (id, "shopId", "ownerId", name, description, category, price, stock, status) VALUES\n`;
part2 += products.map(p=>`('${p.id}','${p.sid}','${p.aid}','${esc(p.name)}','${esc(p.name)} de qualité','${p.cat}',${p.price},${rand(1,100)},'available')`).join(',\n');
part2 += ';\n\n';

part2 += `INSERT INTO "Service" (id, "shopId", "ownerId", name, description, category, price, availability) VALUES\n`;
part2 += services.map(s=>`('${s.id}','${s.sid}','${s.aid}','${esc(s.name)}','Service ${esc(s.name)}','${s.cat}',${s.price},'${Math.random()>0.15?'available':'unavailable'}')`).join(',\n');
part2 += ';\n\n';

// Loans
const loans=[];
for (const ag of pickN(agents,120)) {
  const amt=rand(100000,5000000),rate=randFloat(2.0,5.0),td=Math.round(amt*(1+parseFloat(rate)/100)),mo=rand(3,24),mp=Math.round(td/mo);
  const r=Math.random();let st,mr,rm;
  if(r<0.3){st='paid';mr=0;rm=0}else if(r<0.4){st='defaulted';mr=rand(1,mo);rm=rand(Math.round(td*0.3),td)}else{st='active';mr=rand(1,mo);rm=rand(Math.round(mp*mr),td)}
  const ap=Math.random()>0.3;
  loans.push({id:uuidv4(),aid:ag.id,amt,rate,td,rm,mp,mr,st,ap});
}
part2 += `INSERT INTO "Loan" (id, "userId", amount, interest_rate, total_due, remaining, monthly_payment, months_remaining, status, auto_approved, admin_approved) VALUES\n`;
part2 += loans.map(l=>`('${l.id}','${l.aid}',${l.amt},${l.rate},${l.td},${l.rm},${l.mp},${l.mr},'${l.st}',${l.ap},${l.ap?'NULL':(Math.random()>0.3?'true':'false')})`).join(',\n');
part2 += ';\n\n';

// Assets
const assets=[];
for (const ag of agents) {
  let num=ag.pers==='depensier'||ag.pers==='fou'?rand(1,5):ag.pers==='stratege'?rand(1,4):Math.random()<0.4?rand(1,2):0;
  for (const t of pickN(ASSETS,num)) {
    const pp=rand(t.a,t.b),cv=Math.round(pp*(0.8+Math.random()*0.4));
    let d='{}';
    if(t.c==='immobilier')d=`{"superficie":"${rand(50,500)}m2","pieces":${rand(1,8)}}`;
    else if(t.c==='vehicule')d=`{"annee":${rand(2005,2025)},"kilometrage":"${rand(5000,200000)}km"}`;
    else if(t.c==='or')d=`{"grammes":${pick([5,10,25,50,100])},"carat":${pick([18,21,22,24])}}`;
    assets.push({id:uuidv4(),aid:ag.id,n:t.n,c:t.c,pp,cv,d,st:Math.random()>0.05?'owned':'seized'});
  }
}
part2 += `INSERT INTO "Asset" (id, "userId", name, category, description, purchase_price, current_value, details, status) VALUES\n`;
part2 += assets.map(a=>`('${a.id}','${a.aid}','${esc(a.n)}','${a.c}','${esc(a.n)} - patrimoine',${a.pp},${a.cv},'${a.d}','${a.st}')`).join(',\n');
part2 += ';\n\n';

// Feed posts
const feed=[];
for (const ag of pickN(agents,80)) {
  const ft=pick(FT);let desc;
  switch(ft.t){case'inscription':desc='Un nouvel entrepreneur rejoint la communauté !';break;case'achat':desc=pick(['Achat effectué sur le marché.','Nouvel investissement.','Opération réussie.']);break;case'succes':desc=pick(['Projet rentable !','Objectif atteint !','Belle performance.']);break;case'pret':desc='Prêt approuvé pour une nouvelle activité.';break;case'vente':desc='Bien vendu avec plus-value.';break;case'faillite':desc='Difficultés à rembourser. Situation critique.';break;case'challenge':desc='Qui sera le meilleur ?';break;case'boutique':desc='Nouvelle boutique ouverte !';break;default:desc='Activité sur la plateforme.';}
  feed.push({id:uuidv4(),aid:ag.id,t:ft.t,title:ft.f(ag.name),desc,lk:rand(0,50),cm:rand(0,20)});
}
part2 += `INSERT INTO "FeedPost" (id, "userId", type, title, description, likes, comments) VALUES\n`;
part2 += feed.map(f=>`('${f.id}','${f.aid}','${f.t}','${esc(f.title)}','${esc(f.desc)}',${f.lk},${f.cm})`).join(',\n');
part2 += ';\n\n';

// Demands
const demands=[];
for (const ag of pickN(agents,50)) demands.push({id:uuidv4(),aid:ag.id,title:pick(DT),cat:pick(['produit','service','emploi','partenariat']),bud:rand(50000,5000000),st:pick(['open','open','open','in_progress','closed']),resp:rand(0,15)});
part2 += `INSERT INTO "Demand" (id, "userId", title, description, category, budget, status, responses_count) VALUES\n`;
part2 += demands.map(d=>`('${d.id}','${d.aid}','${esc(d.title)}','Je recherche ce service. Contactez-moi si intéressé.','${d.cat}',${d.bud},'${d.st}',${d.resp})`).join(',\n');
part2 += ';\n\n';

// Proposals
const props=[];
for(let i=0;i<Math.min(30,demands.length);i++){const dm=demands[i];for(const pr of pickN(agents.filter(a=>a.id!==dm.aid),rand(1,4)))props.push({id:uuidv4(),did:dm.id,aid:pr.id,price:rand(25000,3000000),st:pick(['pending','pending','accepted','rejected'])})}
part2 += `INSERT INTO "Proposal" (id, "demandId", "fromUserId", price, message, status) VALUES\n`;
part2 += props.map(p=>`('${p.id}','${p.did}','${p.aid}',${p.price},'Je propose ce service à ce prix. Contactez-moi.','${p.st}')`).join(',\n');
part2 += ';\n\n';

// Comments
const comms=[];
for(const post of pickN(feed,60)){const c=pick(agents.filter(a=>a.id!==post.aid));comms.push({id:uuidv4(),pid:post.id,aid:c.id,txt:pick(COM)})}
part2 += `INSERT INTO "FeedComment" (id, "postId", "userId", content) VALUES\n`;
part2 += comms.map(c=>`('${c.id}','${c.pid}','${c.aid}','${esc(c.txt)}')`).join(',\n');
part2 += ';\n\n';

// Reviews
const revs=[];
for(let i=0;i<80;i++){const fr=pick(agents),to=pick(agents.filter(a=>a.id!==fr.id));revs.push({id:uuidv4(),fid:fr.id,tid:to.id,rat:rand(1,5),txt:pick(REV)})}
part2 += `INSERT INTO "Review" (id, "fromUserId", "toUserId", rating, comment) VALUES\n`;
part2 += revs.map(r=>`('${r.id}','${r.fid}','${r.tid}',${r.rat},'${esc(r.txt)}')`).join(',\n');
part2 += ';\n\n';

// Transactions
const trTypes=['pret','remboursement','achat','vente','transfert','don'];
const trans=[];
for(const ag of pickN(agents,200)){for(let j=0;j<rand(1,5);j++){const tp=pick(trTypes),ot=pick(agents.filter(a=>a.id!==ag.id)),amt=tp==='pret'||tp==='achat'?rand(50000,5000000):tp==='remboursement'?rand(25000,500000):tp==='don'?rand(5000,100000):rand(10000,1000000);const desc=tp==='pret'?'Prêt bancaire':tp==='remboursement'?'Remboursement mensuel':tp==='achat'?'Achat marché':tp==='vente'?'Vente de bien':tp==='don'?'Don entre joueurs':'Transfert de fonds';trans.push({id:uuidv4(),fid:tp==='vente'||tp==='don'?ag.id:ot.id,tid:tp==='pret'||tp==='remboursement'?ag.id:ot.id,amt,tp,desc})}}
part2 += `INSERT INTO "Transaction" (id, "fromUserId", "toUserId", amount, type, description) VALUES\n`;
part2 += trans.map(t=>`('${t.id}','${t.fid}','${t.tid}',${t.amt},'${t.tp}','${esc(t.desc)}')`).join(',\n');
part2 += ';\n\n';

part2 += `-- FIN : ${agents.length} agents, ${shops.length} boutiques, ${products.length} produits, ${services.length} services, ${loans.length} prêts, ${assets.length} actifs, ${feed.length} posts, ${demands.length} demandes, ${props.length} propositions, ${comms.length} commentaires, ${revs.length} avis, ${trans.length} transactions\n`;

// Write files
const dl = path.join(__dirname, '..', 'download');
fs.writeFileSync(path.join(dl, 'sama-schema.sql'), part1, 'utf8');
fs.writeFileSync(path.join(dl, 'sama-data.sql'), part2, 'utf8');
console.log(`✅ Partie 1 (Schema): ${(part1.length/1024).toFixed(0)} Ko`);
console.log(`✅ Partie 2 (Données): ${(part2.length/1024).toFixed(0)} Ko`);
console.log(`   → ${agents.length} agents, ${shops.length} boutiques, ${products.length} produits`);
console.log(`   → ${services.length} services, ${loans.length} prêts, ${assets.length} actifs`);
