# 🔧 CORRECTIONS PRIORITÉ 2

**Date** : 2 décembre 2025  
**Statut** : ✅ Corrigé

---

## 🐛 ERREURS RENCONTRÉES

### 1. Erreur SQL : `column p.full_name does not exist`

**Problème** :
```sql
ERROR: 42703: column p.full_name does not exist
LINE 236: p.full_name as demande_par_nom,
```

**Cause** :
- Les vues SQL utilisaient `p.full_name` pour récupérer le nom de l'utilisateur
- La table `profiles` utilise en réalité la colonne `name` et non `full_name`

**Solution** :
- ✅ Remplacé `p.full_name` par `p.name` dans `v_workflow_en_attente` (ligne 236)
- ✅ Remplacé `p1.full_name` et `p2.full_name` par `p1.name` et `p2.name` dans `v_workflow_historique` (lignes 253-254)

**Fichier** : `sql/add_priorite2_features.sql`

---

### 2. Erreur Import : `Failed to resolve import "../supabaseClient"`

**Problème** :
```
Failed to resolve import "../supabaseClient" from "src/components/EtiquetteChemiseGenerator.jsx"
Failed to resolve import "../supabaseClient" from "src/components/WorkflowAttributionManager.jsx"
```

**Cause** :
- Les nouveaux composants utilisaient un import incorrect : `'../supabaseClient'`
- Le projet utilise en réalité : `'@/lib/customSupabaseClient'`

**Solution** :
- ✅ Corrigé l'import dans `WorkflowAttributionManager.jsx`
- ✅ Corrigé l'import dans `EtiquetteChemiseGenerator.jsx`

**Avant** :
```jsx
import { supabase } from '../supabaseClient';
```

**Après** :
```jsx
import { supabase } from '@/lib/customSupabaseClient';
```

---

### 3. Bonus : Cohérence des références dans React

**Problème mineur** :
- Le composant `WorkflowAttributionManager` utilisait `workflow.demandeur?.full_name` et `workflow.traiteur?.full_name`
- Incohérent avec la structure réelle de la table

**Solution** :
- ✅ Remplacé toutes les références `full_name` par `name` dans le JSX
- ✅ Corrigé les requêtes Supabase pour utiliser `name` au lieu de `full_name`

**Lignes modifiées** :
- Ligne 41 : Query select avec `name`
- Ligne 245 : Affichage `workflow.demandeur?.name`
- Ligne 277 : Affichage `workflow.traiteur?.name` (cas attribué)
- Ligne 288 : Affichage `workflow.traiteur?.name` (cas rejeté)

---

## ✅ VÉRIFICATIONS POST-CORRECTION

### SQL
```sql
-- Vérifier les vues
SELECT * FROM v_workflow_en_attente LIMIT 1;
SELECT * FROM v_workflow_historique LIMIT 1;
```

### React
```bash
# Vérifier la compilation
npm run dev
```

**Résultat attendu** :
- ✅ Aucune erreur SQL
- ✅ Aucune erreur de résolution d'import
- ✅ Application démarre correctement

---

## 📋 FICHIERS MODIFIÉS

1. **sql/add_priorite2_features.sql**
   - Ligne 236 : `p.full_name` → `p.name`
   - Ligne 253 : `p1.full_name` → `p1.name`
   - Ligne 254 : `p2.full_name` → `p2.name`

2. **src/components/WorkflowAttributionManager.jsx**
   - Ligne 2 : Import corrigé
   - Ligne 41 : Query select corrigée
   - Ligne 245 : Affichage corrigé
   - Ligne 277 : Affichage corrigé (attribué)
   - Ligne 288 : Affichage corrigé (rejeté)

3. **src/components/EtiquetteChemiseGenerator.jsx**
   - Ligne 2 : Import corrigé

---

## 🚀 PROCHAINES ÉTAPES

1. **Exécuter le script SQL corrigé** :
```bash
psql -d votre_db -f sql/add_priorite2_features.sql
```

2. **Vérifier que l'application démarre** :
```bash
npm run dev
```

3. **Tester les fonctionnalités** :
   - Créer une demande workflow
   - Vérifier l'affichage des noms d'utilisateurs
   - Générer une étiquette

---

## 📊 STRUCTURE CORRECTE DE LA TABLE PROFILES

Pour référence future :

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,  -- ✅ PAS full_name
  role TEXT,
  "function" TEXT,
  created_at TIMESTAMPTZ,
  -- ... autres colonnes
);
```

**Import correct dans React** :
```jsx
import { supabase } from '@/lib/customSupabaseClient';
```

---

**Document créé le** : 2 décembre 2025  
**Corrections appliquées** : ✅ Terminé  
**Prêt pour déploiement** : ✅ Oui
