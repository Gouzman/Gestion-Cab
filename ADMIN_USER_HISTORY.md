# Module Historique des Comptes - Documentation

## Description

Le module "Historique des Comptes" a été ajouté à la section Admin pour permettre aux administrateurs de visualiser toutes les informations des utilisateurs et leurs données de sécurité.

## Fonctionnalités

### 🔐 Contrôle d'Accès
- **Accès restreint aux Admins uniquement** : Seuls les utilisateurs avec le rôle `admin` peuvent accéder à ce module
- **Protection renforcée** : Les informations sensibles du gérant sont automatiquement masquées

### 📊 Informations Affichées
- **Données utilisateur** : nom, email, rôle, fonction
- **Historique de création** : date de création du compte
- **État de première connexion** : indication si l'utilisateur doit encore changer son mot de passe
- **Données d'authentification** : dernière connexion, confirmation email, mise à jour mot de passe
- **Sécurité des mots de passe** : affichage conditionnel des informations de mot de passe

### 🛡️ Sécurité et Confidentialité
- **Mots de passe hashés** : Les mots de passe cryptés ne sont jamais déchiffrés
- **Protection du gérant** : Les informations du gérant sont automatiquement masquées
- **Affichage conditionnel** : Possibilité de masquer/afficher les informations de mot de passe
- **Indicateurs de sécurité** : Avertissements pour les mots de passe cryptés

## Structure

### Composant Principal
- **Fichier** : `src/components/AdminUserHistory.jsx`
- **Emplacement** : Intégré dans `Settings.jsx` sous l'onglet "Admin"

### Interface Utilisateur
1. **Statistiques générales** : Nombre total d'utilisateurs, admins, etc.
2. **Liste détaillée** : Cartes avec informations complètes pour chaque utilisateur
3. **Contrôles d'affichage** : Boutons pour masquer/afficher les mots de passe et actualiser

### Données Sources
- **Supabase Auth** : Données d'authentification (last_sign_in_at, email_confirmed_at, etc.)
- **Table users** : Données personnalisées (nom, rôle, fonction, etc.)

## Sécurité Implémentée

### Masquage des Données Sensibles
```javascript
// Les informations du gérant sont automatiquement protégées
password_hash: (() => {
  if (customUser.role === 'gerant' || customUser.function === 'Gerant') {
    return '*** MASQUÉ POUR SÉCURITÉ ***';
  }
  return authUser?.encrypted_password ? 'Mot de passe hashé (bcrypt)' : 'Non défini';
})()
```

### Contrôle d'Accès
```javascript
// Vérification stricte du rôle admin
const isAdmin = user?.role === 'admin';

if (!isAdmin) {
  return <AccessDeniedComponent />;
}
```

## Utilisation

### Accès au Module
1. Se connecter en tant qu'Administrateur
2. Aller dans **Paramètres**
3. Cliquer sur l'onglet **Admin**
4. Le module "Historique des Comptes" s'affiche

### Fonctions Disponibles
- **Actualiser** : Recharge les données depuis Supabase
- **Voir/Masquer mots de passe** : Toggle l'affichage des informations de mot de passe
- **Affichage détaillé** : Informations complètes pour chaque utilisateur

## Conformité et Réglementations

### RGPD/Confidentialité
- ✅ Accès restreint aux administrateurs autorisés
- ✅ Masquage automatique des informations du gérant
- ✅ Pas de déchiffrement des mots de passe hashés
- ✅ Indication claire du type de cryptage utilisé

### Sécurité
- ✅ Authentification requise avec rôle spécifique
- ✅ Pas de stockage local des données sensibles
- ✅ Communication sécurisée avec Supabase
- ✅ Logs d'accès via Supabase Auth

## Maintenance

### Mise à Jour des Données
Les données sont récupérées en temps réel depuis :
- `supabase.auth.admin.listUsers()` pour les données d'authentification
- Table `users` pour les données personnalisées

### Surveillance
- Les accès sont tracés via Supabase Auth
- Les erreurs sont affichées via le système de toast
- Console logs pour le debugging

## Notes Techniques

### Dépendances
- React 18+
- Supabase JS
- Framer Motion (animations)
- Lucide React (icônes)
- Composants UI personnalisés

### Performance
- Chargement à la demande uniquement pour les admins
- Mise en cache des données pendant la session
- Actualisation manuelle pour éviter les requêtes excessives