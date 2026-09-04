# Longrich — Backend

API REST Node.js/Express + Prisma + PostgreSQL (Neon) + Socket.IO.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner DATABASE_URL / DIRECT_DATABASE_URL / JWT_SECRET
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed            # crée les comptes admin / super_admin de test
npm run dev
```

Prérequis : **Node.js >= 20.19** (exigé par Prisma 7).

⚠️ **Avant `npm install`** : vérifier sur npm que les versions listées dans `package.json`
sont bien stables depuis plusieurs semaines (consigne du cahier des charges) et ajuster si une
version plus récente s'est stabilisée entre-temps.

### Particularité Prisma 7 (important)

Ce projet est sur **Prisma 7**, qui a changé la façon dont la connexion à la base est configurée
(le moteur Rust historique a été retiré, la connexion se fait maintenant via un *driver adapter*) :

- `prisma/schema.prisma` ne contient **plus** `url`/`directUrl` dans le `datasource` (Prisma 7 l'interdit).
- `prisma.config.js` (racine du projet) configure la CLI (`generate`/`migrate`/`studio`) et utilise
  `DIRECT_DATABASE_URL` — Neon n'autorise pas les migrations sur la connexion poolée.
- `src/config/prisma.js` instancie `PrismaClient` avec un `adapter` (`@prisma/adapter-pg`) branché sur
  `DATABASE_URL` (connexion poolée) pour les requêtes applicatives.

Si tu vois une erreur du style *"The datasource property `url` is no longer supported"* ou
*"requires either adapter or accelerateUrl"*, c'est le signe que quelque chose a été écrit selon
l'ancienne API (Prisma 5/6) — vérifier ces trois fichiers en priorité avant de suspecter autre chose.

## Structure

```
prisma.config.js       Config CLI Prisma 7 (connexion directe, migrations, seed)
prisma/schema.prisma   Schéma complet (User, Category, Product, Order, Chat, etc.) — sans url/directUrl
src/config/             env, client Prisma (avec driver adapter pg)
src/middlewares/       auth (protect/restrictTo), validate (Zod), errorHandler
src/utils/             AppError, asyncHandler, hashing (argon2id), JWT
src/sockets/           Socket.IO — auth au handshake, room personnelle par user
src/routes/            agrégateur de routes (routes métier à monter au fur et à mesure)
src/controllers/       à venir
src/services/          à venir
src/validators/        à venir
```

## État d'avancement backend

- [x] Scaffolding projet, config env validée (Zod)
- [x] Schéma Prisma complet (toutes les entités du cahier des charges)
- [x] Infra transverse : erreurs, validation, JWT + cookie httpOnly, argon2id, Socket.IO (auth handshake)
- [ ] Module Auth (register / login / profil / nom secret / reset mot de passe en 3 étapes)
- [ ] Seed (admin + super_admin)
- [ ] Catégories & Produits (CRUD, images, recherche/filtres)
- [ ] Likes & Commentaires (modération)
- [ ] Commandes (création site/manuelle, stock transactionnel, statuts)
- [ ] Chat temps réel (conversations, messages, rooms)
- [ ] Notifications (+ structure push PWA)
- [ ] Statistiques admin
- [ ] Super Admin (monitoring, gestion admins, paramètres site, logs d'activité)
- [ ] Rate limiting login / nom secret
- [ ] SEO backend (sitemap.xml, robots.txt côté API si servi par le backend)
