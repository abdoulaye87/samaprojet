import { db } from '@/lib/db';

// ============================================
// Seed Database — initialiser les données si vides
// ============================================
export async function seedDatabase() {
  const agentCount = await db.agent.count();

  if (agentCount > 0) {
    return { message: 'Base de données déjà initialisée.', alreadySeeded: true };
  }

  // Créer les agents initiaux
  const agents = await db.agent.createMany({
    data: [
      { prenom: 'Aminata', balance: 2500.00, dette: 0.00 },
      { prenom: 'Moussa', balance: 1800.00, dette: 500.00 },
      { prenom: 'Fatou', balance: 3200.00, dette: 0.00 },
      { prenom: 'Ibrahima', balance: 900.00, dette: 1200.00 },
      { prenom: 'Rokhaya', balance: 4100.00, dette: 200.00 },
    ],
  });

  // Récupérer les IDs des agents pour créer les prêts
  const allAgents = await db.agent.findMany();

  // Créer les prêts initiaux pour Moussa, Ibrahima et Rokhaya
  const moussa = allAgents.find((a) => a.prenom === 'Moussa');
  const ibrahima = allAgents.find((a) => a.prenom === 'Ibrahima');
  const rokhaya = allAgents.find((a) => a.prenom === 'Rokhaya');

  if (moussa) {
    await db.loan.create({
      data: {
        agentId: moussa.id,
        montant: 500.00,
        tauxInteret: 0.02,
        statut: 'en cours',
      },
    });
  }

  if (ibrahima) {
    await db.loan.create({
      data: {
        agentId: ibrahima.id,
        montant: 1200.00,
        tauxInteret: 0.02,
        statut: 'en cours',
      },
    });
  }

  if (rokhaya) {
    await db.loan.create({
      data: {
        agentId: rokhaya.id,
        montant: 200.00,
        tauxInteret: 0.02,
        statut: 'en cours',
      },
    });
  }

  // Créer les produits du marché
  await db.marketItem.createMany({
    data: [
      { produit: 'Riz', prix: 500.00, prixBase: 500.00 },
      { produit: 'Huile', prix: 800.00, prixBase: 800.00 },
      { produit: 'Ciment', prix: 3000.00, prixBase: 3000.00 },
      { produit: 'Farine', prix: 400.00, prixBase: 400.00 },
      { produit: 'Sucre', prix: 600.00, prixBase: 600.00 },
    ],
  });

  // Créer l'état initial de l'économie
  await db.economy.upsert({
    where: { id: 1 },
    update: {},
    create: {
      periode: 1,
      inflationCumul: 0.00,
      inflationRate: 0.02,
    },
  });

  // Journal d'événement initial
  await db.eventLog.create({
    data: {
      message: '🎮 Simulation économique initialisée — 5 agents, 5 produits, période 1',
      type: 'info',
      periode: 1,
    },
  });

  return {
    message: 'Base de données initialisée avec succès !',
    agents: agents.count,
    alreadySeeded: false,
  };
}

// ============================================
// Appliquer l'Inflation
// ============================================
export async function applyInflation() {
  const economy = await db.economy.findUnique({ where: { id: 1 } });
  if (!economy) throw new Error('Économie non trouvée');

  const rate = economy.inflationRate;
  const newPeriode = economy.periode + 1;
  const newInflationCumul = economy.inflationCumul + rate;

  // Augmenter les prix du marché
  const marketItems = await db.marketItem.findMany();
  const priceUpdates = marketItems.map((item) => ({
    id: item.id,
    ancienPrix: Number(item.prix.toFixed(2)),
    nouveauPrix: Number((item.prix * (1 + rate)).toFixed(2)),
  }));

  await db.marketItem.updateMany({
    data: { updatedAt: new Date() },
  });

  for (const item of marketItems) {
    await db.marketItem.update({
      where: { id: item.id },
      data: {
        prix: Number((item.prix * (1 + rate)).toFixed(2)),
        updatedAt: new Date(),
      },
    });
  }

  // Appliquer les intérêts sur les prêts en cours
  const activeLoans = await db.loan.findMany({ where: { statut: 'en cours' } });
  const loanUpdates: { agentPrenom: string; ancienMontant: number; nouveauMontant: number }[] = [];

  for (const loan of activeLoans) {
    const ancienMontant = Number(loan.montant.toFixed(2));
    const nouveauMontant = Number((loan.montant * (1 + loan.tauxInteret)).toFixed(2));

    await db.loan.update({
      where: { id: loan.id },
      data: { montant: nouveauMontant },
    });

    const agent = await db.agent.findUnique({ where: { id: loan.agentId } });
    loanUpdates.push({
      agentPrenom: agent?.prenom || 'Inconnu',
      ancienMontant,
      nouveauMontant,
    });
  }

  // Recalculer les dettes des agents à partir des prêts actifs
  const agents = await db.agent.findMany({
    include: { loans: { where: { statut: 'en cours' } } },
  });

  for (const agent of agents) {
    const totalDette = agent.loans.reduce((sum, loan) => sum + loan.montant, 0);
    await db.agent.update({
      where: { id: agent.id },
      data: { dette: Number(totalDette.toFixed(2)) },
    });
  }

  // Mettre à jour l'économie
  const updatedEconomy = await db.economy.update({
    where: { id: 1 },
    data: {
      periode: newPeriode,
      inflationCumul: Number(newInflationCumul.toFixed(4)),
      updatedAt: new Date(),
    },
  });

  // Journaliser
  await db.eventLog.create({
    data: {
      message: `📈 Inflation appliquée — Taux: ${(rate * 100).toFixed(1)}%, Période: ${newPeriode}, Inflation cumulée: ${(newInflationCumul * 100).toFixed(2)}%`,
      type: 'inflation',
      periode: newPeriode,
    },
  });

  return {
    economy: formatEconomy(updatedEconomy),
    priceUpdates,
    loanUpdates,
  };
}

// ============================================
// Appliquer les Intérêts
// ============================================
export async function applyInterests() {
  const economy = await db.economy.findUnique({ where: { id: 1 } });
  if (!economy) throw new Error('Économie non trouvée');

  const activeLoans = await db.loan.findMany({ where: { statut: 'en cours' } });
  const results: { loanId: number; agentPrenom: string; ancienMontant: number; nouveauMontant: number; taux: number }[] = [];

  for (const loan of activeLoans) {
    const ancienMontant = Number(loan.montant.toFixed(2));
    const nouveauMontant = Number((loan.montant * (1 + loan.tauxInteret)).toFixed(2));

    const updatedLoan = await db.loan.update({
      where: { id: loan.id },
      data: { montant: nouveauMontant },
    });

    const agent = await db.agent.findUnique({ where: { id: loan.agentId } });
    results.push({
      loanId: updatedLoan.id,
      agentPrenom: agent?.prenom || 'Inconnu',
      ancienMontant,
      nouveauMontant,
      taux: loan.tauxInteret,
    });
  }

  // Recalculer les dettes des agents
  const agents = await db.agent.findMany({
    include: { loans: { where: { statut: 'en cours' } } },
  });

  for (const agent of agents) {
    const totalDette = agent.loans.reduce((sum, loan) => sum + loan.montant, 0);
    await db.agent.update({
      where: { id: agent.id },
      data: { dette: Number(totalDette.toFixed(2)) },
    });
  }

  // Journaliser
  await db.eventLog.create({
    data: {
      message: `💰 Intérêts appliqués sur ${results.length} prêt(s) actif(s)`,
      type: 'info',
      periode: economy.periode,
    },
  });

  return { results };
}

// ============================================
// Crash Économique
// ============================================
export async function crashEconomy() {
  const economy = await db.economy.findUnique({ where: { id: 1 } });
  if (!economy) throw new Error('Économie non trouvée');

  // Appliquer une perte aléatoire de 0 à 50% sur chaque agent
  const agents = await db.agent.findMany();
  const agentResults: { prenom: string; soldeAvant: number; pertePct: number; soldeApres: number }[] = [];

  for (const agent of agents) {
    const soldeAvant = Number(agent.balance.toFixed(2));
    const pertePct = Number((Math.random() * 50).toFixed(1));
    const soldeApres = Number((agent.balance * (1 - pertePct / 100)).toFixed(2));

    await db.agent.update({
      where: { id: agent.id },
      data: { balance: soldeApres },
    });

    agentResults.push({ prenom: agent.prenom, soldeAvant, pertePct, soldeApres });
  }

  // Perturber les prix du marché (entre 70% et 100% du prix actuel)
  const marketItems = await db.marketItem.findMany();
  const priceResults: { produit: string; prixAvant: number; prixApres: number }[] = [];

  for (const item of marketItems) {
    const prixAvant = Number(item.prix.toFixed(2));
    const factor = 0.70 + Math.random() * 0.30;
    const prixApres = Number((item.prix * factor).toFixed(2));

    await db.marketItem.update({
      where: { id: item.id },
      data: { prix: prixApres, updatedAt: new Date() },
    });

    priceResults.push({ produit: item.produit, prixAvant, prixApres });
  }

  // Journaliser le crash
  const totalLoss = agentResults.reduce((sum, a) => sum + (a.soldeAvant - a.soldeApres), 0);
  await db.eventLog.create({
    data: {
      message: `💥 CRASH ÉCONOMIQUE ! Perte totale: ${totalLoss.toFixed(2)}F — ${agentResults.length} agents affectés, ${priceResults.length} produits perturbés`,
      type: 'crash',
      periode: economy.periode,
    },
  });

  return { agentResults, priceResults, totalLoss: Number(totalLoss.toFixed(2)) };
}

// ============================================
// Dashboard Data — agrégation complète
// ============================================
export async function getDashboardData() {
  const [agents, market, economy, logs] = await Promise.all([
    db.agent.findMany({
      orderBy: { createdAt: 'asc' },
      include: { loans: true },
    }),
    db.marketItem.findMany({ orderBy: { produit: 'asc' } }),
    db.economy.findUnique({ where: { id: 1 } }),
    db.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const totalRichesse = agents.reduce((sum, a) => sum + a.balance, 0);
  const totalDette = agents.reduce((sum, a) => sum + a.dette, 0);

  return {
    agents: agents.map((a) => ({
      ...a,
      balance: Number(a.balance.toFixed(2)),
      dette: Number(a.dette.toFixed(2)),
      investissementTotal: Number(a.investissementTotal.toFixed(2)),
    })),
    market: market.map((m) => ({
      ...m,
      prix: Number(m.prix.toFixed(2)),
      prixBase: Number(m.prixBase.toFixed(2)),
    })),
    economy: economy ? formatEconomy(economy) : null,
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    totalRichesse: Number(totalRichesse.toFixed(2)),
    totalDette: Number(totalDette.toFixed(2)),
  };
}

// ============================================
// Helpers
// ============================================
function formatEconomy(economy: { id: number; periode: number; inflationCumul: number; inflationRate: number; updatedAt: Date }) {
  return {
    id: economy.id,
    periode: economy.periode,
    inflationCumul: Number(economy.inflationCumul.toFixed(4)),
    inflationRate: Number(economy.inflationRate.toFixed(4)),
    updatedAt: economy.updatedAt.toISOString(),
  };
}
