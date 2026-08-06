# Invest

Tableau de bord de suivi d'actifs financiers (actions, ETF, crypto, matières premières)
avec données issues de **Yahoo Finance**.

## Fonctionnalités

- Suivi multi-actifs avec prix temps réel via Yahoo Finance (`/api/yahoo`)
- Graphiques historiques (recharts) sur différentes périodes
- Calcul des plus hauts historiques (ATH)
- Filtres par classe d'actifs
- Cache local (`localStorage`) relié par période + ATH

## Actifs suivis

| ID        | Label                    | Symbole   | Devise |
|-----------|--------------------------|-----------|--------|
| `gold`    | Or                       | `GC=F`    | USD    |
| `msci`    | MSCI World (via IWDA.L)  | `IWDA.L`  | USD    |
| `msci-acwi` | MSCI ACWI (via ACWI)   | `ACWI`    | USD    |
| `stoxx`   | Stoxx 600                | `^STOXX`  | EUR    |
| `bitcoin` | Bitcoin                  | `BTC-USD` | USD    |
| `ovhcloud`| OVHcloud                 | `OVH.PA`  | EUR    |

La liste des actifs est définie dans `src/assets.ts`.

## Stack

- [React 19](https://react.dev) + [TypeScript 6](https://www.typescriptlang.org) + [Vite 8](https://vite.dev)
- [Recharts](https://recharts.org) pour les graphiques
- [Oxlint](https://oxc.rs) pour le lint
- Serveur Node natif (`server.js`) : fichiers statiques + proxy Yahoo Finance

## Démarrage

### Développement

```bash
npm install
npm run dev          # Vite dev server
```

### Production

```bash
npm run build        # compile TS + bundle dist/
node server.js 3000  # sert dist/ + proxy /api/yahoo/*
```

Le serveur expose :
- `GET /` — SPA (fallback `index.html`)
- `GET /api/yahoo/v8/finance/chart/:symbole?range=...` — proxy vers `query1.finance.yahoo.com`

## Scripts

| Commande        | Description                    |
|-----------------|--------------------------------|
| `npm run dev`   | Serveur de développement Vite  |
| `npm run build` | Compilation TS + build Vite    |
| `npm run lint`  | Oxlint                         |
| `npm run preview` | Prévisualisation du build   |

## Licence

Privé.
