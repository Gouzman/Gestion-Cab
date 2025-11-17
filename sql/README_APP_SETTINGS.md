# 📊 SQL - Création de la table app_settings

## Script : create_app_settings_table.sql

### 🎯 Objectif

Créer la table `app_settings` qui stocke **toute la configuration centralisée** de l'application dans un format JSON flexible.

---

## 📦 Ce que fait le script

1. **Crée la table `app_settings`** avec 3 champs JSON :
   - `company_info` - Informations de l'entreprise
   - `menu_config` - Configuration du menu
   - `categories_config` - Catégories et types

2. **Insère une ligne par défaut** avec les valeurs initiales

3. **Crée un index** sur le nom de l'entreprise pour des requêtes rapides

4. **Configure les policies RLS** :
   - Lecture : Tous les utilisateurs authentifiés
   - Modification : Uniquement Admin/Gérant

5. **Active RLS** sur la table

6. **Crée un trigger** pour mettre à jour automatiquement `updated_at`

7. **Affiche la configuration** pour vérifier que tout fonctionne

---

## 🚀 Comment l'exécuter

### Méthode 1 : Via l'interface Supabase (recommandé)

1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur **SQL Editor** dans le menu latéral
4. Cliquez sur **New Query**
5. Copiez le contenu de `create_app_settings_table.sql`
6. Collez dans l'éditeur
7. Cliquez sur **Run** (ou Ctrl+Enter)

### Méthode 2 : Via psql (avancé)

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f create_app_settings_table.sql
```

---

## ✅ Résultat attendu

Vous devriez voir dans les résultats :

```
CREATE TABLE
INSERT 0 1
CREATE INDEX
DROP POLICY
CREATE POLICY
DROP POLICY
CREATE POLICY
ALTER TABLE
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER

 id |   company_name    | menu_items_count |         created_at         
----+-------------------+------------------+----------------------------
  1 | Cabinet d'Avocats |                9 | 2024-11-15 12:00:00.000000
(1 row)
```

---

## 🔍 Vérifications post-installation

### 1. Vérifier que la table existe

```sql
SELECT * FROM app_settings;
```

**Résultat attendu :** 1 ligne avec les valeurs par défaut

### 2. Vérifier les policies RLS

```sql
SELECT * FROM pg_policies WHERE tablename = 'app_settings';
```

**Résultat attendu :** 2 policies
- `allow_read_app_settings` (SELECT)
- `allow_update_app_settings` (UPDATE)

### 3. Vérifier le trigger

```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'app_settings'::regclass;
```

**Résultat attendu :** `update_app_settings_updated_at`

---

## 📊 Structure de la table

```sql
app_settings
├── id: INTEGER PRIMARY KEY DEFAULT 1
├── company_info: JSONB
├── menu_config: JSONB
├── categories_config: JSONB
├── created_at: TIMESTAMPTZ DEFAULT NOW()
└── updated_at: TIMESTAMPTZ DEFAULT NOW()
```

### Contrainte importante
**Une seule ligne dans la table** (id = 1)

C'est une table de configuration singleton. Toutes les modifications se font sur la ligne avec `id=1`.

---

## 🔒 Sécurité

### Policies RLS configurées

#### allow_read_app_settings
```sql
FOR SELECT
USING (auth.uid() IS NOT NULL)
```
→ Tous les utilisateurs authentifiés peuvent lire

#### allow_update_app_settings
```sql
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'gerant')
  )
)
```
→ Seuls les admins et gérants peuvent modifier

---

## 🎨 Valeurs par défaut

### company_info
```json
{
  "name": "Cabinet d'Avocats",
  "logo_url": "",
  "address": "",
  "phone": "",
  "email": "",
  "slogan": "",
  "description": ""
}
```

### menu_config
```json
{
  "items": [
    {"id": "dashboard", "label": "Tableau de bord", "enabled": true, "order": 1},
    {"id": "clients", "label": "Clients", "enabled": true, "order": 2},
    {"id": "cases", "label": "Dossiers", "enabled": true, "order": 3},
    {"id": "tasks", "label": "Tâches", "enabled": true, "order": 4},
    {"id": "documents", "label": "Documents", "enabled": true, "order": 5},
    {"id": "calendar", "label": "Calendrier", "enabled": true, "order": 6},
    {"id": "team", "label": "Collaborateurs", "enabled": true, "order": 7},
    {"id": "billing", "label": "Facturation", "enabled": true, "order": 8},
    {"id": "settings", "label": "Paramètres", "enabled": true, "order": 9}
  ]
}
```

### categories_config
```json
{
  "task_categories": [],
  "case_types": [],
  "user_roles": [
    {"value": "admin", "label": "Administrateur"},
    {"value": "gerant", "label": "Gérant"},
    {"value": "avocat", "label": "Avocat"},
    {"value": "secretaire", "label": "Secrétaire"}
  ],
  "task_statuses": [
    {"value": "todo", "label": "À faire", "color": "gray"},
    {"value": "in_progress", "label": "En cours", "color": "blue"},
    {"value": "done", "label": "Terminé", "color": "green"}
  ],
  "case_statuses": [
    {"value": "open", "label": "Ouvert", "color": "green"},
    {"value": "in_progress", "label": "En cours", "color": "blue"},
    {"value": "closed", "label": "Fermé", "color": "gray"}
  ]
}
```

---

## 🔧 Modification de la table

### Ajouter un nouveau champ JSON

```sql
ALTER TABLE app_settings 
ADD COLUMN theme_config JSONB DEFAULT '{}'::jsonb;
```

### Mettre à jour les valeurs par défaut

```sql
UPDATE app_settings 
SET company_info = jsonb_set(
  company_info, 
  '{name}', 
  '"Mon Nouveau Cabinet"'::jsonb
)
WHERE id = 1;
```

---

## ❌ Erreurs courantes

### Erreur : "relation app_settings already exists"
**Solution :** La table existe déjà. Vous pouvez :
- Supprimer la table : `DROP TABLE app_settings CASCADE;`
- Ou ignorer l'erreur si la structure est correcte

### Erreur : "permission denied"
**Solution :** Vous devez être connecté avec un compte ayant les droits de création de tables (généralement le propriétaire du projet Supabase)

### Erreur : "table profiles does not exist"
**Solution :** La policy RLS dépend de la table `profiles`. Assurez-vous qu'elle existe, sinon modifiez la policy pour utiliser `auth.users` à la place.

---

## 🧪 Tests manuels

### Test 1 : Lire les paramètres

```sql
SELECT 
  company_info->>'name' as company_name,
  jsonb_array_length(menu_config->'items') as menu_items,
  categories_config->'user_roles' as roles
FROM app_settings;
```

### Test 2 : Modifier le nom de l'entreprise

```sql
UPDATE app_settings 
SET company_info = jsonb_set(
  company_info, 
  '{name}', 
  '"Mon Test Cabinet"'::jsonb
)
WHERE id = 1;
```

### Test 3 : Vérifier updated_at

```sql
-- Avant
SELECT updated_at FROM app_settings;

-- Faire une modification
UPDATE app_settings SET company_info = company_info WHERE id = 1;

-- Après (devrait être différent)
SELECT updated_at FROM app_settings;
```

---

## 📚 Ressources

- **Documentation Supabase :** https://supabase.com/docs
- **JSONB PostgreSQL :** https://www.postgresql.org/docs/current/datatype-json.html
- **Row Level Security :** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist post-installation

- [ ] La table `app_settings` existe
- [ ] Il y a 1 ligne avec id=1
- [ ] Les 2 policies RLS sont actives
- [ ] Le trigger `updated_at` fonctionne
- [ ] La requête SELECT finale affiche la config par défaut
- [ ] Vous pouvez modifier le nom de l'entreprise en tant qu'admin
- [ ] Un utilisateur normal peut lire mais pas modifier

---

**Temps d'installation : ~2 minutes** ⏱️

**Complexité : Facile** 🟢

**Réversible : Oui** (DROP TABLE app_settings CASCADE)
