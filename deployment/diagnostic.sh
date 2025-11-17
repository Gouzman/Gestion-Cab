#!/bin/bash
# 🔍 Script de diagnostic serveur - NE MODIFIE RIEN
# À exécuter : bash diagnostic.sh

echo "============================================"
echo "📊 DIAGNOSTIC SERVEUR - $(date)"
echo "============================================"
echo ""

echo "🖥️  1. SYSTÈME D'EXPLOITATION"
echo "--------------------------------------------"
cat /etc/os-release
uname -a
echo ""

echo "💾 2. ESPACE DISQUE"
echo "--------------------------------------------"
df -h
echo ""

echo "🔧 3. LOGICIELS INSTALLÉS"
echo "--------------------------------------------"
echo "Node.js :"
node --version 2>/dev/null || echo "❌ Node.js non installé"
echo "npm :"
npm --version 2>/dev/null || echo "❌ npm non installé"
echo "PM2 :"
pm2 --version 2>/dev/null || echo "❌ PM2 non installé"
echo "Nginx :"
nginx -v 2>&1 || echo "❌ Nginx non installé"
echo "Certbot :"
certbot --version 2>/dev/null || echo "❌ Certbot non installé"
echo "Git :"
git --version 2>/dev/null || echo "❌ Git non installé"
echo ""

echo "🐳 4. DOCKER (à désactiver)"
echo "--------------------------------------------"
docker --version 2>/dev/null || echo "✅ Docker non installé"
docker ps 2>/dev/null || echo "✅ Docker non actif"
systemctl status docker 2>/dev/null | grep "Active" || echo "✅ Service Docker inactif"
echo ""

echo "🔌 5. PORTS UTILISÉS"
echo "--------------------------------------------"
netstat -tuln | grep LISTEN || ss -tuln | grep LISTEN
echo ""

echo "🌐 6. SERVICES ACTIFS"
echo "--------------------------------------------"
systemctl list-units --type=service --state=running | grep -E "nginx|node|pm2|apache"
echo ""

echo "📁 7. ARBORESCENCE"
echo "--------------------------------------------"
echo "Contenu de /var/www/ :"
ls -la /var/www/ 2>/dev/null || echo "❌ /var/www/ n'existe pas"
echo ""
echo "Contenu de /home/ :"
ls -la /home/ 2>/dev/null
echo ""

echo "👤 8. UTILISATEUR ACTUEL"
echo "--------------------------------------------"
whoami
id
echo ""

echo "🔥 9. FIREWALL"
echo "--------------------------------------------"
ufw status 2>/dev/null || echo "⚠️  UFW non installé"
iptables -L -n 2>/dev/null | head -20 || echo "⚠️  iptables non accessible"
echo ""

echo "============================================"
echo "✅ DIAGNOSTIC TERMINÉ"
echo "============================================"
