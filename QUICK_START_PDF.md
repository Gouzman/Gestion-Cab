# 🚀 Démarrage Rapide - Normalisation PDF

## ⚡ En 3 Commandes

### 1. Vérifier Ghostscript
```bash
gs --version
# Si non installé : brew install ghostscript
```

### 2. Démarrer l'application avec normalisation PDF
```bash
./start-with-pdf-service.sh
```

### 3. Ouvrir l'application
```
http://localhost:3000
```

---

## 📝 Commandes Utiles

### Démarrage
```bash
# Tout en un
./start-with-pdf-service.sh

# Ou séparément
npm run pdf-service    # Service PDF seulement
npm run dev            # Application seulement
```

### Test
```bash
# Test automatique
npm run test:pdf

# Ou
./test-pdf-normalization.sh
```

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
```bash
# Logs du service PDF
tail -f server/server.log

# Arrêter le service
pkill -f "node server/index.js"
```

---

## ✅ Ce Qui Est Fait

- ✅ Ghostscript installé (10.06.0)
- ✅ Service de normalisation PDF opérationnel
- ✅ Intégration transparente dans l'application
- ✅ Aucun changement dans l'UI
- ✅ Tests réussis

---

## 🎯 Résultat

Uploadez un PDF → Il est automatiquement normalisé → Plus d'erreur "TT undefined" !

---

## 📚 Documentation Complète

- `README_NORMALISATION_PDF.md` - Installation et statut
- `GUIDE_NORMALISATION_PDF.md` - Documentation technique complète
- `server/README.md` - Documentation du service

---

**Problème ?** Consultez la section "Dépannage" dans `README_NORMALISATION_PDF.md`
