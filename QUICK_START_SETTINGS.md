# ⚡ DÉMARRAGE RAPIDE - Module Paramètres

## 🎯 En 3 minutes

### 1️⃣ Installer la table (1 minute)

```bash
# Aller sur supabase.com → SQL Editor
# Copier/coller le contenu de sql/create_app_settings_table.sql
# Cliquer sur Run
```

### 2️⃣ Tester l'interface (1 minute)

```bash
# Dans votre application
# 1. Connectez-vous en tant que Gérant/Admin
# 2. Allez dans Paramètres
# 3. Vous verrez 6 onglets :
#    - 🏢 Entreprise (NOUVEAU)
#    - 📋 Menu (NOUVEAU)
#    - 🏷️ Catégories avancées (NOUVEAU)
#    - 🛡️ Permissions
#    - 📜 Admin
#    - 🏷️ Catégories (legacy)
```

### 3️⃣ Utiliser dans votre code (1 minute)

```javascript
// Importer
import { useCompanyInfo, useMenuConfig, useCategoriesConfig } from '@/lib/appSettings';

// Utiliser
const MyComponent = () => {
  const { companyInfo } = useCompanyInfo();
  const { menuConfig } = useMenuConfig();
  const { categoriesConfig } = useCategoriesConfig();
  
  return (
    <div>
      <h1>{companyInfo.name}</h1>
      <p>{companyInfo.slogan}</p>
    </div>
  );
};
```

---

## 📦 Fichiers créés

```
sql/
  └── create_app_settings_table.sql    ← Script SQL

src/
  ├── lib/
  │   └── appSettings.js               ← API (hooks + fonctions)
  ├── components/
  │   ├── CompanyInfoSettings.jsx      ← Onglet Entreprise
  │   ├── MenuConfigSettings.jsx       ← Onglet Menu
  │   └── CategoriesConfigSettings.jsx ← Onglet Catégories
  └── examples/
      └── AppSettingsExamples.jsx      ← 10 exemples d'usage

docs/
  ├── GUIDE_MODULE_PARAMETRES.md       ← Guide complet
  └── QUICK_START_SETTINGS.md          ← Ce fichier
```

---

## 🔥 API Essentielle

### Hooks React (recommandé)

```javascript
// Tout récupérer
const { settings, loading, error, refetch } = useAppSettings();

// Juste l'entreprise
const { companyInfo, loading, error } = useCompanyInfo();

// Juste le menu
const { menuConfig, loading, error } = useMenuConfig();

// Juste les catégories
const { categoriesConfig, loading, error } = useCategoriesConfig();
```

### Fonctions async

```javascript
// Lire
const settings = await getAppSettings();

// Écrire
await updateCompanyInfo({ name: "Mon Cabinet" });
await updateMenuConfig({ items: [...] });
await updateCategoriesConfig({ task_categories: [...] });
```

---

## ✅ Ce qui fonctionne

- ✅ Lecture des paramètres par tous les utilisateurs authentifiés
- ✅ Modification par les Gérants et Admins uniquement
- ✅ Sauvegarde automatique avec timestamp
- ✅ Valeurs par défaut si la table n'existe pas
- ✅ Compatibilité 100% avec le code existant
- ✅ Aucune modification des modules existants

---

## 🚨 Contraintes

- ❌ Ne PAS supprimer la table `app_settings`
- ❌ Ne PAS modifier l'ID (toujours 1)
- ❌ Ne PAS supprimer les champs JSONB existants
- ✅ Vous POUVEZ ajouter de nouveaux champs JSONB
- ✅ Vous POUVEZ modifier les valeurs à volonté

---

## 🎨 Cas d'usage typiques

### 1. Afficher le nom de l'entreprise partout

```javascript
const { companyInfo } = useCompanyInfo();
<h1>{companyInfo.name}</h1>
```

### 2. Menu dynamique

```javascript
const { menuConfig } = useMenuConfig();
const items = menuConfig.items
  .filter(i => i.enabled)
  .sort((a, b) => a.order - b.order);
```

### 3. Sélecteur de catégories

```javascript
const { categoriesConfig } = useCategoriesConfig();
<select>
  {categoriesConfig.task_categories.map(cat => (
    <option value={cat.value}>{cat.label}</option>
  ))}
</select>
```

---

## 📚 Documentation complète

Pour plus de détails, consultez **`GUIDE_MODULE_PARAMETRES.md`**

Pour des exemples de code, consultez **`src/examples/AppSettingsExamples.jsx`**

---

## 🆘 Support

Si quelque chose ne fonctionne pas :

1. Vérifiez que la table `app_settings` existe dans Supabase
2. Vérifiez les policies RLS (doit avoir 2 policies)
3. Vérifiez que vous êtes connecté en tant que Gérant/Admin
4. Consultez la console développeur (F12) pour les erreurs

---

**Temps total d'installation : ~3 minutes** ⏱️

**Complexité : Facile** 🟢

**Impact sur le code existant : Aucun** ✅
