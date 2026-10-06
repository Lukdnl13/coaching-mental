# Coaching Mental

Application : https://coaching-mental.lucasdaniel1108.chatgpt.site

Application mobile web installable, inspirée de la maquette Coaching Mental : notes privées, matrice de décision, roue des valeurs et suivi quotidien des statistiques.

## Fonctionnalités

- Actions à réaliser : tâches personnelles avec 12 icônes au choix, précisions facultatives, cases à cocher et filtres À faire / Réalisées / Toutes. Modification, suppression et sauvegarde privée ; le changement d’état est enregistré immédiatement après confirmation du serveur.
- Notes : création, modification, suppression, catégories et recherche.
- Décisions : 2 à 4 options, critères pondérés, sous-critères, seuils éliminatoires, sauvegarde de plusieurs décisions.
- Tableaux généralistes : deux colonnes **Pour — obligatoire** et **Contre — rédhibitoire**, avec critères et sous-critères sans notes ni comparaison ; glisser-déposer tactile, déplacement entre critères et colonnes, flèches accessibles, sauvegarde et export. Jusqu’à 100 critères et 50 sous-critères par critère.
- Compétences et projet pro : inventaire de compétences et qualités, catégories personnalisables avec couleurs au choix (repères partagés dans les listes, groupes et points d’appui), objectif professionnel, sélection des points d’appui et actions à cocher. Sauvegarde privée, export JSON et protection des brouillons.
- Valeurs : 3 à 12 valeurs personnalisables, notes 0–10, roue SVG dynamique, sous-dimensions et réflexions.
- Connexion Supabase par e-mail et mot de passe, inscription, confirmation e-mail, récupération du mot de passe et déconnexion.
- Statistiques : aperçu sous les boutons de l’accueil, courbes sur 7/30/90 jours, comparaison des valeurs et suivi des compétences/actions.
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
2. Appliquer les fichiers de `supabase/migrations/` dans leur ordre chronologique via Supabase CLI ou SQL Editor **une seule fois**.
3. Configurer `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` dans l’environnement serveur d’hébergement.
4. Dans Authentication → URL Configuration, définir l’origine de production comme Site URL et l’ajouter aux Redirect URLs. Ajouter aussi l’origine locale utilisée.
5. Activer Email / Password et la confirmation des e-mails ; régler une longueur minimale de 12 caractères. Configurer un fournisseur SMTP de production pour les confirmations et réinitialisations.
6. Tester avec deux comptes distincts : vérifier qu’aucun compte ne peut lire, modifier ou supprimer les données de l’autre, ni modifier leur `user_id`.

Aucune clé réelle n’est incluse dans ce dépôt. La clé publishable/anon est publique par conception ; la sécurité repose sur les policies RLS. **Ne jamais fournir de clé `service_role` ou `sb_secret_*` à l’application.** L’endpoint `/api/config` refuse ces clés.

## Données et synchronisation

Tables `cm_notes`, `cm_decisions`, `cm_tables`, `cm_wheels`, `cm_career`, `cm_progress`, `cm_tasks`, avec RLS sur `auth.uid() = user_id`, accès anonyme révoqué. Les enregistrements portent le propriétaire connecté. L’interface n’annonce un enregistrement qu’après confirmation du serveur. Les modifications concurrentes utilisent `updated_at` pour éviter d’écraser silencieusement une modification faite ailleurs. Actualiser depuis le profil recharge les dernières données.

L’enregistrement se fait avec le bouton **Enregistrer**, pas en arrière-plan. Les brouillons restent ouverts en cas d’échec. Le service worker ne met en cache aucune réponse API ni donnée personnelle. Hors connexion, la page ouverte garde ses données en mémoire ; une ouverture à froid montre une page expliquant comment se reconnecter.

## Calcul de décision

`score(option) = somme(poids × note) / somme(poids)`.

S’il existe des sous-critères, leur moyenne à poids égaux remplace la note du parent. Un critère indispensable noté sous son seuil élimine l’option, quelle que soit sa moyenne. Les égalités restent des égalités. Un total de poids nul ne produit pas de recommandation. Le jeu d’exemple donne 3,0/5 et 4,6/5 ; la maquette indiquait 3,2 malgré des notes qui totalisent 3,0.

## Vérification

```sh
node --experimental-strip-types --test tests/*.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Le projet Supabase de l’application hébergée est créé, la migration appliquée et les variables de connexion configurées. Les tests SQL d’isolation entre propriétaires passent et l’audit Supabase ne remonte aucune alerte sur les tables et leurs règles d’accès. Il signale toutefois que la [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) est désactivée. Les URL de confirmation et de récupération sont configurées vers l’application. L’inscription par e-mail et la confirmation sont activées, avec un mot de passe de 12 caractères minimum. Le workflow GitHub Actions a réussi : installation figée, tests de décision, TypeScript et compilation.

L’envoi utilise encore le SMTP de test Supabase, réservé aux adresses des membres de l’organisation et sans garantie de délivrabilité. Pour le premier essai, utiliser l’adresse du compte Supabase propriétaire. Un SMTP personnalisé est nécessaire pour ouvrir les inscriptions à d’autres utilisateurs. Le parcours réel de création du compte et réception de l’e-mail reste à valider par l’utilisateur. Documentation : https://supabase.com/docs/guides/auth/auth-smtp L’absence de configuration sur une autre installation propose uniquement une démonstration clairement signalée.

## Installation iPhone

Ouvrir l’adresse HTTPS dans Safari → Partager → Sur l’écran d’accueil → Ajouter. La synchronisation exige Internet.

## Déploiement

Application React/TypeScript avec Vinext, sortie Cloudflare Worker. Les scripts fournis construisent le serveur et les ressources statiques. La migration Supabase est indépendante du déploiement de l’interface.

Le fichier `.openai/hosting.json` contient l’identité de l’hébergement Sites. Le dépôt GitHub public sert à conserver et modifier le code ; il ne rend pas les données Supabase publiques et ne déploie pas automatiquement l’application.

Les anciens tableaux sans colonne apparaissent dans **Pour**. Le bouton « Vers Contre » déplace un critère avec tous ses sous-critères. La colonne est conservée dans le JSON `criteria` existant, sans migration ni modification des comparaisons.

## Historique statistique

`cm_progress` conserve le dernier état enregistré de chaque journée (Europe/Paris). Des triggers sur les cinq tables métier actualisent notes, décisions, tableaux, compétences, actions et scores des valeurs après chaque écriture. Les brouillons ne changent pas les statistiques. Une base réelle est créée à l’installation de la migration ; aucun historique antérieur n’est reconstitué. Les jours sans écriture ne créent pas de points. Le navigateur recharge les 90 derniers points après sauvegarde et lors de l’actualisation du profil ; l’export JSON inclut ces points.

Les nombres de notes/décisions/tableaux décrivent les éléments conservés, pas un cumul de créations. Les moyennes de valeurs et le taux d’actions peuvent varier si leur composition change. La démonstration utilise un historique fictif explicitement indiqué. Les fonctions de suivi sont SECURITY INVOKER et respectent les règles RLS du propriétaire ; les comptes ne peuvent consulter ni écrire les points d’un autre utilisateur.

Les actions personnelles sont indépendantes des actions du plan professionnel. Les courbes « Actions du projet pro » restent consacrées au plan ; l’onglet Actions affiche son propre compteur. Les nouvelles tâches sont incluses dans l’export JSON.
