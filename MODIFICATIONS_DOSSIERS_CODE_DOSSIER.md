# Modifications : Gestion du champ `code_dossier` dans les Dossiers

**Date** : 28 novembre 2025  
**Contexte** : Adaptation de la gestion des dossiers pour utiliser un champ `code_dossier` manuel comme "ID du dossier" visible par l'utilisateur, tout en conservant `id` comme identifiant technique interne.

---

## 🎯 Objectifs

1. Ajouter un champ `code_dossier` saisi manuellement par l'utilisateur
2. Afficher "ID du dossier" pour `code_dossier` et "Réf dossier" pour `id`
3. Améliorer l'affichage des clients (particulier/entreprise)
4. Renommer "Visible par" en "Autorisé à"
5. Optimiser la gestion des pièces jointes

---

## 📝 Modifications apportées

### 1️⃣ **CaseForm.jsx** - Formulaire de dossier

#### Ajouts dans le state du formulaire
```javascript
const [formData, setFormData] = useState({
  title: '',
  code_dossier: '',        // ✅ NOUVEAU
  client_id: '',
  client_type: 'particulier',
  opposing_party: '',
  description: '',
  status: 'en-cours',
  priority: 'medium',
  honoraire: '',
  notes: '',
  attachments: [],
  visible_to: []
});
```

#### Nouveau champ "ID du dossier"
- **Label** : "ID du dossier"
- **Name** : `code_dossier`
- **Type** : `text`
- **Placeholder** : "Ex: CASE-2025-001"
- **Requis** : Oui
- **Note** : "Identifiant unique du dossier (saisi manuellement)"

#### Label modifié
- **Avant** : "Visible par"
- **Après** : "Autorisé à"
- Note ajoutée : "🔒 Tout le monde peut voir la liste des dossiers. Seuls les utilisateurs sélectionnés et les administrateurs peuvent consulter le contenu complet."

#### Pièces jointes
Deux boutons distincts (déjà implémentés) :
1. **"Choisir des fichiers"** : Sélection depuis l'application (bouton bleu)
2. **"Importer fichier"** : Import depuis l'ordinateur (bouton vert)

---

### 2️⃣ **CaseManager.jsx** - Gestion des dossiers

#### Chargement des clients
```javascript
const [clients, setClients] = useState([]);

const fetchClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, type, first_name, last_name, company');
  if (!error) {
    setClients(data || []);
  }
};
```

#### Colonnes Supabase mises à jour
**Insertion (handleAddCase)** :
```javascript
const validColumns = [
  'title', 'code_dossier', 'client_id', 'client_type', // ✅ code_dossier et client_type ajoutés
  'opposing_party', 'description', 'status', 'priority',
  'honoraire', 'notes', 'attachments', 'visible_to', 'created_by'
];
```

**Modification (handleEditCase)** :
```javascript
const validColumns = [
  'title', 'code_dossier', 'client_id', 'client_type', // ✅ code_dossier et client_type ajoutés
  'opposing_party', 'description', 'status', 'priority',
  'honoraire', 'notes', 'attachments', 'visible_to'
];
```

#### En-têtes de colonnes
**Avant** :
- Titre & Type | Statut | Priorité | Assigné à | Date & Actions

**Après** :
- **Titre & ID** | Statut | Priorité | **Client** | Date & Actions

---

### 3️⃣ **CaseListItem.jsx** - Affichage des dossiers

#### Import de la fonction utilitaire
```javascript
import { getClientDisplayName } from '@/lib/clientUtils';
```

#### Calcul du client
```javascript
const client = clients.find(c => c.id === caseData.client_id);
const clientName = client ? getClientDisplayName(client) : 'Non assigné';
const clientTypeLabel = caseData.client_type === 'entreprise' ? 'Entreprise' : 'Particulier';
```

#### Affichage mobile
```jsx
<div className="flex-1">
  <h3 className="text-white font-medium">{caseData.title || 'N/A'}</h3>
  <div className="text-xs text-slate-400 mt-1 space-y-0.5">
    <div>ID du dossier : <span className="font-mono">{caseData.code_dossier || 'Non défini'}</span></div>
    <div>Réf dossier : <span className="font-mono">{caseData.id}</span></div>
  </div>
</div>
```

```jsx
<div className="text-xs text-slate-400">
  <div>Client ({clientTypeLabel}) : <span className="text-slate-300">{clientName}</span></div>
</div>
```

#### Affichage desktop (colonne 1)
```jsx
<div>
  <div className="text-white font-medium truncate">{caseData.title || 'N/A'}</div>
  <div className="text-xs text-slate-400 mt-1">
    <div>ID: <span className="font-mono">{caseData.code_dossier || 'Non défini'}</span></div>
    <div>Réf: <span className="font-mono text-[10px]">{caseData.id?.substring(0, 8)}...</span></div>
  </div>
</div>
```

#### Affichage desktop (colonne 4 - Client)
```jsx
<div className="text-sm">
  <div className="text-slate-400 text-xs">{clientTypeLabel}</div>
  <div className="flex items-center gap-2 text-slate-300">
    <User className="w-4 h-4 text-slate-400" />
    <span className="truncate">{clientName}</span>
  </div>
</div>
```

---

## 🗄️ Structure de la table `cases`

### Colonnes utilisées
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant technique (auto-généré) |
| `code_dossier` | TEXT | **ID du dossier** saisi manuellement |
| `title` | TEXT | Titre du dossier |
| `client_id` | UUID | ID du client (FK vers `clients`) |
| `client_type` | TEXT | Type de client : `particulier` ou `entreprise` |
| `opposing_party` | TEXT | Partie adverse |
| `description` | TEXT | Description du dossier |
| `status` | TEXT | Statut : `en-cours`, `juge-acheve`, `cloture`, `archive` |
| `priority` | TEXT | Priorité : `low`, `medium`, `high`, `urgent` |
| `honoraire` | NUMERIC | Honoraire du dossier |
| `notes` | TEXT | Notes diverses |
| `attachments` | JSONB | Pièces jointes (array de noms/paths) |
| `visible_to` | UUID[] | Liste des utilisateurs autorisés |
| `created_by` | UUID | Créateur du dossier |
| `created_at` | TIMESTAMP | Date de création |

### ⚠️ Colonnes supprimées des requêtes
- `case_reference` : Remplacé par `code_dossier`
- `case_type` : Si cette colonne n'existe plus dans la table

---

## 🎨 Expérience utilisateur

### Formulaire de dossier
1. **Titre du dossier** : Ex. "Affaire Martin vs. Société ABC"
2. **ID du dossier** : Ex. "CASE-2025-001" (saisi manuellement)
3. **Client** : Sélection depuis la liste déroulante
4. **Type de client** : Radio buttons (Particulier / Entreprise)
5. **Partie adverse** : Texte libre
6. **Description** : Zone de texte
7. **Statut & Priorité** : Sélections déroulantes
8. **Honoraire** : Montant en FCFA
9. **Autorisé à** : Checkboxes pour sélectionner les collaborateurs
10. **Pièces jointes** : 2 boutons (Choisir / Importer)

### Liste des dossiers

#### Vue mobile
```
┌─────────────────────────────────────┐
│ 📄 [Titre du dossier]               │
│    ID du dossier : CASE-2025-001    │
│    Réf dossier : a3f2c1d5...        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🟢 En cours  🟡 Moyenne             │
│ Client (Particulier) : Jean Martin  │
│ 📅 28/11/2025                       │
└─────────────────────────────────────┘
```

#### Vue desktop
```
┌─────────────────┬──────────┬─────────┬───────────────────┬─────────────────┐
│ Titre & ID      │ Statut   │ Priorité│ Client            │ Date & Actions  │
├─────────────────┼──────────┼─────────┼───────────────────┼─────────────────┤
│ 📄 Smith vs ABC │ 🟢 Actif │ 🟡 Moy. │ Particulier       │ 📅 28/11/2025   │
│ ID: CASE-001    │          │         │ 👤 Jean Martin    │ ✏️ 🗑️           │
│ Réf: a3f2c1d5...│          │         │                   │                 │
└─────────────────┴──────────┴─────────┴───────────────────┴─────────────────┘
```

---

## ✅ Validation

### Champs requis
- ✅ Titre du dossier
- ✅ **ID du dossier** (`code_dossier`)
- ✅ Client

### Comportement
- Si `code_dossier` est vide → message d'erreur et blocage de la soumission
- Le champ `id` (UUID) n'est jamais modifié manuellement
- Le champ `code_dossier` est **100% manuel** (pas de génération automatique)

---

## 🔗 Fichiers modifiés

1. `/src/components/CaseForm.jsx`
   - Ajout du champ `code_dossier`
   - Renommage "Visible par" → "Autorisé à"

2. `/src/components/CaseManager.jsx`
   - Ajout de `code_dossier` et `client_type` dans les colonnes valides
   - Chargement des clients pour affichage
   - Passage de `clients` à `CaseListItem`

3. `/src/components/CaseListItem.jsx`
   - Affichage de l'ID du dossier (`code_dossier`)
   - Affichage de la réf dossier (`id`)
   - Affichage du client selon son type (Particulier/Entreprise)

---

## 🚀 Prochaines étapes suggérées

1. **Validation côté serveur** : Ajouter une vérification d'unicité du `code_dossier` dans Supabase
2. **Migration de données** : Si des dossiers existants n'ont pas de `code_dossier`, créer un script de migration
3. **Recherche améliorée** : Permettre la recherche par `code_dossier`
4. **Tri personnalisé** : Ajouter un tri par `code_dossier`
5. **Permissions détaillées** : Implémenter la logique "voir l'existence vs accéder au contenu" pour `visible_to`

---

## 📌 Notes importantes

- ✅ Le champ `id` (UUID) reste l'identifiant technique principal
- ✅ Le champ `code_dossier` est destiné à l'affichage et à la saisie manuelle
- ✅ Les pièces jointes utilisent le système déjà en place (à compléter avec l'upload réel)
- ✅ La table `clients` existe avec les champs `type`, `first_name`, `last_name`, `company`
- ✅ La fonction utilitaire `getClientDisplayName()` gère automatiquement l'affichage selon le type

---

**Modifications complétées avec succès ! ✅**
