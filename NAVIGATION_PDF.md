# 🎯 NAVIGATION RAPIDE - NORMALISATION PDF

## 🚀 VOUS VOULEZ...

### ⚡ Démarrer Immédiatement
```bash
./start-with-pdf-service.sh
```
📖 Ou lisez → [QUICK_START_PDF.md](QUICK_START_PDF.md)

---

### 📋 Comprendre en 2 Minutes
📖 Lisez → [SUMMARY_PDF.md](SUMMARY_PDF.md)

---

### 🔧 Installer et Configurer
📖 Lisez → [README_NORMALISATION_PDF.md](README_NORMALISATION_PDF.md)

---

### 🏗️ Comprendre l'Architecture
📖 Lisez → [ARCHITECTURE_PDF.md](ARCHITECTURE_PDF.md)

---

### 🧪 Tester le Système
```bash
./test-pdf-normalization.sh
```

---

### 📚 Documentation Technique Complète
📖 Lisez → [GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md)

---

### ✅ Vérifier l'Installation
📖 Lisez → [CHECKLIST_PDF.md](CHECKLIST_PDF.md)

---

### 🗂️ Voir Tous les Fichiers
📖 Lisez → [INDEX_PDF.md](INDEX_PDF.md)

---

### ℹ️ Afficher les Informations
```bash
./info-pdf.sh
```

---

### 🔍 Voir le Service Backend
📖 Lisez → [server/README.md](server/README.md)

---

## 🛠️ COMMANDES UTILES

| Action | Commande |
|--------|----------|
| 🚀 Démarrer tout | `./start-with-pdf-service.sh` |
| 🔧 Service PDF seul | `npm run pdf-service` |
| 💻 Application seule | `npm run dev` |
| 🧪 Tests | `npm run test:pdf` |
| 🏥 Health check | `curl http://localhost:3001/health` |
| 📊 Logs | `tail -f server/server.log` |
| ℹ️ Info | `./info-pdf.sh` |
| ❌ Arrêter service | `pkill -f "node server/index.js"` |

---

## 📍 ENDPOINTS

| Service | URL |
|---------|-----|
| 💻 Application | http://localhost:3000 |
| 🔧 Service PDF | http://localhost:3001 |
| 🏥 Health Check | http://localhost:3001/health |

---

## 🎯 PAR CAS D'USAGE

### 👨‍💻 Je suis Développeur
1. [ARCHITECTURE_PDF.md](ARCHITECTURE_PDF.md) - Comprendre le système
2. [server/index.js](server/index.js) - Code du service
3. [src/lib/pdfOptimizer.js](src/lib/pdfOptimizer.js) - Intégration

### 👨‍💼 Je suis Manager/Chef de Projet
1. [SUMMARY_PDF.md](SUMMARY_PDF.md) - Vue d'ensemble
2. [CHECKLIST_PDF.md](CHECKLIST_PDF.md) - Validation
3. [INDEX_PDF.md](INDEX_PDF.md) - Statistiques

### 🔧 Je suis Admin Système
1. [README_NORMALISATION_PDF.md](README_NORMALISATION_PDF.md) - Installation
2. [GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md) - Configuration
3. [CHECKLIST_PDF.md](CHECKLIST_PDF.md) - Vérification

### 🧪 Je veux Tester
1. `./test-pdf-normalization.sh` - Tests automatiques
2. [GUIDE_NORMALISATION_PDF.md](GUIDE_NORMALISATION_PDF.md) - Tests manuels

---

## 🆘 AIDE RAPIDE

### ❓ Le service ne démarre pas
→ [README_NORMALISATION_PDF.md](README_NORMALISATION_PDF.md) - Section "Dépannage"

### ❓ Le PDF n'est pas normalisé
→ Vérifier : `curl http://localhost:3001/health`

### ❓ Erreur dans le navigateur
→ Vérifier la console (F12) et `server/server.log`

### ❓ Port déjà utilisé
```bash
lsof -i :3001
kill -9 <PID>
```

---

## 📊 STATUT RAPIDE

| Composant | Status |
|-----------|--------|
| 🟢 Ghostscript | Installé (10.06.0) |
| 🟢 Service Node.js | Opérationnel |
| 🟢 Intégration | Fonctionnelle |
| 🟢 Tests | Réussis |
| 🟢 Documentation | Complète |

---

## 🎉 EN RÉSUMÉ

✅ **Tout est prêt**  
✅ **Tout fonctionne**  
✅ **Tout est documenté**  

**Pour démarrer :**
```bash
./start-with-pdf-service.sh
```

---

📅 **Dernière mise à jour** : 27 novembre 2025  
📦 **Version** : 1.0.0  
✅ **Statut** : Production Ready
