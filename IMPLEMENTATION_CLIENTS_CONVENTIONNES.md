# ✅ IMPLÉMENTATION : Clients Conventionnés (Article 81)

**Date** : 2 décembre 2025  
**Objectif** : Gestion des clients bénéficiant de conventions (aide juridictionnelle, assurance, etc.)

---

## 📋 Résumé

Cette fonctionnalité permet de :
- ✅ Identifier les clients conventionnés
- ✅ Gérer les différents types de conventions
- ✅ Suivre les dates de validité
- ✅ Alerter sur les expirations imminentes
- ✅ Visualiser les statistiques globales

---

## 🗄️ Base de données

### Nouvelles colonnes (table `clients`)

| Colonne | Type | Description |
|---------|------|-------------|
| `is_conventionne` | BOOLEAN | true si client conventionné |
| `numero_convention` | TEXT | Numéro de référence unique |
| `type_convention` | TEXT | Type : aide juridictionnelle, assurance, convention entreprise, autre |
| `organisme_convention` | TEXT | Nom de l'organisme (assurance, CPAM, etc.) |
| `date_debut_convention` | DATE | Date de début de validité |
| `date_fin_convention` | DATE | Date de fin de validité |
| `taux_prise_en_charge` | NUMERIC(5,2) | Pourcentage pris en charge (0-100) |
| `notes_convention` | TEXT | Notes spécifiques |

### Contraintes

```sql
-- Si conventionné, le numéro et le type sont obligatoires
CHECK (
  (is_conventionne = false) OR 
  (is_conventionne = true AND numero_convention IS NOT NULL AND type_convention IS NOT NULL)
)
```

### Index

```sql
CREATE INDEX idx_clients_conventionne ON clients(is_conventionne) WHERE is_conventionne = true;
CREATE INDEX idx_clients_type_convention ON clients(type_convention);
CREATE INDEX idx_clients_date_fin_convention ON clients(date_fin_convention);
```

---

## 📊 Vues SQL

### 1. `v_clients_conventionnes_actifs`
Liste tous les clients conventionnés avec leur statut actif/expiré.

```sql
SELECT 
  id, client_code, name, type,
  numero_convention, type_convention, organisme_convention,
  date_debut_convention, date_fin_convention,
  CASE 
    WHEN date_fin_convention IS NULL THEN true
    WHEN date_fin_convention >= CURRENT_DATE THEN true
    ELSE false
  END as convention_active
FROM clients
WHERE is_conventionne = true;
```

### 2. `v_conventions_expirant_bientot`
Alertes pour les conventions expirant dans les 30 prochains jours.

```sql
SELECT 
  id, client_code, name,
  numero_convention, date_fin_convention,
  date_fin_convention - CURRENT_DATE as jours_restants
FROM clients
WHERE 
  is_conventionne = true 
  AND date_fin_convention BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY date_fin_convention ASC;
```

---

## 🔧 Fonctions SQL

### `is_convention_active(client_id UUID)`
Vérifie si la convention d'un client est valide.

**Retour** : `BOOLEAN`

```sql
SELECT is_convention_active('uuid-du-client');
-- true si convention active, false sinon
```

### `get_conventions_stats()`
Retourne les statistiques globales des conventions.

**Retour** : 
- `total_conventionnes` : Nombre total
- `conventions_actives` : Actives
- `conventions_expirees` : Expirées
- `expirant_bientot` : < 30 jours
- Par type (aide juridictionnelle, assurance, etc.)

```sql
SELECT * FROM get_conventions_stats();
```

---

## 🚨 Trigger d'alerte

Un trigger automatique enregistre une activité lorsqu'une convention expire dans moins de 30 jours :

```sql
CREATE TRIGGER trigger_check_convention_expiration
  AFTER INSERT OR UPDATE OF date_fin_convention ON clients
  FOR EACH ROW
  WHEN (NEW.is_conventionne = true)
  EXECUTE FUNCTION check_convention_expiration();
```

L'alerte est enregistrée dans la table `activities` avec :
- `action_type` : `'convention_expiring'`
- `details` : JSON avec nom client, numéro convention, jours restants

---

## 🎨 Interface (Frontend)

### 1. `ClientForm.jsx` ✅ Modifié

**Section ajoutée : "Client conventionné"**

Champs :
- ☑️ Checkbox "Ce client bénéficie d'une convention"
- 📝 N° de convention (obligatoire si coché)
- 📋 Type de convention (select)
  - Aide juridictionnelle
  - Assurance protection juridique
  - Convention entreprise
  - Autre
- 🏢 Organisme
- 📅 Date début / Date fin
- 📊 Taux de prise en charge (%)
- 📝 Notes spécifiques

**Design** :
- Section séparée avec bordure verte
- Affichage conditionnel (uniquement si coché)
- Validation : si conventionné → numéro et type obligatoires

### 2. `ClientManager.jsx` ✅ Modifié

**Gestion des conventions dans :**
- `handleAddClient()` : Sauvegarde des champs convention
- `handleEditClient()` : Mise à jour des conventions existantes

**Transformation des données** :
```javascript
is_conventionne: clientData.is_conventionne || false,
numero_convention: clientData.numero_convention || null,
type_convention: clientData.type_convention || null,
// ...
taux_prise_en_charge: clientData.taux_prise_en_charge ? parseFloat(clientData.taux_prise_en_charge) : null
```

### 3. `ClientListItem.jsx` ✅ Modifié

**Badge "Conventionné"** ajouté :
```jsx
{client.is_conventionne && (
  <div className="badge-conventionné">
    <FileCheck className="w-3 h-3" />
    Conventionné
  </div>
)}
```

Style : Vert avec icône `FileCheck`

### 4. `ConventionDashboard.jsx` ✅ Nouveau composant

**Dashboard dédié aux conventions** avec :

#### 📊 Statistiques en temps réel
- Total conventionnés
- Actives
- Expirent bientôt (< 30 jours)
- Expirées

#### 🎯 Filtres
- Tous
- Actives
- Expirent bientôt
- Expirées

#### 📋 Liste détaillée
Pour chaque client :
- Nom + N° client
- N° convention + Type
- Dates (début → fin)
- Organisme
- Statut avec badge coloré :
  - ✅ **Vert** : Active
  - ⚠️ **Orange** : Expire dans X jours
  - ❌ **Rouge** : Expirée
- Taux de prise en charge

---

## 📁 Fichiers créés/modifiés

### Créés
1. ✅ `sql/add_client_conventionne.sql` - Migration SQL complète
2. ✅ `src/components/ConventionDashboard.jsx` - Dashboard conventions

### Modifiés
1. ✅ `src/components/ClientForm.jsx` - Section convention
2. ✅ `src/components/ClientManager.jsx` - Gestion CRUD conventions
3. ✅ `src/components/ClientListItem.jsx` - Badge conventionné

---

## 🚀 Déploiement

### Étape 1 : Migration SQL

```bash
# Dans Supabase SQL Editor
# Exécuter : sql/add_client_conventionne.sql
```

Vérification :
```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name LIKE '%convention%';

-- Tester les vues
SELECT * FROM v_clients_conventionnes_actifs;
SELECT * FROM v_conventions_expirant_bientot;

-- Tester les fonctions
SELECT * FROM get_conventions_stats();
```

### Étape 2 : Déploiement frontend

```bash
# Test local
npm run dev

# Build production
npm run build

# Déploiement
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/
```

### Étape 3 : Vider le cache

```bash
ssh root@82.25.116.122
systemctl reload nginx
```

---

## ✅ Tests de validation

### Test 1 : Création client conventionné

1. Ouvrir "Clients" → "Nouveau Client"
2. Remplir les informations client
3. Cocher "Ce client bénéficie d'une convention"
4. Remplir :
   - N° : `CONV-2024-001`
   - Type : `Aide juridictionnelle`
   - Organisme : `Ministère de la Justice`
   - Date début : `2024-01-01`
   - Date fin : `2024-12-31`
   - Taux : `100`
5. Enregistrer
6. ✅ Vérifier badge "Conventionné" dans la liste

### Test 2 : Convention expirée

1. Créer un client avec date fin dans le passé
2. Vérifier statut "Expirée" dans ConventionDashboard
3. Badge rouge affiché

### Test 3 : Convention expirant bientôt

1. Créer un client avec date fin dans 15 jours
2. Vérifier statut "Expire dans 15 jours"
3. Badge orange affiché
4. Compteur "Expirent bientôt" incrémenté

### Test 4 : Dashboard conventions

1. Accéder au `ConventionDashboard`
2. Vérifier statistiques :
   - Total : correct
   - Actives : correct
   - Expirant bientôt : correct
   - Expirées : correct
3. Tester filtres (Tous, Actives, Expirent bientôt, Expirées)
4. Vérifier affichage détails de chaque convention

### Test 5 : Validation formulaire

1. Cocher "Conventionné"
2. Ne pas remplir N° convention
3. Tenter d'enregistrer
4. ✅ Erreur validation : "Le N° de convention est obligatoire"

---

## 🎯 Cas d'usage

### 1. Aide juridictionnelle
```
Type : aide_juridictionnelle
Organisme : Ministère de la Justice
Taux : 100%
Validité : 1 an renouvelable
```

### 2. Assurance protection juridique
```
Type : assurance_protection_juridique
Organisme : Allianz, AXA, MAIF, etc.
Taux : Variable (50-100%)
Validité : Selon contrat
```

### 3. Convention entreprise
```
Type : convention_entreprise
Organisme : Nom de l'entreprise cliente
Taux : Négocié
Validité : Durée du contrat
```

---

## 📈 Améliorations futures (optionnelles)

### 1. Notifications automatiques
- Email/SMS 30 jours avant expiration
- Rappel à J-15, J-7, J-1

### 2. Renouvellement automatique
- Bouton "Renouveler" dans le dashboard
- Clone la convention avec nouvelles dates

### 3. Historique des conventions
- Table `convention_history` pour tracer les renouvellements
- Visualisation timeline

### 4. Export Excel
- Liste des conventions à renouveler
- Rapport mensuel pour le secrétariat

### 5. Intégration facturation
- Calcul automatique honoraires selon taux prise en charge
- Mention convention sur les factures

---

## 📞 Support

### Requêtes SQL utiles

```sql
-- Clients avec conventions expirant ce mois
SELECT * FROM v_conventions_expirant_bientot;

-- Statistiques globales
SELECT * FROM get_conventions_stats();

-- Vérifier si convention active
SELECT is_convention_active('uuid-client');

-- Clients conventionnés par type
SELECT type_convention, COUNT(*) 
FROM clients 
WHERE is_conventionne = true 
GROUP BY type_convention;

-- Taux moyen de prise en charge
SELECT AVG(taux_prise_en_charge) as taux_moyen
FROM clients 
WHERE is_conventionne = true;
```

---

## ✅ Checklist finale

- [x] Migration SQL créée
- [x] Vues SQL implémentées
- [x] Fonctions SQL créées
- [x] Trigger d'alerte configuré
- [x] Formulaire client étendu
- [x] Gestion CRUD complète
- [x] Badge visuel ajouté
- [x] Dashboard conventions créé
- [x] Documentation complète
- [ ] Migration SQL exécutée en production
- [ ] Tests de validation effectués
- [ ] Déploiement frontend

---

**Version** : 1.0.0  
**Statut** : ✅ Prêt pour déploiement  
**Conformité** : Article 81 - Gestion des clients conventionnés
