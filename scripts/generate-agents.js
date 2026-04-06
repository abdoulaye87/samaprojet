// ============================================================
// SAMA ÉCONOMIE V2 — Génération de 300 agents IA sénégalais
// Utilise l'API REST Supabase (fonctionne même sans IPv4 direct)
// + boutiques, produits, services, prêts, actifs, feed, demandes
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Lecture directe du fichier .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && !line.startsWith('#')) {
    envVars[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables Supabase manquantes dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// ============================================================
// DONNÉES SÉNÉGALAISES RÉALISTES
// ============================================================

const FIRST_NAMES_M = [
  'Abdoulaye','Moussa','Ibrahima','Ousmane','Mamadou','Pape','Cheikh',
  'Mbaye','Seydou','Boubacar','Amadou','Idrissa','Birame','Mouhamadou',
  'El Hadj','Serigne','Modou','Lamine','Daouda','Yaya','Souleymane',
  'Aliou','Babacar','Thierno','Oumar','Falilou','Mamadou Lamine',
  'Samba','Moustapha','Djibril','Mansour','Bouna','Salif','Malick','Pate',
  'Abdou','Mouctar','Bassirou','Ousman','Demba','Issa',
];

const FIRST_NAMES_F = [
  'Fatou','Aminata','Mariama','Awa','Khady','Ndèye','Coumba',
  'Dieynaba','Sokhna','Rokhaya','Yacine','Adama','Bineta','Oulimata',
  'Ndeye','Aissatou','Maimouna','Djénéba','Kine','Mariétou',
  'Astou','Thioro','Safiétou','Nafi','Daba','Coly','Gnilane',
  'Fama','Hawa','Oumy','Ramata','Siga','Mbegue','Mareme',
  'Djenaba','Yaram','Ndack','Touba','Soukeyna',
];

const LAST_NAMES = [
  'Diop','Ndiaye','Sow','Fall','Dia','Ba','Sy','Mbaye','Gueye',
  'Kane','Diallo','Seck','Diouf','Niang','Pouye','Sarr','Thiam',
  'Mboup','Wade','Guissé','Cissé','Traoré','Tall','Aidara',
  'Senghor','Dieng','Camara','Ly','Faye','Badji','Sakho',
  'Dembélé','Konaté','Hane','Diedhiou','Sonko','Diatta',
  'Sané','Sambou','Coly','Tendeng','Gomis','Ndong','Mané',
  'Daff','Bâ','Wone','Ndir','Penda','Cissokho',
];

const LOCATIONS = [
  'Dakar','Pikine','Guédiawaye','Rufisque','Thiès','Saint-Louis',
  'Kaolack','Ziguinchor','Tambacounda','Kolda','Diourbel','Louga',
  'Diamniadio','Mbao','Parcelles Assainies','Médina','Sandaga','Plateau',
  'Grand Yoff','Liberté','Sacr-Coeur','Mermoz','Almadies','Fann','Ngor',
  'Bignona','Sédhiou','Kaffrine','Matam','Podor','Linguère','Dagana',
];

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

const SHOP_NAMES = [
  'Boutique du Coin','Épicerie Moderne','Alimentation Générale','Chez Papa',
  'Boutique Sénégal','Marché Frais','Dakar Store','Sandaga Shop',
  'Gold & Bijoux','Transport Express','BTP Sénégal','Agri Plus',
  'Tech Zone','Cyber Connect','Auto Plus','Immobilier du Soleil',
  'Meubles & Déco','Couture Élégance','Resto du Terroir','Boulangerie Moderne',
  'Quincaillerie du Nord','Poissonnerie Fraîche','Boucherie Premium',
  'Fruits & Légumes','Electro Men','Fashion Style','Sport & Loisirs',
  'Peinture & Décoration','Plomberie Service','Cuir & Maroquinerie',
  'Parfumerie Luxe','Librairie du Savoir','Clinique Mobile','Maison Connectée',
  'Salon Béauté Prestige','Pressing Express','Santé & Bien-être',
  'Bric-à-brac Sénégal','Teranga Telecom','Sahel Digital',
  'Minoterie du Nord','Savonnerie Artisanale','Poterie de Colobane',
  'Atelier Mécanique Diop','Garage Auto Mbaye',
];

const SHOP_CATEGORIES = ['boutique','entreprise','commerce','service'];

const PRODUCTS = [
  { name:'Lingot or 10g', category:'or', pMin:350000, pMax:400000 },
  { name:'Lingot or 50g', category:'or', pMin:1500000, pMax:1800000 },
  { name:'Bracelet or 18k', category:'or', pMin:150000, pMax:250000 },
  { name:'Chaîne or massif', category:'or', pMin:200000, pMax:350000 },
  { name:'Bague or blanc', category:'or', pMin:120000, pMax:200000 },
  { name:'Pendentif or', category:'or', pMin:80000, pMax:180000 },
  { name:'Bague diamant 1ct', category:'diamant', pMin:500000, pMax:2000000 },
  { name:'Collier diamant', category:'diamant', pMin:1000000, pMax:5000000 },
  { name:'Bracelet diamant', category:'diamant', pMin:800000, pMax:3000000 },
  { name:'Terrain 200m² Diamniadio', category:'immobilier', pMin:5000000, pMax:15000000 },
  { name:'Case 3 pièces Pikine', category:'immobilier', pMin:3000000, pMax:8000000 },
  { name:'Villa 5 pièces Almadies', category:'immobilier', pMin:25000000, pMax:80000000 },
  { name:'Appartement Fann', category:'immobilier', pMin:8000000, pMax:20000000 },
  { name:'Local commercial Sandaga', category:'immobilier', pMin:10000000, pMax:30000000 },
  { name:'Moto Java', category:'vehicule', pMin:350000, pMax:500000 },
  { name:'Mercedes Classe C', category:'vehicule', pMin:8000000, pMax:15000000 },
  { name:'Toyota Hilux', category:'vehicule', pMin:15000000, pMax:25000000 },
  { name:'Minibus 18 places', category:'vehicule', pMin:8000000, pMax:12000000 },
  { name:'Dacia Logan', category:'vehicule', pMin:5000000, pMax:8000000 },
  { name:'Riz 50kg', category:'alimentaire', pMin:25000, pMax:40000 },
  { name:'Huile arachide 5L', category:'alimentaire', pMin:8000, pMax:15000 },
  { name:'Poisson fumé 10kg', category:'alimentaire', pMin:15000, pMax:30000 },
  { name:'Sucre 25kg', category:'alimentaire', pMin:18000, pMax:28000 },
  { name:'Lait en poudre', category:'alimentaire', pMin:5000, pMax:12000 },
  { name:'Ciment 50 sacs', category:'materiel', pMin:250000, pMax:350000 },
  { name:'Groupe électrogène', category:'materiel', pMin:200000, pMax:500000 },
  { name:'Fer à béton tonne', category:'materiel', pMin:350000, pMax:500000 },
  { name:'Parpaing 1000', category:'materiel', pMin:80000, pMax:150000 },
  { name:'Montre Rolex', category:'luxe', pMin:2000000, pMax:8000000 },
  { name:'iPhone 15 Pro', category:'luxe', pMin:600000, pMax:900000 },
  { name:'Costume italien', category:'luxe', pMin:100000, pMax:300000 },
  { name:'Sac Louis Vuitton', category:'luxe', pMin:500000, pMax:2000000 },
  { name:'Boubou brodé grand soir', category:'luxe', pMin:50000, pMax:200000 },
  { name:'Parfum Chanel N°5', category:'luxe', pMin:80000, pMax:150000 },
];

const SERVICES = [
  { name:'Transport Dakar-Thiès', category:'transport', pMin:3000, pMax:5000 },
  { name:'Transport marchandises Dakar-Kaolack', category:'transport', pMin:50000, pMax:200000 },
  { name:'Déménagement local', category:'transport', pMin:50000, pMax:150000 },
  { name:'Course en ville', category:'transport', pMin:1500, pMax:5000 },
  { name:'Construction maison R+1', category:'construction', pMin:5000000, pMax:20000000 },
  { name:'Maçonnerie', category:'construction', pMin:200000, pMax:500000 },
  { name:'Peinture bâtiment', category:'construction', pMin:100000, pMax:300000 },
  { name:'Carrelage', category:'construction', pMin:150000, pMax:400000 },
  { name:'Plomberie', category:'construction', pMin:50000, pMax:200000 },
  { name:'Réparation téléphone', category:'reparation', pMin:5000, pMax:30000 },
  { name:'Réparation climatisation', category:'reparation', pMin:25000, pMax:75000 },
  { name:'Réparation voiture', category:'reparation', pMin:20000, pMax:200000 },
  { name:'Réparation ordinateur', category:'reparation', pMin:10000, pMax:50000 },
  { name:'Conseil juridique', category:'conseil', pMin:50000, pMax:200000 },
  { name:'Comptabilité', category:'conseil', pMin:100000, pMax:500000 },
  { name:'Conseil en investissement', category:'conseil', pMin:75000, pMax:300000 },
  { name:'Formation couture', category:'formation', pMin:50000, pMax:200000 },
  { name:'Formation informatique', category:'formation', pMin:30000, pMax:100000 },
  { name:'Cours de langue', category:'formation', pMin:15000, pMax:50000 },
  { name:'Manoeuvre journalier', category:'main_d_oeuvre', pMin:5000, pMax:10000 },
  { name:'Couturier traditionnel', category:'main_d_oeuvre', pMin:15000, pMax:50000 },
  { name:'Cuisinier événementiel', category:'main_d_oeuvre', pMin:25000, pMax:75000 },
  { name:'Garde malade', category:'main_d_oeuvre', pMin:10000, pMax:25000 },
];

const ASSET_TEMPLATES = [
  { name:'Lingot or 10g', category:'or', pMin:350000, pMax:400000 },
  { name:'Bracelet or 18k', category:'or', pMin:150000, pMax:250000 },
  { name:'Chaîne or massif', category:'or', pMin:200000, pMax:350000 },
  { name:'Bague diamant 1ct', category:'diamant', pMin:500000, pMax:2000000 },
  { name:'Collier diamant', category:'diamant', pMin:1000000, pMax:5000000 },
  { name:'Terrain Diamniadio', category:'immobilier', pMin:5000000, pMax:15000000 },
  { name:'Villa Almadies', category:'immobilier', pMin:25000000, pMax:80000000 },
  { name:'Case Pikine', category:'immobilier', pMin:3000000, pMax:8000000 },
  { name:'Appartement Plateau', category:'immobilier', pMin:10000000, pMax:25000000 },
  { name:'Toyota Hilux', category:'vehicule', pMin:15000000, pMax:25000000 },
  { name:'Mercedes Classe C', category:'vehicule', pMin:8000000, pMax:15000000 },
  { name:'Moto Java', category:'vehicule', pMin:350000, pMax:500000 },
  { name:'Montre Rolex', category:'luxe', pMin:2000000, pMax:8000000 },
  { name:'iPhone 15 Pro', category:'luxe', pMin:600000, pMax:900000 },
  { name:'Sac Louis Vuitton', category:'luxe', pMin:500000, pMax:2000000 },
  { name:'Boubou brodé', category:'luxe', pMin:50000, pMax:200000 },
];

const FEED_TEMPLATES = [
  { type:'inscription', tf: n=>`${n} a rejoint Sama Économie !` },
  { type:'achat', tf: n=>`${n} vient d'acheter un bien sur le marché` },
  { type:'succes', tf: n=>`${n} a réussi son projet avec succès !` },
  { type:'pret', tf: n=>`${n} a obtenu un prêt pour son projet` },
  { type:'vente', tf: n=>`${n} vend un de ses biens au meilleur prix` },
  { type:'faillite', tf: n=>`${n} est en difficulté financière...` },
  { type:'challenge', tf: n=>`${n} a lancé un défi aux entrepreneurs` },
  { type:'boutique', tf: n=>`${n} a ouvert une nouvelle boutique` },
];

const DEMAND_TITLES = [
  'Cherche terrain à bâtir à Diamniadio',
  'Besoin de transport marchandises vers Kaolack',
  'Recherche maçon expérimenté pour construction',
  'Cherche fournisseur de ciment en gros',
  'Besoin d\'un mécanicien fiable',
  'Recherche climaticien pour installation',
  'Cherche coursier pour livraisons quotidiennes',
  'Besoin de matériel de pêche professionnel',
  'Recherche bailleur pour local commercial',
  'Cherche peintre pour ravalement façade',
  'Besoin d\'une Toyota Hilux d\'occasion',
  'Recherche grossiste en produits alimentaires',
  'Cherche électricien pour installation solaire',
  'Besoin de service de déménagement',
  'Recherche artisan bijoutier pour commande spéciale',
  'Cherche cuisinier pour mariage 200 personnes',
  'Besoin de 50 sacs de ciment urgemment',
  'Recherche chauffeur privé',
  'Cherche location de groupe électrogène',
  'Besoin d\'expert comptable pour bilan annuel',
  'Recherche fournisseur de tissu wax en gros',
  'Cherche carreleur pour 150m²',
  'Besoin de main d\'oeuvre pour récolte',
  'Recherche adjudicateur pour marché public',
  'Cherche partenaire pour projet agribusiness',
  'Besoin de formation en informatique',
  'Recherche imprimeur pour cartes de visite',
  'Cherche plombier urgently',
  'Besoin de location voiture pour une semaine',
  'Recherche tisseur de tapis traditionnels',
];

// ============================================================
// UTILITAIRES
// ============================================================

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  n = Math.min(n, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = rand(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// Insert par lots via Supabase REST API
async function batchInsert(table, items) {
  const BATCH = 100;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ❌ ${table} [${i}-${i+BATCH}]: ${error.message}`);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.error(`     ⚠️ Skipping duplicates...`);
        continue;
      }
      // Ne pas arrêter, continuer
    }
  }
}

// ============================================================
// GÉNÉRATION
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SAMA ÉCONOMIE — Génération de 300 agents IA');
  console.log('  Via Supabase REST API');
  console.log('═══════════════════════════════════════════════\n');

  // Test connexion
  const { data: testData, error: testError } = await supabase.from('User').select('id').limit(1);
  if (testError) {
    console.error('❌ Impossible de se connecter à Supabase:', testError.message);
    process.exit(1);
  }
  console.log('✅ Connecté à Supabase\n');

  // Vérifier s'il y a déjà des agents
  const { count: existingCount } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('is_agent', true);
  if (existingCount > 0) {
    console.log(`⚠️  ${existingCount} agents existent déjà. Suppression pour recréation...`);
    // Supprimer en cascade via le client
    await supabase.from('FeedComment').delete().in('postId', (await supabase.from('FeedPost').select('id').in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id))).data.map(p=>p.id));
    await supabase.from('Proposal').delete().in('fromUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('FeedLike').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('FeedComment').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Review').delete().in('fromUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Review').delete().in('toUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Demand').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Order').delete().in('buyerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Order').delete().in('sellerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('P2PLoan').delete().in('lenderId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('P2PLoan').delete().in('borrowerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Challenge').delete().in('fromUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Challenge').delete().in('toUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('ProfileView').delete().in('viewerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('ProfileView').delete().in('viewedId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Notification').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Transaction').delete().in('fromUserId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Service').delete().in('ownerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Product').delete().in('ownerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Shop').delete().in('ownerId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Asset').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('Loan').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('FeedPost').delete().in('userId', (await supabase.from('User').select('id').eq('is_agent', true)).data.map(u=>u.id));
    await supabase.from('User').delete().eq('is_agent', true);
    console.log('✅ Anciens agents supprimés\n');
  }

  // ---- Étape 1 : Générer les 300 agents ----
  console.log('📊 Génération des 300 agents...');
  const agents = [];
  const usedEmails = new Set();

  for (let i = 0; i < 300; i++) {
    const isFemale = Math.random() > 0.52;
    const firstName = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const loc = pick(LOCATIONS);

    let email;
    do {
      email = `${firstName.toLowerCase().replace(/\s/g,'')}.${lastName.toLowerCase()}${rand(1,999)}@agent.sama.sn`;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const r = Math.random();
    const personality = r < 0.40 ? 'econome' : r < 0.65 ? 'depensier' : r < 0.85 ? 'stratege' : 'fou';

    const cash = personality === 'econome' ? rand(100000, 5000000) :
                 personality === 'depensier' ? rand(0, 8000000) :
                 personality === 'stratege' ? rand(500000, 10000000) : rand(0, 12000000);

    const creditScore = personality === 'econome' ? rand(700, 1000) :
                        personality === 'stratege' ? rand(650, 950) :
                        personality === 'depensier' ? rand(400, 800) : rand(200, 700);

    const gamesPlayed = rand(1, 20);
    const gamesWon = personality === 'stratege' ? rand(1, gamesPlayed) :
                     personality === 'econome' ? rand(0, Math.floor(gamesPlayed * 0.7)) :
                     rand(0, Math.floor(gamesPlayed * 0.5));
    const gamesLost = gamesPlayed - gamesWon;
    const isBankrupt = personality === 'fou' && Math.random() < 0.15;

    agents.push({
      id: uuidv4(),
      name,
      email,
      password_hash: null,
      avatar: '/avatars/default.png',
      location: loc,
      bio: pick(BIOS),
      cash,
      type: 'player',
      is_agent: true,
      agent_personality: personality,
      credit_score: creditScore,
      total_profit: rand(0, personality === 'stratege' ? 5000000 : 2000000),
      total_spent: rand(100000, personality === 'depensier' ? 10000000 : 3000000),
      total_debt: rand(0, personality === 'fou' ? 5000000 : 1000000),
      games_played: gamesPlayed,
      games_won: gamesWon,
      games_lost: gamesLost,
      is_bankrupt: isBankrupt,
      profile_views: rand(0, 500),
      status: 'active',
    });
  }

  // ---- Étape 2 : Insérer les agents ----
  console.log('📊 Insertion des 300 agents...');
  await batchInsert('User', agents);
  const { count: agentCount } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('is_agent', true);
  console.log(`✅ ${agentCount} agents insérés\n`);

  // ---- Étape 3 : Boutiques, Produits, Services ----
  console.log('📊 Création des boutiques...');
  const shops = [];
  const products = [];
  const services = [];
  const shopIdMap = new Map();

  for (const agent of agents) {
    if (Math.random() < 0.65) {
      const shopId = uuidv4();
      shopIdMap.set(agent.id, shopId);

      shops.push({
        id: shopId,
        ownerId: agent.id,
        name: `${pick(SHOP_NAMES)} - ${agent.name.split(' ')[1] || ''}`.trim(),
        description: `Boutique de ${agent.name} à ${agent.location}`,
        category: pick(SHOP_CATEGORIES),
        location: agent.location,
        rating: randFloat(2.5, 5.0),
        review_count: rand(0, 50),
        sales_count: rand(0, 200),
        status: 'active',
      });

      for (const prod of pickN(PRODUCTS, rand(2, 6))) {
        products.push({
          id: uuidv4(),
          shopId,
          ownerId: agent.id,
          name: prod.name,
          description: `${prod.name} de qualité chez ${agent.name}`,
          category: prod.category,
          price: rand(prod.pMin, prod.pMax),
          stock: rand(1, 100),
          status: 'available',
        });
      }

      for (const serv of pickN(SERVICES, rand(1, 4))) {
        services.push({
          id: uuidv4(),
          shopId,
          ownerId: agent.id,
          name: serv.name,
          description: `Service professionnel ${serv.name} par ${agent.name}`,
          category: serv.category,
          price: rand(serv.pMin, serv.pMax),
          availability: Math.random() > 0.15 ? 'available' : 'unavailable',
        });
      }
    }
  }

  await batchInsert('Shop', shops);
  console.log(`✅ ${shops.length} boutiques insérées`);

  await batchInsert('Product', products);
  console.log(`✅ ${products.length} produits insérés`);

  await batchInsert('Service', services);
  console.log(`✅ ${services.length} services insérés\n`);

  // ---- Étape 4 : Prêts ----
  console.log('📊 Création des prêts...');
  const loans = [];
  for (const agent of pickN(agents, 120)) {
    const amount = rand(100000, 5000000);
    const interestRate = randFloat(2.0, 5.0);
    const totalDue = Math.round(amount * (1 + interestRate / 100));
    const months = rand(3, 24);
    const monthlyPayment = Math.round(totalDue / months);

    const r = Math.random();
    let status = 'active';
    let monthsRemaining = months;
    let remaining = totalDue;

    if (r < 0.30) {
      status = 'paid'; monthsRemaining = 0; remaining = 0;
    } else if (r < 0.40) {
      status = 'defaulted';
      monthsRemaining = rand(1, months);
      remaining = rand(Math.round(totalDue * 0.3), totalDue);
    } else {
      monthsRemaining = rand(1, months);
      remaining = rand(Math.round(monthlyPayment * monthsRemaining), totalDue);
    }

    const autoApproved = Math.random() > 0.3;

    loans.push({
      id: uuidv4(),
      userId: agent.id,
      amount,
      interest_rate: interestRate,
      total_due: totalDue,
      remaining,
      monthly_payment: monthlyPayment,
      months_remaining: monthsRemaining,
      status,
      auto_approved: autoApproved,
      admin_approved: autoApproved ? null : (Math.random() > 0.3),
    });
  }

  await batchInsert('Loan', loans);
  console.log(`✅ ${loans.length} prêts insérés\n`);

  // ---- Étape 5 : Actifs ----
  console.log('📊 Création des actifs...');
  const assets = [];
  for (const agent of agents) {
    let numAssets = 0;
    if (agent.agent_personality === 'depensier' || agent.agent_personality === 'fou') {
      numAssets = rand(1, 5);
    } else if (agent.agent_personality === 'stratege') {
      numAssets = rand(1, 4);
    } else if (agent.agent_personality === 'econome') {
      numAssets = Math.random() < 0.4 ? rand(1, 2) : 0;
    }

    for (const tpl of pickN(ASSET_TEMPLATES, numAssets)) {
      const purchasePrice = rand(tpl.pMin, tpl.pMax);
      const currentValue = Math.round(purchasePrice * (0.8 + Math.random() * 0.4));

      let details = {};
      if (tpl.category === 'immobilier') {
        details = { superficie: `${rand(50,500)}m²`, pieces: rand(1,8), etage: rand(0,5) };
      } else if (tpl.category === 'vehicule') {
        details = { annee: rand(2005,2025), kilometrage: `${rand(5000,200000)}km`, carburant: pick(['Essence','Diesel','Hybride']) };
      } else if (tpl.category === 'or') {
        details = { grammes: pick([5,10,25,50,100]), carat: pick([18,21,22,24]) };
      }

      assets.push({
        id: uuidv4(),
        userId: agent.id,
        name: tpl.name,
        category: tpl.category,
        description: `${tpl.name} - patrimoine de ${agent.name}`,
        purchase_price: purchasePrice,
        current_value: currentValue,
        details,
        status: Math.random() > 0.05 ? 'owned' : 'seized',
      });
    }
  }

  await batchInsert('Asset', assets);
  console.log(`✅ ${assets.length} actifs insérés\n`);

  // ---- Étape 6 : Feed posts ----
  console.log('📊 Création du feed...');
  const feedPosts = [];
  for (const agent of pickN(agents, 80)) {
    const ft = pick(FEED_TEMPLATES);
    let description;
    switch (ft.type) {
      case 'inscription': description = 'Un nouvel entrepreneur rejoint la communauté !'; break;
      case 'achat': description = pick(['Achat effectué sur le marché.','Nouvel investissement.','Opération réussie.']); break;
      case 'succes': description = pick(['Projet rentable !','Objectif atteint !','Belle performance.']); break;
      case 'pret': description = 'Prêt approuvé pour une nouvelle activité.'; break;
      case 'vente': description = pick(['Bien vendu avec plus-value.','Transaction fructueuse.']); break;
      case 'faillite': description = 'Difficultés à rembourser. Situation critique.'; break;
      case 'challenge': description = 'Qui sera le meilleur ? Relevez le défi !'; break;
      case 'boutique': description = 'Nouvelle boutique sur la plateforme !'; break;
      default: description = 'Activité sur la plateforme.';
    }

    feedPosts.push({
      id: uuidv4(),
      userId: agent.id,
      type: ft.type,
      title: ft.tf(agent.name),
      description,
      likes: rand(0, 50),
      comments: rand(0, 20),
    });
  }

  await batchInsert('FeedPost', feedPosts);
  console.log(`✅ ${feedPosts.length} posts feed insérés\n`);

  // ---- Étape 7 : Demandes ----
  console.log('📊 Création des demandes...');
  const demands = [];
  for (const agent of pickN(agents, 50)) {
    demands.push({
      id: uuidv4(),
      userId: agent.id,
      title: pick(DEMAND_TITLES),
      description: 'Je recherche ce service/produit. Contactez-moi si intéressé.',
      category: pick(['produit', 'service', 'emploi', 'partenariat']),
      budget: rand(50000, 5000000),
      status: pick(['open', 'open', 'open', 'in_progress', 'closed']),
      responses_count: rand(0, 15),
    });
  }

  await batchInsert('Demand', demands);
  console.log(`✅ ${demands.length} demandes insérées\n`);

  // ---- Étape 8 : Propositions ----
  console.log('📊 Création des propositions...');
  const proposals = [];
  for (let i = 0; i < Math.min(30, demands.length); i++) {
    const demand = demands[i];
    if (!demand) continue;
    const otherAgents = agents.filter(a => a.id !== demand.userId);
    for (const proposer of pickN(otherAgents, rand(1, 4))) {
      proposals.push({
        id: uuidv4(),
        demandId: demand.id,
        fromUserId: proposer.id,
        price: rand(25000, 3000000),
        message: 'Bonjour, je propose ce service à ce prix. Contactez-moi pour discuter.',
        status: pick(['pending', 'pending', 'accepted', 'rejected']),
      });
    }
  }

  await batchInsert('Proposal', proposals);
  console.log(`✅ ${proposals.length} propositions insérées\n`);

  // ---- Étape 9 : Commentaires ----
  console.log('📊 Création des commentaires...');
  const COMMENTS = [
    'Trop bien ! Continue comme ça',
    'Bonne chance pour ton projet !',
    'Intéressant, je vais suivre ça de près.',
    'Conseil : pense bien à ton étude de marché.',
    'J\'ai fait pareil et j\'ai réussi !',
    'Attention aux dépenses imprévues...',
    'Tu devrais aller voir sur le marché.',
    'Que Dieu t\'aide dans ton business.',
    'Je peux te proposer mes services.',
    'Tu gères ! Un vrai entrepreneur.',
  ];
  const comments = [];
  for (const post of pickN(feedPosts, 60)) {
    const commenter = pick(agents.filter(a => a.id !== post.userId));
    comments.push({
      id: uuidv4(),
      postId: post.id,
      userId: commenter.id,
      content: pick(COMMENTS),
    });
  }

  await batchInsert('FeedComment', comments);
  console.log(`✅ ${comments.length} commentaires insérés\n`);

  // ---- Étape 10 : Reviews ----
  console.log('📊 Création des avis...');
  const reviews = [];
  for (let i = 0; i < 80; i++) {
    const fromAgent = pick(agents);
    const toAgent = pick(agents.filter(a => a.id !== fromAgent.id));
    reviews.push({
      id: uuidv4(),
      fromUserId: fromAgent.id,
      toUserId: toAgent.id,
      rating: rand(1, 5),
      comment: pick([
        'Très bon partenaire, fiable et ponctuel.',
        'Service correct, rien à redire.',
        'Pas satisfait du délai de livraison.',
        'Excellent rapport qualité-prix.',
        'Je recommande vivement !',
        'Professionnel et sérieux.',
        'Un peu cher mais la qualité est là.',
        'Bonne communication tout au long.',
        'Service médiocre, je ne recommande pas.',
        'Un vrai homme/femme d\'affaires !',
      ]),
    });
  }

  await batchInsert('Review', reviews);
  console.log(`✅ ${reviews.length} avis insérés\n`);

  // ---- Étape 11 : Transactions ----
  console.log('📊 Création des transactions...');
  const transactions = [];
  const TRANS_TYPES = ['pret', 'remboursement', 'achat', 'vente', 'transfert', 'don'];
  for (const agent of pickN(agents, 200)) {
    for (let j = 0; j < rand(1, 5); j++) {
      const type = pick(TRANS_TYPES);
      const otherAgent = pick(agents.filter(a => a.id !== agent.id));
      const amount = type === 'pret' || type === 'achat' ? rand(50000, 5000000) :
                     type === 'remboursement' ? rand(25000, 500000) :
                     type === 'don' ? rand(5000, 100000) :
                     rand(10000, 1000000);

      transactions.push({
        id: uuidv4(),
        fromUserId: type === 'vente' || type === 'don' ? agent.id : otherAgent.id,
        toUserId: type === 'pret' || type === 'remboursement' ? agent.id : otherAgent.id,
        amount,
        type,
        description: type === 'pret' ? 'Prêt bancaire' :
                     type === 'remboursement' ? 'Remboursement mensuel' :
                     type === 'achat' ? 'Achat sur le marché' :
                     type === 'vente' ? 'Vente de bien' :
                     type === 'don' ? 'Don entre joueurs' :
                     'Transfert de fonds',
      });
    }
  }

  await batchInsert('Transaction', transactions);
  console.log(`✅ ${transactions.length} transactions insérées\n`);

  // ---- Résumé final ----
  const [agentsRes, shopsRes, prodsRes, servsRes, loansRes, assetsRes, feedRes, demRes, propRes, commRes, revRes, transRes] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }).eq('is_agent', true),
    supabase.from('Shop').select('*', { count: 'exact', head: true }),
    supabase.from('Product').select('*', { count: 'exact', head: true }),
    supabase.from('Service').select('*', { count: 'exact', head: true }),
    supabase.from('Loan').select('*', { count: 'exact', head: true }),
    supabase.from('Asset').select('*', { count: 'exact', head: true }),
    supabase.from('FeedPost').select('*', { count: 'exact', head: true }),
    supabase.from('Demand').select('*', { count: 'exact', head: true }),
    supabase.from('Proposal').select('*', { count: 'exact', head: true }),
    supabase.from('FeedComment').select('*', { count: 'exact', head: true }),
    supabase.from('Review').select('*', { count: 'exact', head: true }),
    supabase.from('Transaction').select('*', { count: 'exact', head: true }),
  ]);

  console.log('═══════════════════════════════════════════════');
  console.log('  ✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════');
  console.log(`  🤖 Agents IA        : ${agentsRes.count}`);
  console.log(`  🏪 Boutiques         : ${shopsRes.count}`);
  console.log(`  📦 Produits          : ${prodsRes.count}`);
  console.log(`  🔧 Services          : ${servsRes.count}`);
  console.log(`  💰 Prêts             : ${loansRes.count}`);
  console.log(`  🏠 Actifs            : ${assetsRes.count}`);
  console.log(`  📰 Posts Feed        : ${feedRes.count}`);
  console.log(`  📋 Demandes          : ${demRes.count}`);
  console.log(`  💬 Propositions      : ${propRes.count}`);
  console.log(`  💬 Commentaires      : ${commRes.count}`);
  console.log(`  ⭐ Avis              : ${revRes.count}`);
  console.log(`  💳 Transactions      : ${transRes.count}`);
  console.log('═══════════════════════════════════════════════\n');

  // Distribution par personnalité
  const { data: persStats } = await supabase.from('User')
    .select('agent_personality')
    .eq('is_agent', true);

  const persCount = {};
  for (const p of persStats) {
    persCount[p.agent_personality] = (persCount[p.agent_personality] || 0) + 1;
  }
  console.log('📊 Distribution par personnalité :');
  for (const [pers, count] of Object.entries(persCount).sort((a,b) => b[1] - a[1])) {
    const pct = ((count / 300) * 100).toFixed(1);
    console.log(`   ${pers.padEnd(12)} : ${String(count).padStart(4)} agents (${pct}%)`);
  }

  console.log('\n✨ Les 300 agents IA sont prêts à animer la plateforme !');
}

main().catch(e => {
  console.error('❌ ERREUR FATALE:', e.message);
  if (process.env.DEBUG) console.error(e);
  process.exit(1);
});
