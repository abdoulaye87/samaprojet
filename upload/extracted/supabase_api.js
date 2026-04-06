// ============================================
// supabaseClient.js — Configuration Supabase
// ============================================
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://VOTRE_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ============================================
// api.js — Toutes les fonctions API GLM5
// ============================================

import { supabase } from './supabaseClient';

// ---------- AGENTS ----------

export async function getAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAgent(prenom, balance = 1000) {
  const { data, error } = await supabase
    .from('agents')
    .insert([{ prenom, balance }])
    .select()
    .single();
  if (error) throw error;

  await addLog(`Agent "${prenom}" créé avec ${balance} F`, 'creation');
  return data;
}

export async function updateAgent(id, updates) {
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAgent(id) {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---------- TRANSACTIONS ----------

export async function getTransactions(agentId = null) {
  let query = supabase
    .from('transactions')
    .select('*, agents(prenom)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (agentId) query = query.eq('agent_id', agentId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function receiveMonney(agentId, montant) {
  const agent = await getAgent(agentId);
  await updateAgent(agentId, { balance: agent.balance + montant });

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ agent_id: agentId, type: 'depot', montant, description: 'Réception d\'argent' }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function buyProduct(agentId, produit) {
  const agent = await getAgent(agentId);
  const product = await getProduct(produit);

  if (agent.balance < product.prix) throw new Error('Solde insuffisant');

  await updateAgent(agentId, {
    balance: agent.balance - product.prix,
    investissement_total: agent.investissement_total + product.prix,
  });

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      agent_id: agentId,
      type: 'achat',
      montant: product.prix,
      description: `Achat: ${product.produit}`,
    }])
    .select().single();
  if (error) throw error;

  await addLog(`${agent.prenom} a acheté ${product.produit} pour ${product.prix} F`, 'achat');
  return data;
}

export async function sellProduct(agentId, produit) {
  const agent = await getAgent(agentId);
  const product = await getProduct(produit);

  await updateAgent(agentId, {
    balance: agent.balance + product.prix,
    investissement_total: Math.max(0, agent.investissement_total - product.prix * 0.8),
  });

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      agent_id: agentId,
      type: 'vente',
      montant: product.prix,
      description: `Vente: ${product.produit}`,
    }])
    .select().single();
  if (error) throw error;

  await addLog(`${agent.prenom} a vendu ${product.produit} pour ${product.prix} F`, 'vente');
  return data;
}

// ---------- PRÊTS ----------

export async function requestLoan(agentId, montant, taux = 0.02) {
  const agent = await getAgent(agentId);

  // Créer le prêt
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .insert([{ agent_id: agentId, montant, taux_interet: taux, statut: 'en cours' }])
    .select().single();
  if (loanError) throw loanError;

  // Mettre à jour l'agent
  await updateAgent(agentId, {
    balance: agent.balance + montant,
    dette: agent.dette + montant,
  });

  // Transaction
  await supabase.from('transactions').insert([{
    agent_id: agentId, type: 'pret', montant,
    description: `Prêt accordé à ${taux * 100}% d'intérêt`,
  }]);

  await addLog(`${agent.prenom} a reçu un prêt de ${montant} F (${taux * 100}%)`, 'pret');
  return loan;
}

export async function repayLoan(agentId, montant) {
  const agent = await getAgent(agentId);
  if (agent.balance < montant) throw new Error('Solde insuffisant');
  if (agent.dette <= 0) throw new Error('Aucune dette à rembourser');

  const payment = Math.min(montant, agent.dette);

  await updateAgent(agentId, {
    balance: agent.balance - payment,
    dette: Math.max(0, agent.dette - payment),
  });

  // Marquer prêt comme remboursé si dette = 0
  if (agent.dette - payment <= 0) {
    await supabase.from('loans')
      .update({ statut: 'remboursé' })
      .eq('agent_id', agentId)
      .eq('statut', 'en cours');
  }

  await supabase.from('transactions').insert([{
    agent_id: agentId, type: 'remboursement', montant: payment,
    description: 'Remboursement de dette',
  }]);

  await addLog(`${agent.prenom} a remboursé ${payment} F`, 'remboursement');
}

// ---------- MARCHÉ ----------

export async function getMarket() {
  const { data, error } = await supabase
    .from('market')
    .select('*')
    .order('produit');
  if (error) throw error;
  return data;
}

async function getProduct(produit) {
  const { data, error } = await supabase
    .from('market')
    .select('*')
    .eq('produit', produit)
    .single();
  if (error) throw error;
  return data;
}

// ---------- ÉCONOMIE ----------

export async function getEconomy() {
  const { data, error } = await supabase
    .from('economy')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

export async function applyInflation() {
  const economy = await getEconomy();
  const rate = economy.inflation_rate;

  // Appliquer via la fonction SQL
  const { error } = await supabase.rpc('apply_inflation', { rate });
  if (error) throw error;

  await addLog(`Inflation +${(rate * 100).toFixed(1)}% appliquée — Période ${economy.periode + 1}`, 'inflation');
  await applyInterests();
}

export async function applyInterests() {
  const { error } = await supabase.rpc('apply_interests');
  if (error) throw error;
}

export async function crashEconomy() {
  const { data, error } = await supabase.rpc('crash_economy');
  if (error) throw error;
  await addLog('CRASH ÉCONOMIQUE déclenché !', 'crash');
  return data;
}

// ---------- LOGS ----------

export async function getLogs(limit = 50) {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function addLog(message, type = 'info') {
  const economy = await getEconomy();
  await supabase.from('logs').insert([{
    message,
    type,
    periode: economy.periode,
  }]);
}

// ---------- HELPERS ----------

async function getAgent(id) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
