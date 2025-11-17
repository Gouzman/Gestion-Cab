# ✅ CORRECTION APPLIQUÉE - Erreur "column date does not exist"

## 🔧 Problème Résolu

**Erreur :** `ERROR: 42703: column "date" does not exist`  
**Cause :** Le mot `date` est un mot réservé en PostgreSQL  
**Solution :** Renommé en `invoice_date`

## 📋 Action Requise

### Réexécuter le Script SQL Corrigé

Le fichier `sql/create_invoices_table.sql` a été corrigé.

**Étapes :**

1. **Si la table existe déjà avec l'erreur, la supprimer d'abord :**
   - Dashboard Supabase → SQL Editor
   - Exécuter : `DROP TABLE IF EXISTS invoices CASCADE;`

2. **Exécuter le script corrigé :**
   - Copier tout le contenu de `sql/create_invoices_table.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"
   - ✅ Vérifier "Success. No rows returned"

3. **Redémarrer l'application si nécessaire :**
   ```bash
   npm run dev
   ```

## ✅ Corrections Appliquées

### Fichier SQL (`sql/create_invoices_table.sql`)
- ✅ `date` → `invoice_date` dans la définition de table
- ✅ `idx_invoices_date` → `idx_invoices_invoice_date` dans l'index

### Fichier JavaScript (`src/components/BillingManager.jsx`)
- ✅ `.order('date', ...)` → `.order('invoice_date', ...)`
- ✅ `date: invoice.date` → `date: invoice.invoice_date`
- ✅ `date: new Date()...` → `invoice_date: new Date()...`
- ✅ `date: invoiceData.date` → `invoice_date: invoiceData.date`

## 🧪 Test

1. Créer une nouvelle facture
2. Rafraîchir la page
3. ✅ La facture doit apparaître avec la bonne date

## ⚠️ Note

Le frontend utilise toujours `date` (camelCase), mais la base de données utilise maintenant `invoice_date` (snake_case). La transformation est automatique.
