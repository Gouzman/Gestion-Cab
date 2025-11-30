# 📦 Archive Docker - Ancienne Architecture

**Date d'archivage** : 29 novembre 2025  
**Raison** : Retour à l'architecture initiale sans Docker

---

## 📋 Contenu de cette archive

Ce dossier contient les fichiers Docker qui ont été utilisés temporairement mais qui sont maintenant archivés car nous sommes revenus à une architecture de déploiement plus simple.

### Fichiers archivés

1. **Dockerfile** - Image Docker pour le serveur PDF
   - Basée sur Node.js 20 Bullseye
   - Incluait LibreOffice et Ghostscript
   - Port 3001

---

## 🚫 Pourquoi Docker a été supprimé

L'architecture initiale de Gestion-Cab était conçue pour fonctionner **SANS Docker** :

### Architecture initiale (sans Docker)
```
/var/www/ges-cab/
├── frontend/      ← Build Vite déployé
├── server/        ← Node.js en direct
├── logs/
└── .env
```

**Avantages** :
- ✅ Plus simple à comprendre
- ✅ Moins de ressources système
- ✅ Pas d'overhead de conteneurisation
- ✅ Débogage plus facile
- ✅ Déploiement direct

### Pourquoi Docker avait été ajouté (temporairement)

Docker avait été introduit pour :
- Isolation du service PDF
- Portabilité supposée
- Gestion des dépendances (LibreOffice, Ghostscript)

**Mais** :
- ❌ Ajoutait de la complexité inutile
- ❌ Consommation mémoire supplémentaire
- ❌ Configuration réseau plus complexe
- ❌ Pas nécessaire pour une app simple

---

## 🔄 Comment l'application fonctionne maintenant

### Sans Docker (architecture actuelle)

**1. Frontend**
- Build React/Vite déployé dans `/var/www/ges-cab/frontend/`
- Servi par NGINX directement
- Pas de conteneur

**2. Service PDF (Node.js)**
- Installé directement dans `/var/www/ges-cab/server/`
- LibreOffice et Ghostscript installés sur le système
- Service systemd : `ges-cab.service`
- Port 3001 (localhost uniquement)

**3. NGINX**
- Reverse proxy simple
- Sert le frontend
- Proxy `/pdf/` vers `localhost:3001`

### Commandes de gestion

```bash
# Démarrer/arrêter l'application
systemctl start ges-cab
systemctl stop ges-cab
systemctl restart ges-cab

# Voir les logs
journalctl -u ges-cab -f
tail -f /var/www/ges-cab/logs/server.log

# Recharger NGINX
systemctl reload nginx

# Déployer nouvelle version
npm run build
rsync -avz dist/ root@82.25.116.122:/var/www/ges-cab/frontend/
systemctl restart ges-cab
```

---

## 🗂️ Si vous devez réutiliser Docker

Si dans le futur vous avez besoin de revenir à Docker, les fichiers sont ici.

### Pour reconstruire l'image

```bash
cd /path/to/Gestion-Cab
docker build -f deployment/docker-archive/Dockerfile -t gestion-cab-pdf:latest ./server
```

### Pour lancer le container

```bash
docker run -d \
  --name pdf-service \
  -p 3001:3001 \
  -v $(pwd)/server/temp:/app/temp \
  -e NODE_ENV=production \
  gestion-cab-pdf:latest
```

---

## 📚 Documentation de référence

- **Plan de migration** : `PLAN_RETOUR_ARCHITECTURE_INITIALE.md`
- **Script d'exécution** : `remove-docker-restore-initial.sh`
- **Architecture initiale** : `RAPPORT_DEPLOIEMENT_INITIAL.md`

---

**Note** : Cette archive est conservée uniquement à titre de référence. L'architecture de production n'utilise **PAS** Docker.
