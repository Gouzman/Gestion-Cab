# Migration - Ajout du champ client_code

## 📋 Contexte

Cette migration ajoute un identifiant métier `client_code` à la table `clients` pour remplacer l'utilisation de codes clients saisis manuellement par les utilisateurs.

## 🎯 Objectifs

1. Ajouter une colonne `client_code` (TEXT, UNIQUE, NOT NULL) dans la table `clients`
2. Conserver l'`id` (UUID) comme clé primaire technique
3. Utiliser `client_code` pour l'affichage dans l'interface utilisateur
4. Envoyer l'`id` (UUID) dans les foreign keys (`client_id` dans la table `cases`)

## 🗄️ Modifications de la base de données

### Fichier SQL : `sql/add_client_code_column.sql`

```sql
-- 1. Ajout de la colonne client_code
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_code TEXT;

-- 2. Génération automatique des codes pour les clients existants
--    Format: CLI-XXX (particuliers) ou ENT-XXX (entreprises)

-- 3. Contraintes
ALTER TABLE clients ALTER COLUMN client_code SET NOT NULL;
ALTER TABLE clients ADD CONSTRAINT clients_client_code_unique UNIQUE (client_code);

-- 4. Index pour améliorer les performances
CREATE INDEX idx_clients_client_code ON clients(client_code);
```

### Exécution du script

```bash
# Option 1 : Via l'interface Supabase
# Copier-coller le contenu du fichier dans l'éditeur SQL

# Option 2 : Via la CLI Supabase (si configurée)
supabase db push
```

## 🔧 Modifications du code

### 1. `CaseForm.jsx`

#### Avant
```jsx
// Input texte libre pour saisir un code client
<input
  type="text"
  name="client_id"
  value={formData.client_id}
  placeholder="Ex: CLI-001, ENT-2024-15, etc."
/>
```

#### Après
```jsx
// Select avec chargement des clients depuis Supabase
const [clients, setClients] = useState([]);

useEffect(() => {
  // Charger les clients avec id, client_code, name
  const { data } = await supabase
    .from('clients')
    .select('id, client_code, name, type');
  setClients(data);
}, []);

<select name="client_id" value={formData.client_id}>
  <option value="">Sélectionner un client...</option>
  {clients.map(client => (
    <option key={client.id} value={client.id}>
      {client.client_code} - {client.name}
    </option>
  ))}
</select>
```

#### Changements clés
- ✅ Ajout d'un state `clients` pour stocker la liste des clients
- ✅ Chargement des clients depuis Supabase au montage du composant
- ✅ Remplacement de l'input texte par un select
- ✅ Affichage : `client_code - name` (ex: "CLI-001 - Jean Dupont")
- ✅ Valeur envoyée : `client.id` (UUID)

### 2. `CaseManager.jsx`

Aucune modification nécessaire ! Le code utilise déjà correctement `client_id` comme UUID.

```jsx
const validColumns = [
  'title', 
  'client_id',  // ← Reçoit maintenant un UUID valide
  'opposing_party',
  // ...
];
```

## ✅ Résultats attendus

### Avant la migration

```javascript
// ❌ Payload envoyé à Supabase
{
  title: 'test-10',
  client_id: 'CLI-012',  // ← Chaîne de texte invalide
  // ...
}

// ❌ Erreur Supabase
// "invalid input syntax for type uuid: 'CLI-012'"
```

### Après la migration

```javascript
// ✅ Payload envoyé à Supabase
{
  title: 'test-10',
  client_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  // ← UUID valide
  // ...
}

// ✅ Succès : 201 Created
```

## 🧪 Tests à effectuer

### 1. Vérifier la structure de la base

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'client_code';

-- Vérifier l'unicité
SELECT client_code, COUNT(*) 
FROM clients 
GROUP BY client_code 
HAVING COUNT(*) > 1;

-- Voir quelques exemples
SELECT id, client_code, name, type FROM clients LIMIT 5;
```

### 2. Tester l'interface utilisateur

1. ✅ Ouvrir le formulaire de création de dossier
2. ✅ Vérifier que le champ "Client" est un dropdown
3. ✅ Vérifier que les clients s'affichent au format "CLI-001 - Nom Client"
4. ✅ Sélectionner un client
5. ✅ Créer un dossier
6. ✅ Vérifier qu'aucune erreur Supabase n'apparaît
7. ✅ Vérifier dans la base que `client_id` contient bien un UUID

### 3. Vérifier les logs

```javascript
// Dans la console navigateur, vérifier le payload
console.log("Payload envoyé à Supabase :", payload);

// Doit contenir :
{
  title: "...",
  client_id: "uuid-valide-ici",  // ← UUID, pas "CLI-XXX"
  // ...
}
```

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la migration :

```sql
-- Supprimer la contrainte unique
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_code_unique;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_clients_client_code;

-- Rendre la colonne nullable
ALTER TABLE clients ALTER COLUMN client_code DROP NOT NULL;

-- Supprimer la colonne (optionnel, perte de données)
ALTER TABLE clients DROP COLUMN IF EXISTS client_code;
```

⚠️ **Attention** : Le rollback supprimera les codes clients générés automatiquement.

## 📚 Documentation additionnelle

### Structure de la table `clients` (après migration)

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant technique (inchangé) |
| `client_code` | TEXT | UNIQUE, NOT NULL | Identifiant métier (ex: CLI-001) |
| `name` | TEXT | NOT NULL | Nom du client |
| `type` | TEXT | | Type : 'individual' ou 'company' |
| ... | ... | | Autres colonnes existantes |

### Structure de la table `cases`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant du dossier |
| `client_id` | UUID | FOREIGN KEY → clients(id) | Référence au client |
| ... | ... | | Autres colonnes |

## 🎓 Points clés à retenir

1. **Séparation des préoccupations**
   - `id` (UUID) = identifiant technique (relations, foreign keys)
   - `client_code` (TEXT) = identifiant métier (affichage, recherche)

2. **Dans l'interface**
   - Affichage : `client_code` + `name`
   - Valeur envoyée : `id` (UUID)

3. **Dans la base**
   - Foreign keys utilisent toujours `id` (UUID)
   - `client_code` est unique mais pas utilisé pour les relations

4. **Avantages**
   - ✅ Codes clients lisibles et personnalisables
   - ✅ Relations en base robustes avec UUID
   - ✅ Pas de conflits entre les identifiants techniques et métier
   - ✅ Facilite la recherche et le filtrage côté utilisateur

## 🐛 Dépannage

### Erreur : "column client_code already exists"
→ La colonne existe déjà. Vérifiez si une migration précédente l'a créée.

### Erreur : "duplicate key value violates unique constraint"
→ Des doublons existent dans `client_code`. Vérifiez et corrigez manuellement.

### Les clients ne s'affichent pas dans le dropdown
→ Vérifiez la console pour les erreurs de chargement.
→ Vérifiez que les RLS policies autorisent la lecture de la table `clients`.

### Le payload contient encore "CLI-XXX" au lieu d'un UUID
→ Vérifiez que le formulaire utilise bien `client.id` comme valeur de l'option.
→ Vérifiez que `formData.client_id` est bien mis à jour par le select.

---

**Date de création** : 28 Novembre 2025  
**Auteur** : GitHub Copilot  
**Version** : 1.0
