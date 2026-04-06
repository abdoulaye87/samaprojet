// ============================================================
// SAMA ÉCONOMIE V2 — Génération de 300 agents IA sénégalais
// + boutiques, produits, services, feed posts
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qcocpqzynlwmezajcwhf.supabase.co';
const supabaseAnonKey = 'sb_publishable_nFkrdnm1igkiHHHgb4gNsg_4qBdWtwX';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FIRST_NAMES_M = [
  'Abdoulaye','Moussa','Ibrahima','Ousmane','Mamadou','Pape','Cheikh',
  'Mbaye','Seydou','Boubacar','Amadou','Idrissa','Birame','Mouhamadou',
  'El Hadj','Serigne','Modou','Lamine','Daouda','Yaya','Souleymane',
  'Aliou','Babacar','Thierno','Oumar','Falilou','Mamadou Lamine',
  'Samba','Moustapha','Djibril','Mansour','Bouna','Salif','Malick','Pate',
];

const FIRST_NAMES_F = [
  'Fatou','Aminata','Mariama','Awa','Khady','Ndèye','Coumba',
  'Dieynaba','Sokhna','Rokhaya','Yacine','Adama','Bineta','Oulimata',
  'Ndeye','Aissatou','Maimouna','Djénéba','Kine','Mariétou',
  'Astou','Thioro','Safiétou','Nafi','Daba','Coly','Gnilane',
  'Fama','Hawa','Oumy','Ramata','Siga','Mbegue',
];

const LAST_NAMES = [
  'Diop','Ndiaye','Sow','Fall','Dia','Ba','Sy','Mbaye','Gueye',
  'Kane','Diallo','Seck','Diouf','Niang','Pouye','Sarr','Thiam',
  'Mboup','Wade','Guissé','Cissé','Traoré','Tall','Aidara',
  'Senghor','Dieng','Camara','Ly','Faye','Badji','Sakho',
  'Dembélé','Konaté','Hane','Diedhiou','Sonko','Diatta',
  'Sané','Sambou','Coly','Tendeng','Gomis','Ndong','Mané',
];

const LOCATIONS = [
  'Dakar','Pikine','Guédiawaye','Rufisque','Thiès','Saint-Louis',
  'Kaolack','Ziguinchor','Tambacounda','Kolda','Diourbel','Louga',
  'Diamniadio','Mbao','Parcelles Assainies','Médina','Sandaga','Plateau',
  'Grand Yoff','Liberté','Sacr-Coeur','Mermoz','Almadies','Fann','Ngor',
];

const BIOS = [
  'Entrepreneur passionné, toujours en quête de nouvelles opportunités.',
  'Commerçant depuis 10 ans au marché Sandaga.',
  'Fondateur d\'une PME dans le transport.',
  'Investisseur dans l\'immobilier à Diamniadio.',
  'Eleveur dans la région de Thiès.',
  'Femme d\'affaires dans le commerce de détail.',
  'Expert en agriculture irriguée.',
  'Propriétaire d\'un cyber café à Pikine.',
  'Artisan bijoutier.',
  'Transporteur inter-villes.',
  'Fournisseur de matériel de construction.',
  'Négociant en produits alimentaires.',
  'Gérant de boutique de téléphones.',
  'Restaurateur à Médina.',
  'Commerçant d\'or et bijoux.',
  'Marchand de tissus.',
  'Tailleur de haute couture.',
  'Mécanicien auto.',
  'Eleveur de volailles.',
  'Peintre en bâtiment.',
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
  'Parfumerie Luxe','Librairie du Savoir',
];

const PRODUCTS = [
  { name:'Lingot or 10g', category:'or', pMin:350000, pMax:400000 },
  { name:'Lingot or 50g', category:'or', pMin:1500000, pMax:1800000 },
  { name:'Bracelet or 18k', category:'or', pMin:150000, pMax:250000 },
  { name:'Chaîne or massif', category:'or', pMin:200000, pMax:350000 },
  { name:'Bague diamant', category:'diamant', pMin:500000, pMax:2000000 },
  { name:'Collier diamant', category:'diamant', pMin:1000000, pMax:5000000 },
  { name:'Terrain 200m² Diamniadio', category:'immobilier', pMin:5000000, pMax:15000000 },
  { name:'Case 3 pièces Pikine', category:'immobilier', pMin:3000000, pMax:8000000 },
  { name:'Villa 5 pièces Almadies', category:'immobilier', pMin:25000000, pMax:80000000 },
  { name:'Moto Java', category:'vehicule', pMin:350000, pMax:500000 },
  { name:'Mercedes Classe C', category:'vehicule', pMin:8000000, pMax:15000000 },
  { name:'Toyota Hilux', category:'vehicule', pMin:15000000, pMax:25000000 },
  { name:'Minibus 18 places', category:'vehicule', pMin:8000000, pMax:12000000 },
  { name:'Riz 50kg', category:'alimentaire', pMin:25000, pMax:40000 },
  { name:'Huile arachide 5L', category:'alimentaire', pMin:8000, pMax:15000 },
  { name:'Poisson fumé 10kg', category:'alimentaire', pMin:15000, pMax:30000 },
  { name:'Ciment 50 sacs', category:'materiel', pMin:250000, pMax:350000 },
  { name:'Groupe électrogène', category:'materiel', pMin:200000, pMax:500000 },
  { name:'Montre Rolex', category:'luxe', pMin:2000000, pMax:8000000 },
  { name:'iPhone 15 Pro', category:'luxe', pMin:600000, pMax:900000 },
  { name:'Costume italien', category:'luxe', pMin:100000, pMax:300000 },
  { name:'Sac Louis Vuitton', category:'luxe', pMin:500000, pMax:2000000 },
  { name:'Boubou brodé', category:'luxe', pMin:50000, pMax:200000 },
];

const SERVICES = [
  { name:'Transport Dakar-Thiès', category:'transport', pMin:3000, pMax:5000 },
  { name:'Transport marchandises', category:'transport', pMin:50000, pMax:200000 },
  { name:'Déménagement local', category:'transport', pMin:50000, pMax:150000 },
  { name:'Construction maison', category:'construction', pMin:3000000, pMax:15000000 },
  { name:'Maçonnerie', category:'construction', pMin:200000, pMax:500000 },
  { name:'Peinture bâtiment', category:'construction', pMin:100000, pMax:300000 },
  { name:'Réparation téléphone', category:'reparation', pMin:5000, pMax:30000 },
  { name:'Réparation climatisation', category:'reparation', pMin:25000, pMax:75000 },
  { name:'Réparation voiture', category:'reparation', pMin:20000, pMax:200000 },
  { name:'Conseil juridique', category:'conseil', pMin:50000, pMax:200000 },
  { name:'Comptabilité', category:'conseil', pMin:100000, pMax:500000 },
  { name:'Formation couture', category:'formation', pMin:50000, pMax:200000 },
  { name:'Manoeuvre journalier', category:'main_d_oeuvre', pMin:5000, pMax:10000 },
  { name:'Couturier', category:'main_d_oeuvre', pMin:15000, pMax:50000 },
];

function rand(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr) { return arr[rand(0,arr.length-1)]; }
function pickN(arr,n) { return [...arr].sort(()=>0.5-Math.random()).slice(0,n); }
function uuid() { return 'a1'+Array.from({length:30},()=>'0123456789abcdef'[rand(0,15)]).join(''); }

async function main() {
  console.log('=== GÉNÉRATION 300 AGENTS IA ===\n');

  const agents = [], shops = [], prods = [], servs = [], feeds = [];

  for (let i = 0; i < 300; i++) {
    const f = Math.random() > 0.5;
    const fn = f ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const ln = pick(LAST_NAMES);
    const name = `${fn} ${ln}`;
    const loc = pick(LOCATIONS).trim();

    const r = Math.random();
    const pers = r < 0.40 ? 'econome' : r < 0.65 ? 'depensier' : r < 0.85 ? 'stratege' : 'fou';

    const cash = pers === 'econome' ? rand(100000,5000000) :
                 pers === 'depensier' ? rand(0,8000000) :
                 pers === 'stratege' ? rand(500000,10000000) : rand(0,12000000);

    const cs = pers === 'econome' ? rand(700,1000) : pers === 'stratege' ? rand(650,950) :
               pers === 'depensier' ? rand(400,800) : rand(200,700);

    const gp = rand(1,15);
    const gw = pers === 'stratege' ? rand(1,gp) : rand(0,Math.floor(gp*0.6));

    agents.push({
      id: uuid(), name, email: null, cash, type: 'player',
      is_agent: true, agent_personality: pers,
      avatar: null, location: loc, bio: pick(BIOS),
      credit_score: cs,
      total_profit: rand(0, pers==='stratege'?5000000:2000000),
      total_spent: rand(100000, pers==='depensier'?10000000:3000000),
      total_debt: rand(0, pers==='fou'?5000000:1000000),
      games_played: gp, games_won: gw, games_lost: gp-gw,
      is_bankrupt: false, profile_views: rand(0,500), status: 'active',
    });

    if (Math.random() < 0.60) {
      const sid = uuid();
      shops.push({
        id: sid, owner_id: agents[i].id,
        name: pick(SHOP_NAMES),
        description: `Boutique de ${name} à ${loc}`,
        category: pick(['boutique','entreprise','commerce','service']),
        location: loc,
        rating: parseFloat((Math.random()*2+3).toFixed(1)),
        review_count: rand(0,50), sales_count: rand(0,200), status: 'active',
      });

      for (const p of pickN(PRODUCTS, rand(2,6))) {
        prods.push({
          id: uuid(), shop_id: sid, owner_id: agents[i].id,
          name: p.name, description: `${p.name} chez ${name}`,
          category: p.category, price: rand(p.pMin,p.pMax),
          stock: rand(1,100), status: 'available',
        });
      }

      for (const s of pickN(SERVICES, rand(1,4))) {
        servs.push({
          id: uuid(), shop_id: sid, owner_id: agents[i].id,
          name: s.name, description: `Service ${s.name} par ${name}`,
          category: s.category, price: rand(s.pMin,s.pMax),
          availability: Math.random()>0.1?'available':'unavailable',
        });
      }
    }
  }

  // Feed posts
  const FT = [
    { type:'inscription', tf: n=>`${n} a rejoint Sama Économie !` },
    { type:'achat', tf: n=>`${n} vient d'acheter un bien` },
    { type:'succes', tf: n=>`${n} a réussi son projet !` },
    { type:'faillite', tf: n=>`${n} est en difficulté financière` },
    { type:'pret', tf: n=>`${n} a obtenu un prêt` },
    { type:'vente', tf: n=>`${n} vend un de ses biens` },
  ];

  for (const ag of pickN(agents, 50)) {
    const ft = pick(FT);
    feeds.push({
      id: uuid(), user_id: ag.id, type: ft.type,
      title: ft.tf(ag.name),
      description: ft.type==='faillite'?'Des difficultés à rembourser.':'Activité sur la plateforme.',
      likes: rand(0,45), comments: rand(0,15),
    });
  }

  console.log(`Agents: ${agents.length} | Boutiques: ${shops.length}`);
  console.log(`Produits: ${prods.length} | Services: ${servs.length} | Feed: ${feeds.length}\n`);

  // Insert in batches
  async function batch(table, items, map) {
    for (let i = 0; i < items.length; i += 50) {
      const b = items.slice(i, i+50);
      const { error } = await supabase.from(table).insert(b.map(map));
      if (error) console.error(`  ❌ ${table} [${i}]: ${error.message}`);
      else console.log(`  ✅ ${table} ${i+1}-${Math.min(i+50,items.length)}`);
    }
  }

  await batch('User', agents, a=>a);
  await batch('Shop', shops, s=>({id:s.id,ownerId:s.owner_id,name:s.name,description:s.description,category:s.category,location:s.location,rating:s.rating,review_count:s.review_count,sales_count:s.sales_count,status:s.status}));
  await batch('Product', prods, p=>({id:p.id,shopId:p.shop_id,ownerId:p.owner_id,name:p.name,description:p.description,category:p.category,price:p.price,stock:p.stock,status:p.status}));
  await batch('Service', servs, s=>({id:s.id,shopId:s.shop_id,ownerId:s.owner_id,name:s.name,description:s.description,category:s.category,price:s.price,availability:s.availability}));
  await batch('FeedPost', feeds, f=>({id:f.id,userId:f.user_id,type:f.type,title:f.title,description:f.description,likes:f.likes,comments:f.comments}));

  console.log('\n✅ TERMINÉ ! 300 agents + écosystème créés.');
}

main().catch(e=>{console.error('ERREUR:',e);process.exit(1)});
