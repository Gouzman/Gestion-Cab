# 🐳 Dockerfile pour le serveur PDF
# Image officielle Node.js + LibreOffice + Ghostscript
# 
# Ce conteneur fournit :
# - Normalisation PDF (Ghostscript)
# - Conversion Word → PDF (LibreOffice)
# - Rate limiting et sécurité spawn()

FROM node:20-bullseye

# Métadonnées
LABEL maintainer="Gestion-Cab"
LABEL description="Serveur de conversion et normalisation PDF"
LABEL version="1.0.0"

# Installation de LibreOffice et Ghostscript
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    ghostscript \
    fonts-liberation \
    fonts-dejavu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Création du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY server/package*.json ./

# Installation des dépendances Node.js
RUN npm ci --only=production

# Copie du code source
COPY server/ ./

# Création du dossier temp pour les uploads
RUN mkdir -p /app/temp && chmod 777 /app/temp

# Exposition du port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Utilisateur non-root pour la sécurité
RUN useradd -m -u 1001 pdfservice && \
    chown -R pdfservice:pdfservice /app

USER pdfservice

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Commande de démarrage
CMD ["node", "index.js"]
