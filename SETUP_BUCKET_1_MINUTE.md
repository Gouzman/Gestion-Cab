# 🚀 Configuration Bucket Attachments - 1 Minute

## ⚡ Instructions Rapides

### Étape 1 : Ouvrir l'éditeur SQL Supabase

Cliquez sur ce lien (il ouvrira directement l'éditeur SQL) :

👉 **https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/sql/new**

---

### Étape 2 : Copier-Coller ce SQL

```sql
-- Créer la fonction pour créer le bucket
create or replace function public.create_attachments_bucket()
returns void
language plpgsql
security definer
as $$
begin
  insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', true)
  on conflict (id) do nothing;
end;
$$;

-- Exécuter la fonction pour créer le bucket
select public.create_attachments_bucket();

-- Créer les policies RLS
create policy if not exists "Public Access to attachments"
on storage.objects for select 
using (bucket_id = 'attachments');

create policy if not exists "Allow insert for authenticated users"
on storage.objects for insert 
with check (bucket_id = 'attachments');

create policy if not exists "Allow delete for authenticated users"
on storage.objects for delete 
using (bucket_id = 'attachments');
```

---

### Étape 3 : Cliquer sur "RUN"

Cliquez sur le bouton **"RUN"** (ou `Ctrl+Enter`) en haut à droite de l'éditeur SQL.

---

### Étape 4 : Vérifier le Résultat

Vous devriez voir :
```
Success. No rows returned
```

C'est normal ! Cela signifie que tout a été créé avec succès.

---

### Étape 5 : Recharger l'Application

Retournez dans votre application et rechargez la page (**F5** ou `Cmd+R`).

✅ **Le bucket est maintenant configuré !** Les uploads de fichiers fonctionneront normalement.

---

## 🔍 Vérification Visuelle (Optionnel)

### Vérifier le Bucket

1. Allez dans **Storage** (menu latéral gauche)
2. Vous devriez voir le bucket **`attachments`**

### Vérifier les Policies

1. Cliquez sur le bucket **`attachments`**
2. Allez dans l'onglet **Policies**
3. Vous devriez voir 3 policies :
   - ✅ Public Access to attachments
   - ✅ Allow insert for authenticated users
   - ✅ Allow delete for authenticated users

---

## ❓ En Cas de Problème

### Erreur : "policy already exists"

**Cause :** Vous avez déjà exécuté le script avant.

**Solution :** C'est normal, le bucket est déjà configuré ! Ignorez l'erreur et rechargez l'application.

---

### Erreur : "permission denied"

**Cause :** Vous n'avez pas les droits admin sur le projet Supabase.

**Solution :** Demandez à l'administrateur du projet de vous donner les droits ou de faire la configuration pour vous.

---

### Le bucket n'apparaît pas

**Solution :**
1. Actualisez la page Supabase Dashboard (F5)
2. Vérifiez que vous êtes sur le bon projet : `fhuzkubnxuetakpxkwlr`
3. Allez dans **Storage** > Vous devriez voir `attachments`

---

## ✅ C'est Tout !

Une fois cette configuration faite **une seule fois**, elle reste définitive.  
Vous n'aurez plus jamais besoin de refaire cette manipulation.

**Durée totale :** ~1 minute ⏱️
