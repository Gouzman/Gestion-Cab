# Correction de l'erreur 400 - Colonne invoice_type manquante

## Problème identifié
L'erreur `PGRST204 - Could not find the 'invoice_type' column of 'invoices'` indique que le code frontend essaie d'utiliser la colonne `invoice_type` qui n'existe pas dans la table `invoices` de Supabase.

## Solution appliquée

### 1. Fichiers SQL mis à jour

#### `/sql/create_invoices_table.sql`
- ✅ Ajout de la colonne `invoice_type TEXT NOT NULL DEFAULT 'definitive'`
- ✅ Contrainte CHECK ajoutée : `CHECK (invoice_type IN ('proforma', 'definitive'))`
- ✅ Index créé : `idx_invoices_invoice_type`
- ✅ Documentation ajoutée dans les commentaires

#### `/sql/add_invoice_type_column.sql` (nouveau fichier)
- Migration SQL pour ajouter la colonne à une table existante si nécessaire

### 2. Actions à effectuer dans Supabase

Pour résoudre l'erreur, vous devez **exécuter l'une des options suivantes** dans l'éditeur SQL de Supabase :

#### Option A : Si la table n'existe pas encore
Exécutez le script complet : `/sql/create_invoices_table.sql`

#### Option B : Si la table existe déjà
Exécutez uniquement la migration : `/sql/add_invoice_type_column.sql`

Ou copiez-collez ce code directement dans l'éditeur SQL Supabase :

```sql
-- Ajouter la colonne invoice_type
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'definitive';

-- Ajouter la contrainte de validation
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_type 
CHECK (invoice_type IN ('proforma', 'definitive'));

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);

-- Mettre à jour les factures existantes
UPDATE invoices 
SET invoice_type = 'definitive' 
WHERE invoice_type IS NULL;
```

### 3. Vérification

Après l'exécution du script SQL dans Supabase :
1. Rechargez votre application
2. L'erreur 400 devrait disparaître
3. Vous pourrez créer des factures avec le type (proforma ou definitive)

## Détails techniques

**Colonne ajoutée :**
- `invoice_type`: Type TEXT avec valeur par défaut 'definitive'
- Valeurs possibles : 'proforma', 'definitive'
- Utilisée dans `InvoiceForm.jsx` et `BillingManager.jsx`

**Impact :**
- Permet de distinguer les factures pro forma des factures définitives
- Aucune modification du code frontend nécessaire
- Compatible avec le code existant grâce à la valeur par défaut

## Date
29 novembre 2025
