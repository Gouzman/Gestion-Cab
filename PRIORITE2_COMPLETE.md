# 🎯 PRIORITÉ 2 - DOCUMENTATION COMPLÈTE

**Date** : 2 décembre 2025  
**Statut** : ✅ Implémentation terminée

---

## 📋 APERÇU GÉNÉRAL

La **Priorité 2** ajoute 3 fonctionnalités essentielles pour la gestion administrative et physique des dossiers juridiques :

1. **Numéro Cabinet d'Instruction** - Suivi des dossiers contentieux
2. **Workflow Secrétariat** - Attribution contrôlée des numéros
3. **Étiquettes de Chemises** - Impression pour classement physique

---

## 1️⃣ NUMÉRO CABINET D'INSTRUCTION

### 🎯 Objectif
Permettre l'enregistrement du numéro de cabinet d'instruction pour les affaires contentieuses (Point 76 des spécifications).

### 🗄️ Structure Base de Données

```sql
-- Champ ajouté aux dossiers
ALTER TABLE cases 
ADD COLUMN numero_cabinet_instruction TEXT;

-- Champ ajouté aux instances
ALTER TABLE dossier_instance 
ADD COLUMN numero_cabinet_instruction TEXT;

-- Index pour recherche rapide
CREATE INDEX idx_cases_numero_cabinet 
  ON cases(numero_cabinet_instruction);
CREATE INDEX idx_dossier_instance_numero_cabinet 
  ON dossier_instance(numero_cabinet_instruction);
```

### 🖥️ Interface Utilisateur

**Dans InstanceManager.jsx** :
- Nouveau champ "N° Cabinet d'instruction"
- Visible lors de la création/modification d'une instance
- Format suggéré : `CAB-2025-001`
- Sauvegarde automatique avec l'instance

**Emplacement** : Entre "N° RG" et "Date d'introduction"

---

## 2️⃣ WORKFLOW ATTRIBUTION SECRÉTARIAT

### 🎯 Objectif
Centraliser les demandes d'attribution de numéros via le Secrétariat (Point 75).

### 🗄️ Structure Base de Données

```sql
CREATE TABLE workflow_attribution_numeros (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  statut TEXT CHECK (statut IN ('en_attente', 'en_traitement', 'attribue', 'rejete')),
  
  -- Informations demande
  demande_par UUID REFERENCES auth.users(id),
  date_demande TIMESTAMPTZ DEFAULT now(),
  notes_demande TEXT,
  
  -- Traitement Secrétariat
  traite_par UUID REFERENCES auth.users(id),
  date_traitement TIMESTAMPTZ,
  numero_client_attribue TEXT,
  numero_dossier_attribue TEXT,
  notes_secretariat TEXT,
  motif_rejet TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 📊 Statuts du Workflow

| Statut | Description | Badge |
|--------|-------------|-------|
| `en_attente` | Demande transmise, en attente de traitement | 🟡 Jaune |
| `en_traitement` | Secrétariat en cours de traitement | 🔵 Bleu |
| `attribue` | Numéros attribués avec succès | 🟢 Vert |
| `rejete` | Demande rejetée (infos manquantes) | 🔴 Rouge |

### 🔧 Fonctions PostgreSQL

#### Créer une demande
```sql
SELECT demander_attribution_numeros(
  p_case_id := 'uuid-du-dossier',
  p_notes_demande := 'Notes optionnelles'
);
```

#### Traiter une demande (Secrétariat)
```sql
-- Attribuer
SELECT traiter_attribution_numeros(
  p_workflow_id := 'uuid-workflow',
  p_action := 'attribuer',
  p_numero_client := 'CL-2025-042',
  p_numero_dossier := '25.042',
  p_notes := 'Numéros attribués'
);

-- Rejeter
SELECT traiter_attribution_numeros(
  p_workflow_id := 'uuid-workflow',
  p_action := 'rejeter',
  p_notes := 'Informations manquantes'
);
```

### 🖥️ Composant React : `WorkflowAttributionManager`

**Localisation** : `src/components/WorkflowAttributionManager.jsx`

#### Fonctionnalités

**Pour tous les utilisateurs** :
- ✅ Visualiser toutes les demandes d'attribution
- ✅ Créer une nouvelle demande pour un dossier
- ✅ Ajouter des notes pour le Secrétariat
- ✅ Voir l'historique des traitements

**Pour le Secrétariat** :
- ✅ Liste des demandes en attente
- ✅ Traiter une demande : attribuer ou rejeter
- ✅ Saisir les numéros attribués
- ✅ Ajouter des notes de traitement
- ✅ Mise à jour automatique du dossier

#### Accès
**CaseManager** → Bouton "Workflow Secrétariat" (en haut)

#### Interface

```jsx
<WorkflowAttributionManager caseId={optionnel} />
```

- Sans `caseId` : Affiche toutes les demandes
- Avec `caseId` : Filtré pour un dossier spécifique

### 📈 Vues PostgreSQL

#### Demandes en attente
```sql
SELECT * FROM v_workflow_en_attente;
```
Liste les demandes non traitées avec infos dossier/client.

#### Historique
```sql
SELECT * FROM v_workflow_historique;
```
Archive des demandes traitées (attribuées ou rejetées).

---

## 3️⃣ ÉTIQUETTES DE CHEMISES PHYSIQUES

### 🎯 Objectif
Générer et imprimer des étiquettes pour les chemises à sangle physiques (Point 76).

### 🗄️ Structure Base de Données

```sql
CREATE TABLE modeles_etiquettes (
  id UUID PRIMARY KEY,
  nom_modele TEXT NOT NULL,
  type_chemise TEXT CHECK (type_chemise IN (
    'dossier_principal',
    'documents_facturation',
    'pieces',
    'ecritures',
    'courriers',
    'observations'
  )),
  
  -- Configuration
  largeur_mm NUMERIC DEFAULT 210,  -- A4
  hauteur_mm NUMERIC DEFAULT 297,
  
  -- Champs à afficher
  afficher_date_ouverture BOOLEAN DEFAULT TRUE,
  afficher_numero_client BOOLEAN DEFAULT TRUE,
  afficher_numero_dossier BOOLEAN DEFAULT TRUE,
  afficher_nature_dossier BOOLEAN DEFAULT TRUE,
  afficher_juridiction BOOLEAN DEFAULT TRUE,
  afficher_numero_cabinet BOOLEAN DEFAULT TRUE,
  afficher_parties BOOLEAN DEFAULT TRUE,
  afficher_objet BOOLEAN DEFAULT TRUE,
  
  -- Style
  police TEXT DEFAULT 'Arial',
  taille_police INTEGER DEFAULT 12,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 🏷️ Types de Chemises

| Type | Label | Couleur |
|------|-------|---------|
| `dossier_principal` | Dossier Principal | Bleu |
| `documents_facturation` | Documents et Facturation | Vert |
| `pieces` | Pièces | Jaune |
| `ecritures` | Écritures | Violet |
| `courriers` | Courriers | Rose |
| `observations` | Observations | Orange |

### 🔧 Fonction de Génération

```sql
SELECT generer_donnees_etiquette('uuid-du-dossier');
```

**Retourne** :
```json
{
  "date_ouverture": "02/12/2025",
  "numero_client": "CL-2025-042",
  "numero_dossier": "25.042",
  "nature_dossier": "Contentieux",
  "type_diligence": "Contentieux administratif",
  "juridiction": "Tribunal Administratif",
  "numero_cabinet_instruction": "CAB-2025-001",
  "parties": {
    "client": "Société ABC",
    "adverse": "Administration Fiscale"
  },
  "objet_dossier": "Contestation décision fiscale",
  "titre_dossier": "Dossier ABC vs Fisc"
}
```

### 🖥️ Composant React : `EtiquetteChemiseGenerator`

**Localisation** : `src/components/EtiquetteChemiseGenerator.jsx`

#### Fonctionnalités

✅ **Sélection du type de chemise** (6 types)  
✅ **Choix du modèle d'étiquette** (configurable)  
✅ **Aperçu des données** en temps réel  
✅ **Génération HTML optimisée** pour impression  
✅ **Impression directe** via `window.print()`  
✅ **Mise en page A4** avec CSS print

#### Accès

**Depuis CaseListItem** → Bouton "Étiquette" (icône Tag 🏷️)

**Ou dans un modal** :
```jsx
<EtiquetteChemiseGenerator caseId="uuid-du-dossier" />
```

#### Processus d'Impression

1. **Sélectionner** le type de chemise
2. **Choisir** le modèle d'étiquette
3. **Vérifier** l'aperçu des données
4. **Cliquer** sur "Imprimer l'étiquette"
5. **Dialogue d'impression** natif du navigateur s'ouvre
6. **Imprimer** sur format A4

### 🎨 Modèle d'Étiquette

L'étiquette générée inclut :

```
┌─────────────────────────────────────────┐
│        [TYPE DE CHEMISE - COULEUR]       │
│            TITRE DU DOSSIER              │
├─────────────────────────────────────────┤
│ Date d'ouverture : 02/12/2025           │
│ N° Client : CL-2025-042                 │
│ N° Dossier : 25.042                     │
│ Nature : Contentieux                    │
│ Juridiction : Tribunal Administratif    │
│ ⚠️ N° Cabinet : CAB-2025-001            │
├─────────────────────────────────────────┤
│ Client : Société ABC                    │
│ Partie adverse : Administration Fiscale │
├─────────────────────────────────────────┤
│ Objet : Contestation décision fiscale   │
└─────────────────────────────────────────┘
```

### 📐 Configuration Print CSS

```css
@page {
  size: A4;
  margin: 15mm;
}

body {
  font-family: Arial, sans-serif;
  font-size: 12pt;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

---

## 🔐 SÉCURITÉ & RLS

### Workflow Attribution

```sql
-- Tous peuvent consulter
CREATE POLICY "view_workflow" ON workflow_attribution_numeros
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Tous peuvent créer des demandes
CREATE POLICY "create_workflow" ON workflow_attribution_numeros
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Seul le Secrétariat peut modifier
CREATE POLICY "update_workflow" ON workflow_attribution_numeros
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.function = 'Secretariat')
    )
  );
```

### Modèles d'Étiquettes

Aucune RLS requise - lecture seule pour tous les utilisateurs authentifiés.

---

## 📦 INSTALLATION

### 1. Exécuter le Script SQL

```bash
psql -d votre_database -f sql/add_priorite2_features.sql
```

Ou via Supabase Dashboard :
1. Aller dans **SQL Editor**
2. Ouvrir `sql/add_priorite2_features.sql`
3. Exécuter le script
4. Vérifier les notifications de succès

### 2. Vérifier les Colonnes

```sql
-- Vérifier cases
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cases' 
  AND column_name = 'numero_cabinet_instruction';

-- Vérifier dossier_instance
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dossier_instance' 
  AND column_name = 'numero_cabinet_instruction';

-- Vérifier workflow
SELECT COUNT(*) FROM workflow_attribution_numeros;

-- Vérifier modèles
SELECT * FROM modeles_etiquettes;
```

### 3. Tester les Fonctions

```sql
-- Test génération étiquette
SELECT generer_donnees_etiquette(
  (SELECT id FROM cases LIMIT 1)
);

-- Test workflow
SELECT demander_attribution_numeros(
  p_case_id := (SELECT id FROM cases LIMIT 1),
  p_notes_demande := 'Test'
);
```

### 4. Déployer les Composants

Les composants React sont déjà créés :
- ✅ `WorkflowAttributionManager.jsx`
- ✅ `EtiquetteChemiseGenerator.jsx`
- ✅ Intégration dans `CaseManager.jsx`
- ✅ Boutons dans `CaseListItem.jsx`
- ✅ Champ dans `InstanceManager.jsx`

**Redémarrer l'application** :
```bash
npm run dev
```

---

## 🧪 TESTS

### Test 1 : Numéro Cabinet

```sql
UPDATE cases 
SET numero_cabinet_instruction = 'CAB-2025-001'
WHERE id = 'votre-case-id';

SELECT id, title, numero_cabinet_instruction 
FROM cases 
WHERE numero_cabinet_instruction IS NOT NULL;
```

**Interface** :
1. Ouvrir un dossier
2. Cliquer sur "Instances"
3. Créer/modifier une instance
4. Saisir "CAB-2025-001" dans le champ
5. Sauvegarder
6. Vérifier dans la BD

### Test 2 : Workflow Secrétariat

**Scénario utilisateur standard** :
1. Aller dans "Workflow Secrétariat"
2. Cliquer "Nouvelle demande"
3. Ajouter des notes : "Besoin numéro pour nouveau client"
4. Transmettre
5. Vérifier statut "En attente" 🟡

**Scénario Secrétariat** :
1. Voir la demande en attente
2. Cliquer "Traiter"
3. Saisir N° dossier : "25.042"
4. Ajouter notes : "Attribué selon registre"
5. Cliquer "Attribuer les numéros"
6. Vérifier statut "Attribué" 🟢
7. Vérifier que le dossier a le nouveau code_dossier

**SQL** :
```sql
-- Vérifier la demande
SELECT * FROM v_workflow_en_attente;

-- Vérifier l'historique
SELECT * FROM v_workflow_historique;
```

### Test 3 : Étiquettes

**Interface** :
1. Aller dans liste des dossiers
2. Cliquer sur bouton "Étiquette" (🏷️)
3. Sélectionner type : "Dossier Principal"
4. Vérifier l'aperçu
5. Cliquer "Imprimer l'étiquette"
6. Vérifier le dialogue d'impression
7. Prévisualiser avant impression
8. Format A4 avec marges correctes

**SQL** :
```sql
-- Test génération
SELECT generer_donnees_etiquette('votre-case-id');

-- Vérifier modèles
SELECT nom_modele, type_chemise FROM modeles_etiquettes;
```

---

## 🎨 INTERFACE UTILISATEUR

### Boutons Ajoutés

#### Dans CaseManager (en-tête)

```
┌─────────────────────────────────────────────────────┐
│  Chemises de dossiers  │  Workflow Secrétariat  │  +│
└─────────────────────────────────────────────────────┘
```

#### Dans CaseListItem (actions)

```
┌──────────────────────────────────────────────┐
│  Instances  │  Étiquette  │  Voir détails  │
└──────────────────────────────────────────────┘
```

### Modaux

1. **Workflow Secrétariat** - Modal pleine largeur (max-w-5xl)
2. **Étiquette Chemise** - Modal moyen (max-w-4xl)

### Couleurs & Badges

- **Workflow** : Bordure bleue, icône Clock
- **Étiquette** : Bordure ambre, icône Tag
- **Statuts** : Badges colorés avec icônes

---

## 📊 STATISTIQUES

### Base de Données

- **3 colonnes** ajoutées (2 tables)
- **1 table** créée (workflow_attribution_numeros)
- **1 table** créée (modeles_etiquettes)
- **3 fonctions** PostgreSQL
- **2 vues** matérialisées
- **6 index** pour performance
- **3 policies RLS**

### Frontend

- **2 nouveaux composants** React
- **3 fichiers** modifiés (CaseManager, CaseListItem, InstanceManager)
- **~800 lignes** de code ajoutées

### Conformité

✅ **Point 75** : Workflow Secrétariat  
✅ **Point 76** : N° Cabinet + Étiquettes physiques

---

## 🚀 UTILISATION QUOTIDIENNE

### Scénario 1 : Nouveau Dossier Contentieux

1. Créer le dossier normalement
2. **Workflow** : Demander attribution numéro au Secrétariat
3. Secrétariat attribue le numéro
4. Ajouter instance "Tribunal"
5. Saisir **N° Cabinet d'instruction**
6. Imprimer **étiquette "Dossier Principal"**
7. Coller sur chemise physique

### Scénario 2 : Impression Étiquettes Multiples

1. Sélectionner un dossier
2. Imprimer étiquette "Dossier Principal"
3. Imprimer étiquette "Documents et Facturation"
4. Imprimer étiquette "Pièces"
5. Organiser les 3 chemises physiques

### Scénario 3 : Suivi Workflow

1. Consulter "Workflow Secrétariat"
2. Voir demandes en attente (badge 🟡)
3. Secrétariat traite par ordre chronologique
4. Demandes traitées passent en historique
5. Notifications visuelles (badges verts/rouges)

---

## 🔍 DÉPANNAGE

### Problème : Champ numero_cabinet_instruction invisible

**Solution** :
```sql
-- Vérifier présence colonne
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'dossier_instance' 
AND column_name = 'numero_cabinet_instruction';

-- Si absent, exécuter :
ALTER TABLE dossier_instance 
ADD COLUMN numero_cabinet_instruction TEXT;
```

### Problème : Workflow ne charge pas

**Solution** :
```sql
-- Vérifier table
SELECT COUNT(*) FROM workflow_attribution_numeros;

-- Vérifier RLS
SELECT * FROM pg_policies 
WHERE tablename = 'workflow_attribution_numeros';

-- Si nécessaire, réexécuter le script SQL
```

### Problème : Étiquette n'imprime pas les couleurs

**Solution** :
- Navigateur : Activer "Graphiques d'arrière-plan" dans options d'impression
- Chrome/Edge : Cocher "Couleurs et images d'arrière-plan"
- Firefox : Cocher "Imprimer l'arrière-plan"

### Problème : Fonction demander_attribution_numeros échoue

**Solution** :
```sql
-- Vérifier sécurité
SELECT prosecdef FROM pg_proc 
WHERE proname = 'demander_attribution_numeros';

-- Doit retourner 't' (true)
-- Sinon recréer avec SECURITY DEFINER
```

---

## 📚 RESSOURCES

### Fichiers Créés

- `sql/add_priorite2_features.sql` - Script de migration complet
- `src/components/WorkflowAttributionManager.jsx` - Interface workflow
- `src/components/EtiquetteChemiseGenerator.jsx` - Générateur d'étiquettes
- `PRIORITE2_COMPLETE.md` - Ce document

### Fichiers Modifiés

- `src/components/InstanceManager.jsx` - Champ numero_cabinet_instruction
- `src/components/CaseManager.jsx` - Intégration composants + boutons
- `src/components/CaseListItem.jsx` - Bouton étiquette

### Documentation Associée

- `CONFORMITE_PRODUCTION_COMPLETE.md` - Spécifications Points 73-82
- `INDEX_CONFORMITE.md` - Index général conformité

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] SQL exécuté sans erreurs
- [ ] Colonnes `numero_cabinet_instruction` présentes
- [ ] Table `workflow_attribution_numeros` créée
- [ ] Table `modeles_etiquettes` créée avec 1 modèle
- [ ] Fonctions PostgreSQL testées
- [ ] Vues `v_workflow_*` accessibles
- [ ] RLS actives et testées
- [ ] Composants React compilent sans erreur
- [ ] Bouton "Workflow Secrétariat" visible
- [ ] Bouton "Étiquette" visible sur dossiers
- [ ] Champ N° Cabinet visible dans Instances
- [ ] Test création demande workflow OK
- [ ] Test attribution numéro par Secrétariat OK
- [ ] Test impression étiquette OK
- [ ] Cache navigateur vidé
- [ ] Application redémarrée

---

## 🎉 PROCHAINES ÉTAPES

### Améliorations Possibles

1. **Notifications** : Alertes temps réel pour Secrétariat
2. **Templates personnalisés** : Créer modèles d'étiquettes par utilisateur
3. **Export PDF** : Générer étiquettes en PDF au lieu de print
4. **QR Codes** : Ajouter QR code sur étiquettes pour traçabilité
5. **Statistiques** : Tableau de bord des demandes workflow

### Priorité 3 (Si demandée)

- Gestion avancée des échéances
- Calculs automatiques de délais
- Intégration calendrier partagé
- Rapports d'activité hebdomadaires

---

**Document créé le** : 2 décembre 2025  
**Dernière mise à jour** : 2 décembre 2025  
**Version** : 1.0  
**Statut** : ✅ Production Ready
