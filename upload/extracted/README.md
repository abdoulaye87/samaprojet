# 🏛️ Simulation Économique GLM5 — Guide d'intégration Supabase

## 📁 Fichiers inclus

| Fichier | Description |
|---------|-------------|
| `supabase_schema.sql` | Schéma complet de la base de données |
| `supabase_api.js` | Toutes les fonctions API (agents, marché, prêts...) |
| `App.jsx` | Dashboard React complet connecté à Supabase |

---

## 🚀 Installation en 5 étapes

### Étape 1 — Créer un projet Supabase

1. Aller sur [https://supabase.com](https://supabase.com)
2. Cliquer **New Project**
3. Choisir un nom et un mot de passe pour la base
4. Attendre la création (~2 minutes)

---

### Étape 2 — Créer les tables SQL

1. Dans Supabase, aller dans **SQL Editor**
2. Copier tout le contenu de `supabase_schema.sql`
3. Coller dans l'éditeur et cliquer **Run**
4. ✅ Tables créées + données de démo insérées

---

### Étape 3 — Récupérer les clés API

Dans Supabase → **Project Settings** → **API** :

- Copier **Project URL** → ex: `https://abcxyz.supabase.co`
- Copier **anon public key** → longue chaîne JWT

Puis dans `supabase_api.js`, remplacer :
```javascript
const SUPABASE_URL = 'https://VOTRE_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY';
```

---

### Étape 4 — Installer les dépendances

```bash
# Créer le projet React (si pas encore fait)
npm create vite@latest glm5-economie -- --template react
cd glm5-economie

# Installer Supabase
npm install @supabase/supabase-js

# Copier les fichiers
cp chemin/vers/supabase_api.js src/api.js
cp chemin/vers/App.jsx src/App.jsx
```

---

### Étape 5 — Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Architecture de la base de données

```
agents          → Profils des agents économiques
transactions    → Historique de tous les achats/ventes/prêts
loans           → Prêts bancaires avec intérêts
market          → Prix des produits (mis à jour par inflation)
economy         → État global (période, taux d'inflation)
logs            → Journal de toutes les événements
```

## 🔄 Flux économique automatique

```
Chaque période (30s) :
  1. apply_inflation()  → prix marché +2%
  2. apply_interests()  → dettes +2%
  3. inflation_cumul mis à jour
  4. Log automatique ajouté
```

## 💡 Fonctions SQL disponibles

```sql
-- Appliquer l'inflation
SELECT apply_inflation(0.02);

-- Appliquer les intérêts sur les dettes
SELECT apply_interests();

-- Déclencher un crash économique
SELECT * FROM crash_economy();
```

## 🔐 Sécurité (optionnel)

Pour activer la sécurité par utilisateur (Row Level Security) :

```sql
-- Dans Supabase SQL Editor
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- (décommenter les lignes RLS dans supabase_schema.sql)
```

---

## 📊 Tables et colonnes

### `agents`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| prenom | TEXT | Prénom de l'agent |
| balance | NUMERIC | Argent disponible |
| dette | NUMERIC | Dette totale |
| investissement_total | NUMERIC | Total investi |
| created_at | TIMESTAMPTZ | Date de création |

### `market`
| Colonne | Type | Description |
|---------|------|-------------|
| produit | TEXT | Nom du produit |
| prix | NUMERIC | Prix actuel |
| prix_base | NUMERIC | Prix de départ (référence) |

### `loans`
| Colonne | Type | Description |
|---------|------|-------------|
| agent_id | INTEGER | Agent concerné |
| montant | NUMERIC | Montant du prêt |
| taux_interet | NUMERIC | Taux (ex: 0.02 = 2%) |
| statut | TEXT | 'en cours' ou 'remboursé' |
