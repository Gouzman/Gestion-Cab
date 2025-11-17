# 🛠️ CORRECTION : Bucket 'attachments' introuvable

## 🔴 ERREUR DÉTECTÉE

```
⚠️ Bucket 'attachments' non trouvé — appel RPC create_attachments_bucket()...
✅ RPC exécutée: null
❌ Le bucket 'attachments' est introuvable et la création automatique a échoué.
```

---

## 🎯 CAUSE

La fonction SQL `create_attachments_bucket()` **existe dans le fichier** `sql/setup_storage.sql` mais **n'a jamais été déployée** dans Supabase.

---

## ⚡ SOLUTION (2 minutes)

### Option 1 : Exécuter le SQL (RECOMMANDÉ)

1. **Ouvrir Supabase Dashboard**
   - https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]

2. **Aller dans SQL Editor**
   - Menu de gauche → SQL Editor

3. **Copier-coller CE CODE UNIQUEMENT** :

```sql
-- ================================================================
-- CRÉATION DE LA FONCTION RPC create_attachments_bucket()
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_attachments_bucket()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket_exists boolean;
  result jsonb;
BEGIN
  -- Vérifier si le bucket existe déjà
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'attachments'
  ) INTO bucket_exists;

  IF bucket_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Le bucket attachments existe déjà'
    );
  END IF;

  -- Créer le bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'attachments',
    'attachments',
    false,
    52428800, -- 50 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Bucket attachments créé avec succès'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Donner les permissions à authenticated
GRANT EXECUTE ON FUNCTION public.create_attachments_bucket() TO authenticated;

-- Exécuter la fonction immédiatement
SELECT public.create_attachments_bucket();
```

4. **Cliquer sur "RUN"**

5. **Vérifier le résultat** :
   - Si vous voyez `{"success": true, "message": "Bucket attachments créé avec succès"}` → ✅ C'EST BON !
   - Rafraîchir votre page d'application

---

### Option 2 : Créer le bucket manuellement (ALTERNATIF)

Si le SQL ne fonctionne pas :

1. **Supabase Dashboard** → **Storage** (menu de gauche)
2. **Cliquer sur "New bucket"**
3. **Remplir** :
   - **Name** : `attachments`
   - **Public** : ❌ NON (décocher)
   - **File size limit** : `50 MB`
   - **Allowed MIME types** : 
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

4. **Create bucket**

---

## 🧪 VÉRIFICATION

Après avoir exécuté le SQL :

1. **Recharger votre application** (F5)
2. **Ouvrir la console** (F12)
3. **Créer une tâche avec fichier**
4. **Vérifier qu'il n'y a plus l'erreur** "Bucket 'attachments' non trouvé"

---

## 📝 POURQUOI CETTE ERREUR ?

Le fichier `sql/setup_storage.sql` contient **toutes les fonctions nécessaires**, mais il n'a **jamais été exécuté** dans Supabase. 

Les fonctions SQL ne sont **PAS déployées automatiquement** — il faut les exécuter manuellement via le SQL Editor.

---

## 🔄 COMMANDES ÉQUIVALENTES (JavaScript)

Après avoir exécuté le SQL, vous pouvez tester depuis la console :

```javascript
const { data, error } = await supabase.rpc('create_attachments_bucket');
console.log(data); // {"success": true, "message": "..."}
```

---

**Date** : 14 novembre 2025  
**Fichier SQL complet** : `sql/setup_storage.sql`  
**Code corrigé** : Aucun (le code est bon, il manque juste le SQL)
