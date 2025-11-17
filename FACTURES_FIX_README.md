# ✅ CORRECTION APPLIQUÉE - Persistance des Factures

## 🎯 Problème Résolu

**Avant :** Les factures disparaissaient après rafraîchissement de la page  
**Cause :** Stockage en mémoire locale (state React) uniquement  
**Solution :** Intégration complète avec Supabase

## 📋 Étapes à Suivre

### 1️⃣ Exécuter le Script SQL (OBLIGATOIRE)

Vous devez créer la table `invoices` dans Supabase :

**Option A - Via Dashboard Supabase (Recommandé)**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu
4. Cliquez sur "+ New query"
5. Copiez-collez le contenu du fichier `sql/create_invoices_table.sql`
6. Cliquez sur "Run" (ou Cmd+Enter)

**Option B - Via CLI Supabase**
```bash
./setup-invoices-table.sh
```

### 2️⃣ Redémarrer l'Application

```bash
npm run dev
```

### 3️⃣ Tester

1. **Créer une facture**
   - Aller dans Facturation
   - Cliquer sur "Nouvelle Facture"
   - Remplir et sauvegarder

2. **Rafraîchir la page** (Cmd+R)
   - ✅ La facture doit réapparaître

3. **Modifier une facture**
   - Cliquer sur l'icône d'édition
   - Modifier et sauvegarder
   - Rafraîchir
   - ✅ Les modifications persistent

## ✅ Modifications Appliquées

### Fichiers Créés
- `sql/create_invoices_table.sql` - Script de création de la table
- `setup-invoices-table.sh` - Script d'installation automatique
- `INVOICES_PERSISTENCE_FIX.md` - Documentation complète

### Fichiers Modifiés
- `src/components/BillingManager.jsx` - Intégration Supabase complète
  - ✅ Import de `supabase` ajouté
  - ✅ `fetchInvoices()` récupère depuis la base
  - ✅ `handleAddInvoice()` sauvegarde dans la base
  - ✅ `handleEditInvoice()` met à jour la base
  - ✅ `handleDeleteInvoice()` supprime de la base

## 🔐 Sécurité (RLS)

Les politiques Row Level Security sont configurées :
- ✅ Lecture : tous les utilisateurs authentifiés
- ✅ Création : tous les utilisateurs authentifiés
- ✅ Modification : tous les utilisateurs authentifiés
- ✅ Suppression : tous les utilisateurs authentifiés

## 📊 Structure de la Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  client_name TEXT,
  case_id TEXT,
  case_title TEXT,
  total_ttc NUMERIC,
  date DATE,
  debours JSONB,
  honoraires JSONB,
  payment JSONB,
  status TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## ⚠️ Important

**Les factures créées AVANT cette mise à jour ne seront pas migrées** car elles n'existaient qu'en mémoire. Vous devrez recréer des factures de test.

## 🆘 En Cas de Problème

1. **Erreur "Table invoices does not exist"**
   → Vous n'avez pas exécuté le script SQL (étape 1)

2. **Erreur "permission denied for table invoices"**
   → Vérifier les politiques RLS dans Supabase

3. **L'application ne démarre pas**
   → Vérifier que `npm run dev` tourne sans erreur

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier la console navigateur (F12)
2. Vérifier les logs du terminal
3. Vérifier que la table existe dans Supabase (Table Editor)
