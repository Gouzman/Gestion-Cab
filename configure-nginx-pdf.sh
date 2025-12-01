#!/bin/bash

# Configuration Nginx pour le proxy du service PDF

echo "🔧 Configuration Nginx pour le service PDF"
echo "==========================================="

ssh root@82.25.116.122 << 'ENDSSH'
# Backup de la configuration actuelle
cp /etc/nginx/sites-available/ges-cab.com /etc/nginx/sites-available/ges-cab.com.backup.$(date +%Y%m%d_%H%M%S)

# Vérifier si la configuration PDF existe déjà
if grep -q "location /pdf/" /etc/nginx/sites-available/ges-cab.com; then
    echo "⚠️ La configuration /pdf/ existe déjà dans Nginx"
    echo "Vérification de la configuration actuelle..."
    grep -A 10 "location /pdf/" /etc/nginx/sites-available/ges-cab.com
else
    echo "📝 Ajout de la configuration /pdf/ dans Nginx..."
    
    # Trouver le bloc server SSL et ajouter la configuration PDF
    # On l'ajoute juste avant la dernière accolade du bloc server SSL (port 443)
    sed -i '/listen 443 ssl;/,/^}$/ {
        /^}$/ i\
\
    # Service de conversion et normalisation PDF\
    location /pdf/ {\
        proxy_pass http://localhost:3001/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '"'"'upgrade'"'"';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        client_max_body_size 50M;\
        \
        # CORS headers pour le health check\
        add_header Access-Control-Allow-Origin * always;\
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;\
        add_header Access-Control-Allow-Headers "Content-Type, Accept" always;\
        \
        # Gestion des preflight requests\
        if ($request_method = OPTIONS) {\
            return 204;\
        }\
    }
    }' /etc/nginx/sites-available/ges-cab.com
    
    echo "✅ Configuration ajoutée"
fi

# Tester la configuration Nginx
echo ""
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    
    # Recharger Nginx
    echo ""
    echo "🔄 Rechargement de Nginx..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
    
    # Tester l'endpoint via Nginx
    echo ""
    echo "🏥 Test de l'endpoint via Nginx..."
    sleep 2
    curl -s https://www.ges-cab.com/pdf/health | python3 -m json.tool 2>/dev/null || curl -s https://www.ges-cab.com/pdf/health
    
else
    echo "❌ Configuration Nginx invalide"
    echo "Restauration du backup..."
    cp /etc/nginx/sites-available/ges-cab.com.backup.$(date +%Y%m%d)* /etc/nginx/sites-available/ges-cab.com
    exit 1
fi

ENDSSH

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "🔍 Tests finaux à effectuer:"
echo "   1. Ouvrir https://www.ges-cab.com"
echo "   2. Vérifier la console : plus d'erreur 500"
echo "   3. L'alerte PDF ne devrait plus apparaître"
echo "   4. Tester l'upload d'un PDF ou document Word"
