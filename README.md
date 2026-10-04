# Coaching Mental

Application : https://coaching-mental.lucasdaniel1108.chatgpt.site

Application mobile web installable, inspirée de la maquette Coaching Mental : notes privées, matrice de décision, roue des valeurs et statistiques descriptives.

## Fonctionnalités

- Notes : création, modification, suppression, catégories et recherche.
- Décisions : 2 à 4 options, critères pondérés, sous-critères, seuils éliminatoires, sauvegarde de plusieurs décisions.
- Valeurs : 3 à 12 valeurs personnalisables, notes 0–10, roue SVG dynamique, sous-dimensions et réflexions.
- Connexion Supabase par e-mail et mot de passe, inscription, confirmation e-mail, récupération du mot de passe et déconnexion.
- Export JSON, manifeste PWA, icônes iPhone, page hors connexion.
- Démonstration explicite en mémoire uniquement. Les essais disparaissent au rechargement et ne sont pas importés dans un compte.

## Installation locale

Node 22.13+ et pnpm (version définie dans package.json).

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

## Configuration Supabase

1. Créer ou sélectionner le projet Supabase.
2. Appliquer `supabase/migrations/202610040001_coaching.sql` via Supabase CLI ou SQL Editor **une seule fois**.
3. Configurer `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` dans l’environnement serveur d’hébergement.
4. Dans Authentication → URL Configuration, définir l’origine de production comme Site URL et l’ajouter aux Redirect URLs. Ajouter aussi l’origine locale utilisée.
5. Activer Email / Password et la confirmation des e-mails ; régler une longueur minimale de 12 caractères. Configurer un fournisseur SMTP de production pour les confirmations et réinitialisations.
6. Tester avec deux comptes distincts : vérifier qu’aucun compte ne peut lire, modifier ou supprimer les données de l’autre, ni modifier leur `user_id`.

Aucune clé réelle n’est incluse dans ce dépôt. La clé publishable/anon est publique par conception ; la sécurité repose sur les policies RLS. **Ne jamais fournir de clé `service_role` ou `sb_secret_*` à l’application.** L’endpoint `/api/config` refuse ces clés.

## Données et synchronisation

Tables `cm_notes`, `cm_decisions`, `cm_wheels`, avec RLS sur `auth.uid() = user_id`, accès anonyme révoqué. Les enregistrements portent le propriétaire connecté. L’interface n’annonce un enregistrement qu’après confirmation du serveur. Les modifications concurrentes utilisent `updated_at` pour éviter d’écraser silencieusement une modification faite ailleurs. Actualiser depuis le profil recharge les dernières données.

L’enregistrement se fait avec le bouton **Enregistrer**, pas en arrière-plan. Les brouillons restent ouverts en cas d’échec. Le service worker ne met en cache aucune réponse API ni donnée personnelle. Hors connexion, la page ouverte garde ses données en mémoire ; une ouverture à froid montre une page expliquant comment se reconnecter.

## Calcul de décision

`score(option) = somme(poids × note) / somme(poids)`.

S’il existe des sous-critères, leur moyenne à poids égaux remplace la note du parent. Un critère indispensable noté sous son seuil élimine l’option, quelle que soit sa moyenne. Les égalités restent des égalités. Un total de poids nul ne produit pas de recommandation. Le jeu d’exemple donne 3,0/5 et 4,6/5 ; la maquette indiquait 3,2 malgré des notes qui totalisent 3,0.

## Vérification

```sh
node --experimental-strip-types --test tests/decision.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Le projet Supabase de l’application hébergée est créé, la migration appliquée et les variables de connexion configurées. Les tests SQL d’isolation entre propriétaires passent et l’audit de sécurité Supabase ne remonte aucune alerte. Les URL de confirmation et de récupération sont configurées vers l’application. L’inscription par e-mail et la confirmation sont activées, avec un mot de passe de 12 caractères minimum. Le workflow GitHub Actions a réussi : installation figée, tests de décision, TypeScript et compilation.

L’envoi utilise encore le SMTP de test Supabase, réservé aux adresses des membres de l’organisation et sans garantie de délivrabilité. Pour le premier essai, utiliser l’adresse du compte Supabase propriétaire. Un SMTP personnalisé est nécessaire pour ouvrir les inscriptions à d’autres utilisateurs. Le parcours réel de création du compte et réception de l’e-mail reste à valider par l’utilisateur. Documentation : https://supabase.com/docs/guides/auth/auth-smtp L’absence de configuration sur une autre installation propose uniquement une démonstration clairement signalée.

## Installation iPhone

Ouvrir l’adresse HTTPS dans Safari → Partager → Sur l’écran d’accueil → Ajouter. La synchronisation exige Internet.

## Déploiement

Application React/TypeScript avec Vinext, sortie Cloudflare Worker. Les scripts fournis construisent le serveur et les ressources statiques. La migration Supabase est indépendante du déploiement de l’interface.

Le fichier `.openai/hosting.json` contient l’identité de l’hébergement Sites. Le dépôt GitHub public sert à conserver et modifier le code ; il ne rend pas les données Supabase publiques et ne déploie pas automatiquement l’application.
