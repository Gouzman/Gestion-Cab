# 📋 MIGRATION - Conformité Procédures Juridiques

**Date** : 28 novembre 2025  
**Objectif** : Mettre l'application Gestion-Cab en conformité avec les procédures réelles de gestion de dossiers juridiques

---

## 🎯 RÉSUMÉ DES MODIFICATIONS

### ✅ 1 — NUMÉRO CLIENT (code_client)

**Implémenté** :
- ✅ Ajout du champ `client_code` dans la table `clients`
- ✅ Génération automatique selon la règle **AA.NNN**
  - **AA** = Numéro de la lettre du nom (A=01, B=02, ..., Z=26)
  - **NNN** = Numéro d'ordre incrémenté par lettre
  - Exemple : **KOFFI** → K → **11.001**
- ✅ Trigger PostgreSQL pour génération automatique à l'insertion
- ✅ UUID interne conservé, mais `client_code` affiché dans l'UI
- ✅ Select des clients affiche : `code_client - Nom`

**Fichiers modifiés** :
- `sql/migration_conformite_juridique.sql` (migration SQL)
- `src/components/ClientManager.jsx` (affichage code_client)
- `src/components/ClientListItem.jsx` (badge N° client)
- `src/components/CaseForm.jsx` (select client avec code)

---

### ✅ 2 — NUMÉRO DOSSIER

**Implémenté** :
- ✅ Ajout du champ `code_dossier` (saisi manuellement par l'utilisateur)
- ✅ Ajout du champ `id_dossier` (auto-incrémenté, usage interne, non affiché)
- ✅ Toutes les références frontend utilisent `code_dossier`

**Fichiers modifiés** :
- `sql/migration_conformite_juridique.sql` (création séquence + colonnes)
- `src/components/CaseForm.jsx` (champ Réf dossier)
- `src/components/CaseManager.jsx` (gestion code_dossier)

---

### ✅ 3 — CATÉGORIES DE DOCUMENTS

**Implémenté** :
- ✅ Ajout du champ `document_category` dans `tasks_files` et `documents`
- ✅ 5 catégories obligatoires :
  1. Documents de suivi et facturation
  2. Pièces
  3. Écritures
  4. Courriers
  5. Observations et notes
- ✅ Modale d'upload modifiée pour rendre la catégorie obligatoire

**Fichiers modifiés** :
- `sql/migration_conformite_juridique.sql` (ajout colonne)
- `src/components/DocumentUploadModal.jsx` (liste des catégories)
- `src/components/DocumentManager.jsx` (filtrage par catégorie - à venir)

---

### ✅ 4 — INSTANCES JURIDIQUES (Contentieux)

**Implémenté** :
- ✅ Nouvelle table `dossier_instance` créée
- ✅ Champs obligatoires :
  - `instance_type` (Tribunal, Appel, Cassation)
  - `juridiction_competente`
  - `etat_du_dossier`
  - `date_ouverture`
- ✅ RLS (Row Level Security) configuré
- ✅ Plusieurs instances par dossier possibles

**Fichiers modifiés** :
- `sql/migration_conformite_juridique.sql` (création table + policies)

**À faire (optionnel)** :
- [ ] Créer un composant React `InstancesManager.jsx` pour afficher/ajouter des instances dans la fiche dossier

---

### ✅ 5 — NOUVEAUX CHAMPS DOSSIERS

**Implémenté** :
- ✅ `objet_du_dossier` (différent de description)
- ✅ `type_de_diligence` (liste déroulante : Consultation, Contentieux, Conseil, etc.)
- ✅ `qualite_du_client` (personne_physique / personne_morale)

**Fichiers modifiés** :
- `sql/migration_conformite_juridique.sql` (ajout colonnes)
- `src/components/CaseForm.jsx` (nouveaux champs dans le formulaire)
- `src/components/CaseManager.jsx` (colonnes valides mises à jour)

---

### ✅ 6 — FORMULAIRES CLIENTS

**Implémenté** :
- ✅ Si `type === 'company'` → afficher **"Nom de l'entreprise"**
- ✅ Si `type === 'individual'` → afficher **"Nom + Prénoms"** (ordre inversé)

**Fichiers modifiés** :
- `src/components/ClientForm.jsx` (labels conditionnels)

---

### ✅ 7 — UI/UX Modale Gestion des Dossiers

**Implémenté** :
- ✅ Ordre des champs réorganisé :
  1. Id dossier (non modifiable, généré)
  2. Réf dossier (code_dossier, saisi par l'utilisateur)
  3. Type de dossier
  4. Client (select avec code_client)
  5. Qualité du client (personne physique / morale)
  6. Type de diligence
  7. Objet du dossier
  8. Titre du dossier
  9. ...autres champs...
- ✅ "Visible par" renommé en **"Autorisé à"**
- ✅ Pièces jointes : 2 boutons distincts (Choisir / Importer)

**Fichiers modifiés** :
- `src/components/CaseForm.jsx` (restructuration complète)

---

## 🚀 INSTRUCTIONS D'EXÉCUTION

### 1️⃣ Exécuter la migration SQL

1. Ouvrir le **Dashboard Supabase** : [https://supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Créer une nouvelle requête
4. Copier le contenu de `sql/migration_conformite_juridique.sql`
5. Coller et exécuter

**Résultat attendu** :
```
✅ Migration terminée avec succès
📋 Résumé des modifications :
  ✔ Code client avec génération automatique (AA.NNN)
  ✔ Code dossier (saisi manuellement) + id_dossier (auto-incrémenté)
  ✔ Catégories de documents ajoutées
  ✔ Table dossier_instance créée pour les procédures judiciaires
  ✔ Nouveaux champs dossiers : objet_du_dossier, type_de_diligence, qualite_du_client
  ✔ Index et contraintes créés
  ✔ Triggers et fonctions configurés
```

### 2️⃣ Tester l'application

```bash
# Démarrer le serveur de développement
npm run dev
```

**Tests à effectuer** :

#### ✅ Module Clients
1. Créer un nouveau client particulier
2. Vérifier que le `client_code` est généré automatiquement (ex: 11.001 pour KOFFI)
3. Créer un nouveau client entreprise
4. Vérifier l'affichage du badge "N° XX.XXX"

#### ✅ Module Dossiers
1. Ouvrir le formulaire "Nouveau Dossier"
2. Vérifier l'ordre des champs
3. Sélectionner un client → vérifier l'affichage "code_client - Nom"
4. Remplir "Réf dossier" (ex: REF-2025-001)
5. Sélectionner "Type de diligence"
6. Remplir "Objet du dossier"
7. Sélectionner "Qualité du client"
8. Créer le dossier
9. Vérifier qu'aucune erreur Supabase n'apparaît

#### ✅ Module Documents
1. Ouvrir la modale d'upload
2. Vérifier que les 5 catégories sont présentes
3. Essayer d'uploader sans catégorie → doit bloquer
4. Sélectionner une catégorie et uploader

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux fichiers
- ✅ `sql/migration_conformite_juridique.sql`
- ✅ `MIGRATION_CONFORMITE_JURIDIQUE.md` (ce fichier)
- ✅ `src/components/CaseForm_OLD.jsx` (backup)

### Fichiers modifiés
- ✅ `src/components/CaseForm.jsx`
- ✅ `src/components/CaseManager.jsx`
- ✅ `src/components/ClientForm.jsx`
- ✅ `src/components/ClientManager.jsx`
- ✅ `src/components/ClientListItem.jsx`
- ✅ `src/components/DocumentUploadModal.jsx`

---

## 🔍 VÉRIFICATIONS POST-MIGRATION

### Base de données
```sql
-- Vérifier les clients avec code_client
SELECT id, client_code, name, type FROM clients LIMIT 10;

-- Vérifier les colonnes de cases
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'cases' 
AND column_name IN ('code_dossier', 'id_dossier', 'objet_du_dossier', 'type_de_diligence', 'qualite_du_client');

-- Vérifier la table dossier_instance
SELECT * FROM dossier_instance LIMIT 5;

-- Vérifier les catégories de documents
SELECT column_name FROM information_schema.columns 
WHERE table_name IN ('tasks_files', 'documents') 
AND column_name = 'document_category';
```

### Frontend
- [ ] Les clients affichent leur `client_code` au lieu de l'UUID
- [ ] Le formulaire dossier affiche les champs dans le bon ordre
- [ ] "Visible par" est renommé en "Autorisé à"
- [ ] Les nouveaux champs (objet_du_dossier, type_de_diligence, qualite_du_client) sont présents
- [ ] L'upload de documents nécessite une catégorie

---

## 🎓 PROCHAINES ÉTAPES (Optionnel)

### 🔹 Affichage des instances juridiques
Créer un composant `InstancesManager.jsx` dans la fiche dossier pour :
- Afficher la liste des instances (Tribunal, Appel, Cassation)
- Ajouter/modifier/supprimer des instances
- Afficher l'état et la juridiction de chaque instance

### 🔹 Filtrage des documents par catégorie
Modifier `DocumentManager.jsx` pour :
- Afficher les documents regroupés par catégorie (comme des chemises)
- Ajouter des onglets pour chaque catégorie
- Améliorer la navigation

### 🔹 Recherche avancée
- Recherche de clients par `client_code`
- Recherche de dossiers par `code_dossier`
- Filtrage par type de diligence

---

## ⚠️ NOTES IMPORTANTES

### Compatibilité
- ✅ Aucune donnée existante n'est supprimée
- ✅ Les champs existants sont conservés
- ✅ Les migrations sont idempotentes (peuvent être exécutées plusieurs fois)
- ✅ Les permissions RLS sont maintenues

### Génération automatique code_client
Le trigger `generate_client_code()` génère automatiquement le code lors de l'insertion d'un nouveau client. Si vous importez des clients existants via CSV, vous pouvez :
1. Laisser `client_code` vide → sera généré automatiquement
2. Ou spécifier le code manuellement → sera respecté

### Performance
Des index ont été créés sur :
- `clients.client_code`
- `cases.code_dossier`
- `cases.id_dossier`
- `cases.objet_du_dossier` (full-text search)
- `cases.type_de_diligence`
- `cases.qualite_du_client`

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs de la console navigateur (F12)
2. Vérifier les erreurs Supabase dans le Dashboard
3. Exécuter les requêtes de vérification ci-dessus
4. Consulter le fichier `MIGRATION_CONFORMITE_JURIDIQUE.md`

---

**✅ Migration terminée avec succès !**

Tous les modules sont maintenant conformes aux procédures juridiques du cabinet.
