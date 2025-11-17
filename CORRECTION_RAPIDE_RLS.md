# 🚀 CORRECTION RAPIDE : RLS tasks_files

## ⚡ Solution en 30 secondes

### 1️⃣ Vérifier la colonne `created_by`

**Ouvrir :** Supabase Dashboard > SQL Editor

**Exécuter :**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks_files' AND column_name = 'created_by';
```

**Si vide, exécuter :**
```sql
ALTER TABLE public.tasks_files 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

### 2️⃣ Corriger les policies RLS

**Copier le contenu de :**  
`sql/fix_tasks_files_rls_final.sql`

**Coller dans :**  
Supabase Dashboard > SQL Editor

**Cliquer sur :** **Run**

---

### 3️⃣ Tester

**Créer une tâche avec un fichier**

**Vérifier dans la console :**
```
✅ Upload vers Supabase Storage réussi
✅ URL publique générée
✅ Enregistrement tasks_files réussi
```

---

## 📁 Fichiers Créés

| Fichier | Description |
|---------|-------------|
| `sql/verify_tasks_files_structure.sql` | Vérification structure table |
| `sql/fix_tasks_files_rls_final.sql` | ⭐ **Correction RLS (RECOMMANDÉE)** |
| `sql/fix_tasks_files_rls_ultra_permissive.sql` | Alternative ultra-permissive (debug) |
| `FIX_RLS_TASKS_FILES_GUIDE.md` | Guide détaillé |
| `SOLUTION_FINALE_RLS.md` | Documentation complète |

---

## ✅ Checklist

- [ ] Colonne `created_by` existe
- [ ] Script RLS exécuté
- [ ] Upload fichier → OK
- [ ] Fichier visible dans tâche → OK
- [ ] Fichier visible dans Documents → OK
- [ ] Preview fonctionne → OK

---

## 🚨 IMPORTANT

**✅ NE TOUCHEZ PAS au code React/JS**  
Le code applicatif est **PARFAIT** et ne doit **PAS** être modifié.

**✅ Seules les policies RLS de Supabase doivent être corrigées**

---

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifier que l'utilisateur est authentifié :**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user?.id);
   ```

2. **Utiliser la version ultra-permissive (temporairement) :**
   - Exécuter : `sql/fix_tasks_files_rls_ultra_permissive.sql`
   - Tester l'upload
   - Si ça fonctionne, revenir au script normal

3. **Vérifier les policies actives :**
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks_files';
   ```

---

**Créé le : 13 novembre 2025**
