# 🚀 Guide d'exécution - Migration client_code

## Étapes à suivre (dans l'ordre)

### 1️⃣ Exécuter le script SQL dans Supabase

1. Ouvrir votre projet Supabase : https://supabase.com
2. Aller dans **SQL Editor** (dans le menu de gauche)
3. Cliquer sur **+ New query**
4. Copier le contenu du fichier `sql/add_client_code_column.sql`
5. Coller dans l'éditeur
6. Cliquer sur **Run** (ou Ctrl/Cmd + Enter)
7. Vérifier qu'il n'y a pas d'erreurs

**Résultat attendu** :
```
✅ ALTER TABLE
✅ DO
✅ ALTER TABLE
✅ ALTER TABLE
✅ CREATE INDEX
✅ COMMENT
```

### 2️⃣ Vérifier que la colonne a été créée

Exécuter cette requête dans SQL Editor :

```sql
SELECT id, client_code, name, type 
FROM clients 
LIMIT 10;
```

**Résultat attendu** :
```
id                                    | client_code | name           | type
--------------------------------------|-------------|----------------|------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | CLI-001     | Jean Dupont    | individual
b2c3d4e5-f6a7-8901-bcde-f12345678901 | ENT-001     | Société ABC    | company
...
```

### 3️⃣ Tester l'application

1. **Rafraîchir l'application** dans le navigateur (Ctrl/Cmd + R)
2. **Ouvrir la gestion des dossiers**
3. **Cliquer sur "Nouveau Dossier"**
4. **Vérifier le champ "Client"** :
   - ✅ Doit être un dropdown (select)
   - ✅ Doit afficher la liste des clients au format "CLI-001 - Jean Dupont"
5. **Sélectionner un client**
6. **Remplir les autres champs**
7. **Créer le dossier**
8. **Vérifier qu'il n'y a pas d'erreur**

### 4️⃣ Vérifier dans la base de données

Exécuter cette requête pour voir le nouveau dossier :

```sql
SELECT 
  cases.id,
  cases.title,
  cases.client_id,
  clients.client_code,
  clients.name as client_name
FROM cases
LEFT JOIN clients ON cases.client_id = clients.id
ORDER BY cases.created_at DESC
LIMIT 5;
```

**Résultat attendu** :
```
id     | title    | client_id (UUID)               | client_code | client_name
-------|----------|--------------------------------|-------------|-------------
...    | test-10  | a1b2c3d4-e5f6-7890-abcd-...   | CLI-001     | Jean Dupont
```

✅ `client_id` contient bien un **UUID** et non "CLI-001"

### 5️⃣ Vérifier les logs de la console

Dans la console du navigateur (F12), rechercher :

```
Payload envoyé à Supabase : {
  title: "test-10",
  client_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  ← UUID valide
  opposing_party: "...",
  ...
}
```

## ⚠️ En cas de problème

### Problème 1 : "column client_code already exists"

**Cause** : La colonne existe déjà (migration déjà exécutée)

**Solution** : Passer à l'étape suivante, la migration est déjà faite

### Problème 2 : Le dropdown est vide

**Cause** : Problème de permissions RLS (Row Level Security)

**Solution** : Vérifier les policies dans Supabase :

```sql
-- Vérifier les policies sur la table clients
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Si besoin, créer une policy pour lire les clients
CREATE POLICY "Allow read access to clients" ON clients
FOR SELECT
USING (true);
```

### Problème 3 : Erreur "invalid input syntax for type uuid"

**Cause** : Le code envoie encore un code texte au lieu d'un UUID

**Solution** : 
1. Vérifier que le fichier `CaseForm.jsx` a bien été modifié
2. Rafraîchir la page (Ctrl/Cmd + R)
3. Vider le cache du navigateur si nécessaire

### Problème 4 : Erreur "duplicate key value violates unique constraint"

**Cause** : Deux clients ont le même `client_code`

**Solution** : Régénérer les codes manuellement :

```sql
-- Supprimer les doublons
WITH duplicates AS (
  SELECT id, client_code, 
         ROW_NUMBER() OVER (PARTITION BY client_code ORDER BY created_at) as rn
  FROM clients
  WHERE client_code IS NOT NULL
)
UPDATE clients
SET client_code = client_code || '-' || duplicates.rn
FROM duplicates
WHERE clients.id = duplicates.id AND duplicates.rn > 1;
```

## 📞 Support

Si vous rencontrez d'autres problèmes :

1. Vérifier les logs de la console navigateur (F12)
2. Vérifier les logs Supabase (onglet Logs dans le dashboard)
3. Consulter la documentation complète : `MIGRATION_CLIENT_CODE.md`

---

✅ Migration terminée avec succès !
