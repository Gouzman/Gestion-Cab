# 🔧 Guide Configuration Buckets Supabase Storage

## ⚠️ Configuration Requise par Administrateur

L'erreur **403 Unauthorized** avec "new row violates row-level security policy" indique que la création automatique de buckets n'est pas autorisée. 

### **Erreur résolue :**
```bash
POST .../storage/v1/bucket 400 (Bad Request)
{"statusCode":"403","error":"Unauthorized","message":"new row violates row-level security policy"}
```

---

## 🛠️ Solution : Configuration Manuelle des Buckets

### **Étapes à suivre dans Supabase Dashboard :**

#### **1. Accéder à Storage**
1. Se connecter à [supabase.com](https://supabase.com)
2. Ouvrir le projet `fhuzkubnxuetakpxkwlr`
3. Aller dans **Storage** (menu de gauche)

#### **2. Créer le bucket "attachments"**
1. Cliquer sur **+ New Bucket**
2. **Name :** `attachments`
3. ✅ **Cocher :** Public bucket
4. **File size limit :** 50MB (ou selon vos besoins)
5. **Allowed MIME types :** 
   ```
   image/*
   application/pdf
   text/*
   application/msword
   application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```
6. Cliquer **Create bucket**

#### **3. Créer le bucket "task-scans"**
1. Cliquer sur **+ New Bucket**
2. **Name :** `task-scans`
3. ✅ **Cocher :** Public bucket
4. **File size limit :** 50MB
5. **Allowed MIME types :**
   ```
   image/*
   application/pdf
   ```
6. Cliquer **Create bucket**

---

## 🔐 Configuration des Politiques RLS (Optionnel)

### **Pour sécuriser davantage :**

#### **Politique attachments :**
```sql
-- Permettre lecture/écriture aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'attachments');

CREATE POLICY "Authenticated users can read" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'attachments');
```

#### **Politique task-scans :**
```sql
-- Permettre lecture/écriture aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload scans" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'task-scans');

CREATE POLICY "Authenticated users can read scans" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'task-scans');
```

---

## ✅ Validation de la Configuration

### **Après création des buckets :**

1. **Aller dans l'application** → **Gestion des Tâches** → **Nouvelle Tâche**
2. **Ajouter une pièce jointe** (n'importe quel fichier)
3. **Sauvegarder la tâche**
4. **Vérifier :** 
   - ✅ Aucune erreur 403 dans la console
   - ✅ Message "✅ Fichier uploadé"
   - ✅ Fichier visible dans l'interface

### **Test du scanner :**

1. **Cliquer sur "Numériser"** dans le formulaire de tâche
2. **Sélectionner un fichier image ou PDF**
3. **Vérifier :**
   - ✅ Message "✅ Scan uploadé"
   - ✅ Document visible avec icône 📷

---

## 🚀 Comportement de l'Application Après Configuration

### **✅ Buckets configurés :**
```bash
✅ Upload de pièces jointes fonctionnel
✅ Upload de documents scannés opérationnel  
✅ Téléchargement de fichiers disponible
✅ Messages d'information clairs
```

### **⚠️ Buckets manquants :**
```bash
⚠️ "🔧 Configuration requise par un administrateur"
⚠️ "Le stockage de fichiers doit être configuré"
⚠️ Les fichiers ne sont pas uploadés (pas d'erreur)
```

---

## 📋 Checklist Post-Configuration

### **Buckets Storage :**
- [ ] ✅ Bucket `attachments` créé et public
- [ ] ✅ Bucket `task-scans` créé et public
- [ ] ✅ MIME types autorisés configurés
- [ ] ✅ Taille limite définie (50MB recommandé)

### **Tests Fonctionnels :**
- [ ] ✅ Upload de fichier dans nouvelle tâche
- [ ] ✅ Upload de document scanné
- [ ] ✅ Téléchargement de fichier existant
- [ ] ✅ Aucune erreur 403 dans la console

### **Monitoring :**
- [ ] ✅ Surveiller l'usage du stockage dans Supabase Dashboard
- [ ] ✅ Vérifier les logs d'accès occasionnellement
- [ ] ✅ Nettoyer les anciens fichiers si nécessaire

---

## 🎯 Résultat Final

### **Avant Configuration :**
```bash
❌ Erreur 403 Unauthorized lors de l'upload
❌ "new row violates row-level security policy"
❌ Fonctionnalités de fichiers indisponibles
```

### **Après Configuration :**
```bash  
✅ Upload de fichiers fluide et sécurisé
✅ Messages d'erreur gracieux si problème
✅ Système robuste sans tentative de création automatique
✅ Respect des politiques de sécurité Supabase
```

---

**Date :** 10 Novembre 2025  
**Status :** 🔧 **Configuration manuelle requise - Code corrigé**  
**Action :** ✅ **Créer les buckets dans Supabase Dashboard**  
**Buckets :** 📂 **attachments + task-scans**