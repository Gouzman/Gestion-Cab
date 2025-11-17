# Fonctionnalité de Numérisation pour les Tâches

## Description
La fonctionnalité de numérisation permet aux utilisateurs de joindre des documents numérisés directement depuis la caméra ou le scanner à leurs tâches.

## Fonctionnalités implémentées

### 1. Interface Utilisateur
- **Bouton "Numériser"** : Ajouté dans le formulaire "Nouvelle Tâche" 
- **Icône** : ScanLine de Lucide React
- **Placement** : À côté du bouton "Choisir des fichiers"

### 2. Fonctionnalité de Capture
- **Mobile** : Utilise `input.capture = 'environment'` pour activer la caméra arrière
- **Web** : Interface de sélection de fichier avec filtre `image/*`
- **Formats supportés** : Toutes les images (JPEG, PNG, GIF, etc.)

### 3. Stockage Backend

#### Table `tasks_files`
```sql
CREATE TABLE tasks_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Bucket Supabase Storage
- **Nom** : `task-scans`
- **Type** : Privé (sécurisé)
- **Limite** : 50MB par fichier
- **Formats** : JPEG, PNG, GIF, PDF

### 4. Sécurité (RLS)
- Les utilisateurs peuvent voir/créer/supprimer uniquement les fichiers des tâches qui leur sont assignées ou qu'ils ont créées
- Politiques de sécurité au niveau base de données et storage

### 5. Interface Utilisateur

#### Différenciation des fichiers
- **Fichiers normaux** : 📎 avec fond vert (nouveau fichier)
- **Documents numérisés** : 📷 avec fond bleu (document numérisé)
- **Bouton de suppression** : Disponible pour chaque fichier avant sauvegarde

#### Messages utilisateur
- **Succès** : "📷 Document numérisé - [nom] ajouté avec succès"
- **Erreur format** : "❌ Format non supporté - Veuillez sélectionner une image"
- **Sauvegarde** : "✅ Tâche créée - X document(s) numérisé(s) joint(s)"

## Utilisation

### Pour créer une tâche avec documents numérisés :
1. Aller dans "Nouvelle Tâche"
2. Remplir les informations de la tâche
3. Cliquer sur le bouton "Numériser" 📷
4. Sur mobile : La caméra s'ouvre automatiquement
5. Sur web : Sélectionner une image depuis les fichiers
6. Le document apparaît dans la liste avec l'icône 📷
7. Sauvegarder la tâche

### Pour modifier une tâche :
- Même processus, les nouveaux scans s'ajoutent aux existants
- Possibilité de supprimer des scans avant sauvegarde

## Isolation et Sécurité

### Fonctionnalité isolée
- ✅ Nouvelle table dédiée (`tasks_files`)
- ✅ Bucket storage séparé (`task-scans`)
- ✅ Aucune modification du schéma existant des tâches
- ✅ Logique séparée pour les fichiers scannés vs attachments normaux

### Fonctionnalité optionnelle
- ✅ Le bouton peut être cliqué ou ignoré
- ✅ Les tâches fonctionnent normalement sans scans
- ✅ Pas d'impact sur l'existant

## Fichiers modifiés

### Frontend
- `/src/components/TaskForm.jsx` : Interface de numérisation
- `/src/components/TaskManager.jsx` : Logique de traitement des scans

### Backend
- `/sql/create_tasks_files_table.sql` : Nouveau schéma de base de données

## Configuration requise

### Base de données Supabase
1. Exécuter le script SQL `/sql/create_tasks_files_table.sql`
2. Le bucket `task-scans` sera créé automatiquement

### Permissions
- Authentification Supabase requise
- RLS activée automatiquement
- Politiques de sécurité configurées

## Notes techniques

### Gestion des fichiers
- **Upload** : Via Supabase Storage API
- **Nommage** : `scan_{timestamp}_{original_name}`
- **Path** : `{user_id}/{task_id}/{filename}`

### Performance
- Upload asynchrone pendant la sauvegarde de tâche
- Index sur `task_id` et `created_at`
- Suppression en cascade si tâche supprimée

### Compatibilité
- ✅ Mobile (iOS/Android) : Caméra native
- ✅ Desktop : Sélection de fichier
- ✅ Tablettes : Interface tactile optimisée

## Prochaines améliorations possibles
- Prévisualisation des images avant upload
- Compression automatique des images
- OCR pour extraction de texte
- Support de documents PDF multicents
- Rotation/recadrage d'images