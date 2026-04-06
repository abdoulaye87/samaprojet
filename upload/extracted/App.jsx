// ============================================
// App.jsx — Dashboard GLM5 avec Supabase
// ============================================
// npm install react react-dom @supabase/supabase-js
// npm run dev (Vite) ou npm start (CRA)

import { useState, useEffect, useCallback } from 'react';
import {
  getAgents, createAgent, updateAgent, deleteAgent,
  getTransactions, receiveMonney, buyProduct, sellProduct,
  requestLoan, repayLoan,
  getMarket, getEconomy, applyInflation, crashEconomy,
  getLogs,
} from './api';

// ─── Utilitaires ────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' F';
const pct = (n) => (Number(n) * 100).toFixed(1) + '%';

// ─── Composant principal ─────────────────────────────────────
export default function App() {
  const [agents, setAgents] = useState([]);
  const [market, setMarket] = useState([]);
  const [economy, setEconomy] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [agentTransactions, setAgentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // 'new-agent' | 'edit-agent' | null
  const [formPrenom, setFormPrenom] = useState('');
  const [formArgent, setFormArgent] = useState(1000);

  // Action state
  const [actionType, setActionType] = useState('recevoir');
  const [actionAmount, setActionAmount] = useState('');
  const [actionProduct, setActionProduct] = useState('Riz');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Chargement initial ──────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [a, m, e, l] = await Promise.all([
        getAgents(), getMarket(), getEconomy(), getLogs(50),
      ]);
      setAgents(a);
      setMarket(m);
      setEconomy(e);
      setLogs(l);
      setError(null);
    } catch (err) {
      setError('Erreur de connexion Supabase : ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Actualisation auto toutes les 10 secondes
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Quand on sélectionne un agent
  useEffect(() => {
    if (!selectedAgent) return;
    getTransactions(selectedAgent.id).then(setAgentTransactions);
  }, [selectedAgent]);

  // ── Tick inflation (toutes les 30s en production) ───────────
  useEffect(() => {
    const interval = setInterval(async () => {
      await applyInflation();
      await refresh();
    }, 30000); // 30 secondes
    return () => clearInterval(interval);
  }, [refresh]);

  // ── Actions admin ───────────────────────────────────────────
  const handleCrash = async () => {
    if (!window.confirm('Déclencher un crash économique ?')) return;
    await crashEconomy();
    await refresh();
  };

  const handleModal = (mode) => {
    if (mode === 'edit-agent' && selectedAgent) {
      setFormPrenom(selectedAgent.prenom);
      setFormArgent(selectedAgent.balance);
    } else {
      setFormPrenom('');
      setFormArgent(1000);
    }
    setModal(mode);
  };

  const handleConfirmModal = async () => {
    if (!formPrenom.trim()) return alert('Entrez un prénom.');
    try {
      if (modal === 'new-agent') {
        await createAgent(formPrenom.trim(), Number(formArgent));
      } else if (modal === 'edit-agent' && selectedAgent) {
        await updateAgent(selectedAgent.id, {
          prenom: formPrenom.trim(),
          balance: Number(formArgent),
        });
      }
      setModal(null);
      await refresh();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent || !window.confirm(`Supprimer ${selectedAgent.prenom} ?`)) return;
    await deleteAgent(selectedAgent.id);
    setSelectedAgent(null);
    await refresh();
  };

  // ── Action sur agent ────────────────────────────────────────
  const handleAction = async () => {
    if (!selectedAgent) return;
    const amount = parseFloat(actionAmount);
    if (!amount || amount <= 0) return alert('Montant invalide.');
    setActionLoading(true);
    try {
      switch (actionType) {
        case 'recevoir':  await receiveMonney(selectedAgent.id, amount); break;
        case 'acheter':   await buyProduct(selectedAgent.id, actionProduct); break;
        case 'vendre':    await sellProduct(selectedAgent.id, actionProduct); break;
        case 'pret':      await requestLoan(selectedAgent.id, amount); break;
        case 'rembourser': await repayLoan(selectedAgent.id, amount); break;
      }
      setActionAmount('');
      await refresh();
      const updated = agents.find(a => a.id === selectedAgent.id);
      if (updated) setSelectedAgent(updated);
      const txs = await getTransactions(selectedAgent.id);
      setAgentTransactions(txs);
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return <div style={styles.loading}>Connexion à Supabase...</div>;
  if (error)   return <div style={styles.error}>{error}</div>;

  const totalRichesse = agents.reduce((s, a) => s + Number(a.balance), 0);
  const totalDette    = agents.reduce((s, a) => s + Number(a.dette), 0);

  return (
    <div style={styles.app}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <h1 style={styles.title}>Économie GLM5</h1>
          <span style={styles.badge}>Période {economy?.periode || 1}</span>
        </div>
        <div style={styles.topBarRight}>
          <button style={styles.btnPrimary} onClick={() => handleModal('new-agent')}>+ Nouvel agent</button>
          <button style={styles.btnDanger} onClick={handleCrash}>Crash économie</button>
          <button style={styles.btn} onClick={async () => { await applyInflation(); await refresh(); }}>
            Tick inflation
          </button>
        </div>
      </div>

      {/* MÉTRIQUES */}
      <div style={styles.metricsGrid}>
        <MetricCard label="Agents actifs"     value={agents.length} />
        <MetricCard label="Richesse totale"   value={fmt(totalRichesse)} color="#639922" />
        <MetricCard label="Dette totale"      value={fmt(totalDette)} color="#E24B4A" />
        <MetricCard label="Inflation cumulée" value={pct(economy?.inflation_cumul || 0)} color="#EF9F27" />
      </div>

      {/* LISTE AGENTS */}
      <Section>
        <SectionHeader title="Agents économiques">
          <span style={styles.small}>Inflation: +{pct(economy?.inflation_rate || 0.02)}/période</span>
        </SectionHeader>
        <div style={styles.agentGrid}>
          {agents.map(a => (
            <div
              key={a.id}
              style={{ ...styles.agentCard, ...(selectedAgent?.id === a.id ? styles.agentCardSelected : {}) }}
              onClick={() => { setSelectedAgent(a); setActiveTab('stats'); }}
            >
              <div style={styles.agentName}>{a.prenom}</div>
              <div style={styles.agentStat}>Argent: <b>{fmt(a.balance)}</b></div>
              <div style={styles.agentStat}>
                Dette: <b style={{ color: a.dette > 0 ? '#E24B4A' : 'inherit' }}>{fmt(a.dette)}</b>
              </div>
              <div style={styles.agentStat}>Invest.: <b>{fmt(a.investissement_total)}</b></div>
            </div>
          ))}
        </div>
      </Section>

      {/* PROFIL AGENT */}
      {selectedAgent && (
        <Section>
          <SectionHeader title={selectedAgent.prenom}>
            <div style={styles.topBarRight}>
              <button style={styles.btn} onClick={() => handleModal('edit-agent')}>Modifier</button>
              <button style={styles.btnDanger} onClick={handleDeleteAgent}>Supprimer</button>
              <button style={styles.btn} onClick={() => setSelectedAgent(null)}>Fermer</button>
            </div>
          </SectionHeader>

          {/* TABS */}
          <div style={styles.tabs}>
            {['stats','actions','historique'].map(tab => (
              <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'stats' && (
            <div style={styles.metricsGrid}>
              <MetricCard label="Argent"         value={fmt(selectedAgent.balance)} color="#639922" />
              <MetricCard label="Dette"          value={fmt(selectedAgent.dette)} color="#E24B4A" />
              <MetricCard label="Investissements" value={fmt(selectedAgent.investissement_total)} />
              <MetricCard label="Transactions"   value={agentTransactions.length} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div>
              <div style={styles.inputRow}>
                <select value={actionType} onChange={e => setActionType(e.target.value)} style={styles.input}>
                  <option value="recevoir">Recevoir de l'argent</option>
                  <option value="acheter">Acheter un produit</option>
                  <option value="vendre">Vendre un produit</option>
                  <option value="pret">Demander un prêt</option>
                  <option value="rembourser">Rembourser dette</option>
                </select>
                {(actionType === 'acheter' || actionType === 'vendre') && (
                  <select value={actionProduct} onChange={e => setActionProduct(e.target.value)} style={styles.input}>
                    {market.map(p => <option key={p.produit} value={p.produit}>{p.produit}</option>)}
                  </select>
                )}
              </div>
              {actionType !== 'acheter' && actionType !== 'vendre' && (
                <div style={styles.inputRow}>
                  <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)}
                    placeholder="Montant (F)" style={{ ...styles.input, maxWidth: 180 }} min={1} />
                </div>
              )}
              <button style={styles.btnPrimary} onClick={handleAction} disabled={actionLoading}>
                {actionLoading ? 'En cours...' : 'Exécuter'}
              </button>
            </div>
          )}

          {activeTab === 'historique' && (
            <div style={styles.logList}>
              {agentTransactions.length === 0
                ? <div style={styles.small}>Aucune transaction.</div>
                : agentTransactions.map(tx => (
                  <div key={tx.id} style={styles.logItem}>
                    <span style={{ ...styles.logDot, background: typeColor(tx.type) }} />
                    <span style={styles.small}>{new Date(tx.created_at).toLocaleString('fr-FR')}</span>
                    <span>{tx.description || tx.type} — {fmt(tx.montant)}</span>
                  </div>
                ))
              }
            </div>
          )}
        </Section>
      )}

      {/* MARCHÉ + BANQUE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Section>
          <SectionHeader title="Marché" />
          <div style={styles.marketGrid}>
            {market.map(p => {
              const change = ((p.prix / p.prix_base - 1) * 100).toFixed(1);
              return (
                <div key={p.id} style={styles.productCard}>
                  <div style={styles.productName}>{p.produit}</div>
                  <div style={styles.productPrice}>{fmt(p.prix)}</div>
                  <div style={{ ...styles.small, color: change > 0 ? '#BA7517' : '#888' }}>+{change}%</div>
                </div>
              );
            })}
          </div>
        </Section>
        <Section>
          <SectionHeader title="Banque centrale" />
          <div style={styles.small}>Taux d'intérêt: <b>2% / période</b></div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Inflation cumulée: <b style={{ color: '#EF9F27' }}>{pct(economy?.inflation_cumul || 0)}</b>
          </div>
          <div style={{ ...styles.small, marginTop: 4 }}>
            Période actuelle: <b>#{economy?.periode || 1}</b>
          </div>
        </Section>
      </div>

      {/* JOURNAL */}
      <Section>
        <SectionHeader title="Journal économique" />
        <div style={styles.logList}>
          {logs.map(l => (
            <div key={l.id} style={styles.logItem}>
              <span style={{ ...styles.logDot, background: typeColor(l.type) }} />
              <span style={{ ...styles.small, minWidth: 32 }}>P{l.periode}</span>
              <span style={styles.small}>{l.message}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* MODAL */}
      {modal && (
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>
              {modal === 'new-agent' ? 'Nouvel agent' : 'Modifier agent'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <label style={styles.small}>Prénom</label>
              <input style={styles.input} value={formPrenom} onChange={e => setFormPrenom(e.target.value)} placeholder="Ex: Aminata" />
              <label style={styles.small}>Argent initial (F)</label>
              <input style={styles.input} type="number" value={formArgent} onChange={e => setFormArgent(e.target.value)} min={0} />
            </div>
            <div style={styles.topBarRight}>
              <button style={styles.btnPrimary} onClick={handleConfirmModal}>Confirmer</button>
              <button style={styles.btn} onClick={() => setModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────

function MetricCard({ label, value, color }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: color || 'inherit' }}>{value}</div>
    </div>
  );
}

function Section({ children }) {
  return <div style={styles.section}>{children}</div>;
}

function SectionHeader({ title, children }) {
  return (
    <div style={styles.sectionHeader}>
      <span style={styles.sectionTitle}>{title}</span>
      {children}
    </div>
  );
}

// ─── Couleurs par type ───────────────────────────────────────

function typeColor(type) {
  const map = {
    achat: '#378ADD', vente: '#639922', pret: '#EF9F27',
    remboursement: '#1D9E75', crash: '#E24B4A', inflation: '#7F77DD',
    creation: '#D4537E', info: '#888', depot: '#1D9E75',
  };
  return map[type] || '#888';
}

// ─── Styles ──────────────────────────────────────────────────

const styles = {
  app:           { padding: '1rem', maxWidth: 920, fontFamily: 'system-ui, sans-serif' },
  loading:       { padding: '2rem', textAlign: 'center', color: '#888' },
  error:         { padding: '1rem', color: '#E24B4A', background: '#FEE', borderRadius: 8 },
  topBar:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  topBarLeft:    { display: 'flex', alignItems: 'center', gap: 10 },
  topBarRight:   { display: 'flex', gap: 8, flexWrap: 'wrap' },
  title:         { fontSize: 20, fontWeight: 500, margin: 0 },
  badge:         { fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#E6F1FB', color: '#185FA5', fontWeight: 500 },
  btn:           { border: '0.5px solid #ccc', borderRadius: 8, background: 'transparent', padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  btnPrimary:    { border: '0.5px solid #378ADD', borderRadius: 8, background: 'transparent', color: '#185FA5', padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  btnDanger:     { border: '0.5px solid #E24B4A', borderRadius: 8, background: 'transparent', color: '#A32D2D', padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  metricsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 12 },
  metricCard:    { background: '#f5f5f5', borderRadius: 8, padding: '0.9rem' },
  metricLabel:   { fontSize: 12, color: '#888', marginBottom: 4 },
  metricValue:   { fontSize: 22, fontWeight: 500 },
  section:       { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  sectionTitle:  { fontSize: 15, fontWeight: 500 },
  agentGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 },
  agentCard:     { border: '0.5px solid #e0e0e0', borderRadius: 8, padding: '0.85rem', cursor: 'pointer' },
  agentCardSelected: { border: '0.5px solid #378ADD', background: '#E6F1FB' },
  agentName:     { fontSize: 14, fontWeight: 500, marginBottom: 6 },
  agentStat:     { fontSize: 12, color: '#666', marginBottom: 2 },
  tabs:          { display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' },
  tab:           { padding: '5px 14px', fontSize: 13, borderRadius: 20, border: '0.5px solid #e0e0e0', cursor: 'pointer', background: 'transparent', color: '#888' },
  tabActive:     { background: '#f0f0f0', color: '#222', borderColor: '#ccc' },
  inputRow:      { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  input:         { border: '0.5px solid #ccc', borderRadius: 8, padding: '6px 10px', fontSize: 13, flex: 1, minWidth: 100 },
  marketGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
  productCard:   { border: '0.5px solid #e0e0e0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' },
  productName:   { fontSize: 13, fontWeight: 500, marginBottom: 4 },
  productPrice:  { fontSize: 18, fontWeight: 500, color: '#185FA5' },
  logList:       { maxHeight: 180, overflowY: 'auto' },
  logItem:       { fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #eee', color: '#666', display: 'flex', gap: 8, alignItems: 'flex-start' },
  logDot:        { width: 6, height: 6, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  small:         { fontSize: 12, color: '#888' },
  modalBg:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:         { background: '#fff', border: '0.5px solid #ddd', borderRadius: 12, padding: '1.5rem', width: 300 },
};
