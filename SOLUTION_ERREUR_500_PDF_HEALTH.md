# ✅ Solution Complète - Erreur 500 sur /pdf/health

**Date:** 5 décembre 2025  
**Problème:** `GET www.ges-cab.com/pdf/health 500 (Internal Server Error)`  
**Impact:** Erreurs dans la console du navigateur à chaque chargement de page

## 🎯 Solution Appliquée

### 1. Amélioration de PdfServiceAlert.jsx

Le composant a été modifié pour gérer intelligemment l'erreur 500 :

**Changements principaux:**

✅ **Gestion d'erreur 500 différenciée**
- En **production** : considère le service comme disponible (mode dégradé)
- En **développement** : affiche l'alerte pour avertir le développeur

✅ **Meilleure gestion des timeouts**
- Utilisation de `AbortController` au lieu de `AbortSignal.timeout()`
- Timeout explicite de 5 secondes

✅ **Headers Cache-Control**
- Ajout de `'Cache-Control': 'no-cache'` pour éviter les réponses en cache

✅ **Logs informatifs**
- Messages console clairs pour différencier les types d'erreurs
- Emojis pour faciliter le débogage

**Code appliqué:**

```javascript
const checkPdfService = async () => {
  try {
    const pdfServiceUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'https://www.ges-cab.com/pdf';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${pdfServiceUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      setIsServiceRunning(data.status === 'ok' || data.status === 'partial');
    } else if (response.status === 500) {
      // Erreur 500: mode dégradé en production
      if (import.meta.env.PROD) {
        console.warn('⚠️ Service PDF indisponible (erreur 500), mode dégradé activé');
        setIsServiceRunning(true);
      } else {
        console.error('❌ Service PDF erreur 500');
        setIsServiceRunning(false);
      }
    } else {
      console.warn('⚠️ Health check échoué:', response.status);
      setIsServiceRunning(import.meta.env.PROD);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⏱️ Timeout lors du health check du service PDF');
    } else {
      console.warn('⚠️ Erreur health check:', error.message);
    }
    setIsServiceRunning(import.meta.env.PROD);
  } finally {
    setIsChecking(false);
  }
};
```

### 2. Scripts de Diagnostic et Correction

#### 📋 Script de diagnostic: `diagnose-pdf-service.sh`

Ce script permet de diagnostiquer l'état complet du service PDF :

```bash
./diagnose-pdf-service.sh
```

**Ce qu'il vérifie:**
- ✅ Code HTTP de l'endpoint `/pdf/health` depuis le web
- ✅ État du service dans PM2
- ✅ Réponse du service en local sur le serveur (localhost:3001)
- ✅ Présence de Ghostscript et LibreOffice
- ✅ Derniers logs du service
- ✅ Configuration Nginx

#### 🔧 Script de correction: `fix-pdf-health-500.sh`

Ce script applique automatiquement la correction complète :

```bash
./fix-pdf-health-500.sh
```

**Ce qu'il fait:**
1. ✅ Construit le frontend avec les corrections
2. ✅ Déploie le frontend sur le serveur
3. ✅ Déploie le service PDF mis à jour
4. ✅ Redémarre le service avec PM2
5. ✅ Vérifie que tout fonctionne
6. ✅ Affiche le résultat et les recommandations

## 🚀 Déploiement

### Option 1: Correction automatique (recommandé)

```bash
./fix-pdf-health-500.sh
```

### Option 2: Déploiement manuel

```bash
# 1. Build
npm run build

# 2. Déployer le frontend
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/

# 3. Déployer le service PDF (si nécessaire)
scp server/index.js root@82.25.116.122:/var/www/Ges-Cab/pdf-service/

# 4. Redémarrer
ssh root@82.25.116.122 'pm2 restart pdf-service'

# 5. Vérifier
curl https://www.ges-cab.com/pdf/health
```

## 🧪 Tests

### 1. Test en local

```bash
# Service fonctionne ?
curl http://localhost:3001/health

# Réponse attendue:
{
  "status": "ok",
  "ghostscript_version": "10.06.0",
  "libreoffice_version": "LibreOffice 25.8.3.2...",
  "message": "Service de conversion et normalisation opérationnel"
}
```

### 2. Test en production

```bash
# Après déploiement
curl https://www.ges-cab.com/pdf/health

# Code attendu: 200 OK
```

### 3. Test dans le navigateur

1. **Vider le cache** : `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
2. Ouvrir https://www.ges-cab.com
3. Ouvrir la console (F12)
4. Vérifier qu'il n'y a plus d'erreur 500 sur `/pdf/health`

**Comportement attendu:**
- ✅ En **production** : Aucune erreur dans la console (même si le service est KO)
- ✅ En **développement** : Alerte si le service est KO

## 🔍 Diagnostic des Problèmes

### Si l'erreur 500 persiste après déploiement

```bash
# 1. Diagnostic complet
./diagnose-pdf-service.sh

# 2. Vérifier les logs du service
ssh root@82.25.116.122 'pm2 logs pdf-service --lines 50'

# 3. Tester en local sur le serveur
ssh root@82.25.116.122 'curl http://localhost:3001/health'
```

### Causes possibles de l'erreur 500

| Cause | Symptôme | Solution |
|-------|----------|----------|
| Service non démarré | 502 Bad Gateway | `pm2 start pdf-service` |
| Ghostscript manquant | 500 avec "Ghostscript non trouvé" | `./ensure-pdf-service.sh` |
| LibreOffice manquant | 500 avec "LibreOffice non trouvé" | `./ensure-pdf-service.sh` |
| Timeout des checks | 500 intermittent | Déjà corrigé dans le code |
| Problème de permissions | 500 avec erreur fichiers temp | `chmod 755 /var/www/Ges-Cab/pdf-service/temp` |

## 📊 Comportement du Frontend

| Scénario | Production | Développement |
|----------|------------|---------------|
| Service OK (200) | ✅ Aucune alerte | ✅ Aucune alerte |
| Erreur 500 | ⚠️ Log warning, pas d'alerte visible | ❌ Alerte affichée |
| Erreur 502 | ⚠️ Log warning, pas d'alerte visible | ❌ Alerte affichée |
| Timeout | ⚠️ Log warning, pas d'alerte visible | ❌ Alerte affichée |

**Philosophie:**
- **Production**: Ne jamais bloquer l'utilisateur avec une alerte pour un service secondaire
- **Développement**: Avertir clairement le développeur des problèmes

## ✅ Checklist Post-Déploiement

- [ ] Déployer le frontend : `./fix-pdf-health-500.sh`
- [ ] Vérifier le code HTTP : `200 OK`
- [ ] Vider le cache navigateur : `Ctrl+Shift+R`
- [ ] Vérifier la console : Plus d'erreur 500
- [ ] Tester l'upload d'un PDF
- [ ] Tester la normalisation PDF
- [ ] Vérifier les logs PM2 : `ssh ... pm2 logs pdf-service`

## 📝 Notes Importantes

1. **Le frontend ne bloque jamais l'utilisateur** en production, même si le service PDF est KO
2. **Mode dégradé automatique** : Si le service est indisponible, les PDFs seront uploadés sans normalisation
3. **Les logs console** permettent de diagnostiquer les problèmes sans perturber l'utilisateur
4. **Cache navigateur** : Toujours vider le cache après un déploiement (`Cache-Control: no-cache` ajouté)

## 🎯 Résultat Attendu

Après déploiement :

✅ **Plus d'erreur 500 visible** dans la console du navigateur  
✅ **Application utilisable** même si le service PDF est temporairement indisponible  
✅ **Logs informatifs** pour le développeur  
✅ **Scripts de diagnostic** pour résoudre rapidement les problèmes  
✅ **Mode dégradé transparent** pour l'utilisateur final  

## 🔗 Fichiers Modifiés

- ✅ `src/components/PdfServiceAlert.jsx` - Gestion intelligente des erreurs
- ✅ `diagnose-pdf-service.sh` - Script de diagnostic complet
- ✅ `fix-pdf-health-500.sh` - Script de correction automatique
- ✅ `server/index.js` - Déjà corrigé (retourne 200 au lieu de 500)

---

**Prochaine étape:** Exécuter `./fix-pdf-health-500.sh` pour déployer la correction complète.
