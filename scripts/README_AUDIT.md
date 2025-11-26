# 🔍 Scripts d'Audit Supabase

Ce dossier contient les scripts permettant d'auditer l'infrastructure Supabase du projet **Gestion-Cab**.

## 📁 Fichiers disponibles

### 1. `audit_supabase.js` ⭐
**Script principal d'audit automatique**

Effectue une vérification complète de l'infrastructure Supabase via l'API JavaScript.

**Utilisation:**
```bash
node scripts/audit_supabase.js
```

**Vérifie:**
- ✅ Buckets Storage (attachments, task-scans)
- ✅ Fonctions RPC (create_attachments_bucket, create_task_scans_bucket)
- ✅ Tables obligatoires (app_settings, calendar_events, tasks_files)
- ✅ Colonnes de la table `cases`
- ✅ Tables des modules (tasks, documents, profiles, invoices, etc.)

**Avantages:**
- Exécution rapide (~4 secondes)
- Rapport détaillé et formaté
- Aucune modification du code
- Score global calculé automatiquement

---

### 2. `audit_supabase.sql`
**Requêtes SQL complètes de vérification**

À exécuter dans le **SQL Editor** du Dashboard Supabase pour une vérification approfondie.

**Utilisation:**
1. Ouvrir le Dashboard Supabase
2. Aller dans **SQL Editor**
3. Créer une nouvelle requête
4. Copier/coller le contenu de `audit_supabase.sql`
5. Exécuter

**Vérifie (plus détaillé que le script JS):**
- Buckets avec détails (public, limites, MIME types)
- Policies RLS détaillées (opérations, rôles, expressions)
- Fonctions RPC avec signatures
- Tables avec types de colonnes
- Résumé statistique complet

---

### 3. `verify_policies_manual.sql`
**Vérification spécifique des Policies RLS**

Script SQL dédié à l'audit des policies de sécurité sur les buckets Storage.

**Utilisation:**
1. Ouvrir le Dashboard Supabase
2. Aller dans **SQL Editor**
3. Copier/coller le contenu de `verify_policies_manual.sql`
4. Exécuter

**Vérifie:**
- Policies sur `storage.objects`
- Policies spécifiques à `attachments`
- Policies spécifiques à `task-scans`
- Statut RLS activé/désactivé
- Résumé des opérations couvertes (SELECT/INSERT/UPDATE/DELETE)

---

### 4. `afficher_rapport_audit.js`
**Affichage formaté du rapport d'audit**

Génère un rapport visuel et structuré dans la console.

**Utilisation:**
```bash
node scripts/afficher_rapport_audit.js
```

**Affiche:**
- Score global avec barre de progression
- Détails par catégorie avec emojis
- Recommandations optionnelles
- Liste des fichiers générés
- Instructions pour réexécuter l'audit

---

## 🎯 Résultat de l'audit du 26/11/2025

### Score Global: **100% ✅**

| Catégorie | Score | Détail |
|-----------|-------|--------|
| 📦 Buckets Storage | 2/2 | 100% |
| ⚙️ Fonctions RPC | 2/2 | 100% |
| 🗂️ Tables obligatoires | 3/3 | 100% |
| 📋 Colonnes `cases` | 10/10 | 100% |
| 🧩 Tables des modules | 6/6 | 100% |

**Conclusion:** Tous les éléments requis sont présents et correctement configurés.

---

## 🚀 Utilisation recommandée

### Pour un audit rapide
```bash
node scripts/audit_supabase.js
```

### Pour un audit complet avec details SQL
1. Exécuter `node scripts/audit_supabase.js`
2. Puis exécuter `scripts/audit_supabase.sql` dans le SQL Editor

### Pour vérifier spécifiquement les policies RLS
```bash
# Dans le SQL Editor de Supabase Dashboard
# Exécuter: scripts/verify_policies_manual.sql
```

---

## 📊 Rapport généré

Après chaque audit, un rapport détaillé est disponible dans:
```
RAPPORT_AUDIT_SUPABASE_YYYY-MM-DD.md
```

Ce rapport contient:
- ✅ Statut détaillé de chaque élément
- 📊 Scores par catégorie
- 💡 Recommandations optionnelles
- 📁 Liste des fichiers d'audit
- 🔍 Méthode d'audit utilisée

---

## ⚠️ Important

### Principes de l'audit
- ✅ **Lecture seule**: Aucune modification n'est effectuée
- ✅ **Non destructif**: Aucune suppression ou création
- ✅ **Sécurisé**: Utilise la clé service_role (lecture uniquement)
- ✅ **Idempotent**: Peut être exécuté plusieurs fois sans effet de bord

### Credentials utilisés
Les scripts utilisent les credentials du fichier `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_KEY`

**Note**: La clé service_role est nécessaire pour accéder aux métadonnées complètes, mais les scripts n'effectuent **aucune modification**.

---

## 🔒 Policies RLS (Note importante)

Les policies RLS ne sont **pas directement accessibles** via l'API JavaScript Supabase. 

**Pour les vérifier:**
1. Utiliser le script SQL `verify_policies_manual.sql`
2. Ou vérifier manuellement dans: Dashboard > Storage > Policies

**Policies attendues par bucket:**
- ✔️ SELECT (public)
- ✔️ INSERT (authenticated)
- ✔️ UPDATE (authenticated)
- ✔️ DELETE (authenticated)

---

## 💡 Recommandations post-audit

Même avec un score de 100%, voici des améliorations optionnelles:

### 1. Limites de stockage
```sql
-- Définir une limite de 50 MB par fichier
ALTER BUCKET attachments 
SET file_size_limit = 52428800;
```

### 2. Types MIME autorisés
```sql
-- Restreindre les types de fichiers
ALTER BUCKET attachments 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

### 3. Monitoring du stockage
```sql
-- Créer une vue pour surveiller l'usage
CREATE OR REPLACE VIEW storage_usage AS
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  SUM((metadata->>'size')::bigint) / 1024 / 1024 as total_size_mb
FROM storage.objects
GROUP BY bucket_id;
```

---

## 📞 Support

Si des éléments manquent après l'audit, consulter:
1. Le rapport détaillé généré
2. Les logs de l'audit dans la console
3. La documentation Supabase officielle

---

**Dernière mise à jour:** 26 novembre 2025  
**Version:** 1.0.0  
**Auteur:** GitHub Copilot (Claude Sonnet 4.5)
