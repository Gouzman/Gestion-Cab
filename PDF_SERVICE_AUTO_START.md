# ✅ Service PDF - Démarrage Automatique Configuré

## 📋 Résumé des modifications

Le service de normalisation PDF se lance désormais **automatiquement** à chaque démarrage de l'application avec `npm run dev`.

---

## 🔧 Modifications appliquées

### 1. **package.json** ✅

```json
"scripts": {
  "dev": "./ensure-pdf-service-smart.sh && vite --host :: --port 3000",
  ...
}
```

**Avant :**
```json
"dev": "vite --host :: --port 3000"
```

**Après :**
```json
"dev": "./ensure-pdf-service-smart.sh && vite --host :: --port 3000"
```

### 2. **Nouveau script : ensure-pdf-service-smart.sh** ✅

Script intelligent créé avec les fonctionnalités suivantes :

#### ✨ Fonctionnalités

- ✅ **Vérification intelligente** : détecte si le service tourne déjà (via `lsof -Pi :3001`)
- ✅ **Pas de doublons** : ne lance pas de nouveau processus si déjà actif
- ✅ **Démarrage en arrière-plan** : utilise `nohup` pour ne pas bloquer le terminal
- ✅ **Vérification Ghostscript** : affiche un message si non installé (sans bloquer)
- ✅ **Installation auto des dépendances** : vérifie `server/node_modules`
- ✅ **Health check** : attend jusqu'à 5 secondes que le service soit prêt
- ✅ **Messages clairs** : affiche le statut du service dans la console

#### 📍 Emplacement
```
/Users/gouzman/Documents/Gestion-Cab/ensure-pdf-service-smart.sh
```

---

## 🚀 Utilisation

### Démarrage normal de l'application

```bash
npm run dev
```

**Résultat attendu :**
```
🔧 Démarrage du service de normalisation PDF...
✅ Service de normalisation PDF opérationnel
🚀 Service PDF actif — les fichiers seront normalisés pour la prévisualisation

VITE v7.2.1  ready in 234 ms
➜  Local:   http://localhost:3000/
```

### Si le service est déjà actif

```bash
npm run dev
```

**Résultat attendu :**
```
✅ Service PDF déjà actif sur le port 3001
🚀 Service PDF actif — les fichiers seront normalisés pour la prévisualisation

VITE v7.2.1  ready in 234 ms
➜  Local:   http://localhost:3000/
```

---

## 🛡️ Protections mises en place

| Protection | Implémentation |
|------------|----------------|
| **Pas de doublon** | Vérification via `lsof -Pi :3001 -sTCP:LISTEN` |
| **Pas de blocage** | Lancement avec `nohup ... &` en arrière-plan |
| **Ghostscript manquant** | Affiche un warning mais continue (mode dégradé) |
| **Service qui plante** | Message d'avertissement mais n'empêche pas le démarrage |
| **Timeout intelligent** | Max 5 secondes d'attente pour le health check |

---

## 📊 Comportement par scénario

### Scénario 1 : Premier lancement
```
1. Script vérifie le port 3001 → libre
2. Lance le service PDF en arrière-plan
3. Attend le health check (max 5s)
4. Affiche "✅ Service opérationnel"
5. Lance Vite normalement
```

### Scénario 2 : Service déjà actif
```
1. Script vérifie le port 3001 → occupé
2. Affiche "✅ Service PDF déjà actif"
3. Lance Vite directement (pas d'attente)
```

### Scénario 3 : Ghostscript non installé
```
1. Script détecte l'absence de Ghostscript
2. Affiche "⚠️ Ghostscript non installé"
3. N'essaie pas de lancer le service
4. Lance Vite normalement (mode dégradé)
```

### Scénario 4 : Service plante au démarrage
```
1. Script lance le service
2. Attend 5 secondes le health check
3. Timeout atteint
4. Affiche "⚠️ Service n'a pas pu démarrer"
5. Lance Vite quand même (mode dégradé)
```

---

## 🔍 Vérification manuelle

### Vérifier que le service tourne

```bash
lsof -i :3001
```

**Résultat attendu :**
```
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    12345 gouzman   21u  IPv6 0x1234567890abcdef      0t0  TCP *:3001 (LISTEN)
```

### Tester le service directement

```bash
curl http://localhost:3001/health
```

**Résultat attendu :**
```json
{"status":"ok","ghostscript":"available","version":"10.03.0"}
```

### Arrêter le service manuellement

```bash
lsof -ti :3001 | xargs kill
```

---

## 📝 Scripts conservés

Les scripts existants ont été **préservés** :

| Script | Fonction | Statut |
|--------|----------|--------|
| `start-with-pdf-service.sh` | Démarrage complet avec interface (mode interactif) | ✅ Conservé |
| `ensure-pdf-service.sh` | Ancien script de vérification | ✅ Conservé |
| `test-pdf-normalization.sh` | Tests de normalisation PDF | ✅ Conservé |
| `pdf-service` (npm script) | Lance uniquement le service PDF | ✅ Conservé |
| `start:all` (npm script) | Lance avec le script complet interactif | ✅ Conservé |

---

## ✅ Avantages de cette approche

1. **Transparence** : le service se lance automatiquement, l'utilisateur n'a rien à faire
2. **Robustesse** : ne plante pas si le service est déjà actif
3. **Performance** : pas de redémarrage inutile
4. **Flexibilité** : fonctionne même si Ghostscript n'est pas installé (mode dégradé)
5. **Simplicité** : une seule commande `npm run dev`
6. **Messages clairs** : l'utilisateur sait toujours ce qui se passe

---

## 🎯 Résultat final

Désormais, au lancement de l'application avec `npm run dev` :

```
🔧 Démarrage du service de normalisation PDF...
✅ Service de normalisation PDF opérationnel
🚀 Service PDF actif — les fichiers seront normalisés pour la prévisualisation

  VITE v7.2.1  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

**Tout est automatique. Aucune manipulation nécessaire.** ✨
