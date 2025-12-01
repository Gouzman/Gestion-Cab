# 🚀 Référence Rapide - Service PDF

## ✅ Statut Actuel
- **Service**: ✅ En ligne (PM2)
- **URL**: https://www.ges-cab.com/pdf/health
- **Status**: `200 OK`
- **Version Ghostscript**: 10.02.1
- **Version LibreOffice**: 24.2.7.2

## 🔗 URLs

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/pdf/health` | GET | Health check du service |
| `/pdf/convert-word-to-pdf` | POST | Conversion Word → PDF |
| `/pdf/normalize-pdf` | POST | Normalisation PDF |

## 📋 Commandes Utiles

### Statut du service
```bash
ssh root@82.25.116.122 "pm2 list"
```

### Logs en temps réel
```bash
ssh root@82.25.116.122 "pm2 logs pdf-service"
```

### Redémarrer le service
```bash
ssh root@82.25.116.122 "pm2 restart pdf-service"
```

### Test health check
```bash
curl https://www.ges-cab.com/pdf/health
```

### Mettre à jour le service
```bash
# 1. Modifier server/index.js localement
# 2. Exécuter:
scp server/index.js root@82.25.116.122:/var/www/Ges-Cab/pdf-service/
ssh root@82.25.116.122 "pm2 restart pdf-service"
```

## 🐛 Débogage Express

### Erreur 500 qui revient
```bash
# Vérifier que le service tourne
ssh root@82.25.116.122
pm2 list | grep pdf-service

# Si "stopped", redémarrer
pm2 restart pdf-service
```

### Erreur CORS
```bash
# Vérifier la config Nginx
ssh root@82.25.116.122
grep -A 15 "location /pdf/" /etc/nginx/sites-available/ges-cab.com

# Recharger si modifiée
systemctl reload nginx
```

### Service ne démarre pas
```bash
# Vérifier les dépendances
ssh root@82.25.116.122
gs --version          # Ghostscript
soffice --version     # LibreOffice

# Installer si manquant
apt-get update
apt-get install -y ghostscript libreoffice-writer
```

## 📦 Redéploiement Complet

Si quelque chose ne fonctionne plus:

```bash
cd /Users/gouzman/Documents/Gestion-Cab
./deploy-full-with-pdf.sh
```

Ce script refait tout de A à Z.

## 📊 Monitoring

### Vérifier l'utilisation mémoire
```bash
ssh root@82.25.116.122 "pm2 monit"
```

### Voir les statistiques
```bash
ssh root@82.25.116.122 "pm2 describe pdf-service"
```

## 🔐 Sécurité

- Rate limiting: 50 req/15min (upload)
- Rate limiting: 30 req/min (health check)
- Taille max: 50 MB
- CORS: Whitelist pour www.ges-cab.com

## 📁 Chemins Importants

| Fichier | Chemin |
|---------|--------|
| Service PDF | `/var/www/Ges-Cab/pdf-service/index.js` |
| Config Nginx | `/etc/nginx/sites-available/ges-cab.com` |
| Logs PM2 | `~/.pm2/logs/pdf-service-*.log` |
| Fichiers temp | `/var/www/Ges-Cab/pdf-service/temp/` |

## 🎯 Checklist de Validation

Après chaque modification:

- [ ] `pm2 list` → Service "online" ✅
- [ ] `curl localhost:3001/health` → Status "ok" ✅
- [ ] `curl https://www.ges-cab.com/pdf/health` → 200 OK ✅
- [ ] Ouvrir https://www.ges-cab.com → Pas d'alerte PDF ✅
- [ ] Uploader un PDF → Pas d'erreur console ✅

## 💡 Astuces

### Tester sans déployer
```bash
# Local
cd server
npm install
node index.js

# Dans un autre terminal
curl http://localhost:3001/health
```

### Voir les processus système
```bash
ssh root@82.25.116.122
top -p $(pgrep -f "pdf-service")
```

### Nettoyer les fichiers temporaires manuellement
```bash
ssh root@82.25.116.122
rm -f /var/www/Ges-Cab/pdf-service/temp/*
```

## 📞 Support

En cas de problème persistant:

1. Vérifier `pm2 logs pdf-service`
2. Vérifier `/var/log/nginx/error.log`
3. Redémarrer: `pm2 restart pdf-service`
4. Si échec: `./deploy-full-with-pdf.sh`

---

**Dernière mise à jour**: 1er décembre 2025  
**Status**: ✅ Opérationnel
