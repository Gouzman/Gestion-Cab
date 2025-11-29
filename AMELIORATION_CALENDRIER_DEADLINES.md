# 📅 AMÉLIORATION : Affichage des Deadlines dans le Calendrier

**Date** : 29 novembre 2025  
**Objectif** : Améliorer l'affichage des dates d'échéance des tâches dans le module Agenda/Calendrier

---

## 📋 Améliorations Apportées

### 1️⃣ Synchronisation avec le Système d'Assignation Multi-Collaborateurs

**Avant** :
```javascript
if (!isAdmin) {
  query = query.eq('assigned_to_id', currentUser.id);
}
```

**Après** :
```javascript
if (!isAdmin) {
  // Filtrer : assigned_to_id OU dans assigned_to_ids OU dans visible_by_ids
  query = query.or(`assigned_to_id.eq.${currentUser.id},assigned_to_ids.cs.{${currentUser.id}},visible_by_ids.cs.{${currentUser.id}}`);
}
```

**Bénéfice** : Les collaborateurs voient maintenant toutes les tâches qui leur sont assignées, même en multi-assignation.

---

### 2️⃣ Détection des Deadlines Dépassées

**Ajout de la propriété `isOverdue`** :
```javascript
return data.map(t => ({ 
  ...t, 
  type: 'task',
  display_time: t.deadline,
  // Vérifier si la deadline est dépassée
  isOverdue: new Date(t.deadline) < new Date() && t.status !== 'completed'
}));
```

**Bénéfice** : Permet d'identifier visuellement les tâches en retard.

---

### 3️⃣ Affichage de la Date d'Échéance dans les Événements

#### Vue Mois
**Ajout sous le titre** :
```jsx
<div className="truncate flex items-center gap-1">
  {item.type === 'task' && <span className="text-[10px]">📝</span>}
  <span>{item.title}</span>
</div>
{item.type === 'task' && (
  <div className="text-[10px] opacity-75 mt-0.5">
    Échéance: {format(itemTime, 'dd/MM/yyyy')}
  </div>
)}
```

#### Vue Semaine
**Même structure** :
```jsx
<div className="truncate flex items-center gap-1">
  {item.type === 'task' && <span className="text-[10px]">📝</span>}
  <span>{item.title}</span>
</div>
{item.type === 'task' && (
  <div className="text-[10px] opacity-75">
    Échéance: {format(itemDate, 'dd/MM/yyyy')}
  </div>
)}
```

**Bénéfice** : L'utilisateur voit immédiatement la date d'échéance sans avoir à survoler l'événement.

---

### 4️⃣ Indicateur Visuel pour les Deadlines Dépassées

**Code couleur** :
```javascript
const getMonthItemClassName = (item) => {
  if (item.type === 'task') {
    // Si la deadline est dépassée et que la tâche n'est pas complétée
    if (item.isOverdue) {
      return 'bg-red-700/90 text-white border border-red-400';
    }
    // Sinon, couleur selon priorité...
  }
};
```

**Symbole** :
```javascript
{item.type === 'task' && (
  <span className="text-xs opacity-75">
    {item.isOverdue ? '⏰' : getPriorityEmoji(item.priority)}
  </span>
)}
```

**Bénéfice** : Les tâches en retard sont immédiatement identifiables avec :
- Fond rouge foncé (`bg-red-700/90`)
- Bordure rouge (`border-red-400`)
- Icône horloge ⏰ au lieu de l'emoji de priorité

---

### 5️⃣ Tooltip Enrichi avec Informations Complètes

**Avant** :
```
📝 Tâche: Titre
📆 29/11/2025 à 14:00
```

**Après** :
```
📝 Tâche: Titre
⏰ Échéance: 29/11/2025 à 14:00
⚠️ DEADLINE DÉPASSÉE (si applicable)
📊 Priorité: Urgente
📋 Statut: En attente
```

**Code** :
```javascript
if (item.type === 'task') {
  tooltip += `⏰ Échéance: ${format(itemTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}\n`;
  if (item.isOverdue) {
    tooltip += `⚠️ DEADLINE DÉPASSÉE\n`;
  }
  tooltip += `📊 Priorité: ${priorityLabel}\n`;
  tooltip += `📋 Statut: ${statusLabel}\n`;
}
```

**Bénéfice** : Informations complètes au survol pour une meilleure visibilité.

---

## 🎨 Visuels et Codes Couleurs

### Priorités (tâches dans les temps)
- 🔴 **Urgent** : `bg-red-500/70`
- 🟠 **Haute** : `bg-orange-500/70`
- 🟡 **Moyenne** : `bg-yellow-500/70`
- 🟢 **Normale** : `bg-green-500/70`

### Deadline Dépassée
- ⏰ **En retard** : `bg-red-700/90` + `border-red-400`

### Événements
- 🟣 **Événement** : `bg-purple-500/70`

---

## 📊 Format d'Affichage

### Heure
- Format : `HH:mm` (ex: 14:30)
- Affiché en haut à gauche de chaque événement

### Date d'Échéance
- Format : `dd/MM/yyyy` (ex: 29/11/2025)
- Affiché en dessous du titre pour les tâches
- Petite taille (`text-[10px]`)
- Opacité réduite (`opacity-75`)

---

## 🔄 Synchronisation Automatique

### Événements écoutés
Le calendrier se rafraîchit automatiquement lors de :
- `taskCreated` - Création d'une nouvelle tâche
- `taskUpdated` - Modification d'une tâche existante
- `taskDeleted` - Suppression d'une tâche

### Code
```javascript
useEffect(() => {
  const handleTaskUpdate = (event) => {
    console.log('✅ Nouvelle tâche détectée, rafraîchissement du calendrier...', event.detail);
    fetchData();
  };

  window.addEventListener('taskCreated', handleTaskUpdate);
  window.addEventListener('taskUpdated', handleTaskUpdate);
  window.addEventListener('taskDeleted', handleTaskUpdate);

  return () => {
    window.removeEventListener('taskCreated', handleTaskUpdate);
    window.removeEventListener('taskUpdated', handleTaskUpdate);
    window.removeEventListener('taskDeleted', handleTaskUpdate);
  };
}, [fetchData]);
```

---

## ✅ Tests de Validation

### Test 1 : Création de tâche avec deadline
1. Créer une tâche avec une date d'échéance dans 7 jours
2. Vérifier qu'elle apparaît dans le calendrier au bon jour
3. Vérifier que la date d'échéance est affichée sous le titre
4. Vérifier le code couleur selon la priorité

### Test 2 : Tâche avec deadline dépassée
1. Créer une tâche avec une deadline passée (ex: hier)
2. Vérifier que l'événement est affiché en **rouge foncé**
3. Vérifier l'icône **⏰** au lieu de l'emoji de priorité
4. Survoler : vérifier le message "⚠️ DEADLINE DÉPASSÉE"

### Test 3 : Modification de deadline
1. Modifier la deadline d'une tâche existante
2. Vérifier que le calendrier se met à jour automatiquement
3. Vérifier que la tâche apparaît au nouveau jour
4. Vérifier que l'ancienne position est vide

### Test 4 : Tâche complétée avec deadline dépassée
1. Créer une tâche avec deadline passée
2. Marquer la tâche comme "complétée"
3. Vérifier que la tâche n'est **PAS** affichée en rouge (car complétée)
4. Vérifier qu'elle garde sa couleur de priorité normale

### Test 5 : Multi-assignation
1. En tant qu'admin, créer une tâche assignée à 2 collaborateurs
2. Se connecter avec le collaborateur 1 → vérifier que la tâche apparaît
3. Se connecter avec le collaborateur 2 → vérifier que la tâche apparaît
4. Se connecter avec un collaborateur 3 (non assigné) → vérifier que la tâche n'apparaît pas

### Test 6 : Vue Mois vs Vue Semaine
1. Créer plusieurs tâches sur différents jours
2. Basculer entre Vue Mois et Vue Semaine
3. Vérifier que les dates d'échéance s'affichent correctement dans les deux vues
4. Vérifier que les codes couleurs sont cohérents

---

## 🐛 Points de Vigilance

### Fuseau Horaire
- Les dates sont affichées selon le fuseau local du navigateur
- La comparaison "deadline dépassée" utilise `new Date()` (heure locale)

### Performance
- Le calendrier charge uniquement les tâches avec `deadline IS NOT NULL`
- Optimisation : pas de JOIN inutile, uniquement les colonnes nécessaires

### RLS (Row Level Security)
- Les policies de la table `tasks` sont respectées
- Un collaborateur ne voit que ses tâches assignées (sauf admin)

---

## 📚 Fichiers Modifiés

### Code Frontend
- ✅ `src/components/Calendar.jsx` - 6 modifications

### Lignes modifiées
1. **Ligne 28** : Filtrage avec `assigned_to_ids` et `visible_by_ids`
2. **Ligne 36** : Ajout de `isOverdue` dans le mapping des tâches
3. **Ligne 132** : Tooltip enrichi avec deadline, priorité, statut
4. **Ligne 165** : Couleur rouge foncé pour deadlines dépassées (Vue Mois)
5. **Ligne 224** : Couleur rouge foncé pour deadlines dépassées (Vue Semaine)
6. **Lignes 208-216** : Affichage de la date d'échéance sous le titre (Vue Mois)
7. **Lignes 271-279** : Affichage de la date d'échéance sous le titre (Vue Semaine)

---

## 🔮 Évolutions Futures Possibles

### Court terme
- [ ] Filtrer par type (Tâches / Événements)
- [ ] Filtrer par priorité (Urgent / Haute / Moyenne / Normale)
- [ ] Filtrer par statut (En attente / En cours / Complétée)
- [ ] Légende des couleurs affichée en haut du calendrier

### Moyen terme
- [ ] Cliquer sur une tâche pour l'éditer directement
- [ ] Drag & drop pour modifier la deadline
- [ ] Notification visuelle des deadlines proches (J-2, J-1)
- [ ] Export ICS pour synchroniser avec calendriers externes

### Long terme
- [ ] Vue Jour avec détails horaires complets
- [ ] Intégration avec Google Calendar / Outlook
- [ ] Rappels automatiques avant deadline
- [ ] Statistiques de respect des deadlines par collaborateur

---

## 📊 Comparaison Avant/Après

### Avant
```
Vue Mois :
┌─────────────┐
│ 14:30       │
│ Nom tâche   │
└─────────────┘
```

### Après
```
Vue Mois :
┌──────────────────┐
│ 14:30        ⏰  │  ← Icône si deadline dépassée
│ 📝 Nom tâche     │  ← Icône tâche
│ Échéance:        │  ← NOUVEAU
│ 29/11/2025       │  ← NOUVEAU
└──────────────────┘
```

### Tooltip Avant
```
📝 Tâche: Rapport mensuel
📆 29/11/2025 à 14:30
```

### Tooltip Après
```
📝 Tâche: Rapport mensuel
⏰ Échéance: 29/11/2025 à 14:30
⚠️ DEADLINE DÉPASSÉE
📊 Priorité: Urgente
📋 Statut: En attente
```

---

**Date de mise en production** : Immédiate  
**Impact** : ✅ Amélioration pure - Aucune régression  
**Design** : ✅ Conservé - Adaptations mineures uniquement  
**Performance** : ✅ Pas d'impact - Requêtes optimisées
