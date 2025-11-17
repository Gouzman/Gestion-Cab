#!/bin/bash

################################################################################
# 🔍 SCRIPT DE DIAGNOSTIC VPS - ANALYSE UNIQUEMENT (AUCUNE MODIFICATION)
# Date: $(date +"%Y-%m-%d %H:%M:%S")
################################################################################

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🔍 DIAGNOSTIC COMPLET DU SERVEUR VPS"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 1. INFORMATIONS SYSTÈME
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 1. INFORMATIONS SYSTÈME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🐧 Distribution Linux:"
if [ -f /etc/os-release ]; then
    cat /etc/os-release
else
    uname -a
fi
echo ""

echo "💾 Espace disque disponible:"
df -h
echo ""

echo "🧠 Mémoire disponible:"
free -h
echo ""

echo "⚡ Charge système (load average):"
uptime
echo ""

# ============================================================================
# 2. SERVICES ET LOGICIELS INSTALLÉS
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 2. SERVICES ET LOGICIELS INSTALLÉS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Node.js
echo "🟢 Node.js:"
if command -v node &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(node --version)"
    echo "   Chemin: $(which node)"
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# NPM
echo "📦 NPM:"
if command -v npm &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(npm --version)"
    echo "   Chemin: $(which npm)"
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# PM2
echo "⚙️  PM2:"
if command -v pm2 &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(pm2 --version)"
    echo "   Chemin: $(which pm2)"
    echo ""
    echo "   Processus PM2 actifs:"
    pm2 list
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# Docker
echo "🐳 Docker:"
if command -v docker &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(docker --version)"
    echo "   Chemin: $(which docker)"
    echo ""
    echo "   ⚠️  ATTENTION: Docker est installé (vous ne voulez pas l'utiliser)"
    echo ""
    echo "   Conteneurs actifs:"
    docker ps 2>/dev/null || echo "   Impossible de lister (permissions?)"
    echo ""
    echo "   Tous les conteneurs:"
    docker ps -a 2>/dev/null || echo "   Impossible de lister (permissions?)"
else
    echo "❌ NON INSTALLÉ (✅ BIEN - vous ne voulez pas Docker)"
fi
echo ""

# NGINX
echo "🌐 NGINX:"
if command -v nginx &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(nginx -v 2>&1)"
    echo "   Chemin: $(which nginx)"
    echo ""
    echo "   Statut du service:"
    systemctl status nginx --no-pager -l 2>/dev/null || service nginx status 2>/dev/null || echo "   Impossible de vérifier le statut"
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# Git
echo "🔧 Git:"
if command -v git &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(git --version)"
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# ============================================================================
# 3. PORTS EN ÉCOUTE
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 3. PORTS EN ÉCOUTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Ports TCP en écoute:"
sudo ss -tulpn | grep LISTEN || netstat -tulpn | grep LISTEN 2>/dev/null
echo ""

echo "⚠️  Ports critiques à vérifier:"
echo "   - Port 80 (HTTP)"
sudo ss -tulpn | grep ':80 ' || echo "   ✅ Libre"
echo "   - Port 443 (HTTPS)"
sudo ss -tulpn | grep ':443 ' || echo "   ✅ Libre"
echo "   - Port 3000 (Node.js standard)"
sudo ss -tulpn | grep ':3000 ' || echo "   ✅ Libre"
echo "   - Port 5000 (Backend alternatif)"
sudo ss -tulpn | grep ':5000 ' || echo "   ✅ Libre"
echo "   - Port 5173 (Vite dev)"
sudo ss -tulpn | grep ':5173 ' || echo "   ✅ Libre"
echo ""

# ============================================================================
# 4. PROCESSUS NODE.JS ACTIFS
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 4. PROCESSUS NODE.JS ACTIFS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Tous les processus Node.js:"
ps aux | grep -i node | grep -v grep
echo ""

# ============================================================================
# 5. STRUCTURE DES DOSSIERS WEB
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 5. STRUCTURE DES DOSSIERS WEB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📂 Contenu de /var/www:"
if [ -d /var/www ]; then
    ls -lah /var/www/
    echo ""
    echo "   Sous-dossiers détaillés:"
    for dir in /var/www/*/; do
        if [ -d "$dir" ]; then
            echo ""
            echo "   📦 $dir"
            ls -lah "$dir" | head -20
            if [ -f "${dir}package.json" ]; then
                echo "      ✅ package.json trouvé"
                echo "      Nom du projet: $(grep '"name"' ${dir}package.json | head -1)"
            fi
        fi
    done
else
    echo "❌ /var/www n'existe pas"
fi
echo ""

echo "📂 Contenu de /home:"
ls -lah /home/
echo ""

# Recherche de projets Node.js
echo "🔍 Recherche de fichiers package.json (projets Node.js):"
sudo find /var/www /home -name "package.json" -type f 2>/dev/null | head -20
echo ""

# ============================================================================
# 6. CONFIGURATION NGINX
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 6. CONFIGURATION NGINX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d /etc/nginx ]; then
    echo "📄 Configuration principale NGINX:"
    if [ -f /etc/nginx/nginx.conf ]; then
        echo "✅ /etc/nginx/nginx.conf existe"
    else
        echo "❌ /etc/nginx/nginx.conf introuvable"
    fi
    echo ""
    
    echo "📋 Sites disponibles (sites-available):"
    if [ -d /etc/nginx/sites-available ]; then
        ls -lah /etc/nginx/sites-available/
        echo ""
        echo "   Contenu des configurations:"
        for conf in /etc/nginx/sites-available/*; do
            if [ -f "$conf" ]; then
                echo ""
                echo "   ═══ $conf ═══"
                cat "$conf"
                echo ""
            fi
        done
    else
        echo "❌ /etc/nginx/sites-available n'existe pas"
    fi
    echo ""
    
    echo "🔗 Sites activés (sites-enabled):"
    if [ -d /etc/nginx/sites-enabled ]; then
        ls -lah /etc/nginx/sites-enabled/
    else
        echo "❌ /etc/nginx/sites-enabled n'existe pas"
    fi
    echo ""
else
    echo "❌ NGINX ne semble pas configuré (/etc/nginx introuvable)"
fi
echo ""

# ============================================================================
# 7. SERVICES SYSTEMD
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  7. SERVICES SYSTEMD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Services actifs (running):"
systemctl list-units --type=service --state=running --no-pager
echo ""

echo "Services en échec (failed):"
systemctl list-units --type=service --state=failed --no-pager
echo ""

# ============================================================================
# 8. PARE-FEU (FIREWALL)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 8. CONFIGURATION PARE-FEU"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# UFW
echo "🛡️  UFW (Uncomplicated Firewall):"
if command -v ufw &> /dev/null; then
    echo "✅ Installé"
    sudo ufw status verbose
else
    echo "❌ Non installé"
fi
echo ""

# iptables
echo "🔒 iptables:"
sudo iptables -L -n -v 2>/dev/null || echo "Impossible de lister iptables"
echo ""

# ============================================================================
# 9. CERTIFICATS SSL
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 9. CERTIFICATS SSL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Certbot
echo "🔑 Certbot (Let's Encrypt):"
if command -v certbot &> /dev/null; then
    echo "✅ INSTALLÉ - Version: $(certbot --version 2>&1 | head -1)"
    echo ""
    echo "   Certificats existants:"
    sudo certbot certificates 2>/dev/null || echo "   Aucun certificat ou erreur"
else
    echo "❌ NON INSTALLÉ"
fi
echo ""

# Recherche de certificats
echo "📜 Certificats dans /etc/letsencrypt:"
if [ -d /etc/letsencrypt/live ]; then
    sudo ls -lah /etc/letsencrypt/live/
else
    echo "❌ Aucun dossier /etc/letsencrypt/live"
fi
echo ""

# ============================================================================
# 10. VARIABLES D'ENVIRONNEMENT ET UTILISATEURS
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 10. UTILISATEURS ET ENVIRONNEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Utilisateur actuel:"
whoami
echo ""

echo "Groupes de l'utilisateur:"
groups
echo ""

echo "Utilisateurs du système:"
cat /etc/passwd | grep -E '/home|/var/www'
echo ""

# ============================================================================
# 11. LOGS RÉCENTS
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 11. LOGS RÉCENTS (20 dernières lignes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🌐 Logs NGINX - Erreurs:"
if [ -f /var/log/nginx/error.log ]; then
    sudo tail -20 /var/log/nginx/error.log
else
    echo "❌ Fichier introuvable"
fi
echo ""

echo "🌐 Logs NGINX - Accès:"
if [ -f /var/log/nginx/access.log ]; then
    sudo tail -20 /var/log/nginx/access.log
else
    echo "❌ Fichier introuvable"
fi
echo ""

echo "💻 Logs système:"
sudo journalctl -n 30 --no-pager -p err 2>/dev/null || echo "Impossible d'accéder aux logs système"
echo ""

# ============================================================================
# 12. RÉSUMÉ ET CONFLITS POTENTIELS
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  12. RÉSUMÉ ET CONFLITS POTENTIELS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Analyse des conflits potentiels:"
echo ""

# Vérification Docker
if command -v docker &> /dev/null; then
    echo "⚠️  DOCKER EST INSTALLÉ"
    echo "   Vous avez dit ne pas vouloir utiliser Docker."
    echo "   Vérifiez s'il peut être désinstallé ou s'il y a des conteneurs actifs."
    echo ""
fi

# Vérification des ports
echo "🔌 Ports occupés à surveiller:"
if sudo ss -tulpn | grep -q ':80 '; then
    echo "   ⚠️  Port 80 (HTTP) est OCCUPÉ"
else
    echo "   ✅ Port 80 (HTTP) est LIBRE"
fi

if sudo ss -tulpn | grep -q ':443 '; then
    echo "   ⚠️  Port 443 (HTTPS) est OCCUPÉ"
else
    echo "   ✅ Port 443 (HTTPS) est LIBRE"
fi

if sudo ss -tulpn | grep -q ':3000 '; then
    echo "   ⚠️  Port 3000 est OCCUPÉ"
else
    echo "   ✅ Port 3000 est LIBRE"
fi
echo ""

# Vérification Node/NPM
if ! command -v node &> /dev/null; then
    echo "❌ Node.js N'EST PAS INSTALLÉ - Installation nécessaire"
    echo ""
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM N'EST PAS INSTALLÉ - Installation nécessaire"
    echo ""
fi

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 N'EST PAS INSTALLÉ - Installation recommandée"
    echo ""
fi

# Vérification NGINX
if ! command -v nginx &> /dev/null; then
    echo "❌ NGINX N'EST PAS INSTALLÉ - Installation nécessaire"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo "✅ DIAGNOSTIC TERMINÉ"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Copiez tout ce rapport"
echo "   2. Envoyez-le pour analyse"
echo "   3. Une procédure de déploiement personnalisée sera créée"
echo ""
echo "⚠️  IMPORTANT: Aucune modification n'a été effectuée sur le serveur"
echo ""
