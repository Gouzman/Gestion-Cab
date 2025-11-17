# Guide de Déploiement - Fonctionnalité Numérisation

## Étapes de Déploiement

### 1. Configuration Base de Données Supabase

#### Connectez-vous à votre dashboard Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet "Gestion-Cab"
3. Cliquez sur "SQL Editor" dans le menu

#### Exécutez le script SQL
1. Créez une nouvelle requête dans l'éditeur SQL
2. Copiez-collez le contenu du fichier `/sql/create_tasks_files_table.sql`
3. Cliquez sur "Run" pour exécuter le script

#### Vérification
```sql
-- Vérifiez que la table a été créée
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks_files';

-- Vérifiez que le bucket a été créé
SELECT * FROM storage.buckets WHERE name = 'task-scans';
```

### 2. Test de la Fonctionnalité

#### Sur le serveur de développement
1. Le serveur dev est déjà en cours (http://localhost:3000)
2. Connectez-vous avec votre compte admin
3. Allez dans "Gestion des Tâches" → "Nouvelle Tâche"
4. Testez le bouton "Numériser" 📷

#### Tests recommandés
- [ ] Bouton "Numériser" visible et cliquable
- [ ] Interface de capture s'ouvre (caméra sur mobile, sélection sur web)
- [ ] Fichier ajouté avec icône 📷 bleue
- [ ] Possibilité de supprimer le fichier avant sauvegarde
- [ ] Création de tâche avec message de succès
- [ ] Vérification en base de données

### 3. Déploiement en Production

#### Si vous utilisez Vercel/Netlify
```bash
# Commitez les changements
git add .
git commit -m "feat: Add document scanning functionality to tasks"
git push origin main
```

#### Si vous deployez manuellement
```bash
# Build du projet
npm run build

# Uploadez le dossier dist/ vers votre serveur
```

### 4. Vérifications Post-Déploiement

#### Base de données
```sql
-- Vérifiez les permissions RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks_files';

-- Vérifiez les politiques
SELECT policyname, tablename, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks_files';
```

#### Interface utilisateur
- [ ] Bouton "Numériser" présent dans le formulaire
- [ ] Pas d'erreurs console JavaScript
- [ ] Upload et storage fonctionnels
- [ ] Messages de succès/erreur corrects

### 5. Monitoring

#### Métriques à surveiller
- Taille du bucket `task-scans`
- Nombre d'enregistrements dans `tasks_files`
- Temps de réponse des uploads
- Erreurs d'upload dans les logs

#### Dashboard Supabase
1. **Storage** : Surveillez l'utilisation du bucket `task-scans`
2. **Database** : Vérifiez les requêtes sur `tasks_files`
3. **Logs** : Consultez les erreurs d'API

### 6. Support Utilisateur

#### Guide utilisateur rapide
> "Pour joindre un document numérisé :
> 1. Clic sur 'Nouvelle Tâche'
> 2. Remplir les informations
> 3. Cliquer 'Numériser' 📷
> 4. Prendre photo ou sélectionner image
> 5. Sauvegarder la tâche"

#### Résolution des problèmes courants

**Problème** : Bouton "Numériser" ne fonctionne pas
**Solution** : Vérifiez les permissions navigateur pour la caméra

**Problème** : Upload échoue
**Solution** : Vérifiez la connexion internet et la taille du fichier (<50MB)

**Problème** : Fichier n'apparaît pas
**Solution** : Vérifiez les politiques RLS dans Supabase

### 7. Rollback (si nécessaire)

#### Pour désactiver temporairement
```javascript
// Dans TaskForm.jsx, remplacez la fonction handleScan par :
const handleScan = () => {
  toast({
    title: "🚧 Temporairement indisponible",
    description: "La numérisation sera bientôt disponible."
  });
};
```

#### Pour suppression complète
```sql
-- Supprimez la table (ATTENTION: perte de données)
DROP TABLE IF EXISTS tasks_files;

-- Supprimez le bucket
DELETE FROM storage.buckets WHERE name = 'task-scans';
```

---

## ✅ Checklist de Déploiement

- [ ] Script SQL exécuté avec succès
- [ ] Table `tasks_files` créée
- [ ] Bucket `task-scans` configuré  
- [ ] Politiques RLS activées
- [ ] Tests en local réussis
- [ ] Déploiement en production effectué
- [ ] Tests en production réussis
- [ ] Documentation utilisateur disponible
- [ ] Monitoring configuré

## 🚀 La fonctionnalité est prête !

Vos utilisateurs peuvent maintenant numériser et joindre des documents directement depuis leur appareil mobile ou desktop lors de la création de tâches.