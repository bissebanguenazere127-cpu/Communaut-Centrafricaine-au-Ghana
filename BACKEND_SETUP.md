# Configuration du backend CCG

Le serveur Node protege l'administration avec un compte unique configure par
variables d'environnement. Il sert aussi d'intermediaire securise avec
Supabase pour les messages, demandes d'adhesion et actualites : la cle
`service_role` reste exclusivement sur le serveur.

## Demarrage local

1. Copiez `.env.example` vers `.env`.
2. Configurez les variables suivantes :

   - `ADMIN_EMAIL` : doit être exactement `ccdughana@gmail.com`. Toute autre
     valeur empêche le serveur de démarrer et toute autre adresse est refusée
     à la connexion ;
   - `ADMIN_PASSWORD` : un mot de passe unique d'au moins 15 caracteres ;
   - `SESSION_SECRET` : une valeur aleatoire d'au moins 32 caracteres ;
   - `SUPABASE_URL` : l'URL HTTPS de votre projet Supabase ;
   - `SUPABASE_SECRET_KEY` : la clé Secret Supabase (`sb_secret_...`).

   Les deux variables Supabase sont necessaires pour administrer les donnees
   du site. La connexion administrateur peut fonctionner sans elles.

3. Executez [`schema.sql`](schema.sql) dans le SQL Editor de Supabase. Pour
   un projet Supabase déjà créé, exécutez aussi la migration
   [`202610190001_lock_admin_to_cc_email.sql`](supabase/migrations/202610190001_lock_admin_to_cc_email.sql).
4. Demarrez le site :

   ```powershell
   npm start
   ```

5. Ouvrez `http://localhost:3000/login.html`.

## API d'administration

Toutes ces routes exigent une session administrateur. Les routes de mutation
acceptent du JSON et refusent les requetes dont l'origine n'est pas le site.

- `GET /api/admin/overview` : session et compteurs ;
- `GET /api/admin/contact-messages?status=new&limit=30` ;
- `PATCH /api/admin/contact-messages/:id` avec `{ "status": "read" }` ;
- `GET /api/admin/membership-requests?status=pending&limit=30` ;
- `PATCH /api/admin/membership-requests/:id` avec `{ "status": "approved" }` ;
- `GET /api/admin/news?status=draft&limit=30` ;
- `POST /api/admin/news` pour creer un brouillon ou publier un article ;
- `PATCH /api/admin/news/:id` pour modifier ou publier un article.

## Publication

Deployez sur un hebergeur Node.js et configurez les cinq variables comme
secrets. N'ajoutez jamais `.env` au depot. Ne placez jamais
`SUPABASE_SECRET_KEY` dans `supabsae-config.js` ou dans un autre fichier
public : cette cle contourne les politiques RLS.

### Deploiement Vercel

Le dossier `api/` fournit une fonction serverless qui alimente les routes
`/api/auth/*` et `/api/admin/*`. Dans **Vercel > Project > Settings >
Environment Variables**, ajoutez les valeurs de votre fichier local `.env` :

- `ADMIN_EMAIL` (exactement `ccdughana@gmail.com`)
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Ajoutez-les au minimum a l'environnement **Production**, puis effectuez un
nouveau deploiement. Les trois premieres variables sont requises pour se
connecter ; les deux variables Supabase permettent d'afficher et gerer les
messages et demandes. Ne copiez pas le fichier `.env` dans Vercel et ne
mettez aucune cle Secret dans `supabsae-config.js`.

Si le tableau d'administration indique que la clé Supabase est refusée, copiez
une clé **Secret** active (`sb_secret_...`) depuis **Supabase > Project Settings
> API** dans `SUPABASE_SECRET_KEY`. Une clé Publishable ou Anon ne peut pas
charger les messages ni valider les inscriptions.

Le serveur protege `admi.html`, signe une session HTTP-only valable huit
heures et limite les tentatives de connexion.

## Messages et demandes d'adhesion

Le site public enregistre directement les messages dans `contact_messages` et
les inscriptions dans `membership_requests` de Supabase. Les politiques RLS
autorisent uniquement leur création par les visiteurs ; elles ne leur donnent
aucun droit de lecture.

Après le déploiement du site public, démarrez ce projet localement avec les
mêmes valeurs `SUPABASE_URL` et `SUPABASE_SECRET_KEY` dans `.env`, puis ouvrez
`http://localhost:3000/login.html`. Le tableau d'administration local affiche
les nouveaux messages et demandes de la base déployée. Vous pourrez marquer
les messages comme lus et approuver ou refuser chaque inscription. Ne placez
jamais la clé Secret dans un fichier envoyé aux visiteurs.

Supabase applique la même règle à ses sessions Auth : la fonction
`is_ccg_admin()` ne renvoie `true` que pour `ccdughana@gmail.com`, si son
profil a été approuvé et marqué `admin` par le serveur. Aucun autre compte ne
peut devenir administrateur.
