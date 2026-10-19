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

3. Executez [`schema.sql`](schema.sql) dans le SQL Editor de Supabase.
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

Le serveur protege `admi.html`, signe une session HTTP-only valable huit
heures et limite les tentatives de connexion.
