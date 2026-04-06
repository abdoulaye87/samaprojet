// Génère le SQL complet (schéma V2 + 300 agents) pour copier-coller dans Supabase SQL Editor
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// UTILITAIRES
// ============================================================
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  n = Math.min(n, copy.length);
  for (let i = 0; i < n; i++) { const idx = rand(0, copy.length - 1); result.push(copy.splice(idx, 1)[0]); }
  return result;
}
function esc(s) { return s ? s.replace(/'/g, "''") : ''; }

// ============================================================
// DONNÉES SÉNÉGALAISES
// ============================================================
const FIRST_NAMES_M = ['Abdoulaye','Moussa','Ibrahima','Ousmane','Mamadou','Pape','Cheikh','Mbaye','Seydou','Boubacar','Amadou','Idrissa','Birame','Mouhamadou','El Hadj','Serigne','Modou','Lamine','Daouda','Yaya','Souleymane','Aliou','Babacar','Thierno','Oumar','Falilou','Samba','Moustapha','Djibril','Mansour','Bouna','Salif','Malick','Pate','Abdou','Mouctar','Bassirou','Demba','Issa'];
const FIRST_NAMES_F = ['Fatou','Aminata','Mariama','Awa','Khady','Ndèye','Coumba','Dieynaba','Sokhna','Rokhaya','Yacine','Adama','Bineta','Oulimata','Ndeye','Aissatou','Maimouna','Djénéba','Kine','Mariétou','Astou','Thioro','Safiétou','Nafi','Daba','Coly','Gnilane','Fama','Hawa','Oumy','Ramata','Siga','Mbegue','Mareme','Djenaba','Yaram','Ndack','Touba','Soukeyna'];
const LAST_NAMES = ['Diop','Ndiaye','Sow','Fall','Dia','Ba','Sy','Mbaye','Gueye','Kane','Diallo','Seck','Diouf','Niang','Pouye','Sarr','Thiam','Mboup','Wade','Guissé','Cissé','Traoré','Tall','Aidara','Senghor','Dieng','Camara','Ly','Faye','Badji','Sakho','Dembélé','Konaté','Hane','Diedhiou','Sonko','Diatta','Sané','Sambou','Coly','Tendeng','Gomis','Ndong','Mané','Daff','Bâ','Wone','Ndir','Penda','Cissokho'];
const LOCATIONS = ['Dakar','Pikine','Guédiawaye','Rufisque','Thiès','Saint-Louis','Kaolack','Ziguinchor','Tambacounda','Kolda','Diourbel','Louga','Diamniadio','Mbao','Parcelles Assainies','Médina','Sandaga','Plateau','Grand Yoff','Liberté','Sacr-Coeur','Mermoz','Almadies','Fann','Ngor','Bignona','Sédhiou','Kaffrine','Matam','Podor','Linguère','Dagana'];
const BIOS = [
  'Entrepreneur passionné, toujours en quête de nouvelles opportunités.',
  'Commerçant depuis 10 ans au marché Sandaga.',
  'Fondateur d\'une PME dans le transport de marchandises.',
  'Investisseur dans l\'immobilier à Diamniadio.',
  'Éleveur dans la région de Thiès, spécialisé en volailles.',
  'Femme d\'affaires dans le commerce de détail.',
  'Expert en agriculture irriguée dans la Vallée du Fleuve.',
  'Propriétaire d\'un cyber café à Pikine.',
  'Artisan bijoutier reconnu dans la Médina.',
  'Transporteur inter-villes Dakar-Kaolack.',
  'Fournisseur de matériel de construction.',
  'Négociant en produits alimentaires à Sandaga.',
  'Gérant de boutique de téléphones au Plateau.',
  'Restaurateur à Médina, spécialité thiéboudienne.',
  'Commerçant d\'or et bijoux à Colobane.',
  'Marchand de tissus wax et bazin.',
  'Tailleur de haute couture à Grand Yoff.',
  'Mécanicien auto indépendant.',
  'Éleveur de bovins dans le Fouta.',
  'Peintre en bâtiment, 15 ans d\'expérience.',
  'Pêcheur artisanal à Soumbédioune.',
  'Agricultrice maraîchère à Sangalkam.',
  'Commerçant de produits électroniques.',
  'Gérant de salon de coiffure.',
  'Menuisier spécialisé en mobilier moderne.',
  'Plombier certifié, interventions Dakar et banlieue.',
  'Électricien avec 8 ans d\'expérience.',
  'Chauffeur de taxi, 5 ans de métier.',
  'Couturière spécialisée en boubou brodé.',
  'Vendeuse de fruits et légumes au marché Kermel.',
  'Propriétaire d\'une quincaillerie à Guédiawaye.',
  'Fournisseur de poissons frais de Kayar.',
  'Technicien en climatisation et réfrigération.',
  'Gérant d\'un pressing moderne.',
  'Importateur de voitures d\'occasion.',
  'Agriculteur dans le bassin arachidier de Diourbel.',
  'Tradipraticien et vendeur de plantes médicinales.',
  'Photographe événementiel.',
  'Tisseur de tapis traditionnels.',
];
const SHOP_NAMES = ['Boutique du Coin','Épicerie Moderne','Alimentation Générale','Chez Papa','Boutique Sénégal','Marché Frais','Dakar Store','Sandaga Shop','Gold & Bijoux','Transport Express','BTP Sénégal','Agri Plus','Tech Zone','Cyber Connect','Auto Plus','Immobilier du Soleil','Meubles & Déco','Couture Élégance','Resto du Terroir','Boulangerie Moderne','Quincaillerie du Nord','Poissonnerie Fraîche','Boucherie Premium','Fruits & Légumes','Electro Men','Fashion Style','Sport & Loisirs','Peinture & Décoration','Plomberie Service','Cuir & Maroquinerie','Parfumerie Luxe','Librairie du Savoir','Clinique Mobile','Maison Connectée','Salon Béauté Prestige','Pressing Express','Santé & Bien-être','Bric-à-brac Sénégal','Teranga Telecom','Sahel Digital','Minoterie du Nord','Savonnerie Artisanale','Poterie de Colobane','Atelier Mécanique Diop','Garage Auto Mbaye'];
const SHOP_CATEGORIES = ['boutique','entreprise','commerce','service'];
const PRODUCTS = [
  {name:'Lingot or 10g',category:'or',pMin:350000,pMax:400000},{name:'Lingot or 50g',category:'or',pMin:1500000,pMax:1800000},{name:'Bracelet or 18k',category:'or',pMin:150000,pMax:250000},{name:'Chaîne or massif',category:'or',pMin:200000,pMax:350000},{name:'Bague or blanc',category:'or',pMin:120000,pMax:200000},{name:'Pendentif or',category:'or',pMin:80000,pMax:180000},{name:'Bague diamant 1ct',category:'diamant',pMin:500000,pMax:2000000},{name:'Collier diamant',category:'diamant',pMin:1000000,pMax:5000000},{name:'Bracelet diamant',category:'diamant',pMin:800000,pMax:3000000},{name:'Terrain 200m² Diamniadio',category:'immobilier',pMin:5000000,pMax:15000000},{name:'Case 3 pièces Pikine',category:'immobilier',pMin:3000000,pMax:8000000},{name:'Villa 5 pièces Almadies',category:'immobilier',pMin:25000000,pMax:80000000},{name:'Appartement Fann',category:'immobilier',pMin:8000000,pMax:20000000},{name:'Local commercial Sandaga',category:'immobilier',pMin:10000000,pMax:30000000},{name:'Moto Java',category:'vehicule',pMin:350000,pMax:500000},{name:'Mercedes Classe C',category:'vehicule',pMin:8000000,pMax:15000000},{name:'Toyota Hilux',category:'vehicule',pMin:15000000,pMax:25000000},{name:'Minibus 18 places',category:'vehicule',pMin:8000000,pMax:12000000},{name:'Dacia Logan',category:'vehicule',pMin:5000000,pMax:8000000},{name:'Riz 50kg',category:'alimentaire',pMin:25000,pMax:40000},{name:'Huile arachide 5L',category:'alimentaire',pMin:8000,pMax:15000},{name:'Poisson fumé 10kg',category:'alimentaire',pMin:15000,pMax:30000},{name:'Sucre 25kg',category:'alimentaire',pMin:18000,pMax:28000},{name:'Lait en poudre',category:'alimentaire',pMin:5000,pMax:12000},{name:'Ciment 50 sacs',category:'materiel',pMin:250000,pMax:350000},{name:'Groupe électrogène',category:'materiel',pMin:200000,pMax:500000},{name:'Fer à béton tonne',category:'materiel',pMin:350000,pMax:500000},{name:'Parpaing 1000',category:'materiel',pMin:80000,pMax:150000},{name:'Montre Rolex',category:'luxe',pMin:2000000,pMax:8000000},{name:'iPhone 15 Pro',category:'luxe',pMin:600000,pMax:900000},{name:'Costume italien',category:'luxe',pMin:100000,pMax:300000},{name:'Sac Louis Vuitton',category:'luxe',pMin:500000,pMax:2000000},{name:'Boubou brodé grand soir',category:'luxe',pMin:50000,pMax:200000},{name:'Parfum Chanel N5',category:'luxe',pMin:80000,pMax:150000},
];
const SERVICES = [
  {name:'Transport Dakar-Thiès',category:'transport',pMin:3000,pMax:5000},{name:'Transport marchandises Dakar-Kaolack',category:'transport',pMin:50000,pMax:200000},{name:'Déménagement local',category:'transport',pMin:50000,pMax:150000},{name:'Course en ville',category:'transport',pMin:1500,pMax:5000},{name:'Construction maison R+1',category:'construction',pMin:5000000,pMax:20000000},{name:'Maçonnerie',category:'construction',pMin:200000,pMax:500000},{name:'Peinture bâtiment',category:'construction',pMin:100000,pMax:300000},{name:'Carrelage',category:'construction',pMin:150000,pMax:400000},{name:'Plomberie',category:'construction',pMin:50000,pMax:200000},{name:'Réparation téléphone',category:'reparation',pMin:5000,pMax:30000},{name:'Réparation climatisation',category:'reparation',pMin:25000,pMax:75000},{name:'Réparation voiture',category:'reparation',pMin:20000,pMax:200000},{name:'Réparation ordinateur',category:'reparation',pMin:10000,pMax:50000},{name:'Conseil juridique',category:'conseil',pMin:50000,pMax:200000},{name:'Comptabilité',category:'conseil',pMin:100000,pMax:500000},{name:'Conseil en investissement',category:'conseil',pMin:75000,pMax:300000},{name:'Formation couture',category:'formation',pMin:50000,pMax:200000},{name:'Formation informatique',category:'formation',pMin:30000,pMax:100000},{name:'Cours de langue',category:'formation',pMin:15000,pMax:50000},{name:'Manoeuvre journalier',category:'main_d_oeuvre',pMin:5000,pMax:10000},{name:'Couturier traditionnel',category:'main_d_oeuvre',pMin:15000,pMax:50000},{name:'Cuisinier événementiel',category:'main_d_oeuvre',pMin:25000,pMax:75000},{name:'Garde malade',category:'main_d_oeuvre',pMin:10000,pMax:25000},
];
const ASSET_TEMPLATES = [
  {name:'Lingot or 10g',category:'or',pMin:350000,pMax:400000},{name:'Bracelet or 18k',category:'or',pMin:150000,pMax:250000},{name:'Chaîne or massif',category:'or',pMin:200000,pMax:350000},{name:'Bague diamant 1ct',category:'diamant',pMin:500000,pMax:2000000},{name:'Collier diamant',category:'diamant',pMin:1000000,pMax:5000000},{name:'Terrain Diamniadio',category:'immobilier',pMin:5000000,pMax:15000000},{name:'Villa Almadies',category:'immobilier',pMin:25000000,pMax:80000000},{name:'Case Pikine',category:'immobilier',pMin:3000000,pMax:8000000},{name:'Appartement Plateau',category:'immobilier',pMin:10000000,pMax:25000000},{name:'Toyota Hilux',category:'vehicule',pMin:15000000,pMax:25000000},{name:'Mercedes Classe C',category:'vehicule',pMin:8000000,pMax:15000000},{name:'Moto Java',category:'vehicule',pMin:350000,pMax:500000},{name:'Montre Rolex',category:'luxe',pMin:2000000,pMax:8000000},{name:'iPhone 15 Pro',category:'luxe',pMin:600000,pMax:900000},{name:'Sac Louis Vuitton',category:'luxe',pMin:500000,pMax:2000000},{name:'Boubou brodé',category:'luxe',pMin:50000,pMax:200000},
];
const FEED_TEMPLATES = [
  {type:'inscription',tf:n=>`${n} a rejoint Sama Économie !`},
  {type:'achat',tf:n=>`${n} vient d'acheter un bien sur le marché`},
  {type:'succes',tf:n=>`${n} a réussi son projet avec succès !`},
  {type:'pret',tf:n=>`${n} a obtenu un prêt pour son projet`},
  {type:'vente',tf:n=>`${n} vend un de ses biens au meilleur prix`},
  {type:'faillite',tf:n=>`${n} est en difficulté financière...`},
  {type:'challenge',tf:n=>`${n} a lancé un défi aux entrepreneurs`},
  {type:'boutique',tf:n=>`${n} a ouvert une nouvelle boutique`},
];
const DEMAND_TITLES = ['Cherche terrain à bâtir à Diamniadio','Besoin de transport marchandises vers Kaolack','Recherche maçon expérimenté pour construction','Cherche fournisseur de ciment en gros','Besoin d\'un mécanicien fiable','Recherche climaticien pour installation','Cherche coursier pour livraisons quotidiennes','Besoin de matériel de pêche professionnel','Recherche bailleur pour local commercial','Cherche peintre pour ravalement façade','Besoin d\'une Toyota Hilux d\'occasion','Recherche grossiste en produits alimentaires','Cherche électricien pour installation solaire','Besoin de service de déménagement','Recherche artisan bijoutier pour commande spéciale','Cherche cuisinier pour mariage 200 personnes','Besoin de 50 sacs de ciment urgemment','Recherche chauffeur privé','Cherche location de groupe électrogène','Besoin d\'expert comptable pour bilan annuel','Recherche fournisseur de tissu wax en gros','Cherche carreleur pour 150m²','Besoin de main d\'oeuvre pour récolte','Recherche adjudicateur pour marché public','Cherche partenaire pour projet agribusiness','Besoin de formation en informatique','Recherche imprimeur pour cartes de visite','Cherche plombier urgently','Besoin de location voiture pour une semaine','Recherche tisseur de tapis traditionnels'];
const COMMENTS = ['Trop bien ! Continue comme ça !','Bonne chance pour ton projet !','Intéressant, je vais suivre ça de près.','Conseil : pense bien à ton étude de marché.','J\'ai fait pareil et j\'ai réussi !','Attention aux dépenses imprévues...','Tu devrais aller voir sur le marché.','Que Dieu t\'aide dans ton business.','Je peux te proposer mes services.','Tu gères ! Un vrai entrepreneur.'];
const REVIEWS = ['Très bon partenaire, fiable et ponctuel.','Service correct, rien à redire.','Pas satisfait du délai de livraison.','Excellent rapport qualité-prix.','Je recommande vivement !','Professionnel et sérieux.','Un peu cher mais la qualité est là.','Bonne communication tout au long.','Service médiocre, je ne recommande pas.','Un vrai homme d\'affaires !'];

// ============================================================
// GÉNÉRATION SQL
// ============================================================
function generateSQL() {
  let sql = '';

  // === PARTIE 1: SCHÉMA ===
  sql += `-- ============================================================
-- SAMA ÉCONOMIE V2 — Schéma complet + 300 agents IA
-- Simulation économique sénégalaise
-- Généré automatiquement
-- ============================================================

-- CLEANUP
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
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Loan" (
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

CREATE TABLE IF NOT EXISTS "Project" (
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

CREATE TABLE IF NOT EXISTS "ProjectExpense" (
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

CREATE TABLE IF NOT EXISTS "GameEvent" (
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

CREATE TABLE IF NOT EXISTS "Asset" (
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

CREATE TABLE IF NOT EXISTS "MarketPrice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  price DOUBLE PRECISION NOT NULL,
  change_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId UUID REFERENCES "User"(id) ON DELETE SET NULL,
  toUserId UUID REFERENCES "User"(id) ON DELETE SET NULL,
  amount DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Shop" (
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

CREATE TABLE IF NOT EXISTS "Product" (
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

CREATE TABLE IF NOT EXISTS "Service" (
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

CREATE TABLE IF NOT EXISTS "Demand" (
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

CREATE TABLE IF NOT EXISTS "Proposal" (
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

CREATE TABLE IF NOT EXISTS "Order" (
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

CREATE TABLE IF NOT EXISTS "FeedPost" (
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

CREATE TABLE IF NOT EXISTS "FeedLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE(postId, userId)
);

CREATE TABLE IF NOT EXISTS "FeedComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES "FeedPost"(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Review" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fromUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  toUserId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  orderId UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(fromUserId, toUserId, "createdAt")
);

CREATE TABLE IF NOT EXISTS "Challenge" (
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

CREATE TABLE IF NOT EXISTS "P2PLoan" (
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

CREATE TABLE IF NOT EXISTS "ProfileView" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  viewedId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "GameSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_agent ON "User"(is_agent);
CREATE INDEX IF NOT EXISTS idx_user_credit_score ON "User"(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_cash ON "User"(cash DESC);
CREATE INDEX IF NOT EXISTS idx_loan_user ON "Loan"(userId);
CREATE INDEX IF NOT EXISTS idx_loan_status ON "Loan"(status);
CREATE INDEX IF NOT EXISTS idx_asset_user ON "Asset"(userId);
CREATE INDEX IF NOT EXISTS idx_shop_owner ON "Shop"(ownerId);
CREATE INDEX IF NOT EXISTS idx_product_shop ON "Product"(shopId);
CREATE INDEX IF NOT EXISTS idx_service_shop ON "Service"(shopId);
CREATE INDEX IF NOT EXISTS idx_demand_user ON "Demand"(userId);
CREATE INDEX IF NOT EXISTS idx_proposal_demand ON "Proposal"(demandId);
CREATE INDEX IF NOT EXISTS idx_feed_created ON "FeedPost"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_created ON "Transaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(userId, "read");

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

`;

  // === PARTIE 2: 300 AGENTS ===
  sql += '-- ============================================================\n';
  sql += '-- 300 AGENTS IA\n';
  sql += '-- ============================================================\n\n';

  const agents = [];
  const usedEmails = new Set();

  for (let i = 0; i < 300; i++) {
    const isFemale = Math.random() > 0.52;
    const firstName = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const loc = pick(LOCATIONS);

    let email;
    do { email = `${firstName.toLowerCase().replace(/\s/g,'')}.${lastName.toLowerCase()}${rand(1,999)}@agent.sama.sn`; } while (usedEmails.has(email));
    usedEmails.add(email);

    const r = Math.random();
    const personality = r < 0.40 ? 'econome' : r < 0.65 ? 'depensier' : r < 0.85 ? 'stratege' : 'fou';
    const cash = personality === 'econome' ? rand(100000,5000000) : personality === 'depensier' ? rand(0,8000000) : personality === 'stratege' ? rand(500000,10000000) : rand(0,12000000);
    const creditScore = personality === 'econome' ? rand(700,1000) : personality === 'stratege' ? rand(650,950) : personality === 'depensier' ? rand(400,800) : rand(200,700);
    const gamesPlayed = rand(1,20);
    const gamesWon = personality === 'stratege' ? rand(1,gamesPlayed) : personality === 'econome' ? rand(0,Math.floor(gamesPlayed*0.7)) : rand(0,Math.floor(gamesPlayed*0.5));
    const isBankrupt = personality === 'fou' && Math.random() < 0.15;

    agents.push({
      id: uuidv4(), name, email, loc, personality, cash, creditScore,
      gamesPlayed, gamesWon, gamesLost: gamesPlayed - gamesWon,
      isBankrupt, totalProfit: rand(0, personality==='stratege'?5000000:2000000),
      totalSpent: rand(100000, personality==='depensier'?10000000:3000000),
      totalDebt: rand(0, personality==='fou'?5000000:1000000),
      profileViews: rand(0,500),
    });
  }

  // Insert agents
  sql += 'INSERT INTO "User" (id, name, email, cash, type, is_agent, agent_personality, avatar, location, bio, credit_score, total_profit, total_spent, total_debt, games_played, games_won, games_lost, is_bankrupt, profile_views, status) VALUES\n';
  sql += agents.map(a => `  ('${a.id}', '${esc(a.name)}', '${a.email}', ${a.cash}, 'player', true, '${a.personality}', '/avatars/default.png', '${a.loc}', '${esc(pick(BIOS))}', ${a.creditScore}, ${a.totalProfit}, ${a.totalSpent}, ${a.totalDebt}, ${a.gamesPlayed}, ${a.gamesWon}, ${a.gamesLost}, ${a.isBankrupt}, ${a.profileViews}, 'active')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 3: BOUTIQUES ===
  sql += '-- ============================================================\n-- BOUTIQUES, PRODUITS, SERVICES\n-- ============================================================\n\n';

  const shops = [];
  const products = [];
  const services = [];

  for (const agent of agents) {
    if (Math.random() < 0.65) {
      const shopId = uuidv4();
      shops.push({ id: shopId, agentId: agent.id, name: `${pick(SHOP_NAMES)} - ${agent.name.split(' ')[1]}`.trim(), loc: agent.loc, agentName: agent.name });

      for (const p of pickN(PRODUCTS, rand(2,6))) {
        products.push({ id: uuidv4(), shopId, agentId: agent.id, name: p.name, cat: p.category, price: rand(p.pMin,p.pMax) });
      }
      for (const s of pickN(SERVICES, rand(1,4))) {
        services.push({ id: uuidv4(), shopId, agentId: agent.id, name: s.name, cat: s.category, price: rand(s.pMin,s.pMax) });
      }
    }
  }

  sql += `INSERT INTO "Shop" (id, "ownerId", name, description, category, location, rating, review_count, sales_count, status) VALUES\n`;
  sql += shops.map(s => `  ('${s.id}', '${s.agentId}', '${esc(s.name)}', 'Boutique de ${esc(s.agentName)} à ${s.loc}', '${pick(SHOP_CATEGORIES)}', '${s.loc}', ${randFloat(2.5,5)}, ${rand(0,50)}, ${rand(0,200)}, 'active')`).join(',\n');
  sql += ';\n\n';

  sql += `INSERT INTO "Product" (id, "shopId", "ownerId", name, description, category, price, stock, status) VALUES\n`;
  sql += products.map(p => `  ('${p.id}', '${p.shopId}', '${p.agentId}', '${esc(p.name)}', '${esc(p.name)} de qualité', '${p.cat}', ${p.price}, ${rand(1,100)}, 'available')`).join(',\n');
  sql += ';\n\n';

  sql += `INSERT INTO "Service" (id, "shopId", "ownerId", name, description, category, price, availability) VALUES\n`;
  sql += services.map(s => `  ('${s.id}', '${s.shopId}', '${s.agentId}', '${esc(s.name)}', 'Service professionnel ${esc(s.name)}', '${s.cat}', ${s.price}, '${Math.random()>0.15?'available':'unavailable'}')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 4: PRÊTS ===
  sql += '-- ============================================================\n-- PRÊTS\n-- ============================================================\n\n';

  const loans = [];
  for (const agent of pickN(agents, 120)) {
    const amount = rand(100000, 5000000);
    const rate = randFloat(2.0, 5.0);
    const totalDue = Math.round(amount * (1 + parseFloat(rate) / 100));
    const months = rand(3, 24);
    const monthly = Math.round(totalDue / months);
    const r = Math.random();
    let status, monthsRemaining, remaining;
    if (r < 0.30) { status='paid'; monthsRemaining=0; remaining=0; }
    else if (r < 0.40) { status='defaulted'; monthsRemaining=rand(1,months); remaining=rand(Math.round(totalDue*0.3),totalDue); }
    else { monthsRemaining=rand(1,months); remaining=rand(Math.round(monthly*monthsRemaining),totalDue); status='active'; }
    const autoApproved = Math.random() > 0.3;
    loans.push({ id: uuidv4(), agentId: agent.id, amount, rate, totalDue, remaining, monthly, monthsRemaining, status, autoApproved });
  }

  sql += `INSERT INTO "Loan" (id, "userId", amount, interest_rate, total_due, remaining, monthly_payment, months_remaining, status, auto_approved, admin_approved) VALUES\n`;
  sql += loans.map(l => `  ('${l.id}', '${l.agentId}', ${l.amount}, ${l.rate}, ${l.totalDue}, ${l.remaining}, ${l.monthly}, ${l.monthsRemaining}, '${l.status}', ${l.autoApproved}, ${l.autoApproved?'NULL':(Math.random()>0.3?'true':'false')})`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 5: ACTIFS ===
  sql += '-- ============================================================\n-- ACTIFS (PATRIMOINE)\n-- ============================================================\n\n';

  const assets = [];
  for (const agent of agents) {
    let num = 0;
    if (agent.personality === 'depensier' || agent.personality === 'fou') num = rand(1,5);
    else if (agent.personality === 'stratege') num = rand(1,4);
    else num = Math.random() < 0.4 ? rand(1,2) : 0;
    for (const t of pickN(ASSET_TEMPLATES, num)) {
      const pp = rand(t.pMin, t.pMax);
      const cv = Math.round(pp * (0.8 + Math.random() * 0.4));
      let details = '{}';
      if (t.category === 'immobilier') details = `{"superficie":"${rand(50,500)}m2","pieces":${rand(1,8)}}`;
      else if (t.category === 'vehicule') details = `{"annee":${rand(2005,2025)},"kilometrage":"${rand(5000,200000)}km"}`;
      else if (t.category === 'or') details = `{"grammes":${pick([5,10,25,50,100])},"carat":${pick([18,21,22,24])}}`;
      assets.push({ id: uuidv4(), agentId: agent.id, name: t.name, cat: t.category, pp, cv, details, status: Math.random()>0.05?'owned':'seized' });
    }
  }

  sql += `INSERT INTO "Asset" (id, "userId", name, category, description, purchase_price, current_value, details, status) VALUES\n`;
  sql += assets.map(a => `  ('${a.id}', '${a.agentId}', '${esc(a.name)}', '${a.cat}', '${esc(a.name)} - patrimoine', ${a.pp}, ${a.cv}, '${a.details}', '${a.status}')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 6: FEED ===
  sql += '-- ============================================================\n-- FEED D\'ACTUALITÉS\n-- ============================================================\n\n';

  const feedPosts = [];
  for (const agent of pickN(agents, 80)) {
    const ft = pick(FEED_TEMPLATES);
    let desc;
    switch (ft.type) {
      case 'inscription': desc = 'Un nouvel entrepreneur rejoint la communauté !'; break;
      case 'achat': desc = pick(['Achat effectué sur le marché.','Nouvel investissement.','Opération réussie.']); break;
      case 'succes': desc = pick(['Projet rentable !','Objectif atteint !','Belle performance.']); break;
      case 'pret': desc = 'Prêt approuvé pour une nouvelle activité.'; break;
      case 'vente': desc = 'Bien vendu avec plus-value.'; break;
      case 'faillite': desc = 'Difficultés à rembourser. Situation critique.'; break;
      case 'challenge': desc = 'Qui sera le meilleur ? Relevez le défi !'; break;
      case 'boutique': desc = 'Nouvelle boutique sur la plateforme !'; break;
      default: desc = 'Activité sur la plateforme.';
    }
    feedPosts.push({ id: uuidv4(), agentId: agent.id, type: ft.type, title: ft.tf(agent.name), desc, likes: rand(0,50), comments: rand(0,20) });
  }

  sql += `INSERT INTO "FeedPost" (id, "userId", type, title, description, likes, comments) VALUES\n`;
  sql += feedPosts.map(f => `  ('${f.id}', '${f.agentId}', '${f.type}', '${esc(f.title)}', '${esc(f.desc)}', ${f.likes}, ${f.comments})`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 7: DEMANDES ===
  sql += '-- ============================================================\n-- DEMANDES\n-- ============================================================\n\n';

  const demands = [];
  for (const agent of pickN(agents, 50)) {
    demands.push({ id: uuidv4(), agentId: agent.id, title: pick(DEMAND_TITLES), cat: pick(['produit','service','emploi','partenariat']), budget: rand(50000,5000000), status: pick(['open','open','open','in_progress','closed']), resp: rand(0,15) });
  }

  sql += `INSERT INTO "Demand" (id, "userId", title, description, category, budget, status, responses_count) VALUES\n`;
  sql += demands.map(d => `  ('${d.id}', '${d.agentId}', '${esc(d.title)}', 'Je recherche ce service/produit. Contactez-moi si intéressé.', '${d.cat}', ${d.budget}, '${d.status}', ${d.resp})`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 8: PROPOSITIONS ===
  sql += '-- ============================================================\n-- PROPOSITIONS\n-- ============================================================\n\n';

  const proposals = [];
  for (let i = 0; i < Math.min(30, demands.length); i++) {
    const demand = demands[i];
    for (const proposer of pickN(agents.filter(a => a.id !== demand.agentId), rand(1,4))) {
      proposals.push({ id: uuidv4(), demandId: demand.id, agentId: proposer.id, price: rand(25000,3000000), status: pick(['pending','pending','accepted','rejected']) });
    }
  }

  sql += `INSERT INTO "Proposal" (id, "demandId", "fromUserId", price, message, status) VALUES\n`;
  sql += proposals.map(p => `  ('${p.id}', '${p.demandId}', '${p.agentId}', ${p.price}, 'Bonjour, je propose ce service à ce prix. Contactez-moi.', '${p.status}')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 9: COMMENTAIRES ===
  sql += '-- ============================================================\n-- COMMENTAIRES\n-- ============================================================\n\n';

  const comments = [];
  for (const post of pickN(feedPosts, 60)) {
    const commenter = pick(agents.filter(a => a.id !== post.agentId));
    comments.push({ id: uuidv4(), postId: post.id, agentId: commenter.id, content: pick(COMMENTS) });
  }

  sql += `INSERT INTO "FeedComment" (id, "postId", "userId", content) VALUES\n`;
  sql += comments.map(c => `  ('${c.id}', '${c.postId}', '${c.agentId}', '${esc(c.content)}')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 10: AVIS ===
  sql += '-- ============================================================\n-- AVIS\n-- ============================================================\n\n';

  const reviews = [];
  for (let i = 0; i < 80; i++) {
    const from = pick(agents);
    const to = pick(agents.filter(a => a.id !== from.id));
    reviews.push({ id: uuidv4(), fromId: from.id, toId: to.id, rating: rand(1,5), comment: pick(REVIEWS) });
  }

  sql += `INSERT INTO "Review" (id, "fromUserId", "toUserId", rating, comment) VALUES\n`;
  sql += reviews.map(r => `  ('${r.id}', '${r.fromId}', '${r.toId}', ${r.rating}, '${esc(r.comment)}')`).join(',\n');
  sql += ';\n\n';

  // === PARTIE 11: TRANSACTIONS ===
  sql += '-- ============================================================\n-- TRANSACTIONS\n-- ============================================================\n\n';

  const transTypes = ['pret','remboursement','achat','vente','transfert','don'];
  const transactions = [];
  for (const agent of pickN(agents, 200)) {
    for (let j = 0; j < rand(1,5); j++) {
      const type = pick(transTypes);
      const other = pick(agents.filter(a => a.id !== agent.id));
      const amount = type==='pret'||type==='achat'?rand(50000,5000000):type==='remboursement'?rand(25000,500000):type==='don'?rand(5000,100000):rand(10000,1000000);
      const desc = type==='pret'?'Prêt bancaire':type==='remboursement'?'Remboursement mensuel':type==='achat'?'Achat sur le marché':type==='vente'?'Vente de bien':type==='don'?'Don entre joueurs':'Transfert de fonds';
      transactions.push({ id: uuidv4(), fromId: type==='vente'||type==='don'?agent.id:other.id, toId: type==='pret'||type==='remboursement'?agent.id:other.id, amount, type, desc });
    }
  }

  sql += `INSERT INTO "Transaction" (id, "fromUserId", "toUserId", amount, type, description) VALUES\n`;
  sql += transactions.map(t => `  ('${t.id}', '${t.fromId}', '${t.toId}', ${t.amount}, '${t.type}', '${esc(t.desc)}')`).join(',\n');
  sql += ';\n\n';

  // === FIN ===
  sql += '-- ============================================================\n';
  sql += `-- FIN : ${agents.length} agents, ${shops.length} boutiques, ${products.length} produits, ${services.length} services\n`;
  sql += `-- ${loans.length} prêts, ${assets.length} actifs, ${feedPosts.length} posts, ${demands.length} demandes\n`;
  sql += `-- ${proposals.length} propositions, ${comments.length} commentaires, ${reviews.length} avis, ${transactions.length} transactions\n`;
  sql += '-- ============================================================\n';

  return sql;
}

const sql = generateSQL();
const outPath = path.join(__dirname, '..', 'download', 'sama-economie-full.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`✅ SQL généré : ${outPath} (${(sql.length / 1024).toFixed(0)} Ko)`);
