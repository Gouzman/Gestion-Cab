#!/bin/bash
# 🔐 Configuration HTTPS avec Let's Encrypt

echo "============================================"
echo "🔐 CONFIGURATION HTTPS"
echo "============================================"
echo ""

# ========================================
# VARIABLES (À ADAPTER)
# ========================================
DOMAIN="votre-domaine.com"  # Remplacer par votre domaine
EMAIL="admin@votre-domaine.com"  # Votre email

echo "⚠️  IMPORTANT : Avant d'exécuter ce script :"
echo "   1. Votre domaine doit pointer vers l'IP du serveur"
echo "   2. Le port 80 doit être ouvert"
echo "   3. Nginx doit être en fonctionnement"
echo ""

read -p "Le domaine ${DOMAIN} pointe-t-il vers ce serveur ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé - Configurez d'abord votre DNS"
    exit 1
fi

# ========================================
# 1. VÉRIFIER CERTBOT
# ========================================
if ! command -v certbot &> /dev/null; then
    echo "❌ Certbot non installé"
    echo "Installez-le avec : apt-get install -y certbot python3-certbot-nginx"
    exit 1
fi

# ========================================
# 2. OBTENIR CERTIFICAT
# ========================================
echo "📜 Obtention du certificat SSL..."
certbot --nginx \
    -d ${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificat SSL installé"
else
    echo "❌ Erreur lors de l'installation du certificat"
    exit 1
fi

# ========================================
# 3. TEST RENOUVELLEMENT
# ========================================
echo "🧪 Test du renouvellement automatique..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Renouvellement automatique configuré"
else
    echo "⚠️  Problème avec le renouvellement automatique"
fi

# ========================================
# 4. VÉRIFIER CRON
# ========================================
echo "⏰ Vérification du cron de renouvellement..."
systemctl status certbot.timer || echo "⚠️  Timer Certbot non actif"

echo ""
echo "============================================"
echo "✅ HTTPS CONFIGURÉ"
echo "============================================"
echo "🌐 Votre site est maintenant accessible en HTTPS"
echo "🔒 https://${DOMAIN}"
echo ""
echo "📝 Le renouvellement automatique est configuré"
echo "   Vérifiez avec : certbot renew --dry-run"
