# ✅ CHECKLIST DE VÉRIFICATION - Conformité Juridique

**Avant de mettre en production, vérifier les points suivants :**

---

## 📋 1. MIGRATION SQL

### ✅ Exécution de la migration
- [ ] Le fichier `sql/migration_conformite_juridique.sql` a été exécuté dans Supabase
- [ ] Aucune erreur n'est apparue lors de l'exécution
- [ ] Le message "✅ Migration terminée avec succès" est apparu

### ✅ Vérification des colonnes

Exécuter dans SQL Editor :

```sql
-- Vérifier la colonne client_code
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'client_code';
-- Attendu : client_code | text | NO

-- Vérifier les colonnes dossiers
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cases' 
AND column_name IN ('code_dossier', 'id_dossier', 'objet_du_dossier', 'type_de_diligence', 'qualite_du_client');
-- Attendu : 5 lignes

-- Vérifier la table dossier_instance
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'dossier_instance';
-- Attendu : 1

-- Vérifier le trigger
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_generate_client_code';
-- Attendu : trigger_generate_client_code
```

### ✅ Vérification des index

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('clients', 'cases', 'dossier_instance') 
AND indexname LIKE '%client_code%' 
OR indexname LIKE '%code_dossier%' 
OR indexname LIKE '%id_dossier%';
-- Attendu : 3 index minimum
```

---

## 📋 2. FRONTEND

### ✅ Clients

**Test de création** :
- [ ] Créer un client nommé "AMADOU"
- [ ] Vérifier que le `client_code` est généré automatiquement (ex: 01.001)
- [ ] Créer un deuxième client nommé "AMANI"
- [ ] Vérifier que le code est 01.002

**Test d'affichage** :
- [ ] Dans la liste des clients, vérifier le badge "N° XX.XXX"
- [ ] Dans le formulaire dossier, vérifier que le select client affiche "XX.XXX - Nom"

**Test du formulaire** :
- [ ] Type "Entreprise" → affiche "Nom de l'entreprise"
- [ ] Type "Particulier" → affiche "Nom" puis "Prénoms"

### ✅ Dossiers

**Test du formulaire (ordre des champs)** :
- [ ] 1. Id dossier (si édition, lecture seule)
- [ ] 2. Réf dossier (obligatoire)
- [ ] 3. Type de dossier (obligatoire)
- [ ] 4. Client (obligatoire, affiche code_client)
- [ ] 5. Qualité du client (obligatoire)
- [ ] 6. Type de diligence
- [ ] 7. Objet du dossier
- [ ] 8. Titre du dossier (obligatoire)

**Test de création** :
- [ ] Remplir tous les champs obligatoires
- [ ] Cliquer sur "Créer le dossier"
- [ ] Vérifier qu'aucune erreur Supabase n'apparaît
- [ ] Vérifier que le dossier est créé

**Test d'édition** :
- [ ] Modifier un dossier existant
- [ ] Vérifier que `id_dossier` est affiché en lecture seule
- [ ] Modifier des champs et sauvegarder
- [ ] Vérifier que les modifications sont enregistrées

**Test "Autorisé à"** :
- [ ] Le label est "Autorisé à" (et non "Visible par")
- [ ] Les checkboxes des collaborateurs fonctionnent

**Test pièces jointes** :
- [ ] 2 boutons distincts : "Choisir des fichiers" et "Importer fichier"
- [ ] Les deux boutons fonctionnent

### ✅ Documents

**Test d'upload** :
- [ ] Ouvrir la modale d'upload
- [ ] Vérifier que les 5 catégories sont présentes :
  - Documents de suivi et facturation
  - Pièces
  - Écritures
  - Courriers
  - Observations et notes
- [ ] Essayer d'uploader sans sélectionner de catégorie
- [ ] Une erreur doit apparaître
- [ ] Sélectionner une catégorie et uploader
- [ ] Le document doit être uploadé avec succès

---

## 📋 3. BASE DE DONNÉES

### ✅ Données de test

```sql
-- Insérer un client de test
INSERT INTO clients (type, name, first_name, last_name, email, phone)
VALUES ('individual', 'TEST Jean', 'Jean', 'TEST', 'test@test.fr', '0123456789');

-- Vérifier la génération du code
SELECT client_code, name FROM clients WHERE name LIKE 'TEST%';
-- Attendu : code_client au format XX.XXX

-- Insérer un dossier de test
INSERT INTO cases (title, code_dossier, case_type, client_id, qualite_du_client, created_by)
VALUES (
  'Dossier de test', 
  'REF-TEST-001', 
  'Droit Civil', 
  (SELECT id FROM clients WHERE name LIKE 'TEST%' LIMIT 1),
  'personne_physique',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Vérifier la création
SELECT id, id_dossier, code_dossier, title FROM cases WHERE code_dossier = 'REF-TEST-001';
-- Attendu : 1 ligne avec id_dossier auto-généré

-- Nettoyer les tests
DELETE FROM cases WHERE code_dossier = 'REF-TEST-001';
DELETE FROM clients WHERE name LIKE 'TEST%';
```

### ✅ RLS (Row Level Security)

```sql
-- Vérifier que RLS est activé sur dossier_instance
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dossier_instance';
-- Attendu : dossier_instance | true

-- Vérifier les policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'dossier_instance';
-- Attendu : 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

---

## 📋 4. PERFORMANCES

### ✅ Vérifier les index

```sql
-- Temps de requête sur clients avec client_code
EXPLAIN ANALYZE SELECT * FROM clients WHERE client_code = '01.001';
-- Doit utiliser l'index idx_clients_client_code

-- Temps de requête sur cases avec code_dossier
EXPLAIN ANALYZE SELECT * FROM cases WHERE code_dossier = 'REF-2025-001';
-- Doit utiliser l'index idx_cases_code_dossier
```

---

## 📋 5. CONSOLE NAVIGATEUR

### ✅ Aucune erreur

**Ouvrir la console (F12) et vérifier** :
- [ ] Aucune erreur rouge lors du chargement
- [ ] Aucune erreur lors de la création d'un client
- [ ] Aucune erreur lors de la création d'un dossier
- [ ] Aucune erreur lors de l'upload d'un document

### ✅ Logs de debug

**Dans la console, vérifier les logs** :
- [ ] Lors de la création d'un dossier, le payload doit contenir :
  ```javascript
  {
    code_dossier: "REF-2025-001",
    objet_du_dossier: "...",
    type_de_diligence: "...",
    qualite_du_client: "personne_physique",
    // ...
  }
  ```

---

## 📋 6. DOCUMENTATION

### ✅ Fichiers présents

- [ ] `sql/migration_conformite_juridique.sql`
- [ ] `MIGRATION_CONFORMITE_JURIDIQUE.md`
- [ ] `MISSION_ACCOMPLIE_CONFORMITE.md`
- [ ] `QUICK_START_CONFORMITE.md`
- [ ] `CHECKLIST_CONFORMITE.md` (ce fichier)
- [ ] `commit-conformite.sh`

### ✅ Composants

- [ ] `src/components/CaseForm.jsx` (restructuré)
- [ ] `src/components/InstancesManager.jsx` (créé)
- [ ] `src/components/CaseForm_OLD.jsx` (backup)

---

## 📋 7. COMMIT GIT

### ✅ Avant de commiter

- [ ] Tous les tests ci-dessus sont passés
- [ ] La migration SQL a été exécutée avec succès
- [ ] L'application démarre sans erreur
- [ ] Les fonctionnalités principales fonctionnent

### ✅ Commit

```bash
# Option 1 : Script automatique
./commit-conformite.sh

# Option 2 : Manuelle
git add .
git commit -m "feat: Conformité procédures juridiques"
git push
```

---

## 📋 8. DÉPLOIEMENT EN PRODUCTION

### ✅ Avant le déploiement

- [ ] Toutes les cases ci-dessus sont cochées
- [ ] Les tests ont été effectués en environnement de développement
- [ ] La migration SQL a été testée sur une base de données de test
- [ ] Les utilisateurs ont été informés des nouvelles fonctionnalités

### ✅ Pendant le déploiement

1. [ ] Faire un backup de la base de données de production
2. [ ] Exécuter `sql/migration_conformite_juridique.sql` sur la production
3. [ ] Déployer le code frontend
4. [ ] Vérifier que l'application fonctionne

### ✅ Après le déploiement

- [ ] Tester la création d'un client en production
- [ ] Tester la création d'un dossier en production
- [ ] Vérifier que les anciens clients ont bien leur `client_code` généré
- [ ] Vérifier que les anciens dossiers sont toujours accessibles

---

## 🎯 CRITÈRES DE VALIDATION

**L'application est prête pour la production si :**

✅ Tous les points de cette checklist sont validés  
✅ Aucune erreur dans la console navigateur  
✅ Aucune erreur dans les logs Supabase  
✅ Les tests de création/modification fonctionnent  
✅ Les données existantes sont préservées  

---

## ⚠️ EN CAS DE PROBLÈME

### Rollback SQL

Si la migration pose problème, vous pouvez revenir en arrière :

```sql
-- Supprimer les nouveaux champs
ALTER TABLE clients DROP COLUMN IF EXISTS client_code;
ALTER TABLE cases DROP COLUMN IF EXISTS code_dossier;
ALTER TABLE cases DROP COLUMN IF EXISTS id_dossier;
ALTER TABLE cases DROP COLUMN IF EXISTS objet_du_dossier;
ALTER TABLE cases DROP COLUMN IF EXISTS type_de_diligence;
ALTER TABLE cases DROP COLUMN IF EXISTS qualite_du_client;
ALTER TABLE tasks_files DROP COLUMN IF EXISTS document_category;
DROP TABLE IF EXISTS dossier_instance;
DROP TRIGGER IF EXISTS trigger_generate_client_code ON clients;
DROP FUNCTION IF EXISTS generate_client_code();
DROP SEQUENCE IF EXISTS cases_id_dossier_seq;
```

### Rollback Frontend

```bash
# Restaurer l'ancien CaseForm
mv src/components/CaseForm.jsx src/components/CaseForm_NEW.jsx
mv src/components/CaseForm_OLD.jsx src/components/CaseForm.jsx

# Puis relancer l'application
npm run dev
```

---

**✅ Checklist complétée ? Vous êtes prêt pour la production !**

*Version : 1.0 - 28 novembre 2025*
