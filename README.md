# Simulation Economique GLM5

Dashboard de simulation economique interactive avec Next.js, Tailwind CSS, shadcn/ui et Supabase.

## Fonctionnalites

- **Gestion des agents** : Creer, modifier, supprimer des agents economiques
- **Banque** : Prets avec interets automatiques (+2%/periode), remboursement partiel/complet
- **Marche** : 5 produits (Riz, Huile, Ciment, Farine, Sucre) avec prix dynamiques
- **Inflation** : Prix augmentent de +2% toutes les 30 secondes, soldes devaluent de -1%
- **Crash economique** : Perte aleatoire 0-50% sur les soldes + perturbation du marche
- **Journal** : Historique complet de tous les evenements
- **Graphiques** : Repartition de la richesse + evolution des prix

## Technologies

| Stack | Technologie |
|-------|-------------|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Base de donnees | Prisma + SQLite (dev) / Supabase PostgreSQL (prod) |
| Graphiques | Recharts |
| Deploiement | Vercel |

## Architecture

```
src/
  app/
    api/
      agents/          # CRUD agents
      agents/[id]/     # Agent detail
      actions/
        buy/           # Achat produit
        sell/          # Vente produit
        receive/       # Depot d'argent
        loan/          # Demande de pret
        repay/         # Remboursement
      market/          # Prix du marche
      economy/         # Inflation + etat
      economy/crash/   # Crash economique
      dashboard/       # Donnees agregees
      logs/            # Journal d'evenements
      seed/            # Initialisation BDD
      transactions/    # Historique transactions
    page.tsx           # Page principale
    layout.tsx         # Layout avec providers
    globals.css        # Styles globaux
  components/
    economy/           # Composants du dashboard
      dashboard-client.tsx
      wealth-chart.tsx
      inflation-chart.tsx
    ui/                # Composants shadcn/ui
  lib/
    db.ts              # Client Prisma
    economy-engine.ts  # Logique metier
    format.ts          # Utilitaires de formatage
    utils.ts           # Utilitaires generaux
prisma/
  schema.prisma        # Schema de la base de donnees
supabase/
  schema.sql           # Schema Supabase (production)
```

## Installation locale

### 1. Cloner le depot

```bash
git clone https://github.com/VOTRE_USER/economie-glm5.git
cd economie-glm5
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

### 4. Initialiser la base de donnees

```bash
npx prisma db push
npx prisma generate
```

### 5. Lancer le serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Deploiement sur Vercel + Supabase

### Etape 1 : Creer un projet Supabase

1. Aller sur [https://supabase.com](https://supabase.com)
2. Creer un nouveau projet
3. Noter le **Project URL** et la **anon public key**

### Etape 2 : Executer le schema SQL

1. Dans Supabase, aller dans **SQL Editor**
2. Copier tout le contenu de `supabase/schema.sql`
3. Coller dans l'editeur et cliquer **Run**
4. Les tables, donnees initiales et fonctions SQL sont creees

### Etape 3 : Creer le depot GitHub

```bash
git init
git add .
git commit -m "Initial commit - Simulation economique GLM5"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/economie-glm5.git
git push -u origin main
```

### Etape 4 : Deploier sur Vercel

1. Aller sur [https://vercel.com](https://vercel.com)
2. Importer le depot GitHub
3. Configurer les variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key Supabase |

4. Cliquer **Deploy**

## Base de donnees

### Tables principales

| Table | Description |
|-------|-------------|
| `agents` | Profils des agents economiques |
| `transactions` | Historique des achats/ventes/prets |
| `loans` | Prets bancaires avec interets |
| `market` | Prix des produits |
| `economy` | Etat global (periode, inflation) |
| `logs` | Journal des evenements |

### Fonctions SQL (Supabase)

```sql
-- Appliquer l'inflation + devaluation
SELECT apply_inflation(0.02);

-- Appliquer les interets sur les dettes
SELECT apply_interests();

-- Declencher un crash economique
SELECT * FROM crash_economy();
```

## Mecaniques economiques

| Evenement | Frequence | Effet |
|-----------|-----------|-------|
| Inflation | Toutes les 30s | Prix +2%, Soldes -1%, Dettes +2% |
| Crash | Manuel | Soldes -0 a 50%, Marche perturbe |

## Licence

MIT
