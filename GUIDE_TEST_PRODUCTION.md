# 🚀 Guide de Test et Déploiement en Production

## ✅ Script de Test Automatisé

Un script complet a été créé pour tester l'application avant la mise en production.

### Exécution du script

```bash
./test-production.sh
```

Ce script vérifie automatiquement :

1. **Environnement** - Node.js, npm, dépendances
2. **Structure du projet** - Tous les dossiers et fichiers critiques
3. **Composants React** - Présence et syntaxe correcte
4. **Bibliothèques** - customSupabaseClient, appSettings, contextes
5. **Dépendances** - Packages npm installés
6. **Références orphelines** - Composants supprimés (Priorité 2)
7. **Compilation** - Build de production réussi
8. **Scripts SQL** - Présence du rollback Priorité 2
9. **Services externes** - Service PDF actif
10. **Sécurité** - Secrets, .env, .gitignore

---

## 📊 Résultat du Dernier Test

```
✅ Tests réussis    : 45
❌ Tests échoués    : 1 (fichier .env à créer localement)
⚠️  Avertissements  : 0
```

### ✅ Points validés

- ✅ Tous les composants principaux existent et sont valides
- ✅ Aucune référence aux composants supprimés (WorkflowAttributionManager, EtiquetteChemiseGenerator)
- ✅ Build de production réussi (1.5M)
- ✅ Service PDF actif sur port 3001
- ✅ Aucun secret hardcodé dans le code
- ✅ .env non versionné dans Git
- ✅ .gitignore correctement configuré
- ✅ 62 scripts SQL présents
- ✅ Script rollback_priorite2.sql prêt

### ⚠️ Action requise avant production

**Créer le fichier .env** :

```bash
cp .env.example .env
```

Puis éditer `.env` avec vos vraies valeurs Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Checklist de Déploiement en Production

### 1. Nettoyage de la base de données

**IMPORTANT** : Exécuter le script de rollback pour supprimer les tables/fonctions Priorité 2 :

```bash
psql $DATABASE_URL -f sql/rollback_priorite2.sql
```

Ce script supprime :
- ❌ Table `workflow_attribution_numeros`
- ❌ Table `modeles_etiquettes`
- ❌ Colonne `numero_cabinet_instruction` dans `dossier_instance`
- ❌ Fonctions `demander_attribution_numeros`, `traiter_attribution_numeros`, `generer_donnees_etiquette`

### 2. Configuration des variables d'environnement

Sur votre serveur de production, configurez :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_publique
```

### 3. Vérification Supabase

- ✅ RLS (Row Level Security) activé sur toutes les tables
- ✅ Policies correctement configurées
- ✅ Bucket `attachments` créé dans Storage
- ✅ Edge Functions déployées (si applicable)

### 4. Service PDF

Configurer le service PDF en production :

```bash
# Vérifier que le script existe
ls -la ensure-pdf-service-smart.sh

# Le service démarre automatiquement avec npm run dev
```

### 5. Sécurité

- ✅ HTTPS activé (SSL/TLS)
- ✅ Fichier .env non versionné (vérifié ✅)
- ✅ CORS configuré correctement
- ✅ Headers de sécurité (CSP, X-Frame-Options, etc.)

### 6. Sauvegardes

- ✅ Sauvegardes automatiques de Supabase activées
- ✅ Plan de restauration testé
- ✅ Fréquence : quotidienne minimum

### 7. Monitoring

Après déploiement, surveiller :

- 📊 Logs d'erreur (console navigateur)
- 📊 Logs serveur Supabase
- 📊 Performance (temps de chargement)
- 📊 Authentification (succès/échecs)

### 8. Tests post-déploiement

Tester en production :

1. ✅ Connexion utilisateur
2. ✅ Création d'un client
3. ✅ Création d'un dossier
4. ✅ Ajout d'une tâche
5. ✅ Upload d'un document
6. ✅ Génération de facture
7. ✅ Accès aux paramètres
8. ✅ Gestion des permissions

---

## 🔧 Commandes Utiles

### Build de production

```bash
npm run build
```

### Prévisualiser le build

```bash
npm run preview
```

### Analyser la taille du build

```bash
du -sh dist
```

### Vérifier les logs en temps réel

```bash
tail -f /tmp/build-output.log
```

---

## 📦 Structure du Build

Le dossier `dist/` contient :

```
dist/
├── index.html          # Point d'entrée
├── assets/             # JS/CSS minifiés
│   ├── index-*.js
│   └── index-*.css
└── vite.svg           # Favicon
```

**Taille actuelle** : 1.5M (optimisé)

---

## 🆘 Résolution de Problèmes

### Erreur : "Table app_settings does not exist"

**Cause** : La table `app_settings` n'existe pas en BDD.

**Solution** : L'application fonctionne avec des valeurs par défaut. Créer la table :

```sql
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_info JSONB,
  menu_config JSONB,
  categories_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Erreur : "Service PDF non disponible"

**Cause** : Le service PDF n'est pas démarré.

**Solution** :

```bash
./ensure-pdf-service-smart.sh
```

### Erreur : "CORS policy blocked"

**Cause** : Configuration CORS incorrecte dans Supabase.

**Solution** : Ajouter votre domaine dans Supabase Dashboard > Settings > API > CORS

---

## 📈 Performance

### Optimisations appliquées

- ✅ Code splitting automatique (Vite)
- ✅ Lazy loading des composants
- ✅ Minification JS/CSS
- ✅ Tree shaking
- ✅ Compression des assets

### Métriques cibles

- ⚡ First Contentful Paint : < 1.5s
- ⚡ Time to Interactive : < 3s
- ⚡ Lighthouse Score : > 90

---

## 🎯 Conclusion

Votre application est **prête pour la production** avec les actions suivantes :

1. ✅ Créer le fichier `.env` localement
2. ✅ Exécuter `sql/rollback_priorite2.sql` en production
3. ✅ Configurer les variables d'environnement sur le serveur
4. ✅ Relancer `./test-production.sh` pour vérification finale
5. ✅ Déployer avec `npm run build`

**Bon déploiement ! 🚀**
