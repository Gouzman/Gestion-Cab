# 🚀 Guide de Déploiement - Champs Juridiques

## 📋 Résumé des Modifications

Cette mise à jour ajoute les champs juridiques requis par les Articles 73-82 :

### ✅ Fonctionnalités Ajoutées

1. **Génération automatique du numéro de dossier** (format YY.NN)
   - 25.01 pour le premier dossier de 2025
   - 25.02 pour le deuxième, etc.
   - Le champ `code_dossier` devient **optionnel** (auto-généré si laissé vide)

2. **5 Nouveaux champs juridiques** :
   - **Juridiction** : Juridiction compétente (ex: TPI Lomé)
   - **Numéro RG** : Numéro au Répertoire Général
   - **Type de procédure** : Référé, Fond, Appel, Cassation, etc.
   - **Avocat adverse** : Nom de l'avocat de la partie adverse
   - **Numéro cabinet d'instruction** : Référence au cabinet d'instruction

---

## 🎯 Étapes de Déploiement

### ÉTAPE 1 : Migration Base de Données (Supabase) ⚠️

**🔴 IMPORTANT : Exécuter dans cet ordre !**

#### 1.1 Ajouter les champs juridiques

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet `Gestion-Cab`
3. Allez dans **SQL Editor** (icône `</>`)
4. Créez une nouvelle requête
5. Copiez-collez le contenu de : `sql/add_juridical_fields.sql`
6. Cliquez sur **RUN** ▶️
7. ✅ Vérifiez le message : "5 colonnes ajoutées avec succès"

#### 1.2 Activer la génération automatique

1. Dans le même SQL Editor
2. Créez une nouvelle requête
3. Copiez-collez le contenu de : `sql/fix_case_number_generation.sql`
4. Cliquez sur **RUN** ▶️
5. ✅ Vérifiez les tests :
   - "Test 1 - Code généré : 25.01"
   - "Test 2 - Code généré : 25.02"
   - "Test 3 - Code manuel préservé : REF-2025-001"

---

### ÉTAPE 2 : Activer les Fonctionnalités (Frontend)

**Fichier : `src/config/features.js`**

Changez cette ligne :
```javascript
// AVANT
export const MIGRATION_EXECUTED = false;

// APRÈS
export const MIGRATION_EXECUTED = true;
```

---

### ÉTAPE 3 : Construire et Déployer

#### 3.1 Build local

```bash
cd /Users/gouzman/Documents/Gestion-Cab
npm run build
```

✅ Vérifiez qu'il n'y a pas d'erreurs de build

#### 3.2 Déployer en production

```bash
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
```

✅ Attendez le message : "100% ... MB/s"

#### 3.3 Vider le cache nginx

```bash
ssh root@82.25.116.122 "rm -rf /var/cache/nginx/* && systemctl reload nginx"
```

---

### ÉTAPE 4 : Tests de Validation 🧪

#### Test 1 : Génération automatique du numéro

1. Connectez-vous sur https://www.ges-cab.com
2. Allez dans **Dossiers** → **Nouveau dossier**
3. **NE PAS remplir** le champ "Numéro de dossier"
4. Remplissez les autres champs obligatoires
5. Cliquez sur **Créer**
6. ✅ Vérifiez qu'un numéro a été généré automatiquement (ex: `25.01`)

#### Test 2 : Numéro manuel préservé

1. Créez un nouveau dossier
2. **Remplissez** le champ "Numéro de dossier" avec : `REF-2025-CUSTOM`
3. Sauvegardez
4. ✅ Vérifiez que le numéro manuel est préservé

#### Test 3 : Nouveaux champs juridiques

1. Dans la création d'un dossier
2. ✅ Vérifiez la présence des nouveaux champs :
   - Avocat Partie Adverse
   - Juridiction
   - Numéro RG
   - Type de Procédure (dropdown)
   - Numéro Cabinet d'Instruction

#### Test 4 : Édition d'un dossier existant

1. Ouvrez un dossier créé avant la mise à jour
2. Cliquez sur **Modifier**
3. ✅ Vérifiez que les nouveaux champs sont présents
4. Remplissez-les et sauvegardez
5. ✅ Vérifiez que les valeurs sont bien enregistrées

---

## 📊 Fichiers Modifiés

### Backend (SQL)
- ✅ `sql/add_juridical_fields.sql` (CRÉÉ)
- ✅ `sql/fix_case_number_generation.sql` (CRÉÉ)

### Frontend (React)
- ✅ `src/components/CaseForm.jsx` (MODIFIÉ)
  - Champ `code_dossier` devient optionnel
  - Ajout de 6 nouveaux inputs
  - Ajout de `Scale` icon (lucide-react)
  
- ✅ `src/config/features.js` (MODIFIÉ)
  - Ajout de `juridicalColumns` dans `getCaseColumns()`
  - Configuration prête pour activation

---

## 🔍 Rollback (En cas de problème)

### Si problème après migration SQL :

1. **Supprimer le trigger** (dans Supabase SQL Editor) :
   ```sql
   DROP TRIGGER IF EXISTS generate_case_number_trigger ON cases;
   DROP FUNCTION IF EXISTS generate_case_number();
   ```

2. **Supprimer les colonnes** (⚠️ PERTE DE DONNÉES) :
   ```sql
   ALTER TABLE cases 
     DROP COLUMN IF EXISTS juridiction,
     DROP COLUMN IF EXISTS numero_rg,
     DROP COLUMN IF EXISTS type_procedure,
     DROP COLUMN IF EXISTS avocat_adverse,
     DROP COLUMN IF EXISTS numero_cabinet_instruction;
   ```

### Si problème après déploiement frontend :

1. Dans `src/config/features.js`, remettez :
   ```javascript
   export const MIGRATION_EXECUTED = false;
   ```

2. Rebuild et redéployez :
   ```bash
   npm run build
   scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
   ```

---

## 📝 Notes Importantes

- ✅ Les dossiers existants gardent leur numéro actuel
- ✅ Le numéro auto-généré respecte le format YY.NN (Article 73)
- ✅ Les nouveaux champs sont **optionnels** (pas de perte de compatibilité)
- ✅ La migration SQL est **idempotente** (peut être exécutée plusieurs fois)
- ✅ Les index sont ajoutés pour optimiser les performances

---

## 🎯 Prochaines Étapes (Priority 2)

Après validation de cette mise à jour :

1. **Gestion des instances** (Article 77)
   - Table `dossier_instance`
   - Opposition, Appel, Cassation
   
2. **Regroupement de dossiers** (Article 79)
   - "Chemise à sangle"
   - Lien entre dossiers

3. **Clients conventionnés** (Article 81)
   - Marqueur `conventionné`
   - Flux spécifique secrétariat

---

## ✅ Checklist de Déploiement

- [ ] ÉTAPE 1.1 : Exécuter `sql/add_juridical_fields.sql`
- [ ] ÉTAPE 1.2 : Exécuter `sql/fix_case_number_generation.sql`
- [ ] ÉTAPE 2 : Changer `MIGRATION_EXECUTED = true`
- [ ] ÉTAPE 3.1 : `npm run build`
- [ ] ÉTAPE 3.2 : Déployer sur serveur
- [ ] ÉTAPE 3.3 : Vider cache nginx
- [ ] ÉTAPE 4 : Tests de validation (4 tests)
- [ ] 🎉 Mise à jour terminée !

---

**Date de création** : 2025-01-XX  
**Version** : 1.0.0  
**Taux de conformité** : 65% → 75% (objectif : 85%)
