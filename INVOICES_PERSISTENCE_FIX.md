# 🔧 Guide de Configuration de la Table Invoices

## Problème Résolu
✅ **Les factures disparaissaient après rafraîchissement de la page**

La cause : les factures étaient stockées en mémoire locale (état React) au lieu de la base de données Supabase.

## Solution Appliquée

### 1. Création de la table `invoices` dans Supabase

**Fichier SQL :** `sql/create_invoices_table.sql`

#### Étapes d'exécution :

1. **Ouvrir le dashboard Supabase**
   - Aller sur https://supabase.com
   - Sélectionner votre projet

2. **Accéder à l'éditeur SQL**
   - Cliquer sur "SQL Editor" dans le menu latéral
   - Cliquer sur "+ New query"

3. **Copier-coller le contenu du fichier `sql/create_invoices_table.sql`**

4. **Exécuter le script**
   - Cliquer sur "Run" ou appuyer sur `Cmd+Enter`

5. **Vérifier la création**
   - Aller dans "Table Editor"
   - Vérifier que la table `invoices` apparaît

### 2. Modifications du Code

Les modifications suivantes ont été appliquées automatiquement dans `src/components/BillingManager.jsx` :

#### ✅ Import de Supabase
```javascript
import { supabase } from '@/lib/supabase';
```

#### ✅ Fonction `fetchInvoices` (récupération depuis la base)
- Récupère toutes les factures depuis Supabase
- Transforme les données de snake_case (DB) vers camelCase (frontend)
- Gère les erreurs avec des toasts informatifs

#### ✅ Fonction `handleAddInvoice` (création persistante)
- Génère un numéro de facture unique
- Sauvegarde dans Supabase avec tous les champs
- Recharge automatiquement la liste après création

#### ✅ Fonction `handleEditInvoice` (modification persistante)
- Met à jour la facture dans Supabase
- Recalcule le statut automatiquement
- Recharge la liste après modification

#### ✅ Fonction `handleDeleteInvoice` (suppression persistante)
- Supprime de la base de données
- Recharge la liste après suppression

## Structure de la Table `invoices`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique (auto-généré) |
| `invoice_number` | TEXT | Numéro de facture (ex: FACT-2025-001) |
| `client_name` | TEXT | Nom du client |
| `case_id` | TEXT | ID du dossier associé |
| `case_title` | TEXT | Titre du dossier |
| `total_ttc` | NUMERIC | Montant total TTC |
| `date` | DATE | Date de la facture |
| `debours` | JSONB | Détails des débours (JSON) |
| `honoraires` | JSONB | Détails des honoraires (JSON) |
| `payment` | JSONB | Informations de paiement (JSON) |
| `status` | TEXT | Statut (non réglée, partiellement, totalement) |
| `created_by` | UUID | ID de l'utilisateur créateur |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

## Sécurité (RLS Configurée)

Les politiques de sécurité Row Level Security (RLS) sont activées :

✅ **Lecture** : Tous les utilisateurs authentifiés peuvent lire les factures  
✅ **Création** : Tous les utilisateurs authentifiés peuvent créer des factures  
✅ **Modification** : Tous les utilisateurs authentifiés peuvent modifier les factures  
✅ **Suppression** : Tous les utilisateurs authentifiés peuvent supprimer les factures

## Fonctionnalités Activées

### ✅ Avant (Mode Démo)
- ❌ Factures stockées en mémoire locale uniquement
- ❌ Données perdues après rafraîchissement
- ❌ Pas de persistance
- ❌ Pas de synchronisation entre utilisateurs

### ✅ Après (Mode Production)
- ✅ Factures sauvegardées dans Supabase
- ✅ Données persistantes après rafraîchissement
- ✅ Synchronisation automatique
- ✅ Partage entre utilisateurs
- ✅ Traçabilité (created_by, created_at, updated_at)
- ✅ Gestion complète CRUD (Create, Read, Update, Delete)

## Test du Fonctionnement

1. **Créer une facture**
   - Aller dans "Facturation"
   - Cliquer sur "Nouvelle Facture"
   - Remplir les informations
   - Sauvegarder

2. **Rafraîchir la page** (Cmd+R ou F5)
   - ✅ La facture doit toujours apparaître

3. **Modifier une facture**
   - Cliquer sur l'icône d'édition
   - Modifier les informations
   - Sauvegarder
   - Rafraîchir → ✅ Modifications conservées

4. **Supprimer une facture**
   - Confirmer la suppression
   - Rafraîchir → ✅ La facture n'apparaît plus

## Données Existantes

⚠️ **Important** : Les factures créées en mode démo (avant cette mise à jour) ne seront pas migrées automatiquement car elles n'existaient qu'en mémoire.

Pour recréer des factures de test :
1. Ouvrir le module Facturation
2. Créer de nouvelles factures
3. Elles seront maintenant persistantes

## Rollback (en cas de problème)

Si vous rencontrez des problèmes, vous pouvez supprimer la table :

```sql
DROP TABLE IF EXISTS invoices CASCADE;
```

Puis restaurer la version précédente du code avec git :
```bash
git checkout HEAD~1 src/components/BillingManager.jsx
```

## Support

En cas de problème :
1. Vérifier que la table `invoices` existe dans Supabase
2. Vérifier les logs de la console navigateur (F12)
3. Vérifier que les politiques RLS sont bien configurées
4. Vérifier que l'utilisateur est bien authentifié

## Prochaines Étapes (Optionnel)

- [ ] Ajouter un système de numérotation automatique plus robuste
- [ ] Ajouter des filtres avancés (par période, par client)
- [ ] Exporter les factures en PDF avec logo entreprise
- [ ] Statistiques et tableaux de bord des factures
- [ ] Notifications par email lors de la création
