# 🚀 Démarrage Rapide - Conversion Word → PDF (30 secondes)

## Installation Express

```bash
# 1. Installer LibreOffice (si pas déjà fait)
brew install --cask libreoffice

# 2. Vérifier l'installation
soffice --version && gs --version

# 3. Démarrer tout
./start-with-pdf-service.sh
```

## ✅ Test Rapide

```bash
# Créer un fichier Word de test
echo "Test conversion" > /tmp/test.txt
soffice --headless --convert-to docx /tmp/test.txt --outdir /tmp

# Tester la conversion
curl -X POST -F "file=@/tmp/test.docx" \
  http://localhost:3001/convert-word-to-pdf \
  -o /tmp/result.pdf

# Vérifier
file /tmp/result.pdf
# → PDF document, version 1.7 ✅
```

## 📍 URLs

- **Application** : http://localhost:3000
- **Service** : http://localhost:3001
- **Health** : http://localhost:3001/health

## 🎯 Fonctionnement

```
Upload .docx → Conversion automatique → PDF → Preview ✅
```

**Plus d'erreur** : ~~"le preview ne supporte que les fichiers pdf"~~

## 📚 Documentation Complète

`GUIDE_CONVERSION_WORD_PDF.md`

---

**Prêt !** Uploadez un fichier Word dans l'application et observez la conversion automatique dans la console.
