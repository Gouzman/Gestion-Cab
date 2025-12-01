# Correction Erreur 500 sur /pdf/health

**Date**: 1er décembre 2025  
**Problème**: `GET https://www.ges-cab.com/pdf/health 500 (Internal Server Error)`

## 🔍 Diagnostic

L'erreur 500 sur l'endpoint `/pdf/health` était causée par plusieurs problèmes :

1. **CORS trop restrictif** : La whitelist CORS ne contenait pas les domaines de production
2. **Status HTTP 500** : Le serveur retournait 500 au lieu de 200 même pour les états "partial"
3. **Pas de headers CORS explicites** : L'endpoint health n'avait pas de headers CORS spécifiques
4. **Timeout manquant** : Les checks Ghostscript/LibreOffice pouvaient bloquer indéfiniment

## ✅ Corrections appliquées

### 1. Configuration CORS mise à jour (`server/index.js`)

```javascript
// Avant
const productionOrigins = [
  process.env.VITE_PRODUCTION_URL,
].filter(Boolean);

// Après
const productionOrigins = [
  'https://www.ges-cab.com',
  'https://ges-cab.com',
  process.env.VITE_PRODUCTION_URL,
].filter(Boolean);
```

**Ajout** : `credentials: false` pour éviter les complications CORS avec preflight

### 2. Endpoint /health amélioré

**Changements principaux** :
- ✅ Retourne toujours `200 OK` (plus de 500)
- ✅ Headers CORS explicites avec `Access-Control-Allow-Origin: *`
- ✅ Timeout de 3 secondes sur les checks Ghostscript/LibreOffice
- ✅ Gestion d'erreur avec try/catch global

```javascript
// Headers CORS explicites
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');

// Timeout de 3 secondes
setTimeout(() => {
  gs.kill();
  resolve({ available: false, error: 'Timeout Ghostscript' });
}, 3000);

// Toujours retourner 200
res.status(200).json({
  status: 'error' | 'partial' | 'ok',
  message: '...'
});
```

### 3. Frontend PdfServiceAlert.jsx mis à jour

**Changements** :
- ✅ Timeout augmenté de 2s à 5s
- ✅ Accepte status `'partial'` comme valide
- ✅ Header `Accept: application/json` ajouté
- ✅ Meilleure gestion des erreurs en production

```javascript
// Avant
setIsServiceRunning(data.status === 'ok');

// Après
setIsServiceRunning(data.status === 'ok' || data.status === 'partial');
```

## 📦 Déploiement

### Option 1 : Script automatique

```bash
./deploy-with-pdf-fix.sh
```

Ce script :
1. Déploie le frontend mis à jour
2. Déploie le service PDF corrigé
3. Redémarre le service avec PM2
4. Teste le health check

### Option 2 : Déploiement manuel

```bash
# 1. Déployer le frontend
scp -r dist/* root@82.25.116.122:/var/www/Ges-Cab/dist/

# 2. Déployer le service PDF
scp server/index.js root@82.25.116.122:/var/www/Ges-Cab/pdf-service/

# 3. Sur le serveur
ssh root@82.25.116.122
cd /var/www/Ges-Cab/pdf-service
pm2 restart pdf-service

# 4. Tester
curl http://localhost:3001/health
```

## 🧪 Tests de validation

### 1. Test du health check local

```bash
curl http://localhost:3001/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "ghostscript_version": "10.x.x",
  "libreoffice_version": "LibreOffice 24.x.x",
  "message": "Service de conversion et normalisation opérationnel"
}
```

### 2. Test du health check en production

```bash
curl https://www.ges-cab.com/pdf/health
```

**Réponse attendue** : `200 OK` avec JSON

### 3. Test dans le navigateur

1. Ouvrir https://www.ges-cab.com
2. Vérifier la console : plus d'erreur 500
3. L'alerte PDF ne devrait plus apparaître (si le service fonctionne)

## 📊 Codes de status expliqués

| Status | Description | Alerte affichée |
|--------|-------------|-----------------|
| `ok` | Ghostscript ET LibreOffice fonctionnent | ❌ Non |
| `partial` | Un seul des deux outils fonctionne | ❌ Non |
| `error` | Aucun outil ne fonctionne | ✅ Oui |

## 🔧 Débogage

### Si l'erreur persiste

1. **Vérifier les logs du service PDF** :
```bash
ssh root@82.25.116.122
pm2 logs pdf-service
```

2. **Vérifier la configuration Nginx** :
```bash
cat /etc/nginx/sites-available/ges-cab.com
# Vérifier que /pdf/ est bien proxifié vers localhost:3001
```

3. **Tester directement depuis le serveur** :
```bash
ssh root@82.25.116.122
curl http://localhost:3001/health
```

4. **Vérifier que Ghostscript/LibreOffice sont installés** :
```bash
ssh root@82.25.116.122
gs --version
soffice --version
```

### Logs utiles

```bash
# Logs du service PDF
pm2 logs pdf-service

# Logs Nginx
tail -f /var/log/nginx/error.log

# Logs système
journalctl -u nginx -f
```

## 📝 Fichiers modifiés

1. `server/index.js` - Configuration CORS et endpoint /health
2. `src/components/PdfServiceAlert.jsx` - Gestion du health check frontend
3. `deploy-with-pdf-fix.sh` - Script de déploiement automatique

## ✨ Améliorations futures possibles

1. **Monitoring** : Ajouter un endpoint `/metrics` pour Prometheus
2. **Cache** : Mettre en cache le résultat du health check pendant 30s
3. **Notification** : Envoyer une alerte Slack si le service est down > 5min
4. **Fallback** : Utiliser PDF.js en mode dégradé si le service est indisponible

## 🎯 Résultat attendu

Après déploiement :
- ✅ Plus d'erreur 500 dans la console
- ✅ L'alerte PDF disparaît si le service fonctionne
- ✅ Les conversions Word→PDF fonctionnent
- ✅ La normalisation PDF fonctionne
- ✅ Health check accessible publiquement sans erreur CORS
