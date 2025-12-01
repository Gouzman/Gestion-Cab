#!/bin/bash

# Script pour forcer le rechargement complet du site
# Résout les problèmes de cache navigateur

echo "🔄 Forçage du rechargement du site..."
echo "===================================="

ssh root@82.25.116.122 << 'ENDSSH'
cd /var/www/Ges-Cab/dist

# Ajouter un timestamp unique à tous les fichiers statiques
echo "📝 Ajout de headers anti-cache..."

# Créer/modifier .htaccess pour forcer le rechargement
cat > .htaccess << 'EOF'
# Désactiver le cache pour les fichiers HTML
<FilesMatch "\.(html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</FilesMatch>

# Cache court pour les assets JS/CSS (1 jour)
<FilesMatch "\.(js|css)$">
    Header set Cache-Control "max-age=86400, must-revalidate"
</FilesMatch>

# Cache long pour les images et fonts
<FilesMatch "\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=2592000"
</FilesMatch>
EOF

echo "✅ Headers configurés"

# Recharger Nginx pour être sûr
echo "🔄 Rechargement de Nginx..."
systemctl reload nginx

# Vérifier le service PDF
echo ""
echo "🏥 Vérification du service PDF..."
pm2 list | grep pdf-service

# Test final
echo ""
echo "🧪 Test de l'endpoint health..."
curl -s https://www.ges-cab.com/pdf/health | python3 -m json.tool 2>/dev/null || curl -s https://www.ges-cab.com/pdf/health

ENDSSH

echo ""
echo "✅ Terminé !"
echo ""
echo "📌 Instructions pour l'utilisateur:"
echo "   1. Ouvrir votre navigateur"
echo "   2. Appuyer sur Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)"
echo "      pour forcer le rechargement sans cache"
echo "   3. Ou ouvrir une fenêtre de navigation privée"
echo "   4. Aller sur https://www.ges-cab.com"
echo ""
echo "🔍 L'erreur 500 devrait avoir disparu !"
