# ✅ CHECKLIST DÉPLOIEMENT PRODUCTION

## 📋 AVANT LE DÉPLOIEMENT

### 1. Préparation locale
- [ ] Code testé localement (`npm run dev`)
- [ ] Build local fonctionne (`npm run build`)
- [ ] Variables d'environnement configurées dans `.env.production`
- [ ] Credentials Supabase valides (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Git commit & push sur branche main/production
- [ ] Backup local du code (`git archive`)

### 2. Base de données Supabase
- [ ] Scripts SQL exécutés dans Supabase SQL Editor :
  - [ ] `sql/SETUP_COMPLET_AUTHENTIFICATION.sql`
  - [ ] `sql/FIX_DEFINITIF_FK_CONSTRAINT.sql`
  - [ ] `sql/FORCE_CONFIRM_EMAILS.sql`
- [ ] Buckets créés :
  - [ ] `attachments` (public)
  - [ ] `task-scans` (public)
- [ ] RLS policies vérifiées
- [ ] Fonctions RPC testées :
  - [ ] `create_collaborator`
  - [ ] `update_user_password`
  - [ ] `delete_user_account`
- [ ] Backup Supabase effectué (export SQL)

### 3. GitHub Secrets configurés
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SSH_PRIVATE_KEY` (clé privée SSH pour connexion serveur)
- [ ] `SERVER_IP` (82.25.116.122)
- [ ] `SERVER_USER` (root)

---

## 🖥️ SUR LE SERVEUR

### 4. Diagnostic initial
```bash
ssh root@82.25.116.122
bash diagnostic.sh
```
- [ ] OS identifié (Ubuntu/Debian)
- [ ] Espace disque suffisant (>5 GB libre)
- [ ] Ports 80 et 443 disponibles
- [ ] Pas de conflit avec Docker

### 5. Installation environnement
```bash
bash install-environment.sh
```
- [ ] Node.js 20 installé
- [ ] npm installé
- [ ] PM2 installé
- [ ] Nginx installé et démarré
- [ ] Certbot installé
- [ ] Git et rsync installés

### 6. Structure production
```bash
bash create-structure.sh
```
- [ ] Dossier `/var/www/gestion-cab` créé
- [ ] Sous-dossiers créés (dist, logs, backups)
- [ ] Permissions configurées

### 7. Configuration Nginx
```bash
# Copier la config
scp deployment/nginx-config root@82.25.116.122:/etc/nginx/sites-available/gestion-cab

# Activer
ssh root@82.25.116.122
bash setup-nginx.sh
```
- [ ] Config Nginx copiée
- [ ] Site activé
- [ ] Config testée (`nginx -t`)
- [ ] Nginx rechargé

---

## 🚀 DÉPLOIEMENT

### 8. Premier déploiement
**Option A : GitHub Actions (automatique)**
```bash
git push origin main
# Vérifier dans GitHub Actions que le déploiement passe
```

**Option B : Manuel (depuis votre machine)**
```bash
bash deployment/deploy-manual.sh
```

- [ ] Build réussi
- [ ] Fichiers transférés via rsync
- [ ] Nginx rechargé
- [ ] Health check OK (HTTP 200)

### 9. Vérifications post-déploiement
- [ ] Site accessible via `http://82.25.116.122`
- [ ] Page d'accueil se charge
- [ ] Connexion admin fonctionne
- [ ] Upload fichier (<1MB) fonctionne
- [ ] Preview fichier fonctionne
- [ ] Création tâche fonctionne
- [ ] Liste collaborateurs s'affiche

---

## 🔐 SÉCURISATION (OPTIONNEL MAIS RECOMMANDÉ)

### 10. HTTPS (si nom de domaine)
```bash
# Éditer deployment/setup-https.sh avec votre domaine
ssh root@82.25.116.122
bash setup-https.sh
```
- [ ] Certificat SSL obtenu
- [ ] HTTPS activé
- [ ] Redirection HTTP → HTTPS configurée
- [ ] Renouvellement automatique configuré

### 11. Firewall (UFW)
```bash
ssh root@82.25.116.122

# Activer firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```
- [ ] Firewall activé
- [ ] Ports autorisés

---

## 🔍 MONITORING

### 12. Logs à surveiller
```bash
# Logs Nginx
tail -f /var/www/gestion-cab/logs/nginx-access.log
tail -f /var/www/gestion-cab/logs/nginx-error.log

# Logs système
journalctl -u nginx -f
```

### 13. Tests de charge (optionnel)
```bash
# Tester avec ab (Apache Bench)
ab -n 100 -c 10 http://82.25.116.122/
```

---

## 🔄 ROLLBACK

### 14. En cas de problème
```bash
# Depuis votre machine locale
bash deployment/rollback.sh
```
- [ ] Backup listé
- [ ] Version précédente restaurée
- [ ] Site fonctionnel

---

## 📝 DOCUMENTATION

### 15. URLs importantes
- **Site production** : `http://82.25.116.122` (ou votre domaine)
- **Health check** : `http://82.25.116.122/health`
- **Supabase Dashboard** : `https://supabase.com/dashboard`
- **GitHub Actions** : `https://github.com/VOTRE_ORG/VOTRE_REPO/actions`

### 16. Commandes utiles
```bash
# État Nginx
systemctl status nginx

# Recharger Nginx
systemctl reload nginx

# Tester config Nginx
nginx -t

# Voir les processus PM2 (si backend)
pm2 list
pm2 logs

# Espace disque
df -h

# Voir les backups
ls -lh /var/www/gestion-cab/backups/
```

---

## ❌ EXCLUSIONS

Les fonctionnalités suivantes sont **EXCLUES** du déploiement :

### Fonctions désactivées / non déployées :
- ❌ Edge Functions Supabase (sendPasswordResetEmail) - **SUPPRIMÉES**
- ❌ Service d'envoi d'emails (emailService.js) - **SUPPRIMÉ**
- ❌ Bucket auto-création automatique via RPC - **CRÉATION MANUELLE REQUISE**

### Fichiers exclus du build :
- `.env*` (jamais déployés)
- `node_modules/`
- `.git/`
- `*.map` (source maps, optionnel)
- `README.md`, `*.md` (documentation)

---

## 🆘 EN CAS DE PROBLÈME

### Site ne se charge pas
1. Vérifier Nginx : `systemctl status nginx`
2. Vérifier logs : `tail -f /var/www/gestion-cab/logs/nginx-error.log`
3. Tester config : `nginx -t`
4. Vérifier fichiers : `ls -la /var/www/gestion-cab/dist/`

### Erreur 502 Bad Gateway
1. Vérifier que dist/ contient des fichiers
2. Vérifier permissions : `ls -la /var/www/gestion-cab/dist/`
3. Recharger Nginx : `systemctl reload nginx`

### Erreurs Supabase (CORS, 401, etc.)
1. Vérifier variables d'environnement
2. Vérifier RLS policies dans Supabase
3. Vérifier que ANON_KEY est correct

### Build échoue dans GitHub Actions
1. Vérifier secrets GitHub
2. Vérifier logs GitHub Actions
3. Tester build en local : `npm run build`

---

## ✅ DÉPLOIEMENT TERMINÉ

- [ ] Toutes les étapes complétées
- [ ] Site accessible et fonctionnel
- [ ] Monitoring en place
- [ ] Documentation mise à jour
- [ ] Équipe informée

**Date du déploiement** : _______________  
**Version déployée** : _______________  
**Déployé par** : _______________
