# ⚡ DÉMARRAGE RAPIDE - Conformité Juridique

## 🎯 Vous venez de recevoir cette migration ?

Suivez ces 3 étapes simples :

---

### 1️⃣ Exécuter la migration SQL (5 minutes)

1. Ouvrir le **Dashboard Supabase** : https://supabase.com
2. Aller dans **SQL Editor** (menu gauche)
3. Créer une nouvelle requête
4. Copier le contenu de `sql/migration_conformite_juridique.sql`
5. Coller et **Exécuter** (bouton Run)

✅ **Résultat attendu** :
```
✅ Migration terminée avec succès
```

---

### 2️⃣ Lancer l'application

```bash
npm run dev
```

L'application se lance sur http://localhost:5173

---

### 3️⃣ Tester les nouvelles fonctionnalités

#### Test 1 : Créer un client
1. Aller dans **Clients** → **Nouveau Client**
2. Créer un client (ex : KOFFI Jean)
3. Vérifier l'affichage du badge **"N° 11.001"**

#### Test 2 : Créer un dossier
1. Aller dans **Dossiers** → **Nouveau Dossier**
2. Remplir le formulaire :
   - Réf dossier : REF-2025-001
   - Type de dossier : Litige contractuel
   - Client : Sélectionner (affiche "11.001 - KOFFI Jean")
   - Qualité du client : Personne physique
   - Type de diligence : Contentieux
   - Objet du dossier : Litige commercial
   - Titre : Affaire Test
3. Cliquer sur **Créer le dossier**
4. ✅ Aucune erreur ne doit apparaître

#### Test 3 : Uploader un document
1. Aller dans **Documents** → **Upload**
2. Sélectionner un fichier
3. **Catégorie** : doit être obligatoire
4. Choisir "Pièces"
5. Uploader

---

## 📚 Documentation complète

Pour tout savoir sur les modifications :

- **MIGRATION_CONFORMITE_JURIDIQUE.md** : Guide détaillé de la migration
- **MISSION_ACCOMPLIE_CONFORMITE.md** : Récapitulatif complet
- **sql/migration_conformite_juridique.sql** : Script SQL commenté

---

## 🆕 Nouveautés principales

### ✅ Numéros clients automatiques
- Format : **AA.NNN** (ex: 11.001, 11.002, 02.001...)
- AA = Numéro de la lettre du nom
- NNN = Numéro d'ordre

### ✅ Gestion dossiers enrichie
- Réf dossier (saisi manuellement)
- Objet du dossier
- Type de diligence
- Qualité du client

### ✅ Catégories de documents
5 catégories obligatoires :
1. Documents de suivi et facturation
2. Pièces
3. Écritures
4. Courriers
5. Observations et notes

### ✅ Instances juridiques
Nouveau module pour gérer :
- Tribunal
- Appel
- Cassation

*(Composant disponible dans `src/components/InstancesManager.jsx`)*

---

## ⚠️ En cas de problème

### Erreur lors de la migration SQL ?
- Vérifier que vous êtes bien connecté à votre projet Supabase
- Vérifier que vous avez les droits d'administration
- Copier l'erreur et chercher dans `MIGRATION_CONFORMITE_JURIDIQUE.md`

### Erreur lors de la création d'un dossier ?
- Ouvrir la console navigateur (F12)
- Vérifier les logs
- Vérifier que la migration SQL a bien été exécutée

### Les codes clients ne s'affichent pas ?
- Exécuter cette requête SQL :
```sql
SELECT client_code, name FROM clients LIMIT 10;
```
- Si la colonne `client_code` est NULL, réexécuter la migration

---

## 📞 Support

Consulter la documentation détaillée :
- `MIGRATION_CONFORMITE_JURIDIQUE.md`
- `MISSION_ACCOMPLIE_CONFORMITE.md`

---

## 🚀 Commit Git

Un script de commit est disponible :

```bash
./commit-conformite.sh
```

Ou manuellement :
```bash
git add .
git commit -m "feat: Conformité procédures juridiques"
git push
```

---

**✅ C'est tout ! L'application est prête.**

*Migration réalisée le 28 novembre 2025*
