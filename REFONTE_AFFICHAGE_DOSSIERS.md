# Refonte de l'affichage des dossiers - Style Carte

**Date** : 28 novembre 2025  
**Contexte** : Refonte complète de l'affichage des dossiers pour correspondre exactement au design du mockup avec des cartes blanches.

---

## 🎯 Vue d'ensemble

L'affichage des dossiers a été transformé d'une liste avec colonnes vers un système de **cartes blanches** individuelles, similaires au design de l'image fournie.

### Structure de chaque carte :

```
┌─────────────────────────────────────────────────────────────┐
│ Smith vs. Johnson  [🔵 Actif]         PRIORITÉ HAUTE (rouge)│
│                                                               │
│ ID du dossier: CASE-2025-001                                 │
│                                                               │
│ Type de dossier   │ Client          │ Assigné à   │ Date     │
│ Litige contractuel│ John Smith      │ Sarah W.    │15/10/2025│
│                                                               │
│ 📄 12 documents    🕐 Prochaine audience: 20/11/2025         │
│                                           [Voir détails] →   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Modifications apportées

### 1️⃣ **CaseListItem.jsx** - Composant de carte

#### Nouveau design
- ✅ **Fond blanc** au lieu de fond sombre
- ✅ **Bordure grise** claire
- ✅ **Badge de statut coloré** (Actif/En attente/Clôturé)
- ✅ **Badge de priorité** aligné à droite (texte coloré en majuscules)
- ✅ **Grille 4 colonnes** pour les informations principales
- ✅ **Footer** avec documents, prochaine audience et bouton "Voir détails"

#### Classes CSS mises à jour
```jsx
// Ancien
className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"

// Nouveau
className="bg-white rounded-lg border border-gray-200"
```

#### Badges de statut
| Statut | Badge | Couleur |
|--------|-------|---------|
| `en-cours` | Actif | Bleu (`bg-blue-500`) |
| `juge-acheve` | Clôturé | Vert (`bg-green-500`) |
| `cloture` | Clôturé | Vert (`bg-green-500`) |
| `archive` | En attente | Jaune (`bg-yellow-500`) |

#### Badges de priorité
| Priorité | Label | Couleur texte |
|----------|-------|---------------|
| `urgent` | PRIORITÉ HAUTE | Rouge (`text-red-500`) |
| `high` | PRIORITÉ HAUTE | Rouge (`text-red-500`) |
| `medium` | PRIORITÉ MOYENNE | Jaune (`text-yellow-500`) |
| `low` | PRIORITÉ BASSE | Vert (`text-green-500`) |

---

### 2️⃣ **CaseForm.jsx** - Formulaire étendu

#### Nouveaux champs ajoutés

**1. Type de dossier** (`case_type`)
```jsx
<select name="case_type" required>
  <option value="">Sélectionner un type...</option>
  <option value="Litige contractuel">Litige contractuel</option>
  <option value="Planification successorale">Planification successorale</option>
  <option value="Droit des sociétés">Droit des sociétés</option>
  <option value="Droit Civil">Droit Civil</option>
  <option value="Droit Commercial">Droit Commercial</option>
  <option value="Droit Pénal">Droit Pénal</option>
  <option value="Droit de la Famille">Droit de la Famille</option>
  <option value="Droit du Travail">Droit du Travail</option>
  <option value="Droit Immobilier">Droit Immobilier</option>
  <option value="Propriété Intellectuelle">Propriété Intellectuelle</option>
  <option value="Droit Administratif">Droit Administratif</option>
</select>
```

**2. Assigné à** (`assigned_to`)
```jsx
<select name="assigned_to">
  <option value="">Sélectionner un collaborateur...</option>
  {teamMembers.map(member => (
    <option key={member.id} value={member.name}>
      {member.name}
    </option>
  ))}
</select>
```

**3. Prochaine audience** (`next_hearing`)
```jsx
<input 
  type="date" 
  name="next_hearing"
  value={formData.next_hearing}
  onChange={handleChange}
/>
```

#### State du formulaire mis à jour
```javascript
const [formData, setFormData] = useState({
  title: '',
  code_dossier: '',
  case_type: '',           // ✅ NOUVEAU
  client_id: '',
  client_type: 'particulier',
  opposing_party: '',
  assigned_to: '',         // ✅ NOUVEAU
  next_hearing: '',        // ✅ NOUVEAU
  description: '',
  status: 'en-cours',
  priority: 'medium',
  honoraire: '',
  notes: '',
  attachments: [],
  visible_to: []
});
```

---

### 3️⃣ **CaseManager.jsx** - Gestion des requêtes

#### Colonnes Supabase mises à jour

**Insertion (handleAddCase)** :
```javascript
const validColumns = [
  'title', 'code_dossier', 'case_type', 'client_id', 'client_type', 
  'opposing_party', 'assigned_to', 'next_hearing',  // ✅ Nouveaux champs
  'description', 'status', 'priority',
  'honoraire', 'notes', 'attachments', 'visible_to', 'created_by'
];
```

**Modification (handleEditCase)** :
```javascript
const validColumns = [
  'title', 'code_dossier', 'case_type', 'client_id', 'client_type', 
  'opposing_party', 'assigned_to', 'next_hearing',  // ✅ Nouveaux champs
  'description', 'status', 'priority',
  'honoraire', 'notes', 'attachments', 'visible_to'
];
```

#### Suppression des en-têtes de colonnes
Les en-têtes de colonnes ont été supprimés car chaque dossier est maintenant une carte complète auto-descriptive.

**Avant** :
```jsx
<div className="hidden lg:grid lg:grid-cols-5 gap-4">
  <div>Titre & ID</div>
  <div>Statut</div>
  ...
</div>
```

**Après** : Supprimé ✅

---

## 🗄️ Structure de la base de données

### Nouvelles colonnes dans la table `cases`

| Colonne | Type | Description | Requis |
|---------|------|-------------|--------|
| `case_type` | TEXT | Type de dossier (Litige contractuel, Droit Civil, etc.) | Oui |
| `assigned_to` | TEXT | Nom du collaborateur assigné | Non |
| `next_hearing` | DATE | Date de la prochaine audience | Non |

### Migration SQL

Fichier : `sql/add_case_display_fields.sql`

```sql
-- Ajouter les nouvelles colonnes
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS next_hearing DATE;

-- Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON cases(next_hearing);
```

**⚠️ Important** : Exécuter ce script SQL dans Supabase avant d'utiliser les nouvelles fonctionnalités.

---

## 🎨 Design et UX

### Palette de couleurs

#### Fond et bordures
- Fond de carte : `bg-white`
- Bordure : `border-gray-200`
- Hover : `hover:shadow-md`

#### Badges de statut
- Actif : `bg-blue-500 text-white`
- Clôturé : `bg-green-500 text-white`
- En attente : `bg-yellow-500 text-white`

#### Badges de priorité (texte uniquement)
- Haute : `text-red-500`
- Moyenne : `text-yellow-500`
- Basse : `text-green-500`

#### Textes
- Titre : `text-gray-900 font-semibold text-lg`
- Labels : `text-gray-500 text-xs`
- Valeurs : `text-gray-900 font-medium text-sm`
- Footer : `text-gray-600 text-sm`

---

## 📱 Responsive

Le composant conserve une version adaptée pour mobile et desktop :

### Desktop
- Affichage complet en carte
- Grille 4 colonnes pour les informations
- Footer avec tous les détails

### Mobile
- Mise en page verticale
- Informations empilées
- Bouton "Voir détails" en bas

---

## ✅ Checklist de migration

### Base de données
- [ ] Exécuter le script `sql/add_case_display_fields.sql` dans Supabase
- [ ] Vérifier que les colonnes sont créées
- [ ] Tester l'insertion d'un nouveau dossier

### Interface utilisateur
- [x] Modifier `CaseListItem.jsx` avec le nouveau design
- [x] Ajouter les champs dans `CaseForm.jsx`
- [x] Mettre à jour les colonnes valides dans `CaseManager.jsx`
- [x] Supprimer les en-têtes de colonnes

### Tests
- [ ] Créer un nouveau dossier avec tous les champs
- [ ] Modifier un dossier existant
- [ ] Vérifier l'affichage des badges de statut
- [ ] Vérifier l'affichage des badges de priorité
- [ ] Tester l'affichage des informations client
- [ ] Vérifier le bouton "Voir détails"

---

## 🔄 Rétrocompatibilité

### Dossiers existants
Les dossiers créés avant cette mise à jour continueront de fonctionner :
- `case_type` : Affichera "Non défini" si NULL
- `assigned_to` : Affichera "Non assigné" si NULL
- `next_hearing` : Ne s'affichera pas si NULL

### Migration en douceur
Vous pouvez mettre à jour progressivement les dossiers existants via l'interface d'édition.

---

## 📊 Exemple d'affichage

```jsx
// Dossier complet
{
  id: "a3f2c1d5-...",
  code_dossier: "CASE-2025-001",
  title: "Smith vs. Johnson",
  case_type: "Litige contractuel",
  client_id: "client-uuid",
  client_type: "particulier",
  assigned_to: "Sarah Williams",
  status: "en-cours",
  priority: "high",
  next_hearing: "2025-11-20",
  attachments: [
    { name: "contrat.pdf" },
    { name: "piece1.pdf" },
    // ... 10 autres documents
  ],
  created_at: "2025-10-15"
}
```

**Rendu de la carte** :

```
┌─────────────────────────────────────────────────────────────┐
│ Smith vs. Johnson  [🔵 Actif]         PRIORITÉ HAUTE       │
│                                                              │
│ ID du dossier: CASE-2025-001                                │
│                                                              │
│ Litige contractuel │ John Smith │ Sarah Williams │15/10/2025│
│                                                              │
│ 📄 12 documents    🕐 Prochaine audience: 20/11/2025        │
│                                           [Voir détails] →  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines améliorations suggérées

1. **Filtrage par type de dossier** : Ajouter un filtre dans `CaseManager.jsx`
2. **Tri par prochaine audience** : Permettre de trier les dossiers par date d'audience
3. **Vue calendrier** : Afficher les audiences sur un calendrier
4. **Notifications** : Alertes pour les audiences à venir
5. **Statistiques par type** : Graphiques de répartition des types de dossiers
6. **Export PDF amélioré** : Inclure tous les nouveaux champs

---

## 🔗 Fichiers modifiés

1. `/src/components/CaseListItem.jsx` - Design carte blanche
2. `/src/components/CaseForm.jsx` - Formulaire étendu
3. `/src/components/CaseManager.jsx` - Colonnes Supabase
4. `/sql/add_case_display_fields.sql` - Migration base de données

---

**Refonte terminée avec succès ! ✅**
