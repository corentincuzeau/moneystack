# MoneyStack

Application complète de gestion de budget personnel avec support Web et Mobile.

## Fonctionnalités

- **Gestion des comptes** : Multiple comptes bancaires (courant, épargne, espèces, etc.)
- **Transactions** : Suivi des revenus et dépenses avec catégorisation
- **Abonnements** : Gestion des paiements récurrents (Netflix, Spotify, etc.)
- **Crédits** : Suivi des emprunts avec échéancier
- **Projets d'épargne** : Objectifs financiers avec progression
- **Notifications Push** : Rappels de paiements et alertes
- **Tableau de bord** : Vue d'ensemble avec graphiques

## Stack technique

### Backend
- NestJS avec architecture modulaire
- Prisma ORM + PostgreSQL
- Redis pour cache et queues (Bull)
- Firebase Admin SDK (notifications)
- Passport.js + Google OAuth2
- Documentation Swagger

### Frontend Web
- React 18 + Vite
- TypeScript strict
- TanStack Query
- Zustand
- Tailwind CSS
- Recharts

### Mobile
- React Native + Expo (SDK 50+)
- expo-notifications
- expo-auth-session

### Infrastructure
- Docker multi-stage builds
- Traefik (reverse proxy + Let's Encrypt)
- Jenkins CI/CD
- Nexus (registry Docker)

## Structure du projet

```
moneystack/
├── apps/
│   ├── api/          # Backend NestJS
│   ├── web/          # Frontend React
│   └── mobile/       # App React Native Expo
├── packages/
│   └── shared/       # Types et utils partagés
├── docker/
│   └── traefik/      # Config Traefik
├── docker-compose.dev.yml
├── docker-compose.test.yml
├── docker-compose.prod.yml
└── Jenkinsfile
```

## Installation

### Prérequis

- Node.js 20+
- Docker et Docker Compose
- PostgreSQL 16 (ou via Docker)
- Redis 7 (ou via Docker)

### Configuration

1. Cloner le repo :
```bash
git clone https://github.com/your-org/moneystack.git
cd moneystack
```

2. Copier et configurer les variables d'environnement :
```bash
cp .env.example .env
```

3. Configurer les variables suivantes :
- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` (Console Google Cloud)
- `FIREBASE_*` (Console Firebase)
- `JWT_SECRET` (chaîne aléatoire sécurisée)

### Développement avec Docker

```bash
# Démarrer tous les services
docker-compose -f docker-compose.dev.yml up

# API : http://localhost:3000
# Web : http://localhost:5173
# Swagger : http://localhost:3000/api/docs
```

### Développement local (sans Docker)

1. Installer les dépendances :
```bash
npm install
```

2. Générer le client Prisma :
```bash
npm run prisma:generate
```

3. Exécuter les migrations :
```bash
npm run prisma:migrate
```

4. Seeder la base (catégories par défaut) :
```bash
npm run prisma:seed -w @moneystack/api
```

5. Démarrer les serveurs :
```bash
# API + Web
npm run dev

# Ou séparément
npm run dev:api
npm run dev:web
```

### Application mobile

```bash
cd apps/mobile

# Installer les dépendances
npm install

# Démarrer Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

## Tests

```bash
# Tous les tests
npm run test

# Tests API
npm run test:api

# Tests Web
npm run test:web

# Avec Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Déploiement

### Production avec Docker

1. Configurer `.env` avec les variables de production

2. Construire et déployer :
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD avec Jenkins

Le pipeline Jenkins effectue :
1. Checkout du code
2. Installation des dépendances
3. Lint (ESLint)
4. Tests (Jest, Vitest)
5. Build des images Docker
6. Push vers Nexus
7. Déploiement sur le VPS

Configurer les credentials Jenkins :
- `nexus-registry` : URL du registry
- `nexus-credentials` : Username/password Nexus
- `vps-ssh` : Clé SSH du serveur

## API Endpoints

### Auth
- `GET /api/v1/auth/google` - Login Google
- `POST /api/v1/auth/refresh` - Rafraîchir tokens
- `GET /api/v1/auth/me` - Utilisateur courant

### Accounts
- `GET /api/v1/accounts` - Liste des comptes
- `POST /api/v1/accounts` - Créer un compte
- `POST /api/v1/accounts/transfer` - Transfert

### Transactions
- `GET /api/v1/transactions` - Liste avec filtres
- `POST /api/v1/transactions` - Créer
- `GET /api/v1/transactions/stats` - Statistiques

### Subscriptions
- `GET /api/v1/subscriptions` - Liste
- `GET /api/v1/subscriptions/upcoming` - À venir

### Credits
- `GET /api/v1/credits` - Liste des crédits
- `POST /api/v1/credits/:id/payment` - Enregistrer paiement

### Projects
- `GET /api/v1/projects` - Projets d'épargne
- `POST /api/v1/projects/:id/contribute` - Contribuer

### Dashboard
- `GET /api/v1/dashboard` - Stats complètes
- `GET /api/v1/dashboard/calendar` - Événements calendrier

Documentation complète : `/api/docs` (Swagger)

## Configuration Firebase

1. Créer un projet Firebase
2. Activer Cloud Messaging
3. Télécharger la clé de service
4. Configurer les variables :
```
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

## Configuration Google OAuth

1. Console Google Cloud > APIs & Services > Credentials
2. Créer OAuth 2.0 Client ID
3. Ajouter les URIs de redirection :
   - `http://localhost:3000/api/v1/auth/google/callback` (dev)
   - `https://api.yourdomain.com/api/v1/auth/google/callback` (prod)
4. Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

## Licence

MIT
