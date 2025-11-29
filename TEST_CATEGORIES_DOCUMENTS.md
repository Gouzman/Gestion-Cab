# 🧪 Test des Catégories de Documents

## ✅ Ce qui a été implémenté

### Base de données
- Colonne `document_category` dans `tasks_files`
- Colonne `document_category` dans `documents`

### Frontend
- 5 catégories obligatoires dans `DocumentUploadModal.jsx`
- Validation avant upload

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier la migration SQL ✅

```sql
-- Dans Supabase SQL Editor, exécuter:

-- Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks_files' AND column_name = 'document_category';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'document_category';
```

**Résultat attendu:**
```
column_name       | data_type | is_nullable
------------------+-----------+-------------
document_category | text      | YES
```

---

### Test 2 : Interface utilisateur 🖥️

#### Étape 1 : Accéder au module Documents
1. Lancer l'application : `npm run dev`
2. Se connecter
3. Naviguer vers **"Documents"** (menu latéral)
4. Cliquer sur **"Nouveau Document"** ou **"Transférer un document"**

#### Étape 2 : Vérifier la liste des catégories
✅ Vous devez voir un champ **"Catégorie *"** avec un select contenant:

```
Sélectionner une catégorie...
├─ Documents de suivi et facturation
├─ Pièces
├─ Écritures
├─ Courriers
└─ Observations et notes
```

#### Étape 3 : Test de validation (champ obligatoire)
1. Remplir tous les champs SAUF "Catégorie"
2. Cliquer sur "Transférer"
3. ✅ **Vous devez voir une erreur :** "Veuillez sélectionner une catégorie"

---

### Test 3 : Upload d'un document 📤

#### Scénario complet

1. **Ouvrir la modale de document**
   - Cliquer sur "Transférer un document"

2. **Remplir le formulaire :**
   ```
   Réf. Document:    TEST-DOC-001
   Dossier associé:  [Choisir un dossier]
   Catégorie:        Pièces ⬅️ OBLIGATOIRE
   Description:      Test de catégorie
   Fichier:          [Sélectionner un PDF]
   ```

3. **Soumettre le formulaire**
   - Cliquer sur "Transférer"
   - ✅ Doit afficher : "✅ Document transféré"

4. **Vérifier dans la console**
   ```javascript
   // Ouvrir DevTools (F12) > Console
   // Vous devriez voir:
   Document payload: {
     document_reference: "TEST-DOC-001",
     category: "Pièces",  // ⬅️ LA CATÉGORIE EST LÀ
     description: "Test de catégorie",
     ...
   }
   ```

---

### Test 4 : Tester chaque catégorie 🔍

Créez 5 documents différents, un pour chaque catégorie :

| # | Référence | Catégorie | Fichier |
|---|-----------|-----------|---------|
| 1 | DOC-FACT-001 | Documents de suivi et facturation | facture.pdf |
| 2 | DOC-PIECE-001 | Pièces | piece_identite.pdf |
| 3 | DOC-ECRIT-001 | Écritures | jugement.pdf |
| 4 | DOC-COUR-001 | Courriers | lettre.pdf |
| 5 | DOC-NOTE-001 | Observations et notes | note_interne.pdf |

✅ Chaque upload doit réussir avec un message de succès.

---

### Test 5 : Vérification en base de données 💾

Après avoir uploadé des documents avec différentes catégories :

```sql
-- Voir les catégories enregistrées
SELECT 
    document_reference,
    category,
    file_name,
    created_at
FROM tasks_files
WHERE category IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Compter les documents par catégorie
SELECT 
    category,
    COUNT(*) as total
FROM tasks_files
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total DESC;
```

**Résultat attendu :**
```
category                              | total
--------------------------------------+-------
Pièces                               | 3
Documents de suivi et facturation    | 2
Écritures                            | 1
...
```

---

## 🐛 Tests d'Erreur

### Test 6 : Tentative sans catégorie ❌

1. Remplir le formulaire complet
2. **NE PAS sélectionner de catégorie**
3. Cliquer sur "Transférer"

✅ **Erreur attendue :**
```
⚠️ Champs requis
Veuillez sélectionner une catégorie.
```

---

### Test 7 : Changement de catégorie ✏️

1. Sélectionner "Pièces"
2. Changer pour "Courriers"
3. Soumettre

✅ Le document doit être enregistré avec "Courriers"

---

## 📊 Checklist de Validation

- [ ] Migration SQL exécutée (colonnes créées)
- [ ] Liste des 5 catégories visible dans le select
- [ ] Validation "catégorie obligatoire" fonctionne
- [ ] Upload avec catégorie "Pièces" réussit
- [ ] Upload avec catégorie "Courriers" réussit
- [ ] Upload avec catégorie "Écritures" réussit
- [ ] Upload avec catégorie "Documents de suivi et facturation" réussit
- [ ] Upload avec catégorie "Observations et notes" réussit
- [ ] Console log affiche la catégorie dans le payload
- [ ] Base de données contient la catégorie enregistrée

---

## 🎯 Résultat Final

Si tous les tests passent ✅ :
- Les 5 catégories sont fonctionnelles
- La validation fonctionne
- Les documents sont correctement catégorisés
- La base de données stocke les catégories

---

## 🆘 Dépannage

### La colonne n'existe pas ?
```sql
-- Exécuter la migration
-- Voir: sql/migration_conformite_juridique.sql
-- Section 3: STRUCTURATION DES DOCUMENTS
```

### Le select est vide ?
- Vérifier le fichier : `src/components/DocumentUploadModal.jsx`
- Lignes 25-31 : `const categories = [...]`

### L'upload ne fonctionne pas ?
- Ouvrir la console (F12)
- Regarder les erreurs
- Vérifier le payload envoyé

---

## 📁 Fichiers Concernés

```
sql/
└── migration_conformite_juridique.sql    (lignes 100-130)

src/components/
└── DocumentUploadModal.jsx               (lignes 25-31, 127-133, 293-302)
```

---

## ✨ Fonctionnalité Complète

✅ **Base de données :** Colonnes créées
✅ **Frontend :** 5 catégories + validation
✅ **UX :** Champ obligatoire avec message d'erreur
✅ **Prêt à tester !**
