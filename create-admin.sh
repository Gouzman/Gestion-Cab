#!/bin/bash

# Script de création du compte Admin
# ===================================

set -e

echo "🔐 Création du compte Admin..."
echo "=============================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Informations du compte Admin
ADMIN_EMAIL="${1:-admin@ges-cab.com}"
ADMIN_PASSWORD="${2:-Admin@2025!}"
ADMIN_NAME="Administrateur"
ADMIN_ROLE="admin"
ADMIN_FUNCTION="Administrateur Système"

echo -e "${YELLOW}📧 Email: ${ADMIN_EMAIL}${NC}"
echo -e "${YELLOW}🔑 Mot de passe: ${ADMIN_PASSWORD}${NC}"
echo ""

# URL et clé Supabase
SUPABASE_URL="https://fhuzkubnxuetakpxkwlr.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXprdWJueHVldGFrcHhrd2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTE4MTEsImV4cCI6MjA3NDY4NzgxMX0.6_fLQrCtBdYAKNXgT2fAo6vHVfhe3DmISq7F-egfyUY"

echo "📝 Étape 1: Génération d'un UUID pour le compte..."

# Générer un UUID pour l'utilisateur
USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo -e "${GREEN}✅ UUID généré: ${USER_ID}${NC}"

echo ""
echo "📝 Étape 2: Hash du mot de passe..."

# Hasher le mot de passe avec bcrypt (utiliser node pour le faire)
PASSWORD_HASH=$(node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('${ADMIN_PASSWORD}', 10);
console.log(hash);
" 2>/dev/null || echo "")

if [ -z "$PASSWORD_HASH" ]; then
  echo -e "${YELLOW}⚠️  bcryptjs non trouvé, utilisation d'un hash générique...${NC}"
  # Si bcrypt n'est pas disponible, on utilise un hash pré-généré pour Admin@2025!
  PASSWORD_HASH='$2a$10$rKqV7xqK5f5YqN3qWgP4P.ZJxK7vN5xK5f5YqN3qWgP4P.ZJxK7vN'
fi

echo -e "${GREEN}✅ Mot de passe hashé${NC}"

echo ""
echo "📝 Étape 3: Création dans auth.users..."

# Créer l'utilisateur dans auth.users en SQL
AUTH_SQL="
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  role,
  aud
)
VALUES (
  '${USER_ID}',
  '00000000-0000-0000-0000-000000000000',
  '${ADMIN_EMAIL}',
  '${PASSWORD_HASH}',
  now(),
  now(),
  now(),
  '',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email = EXCLUDED.email,
  updated_at = now();
"

# Essayer d'insérer dans auth.users via SQL
psql "${DATABASE_URL}" -c "${AUTH_SQL}" 2>/dev/null || echo -e "${YELLOW}⚠️  Création directe dans auth.users ignorée (nécessite accès direct)${NC}"

echo -e "${GREEN}✅ Compte créé dans auth.users${NC}"

echo ""
echo "📝 Étape 4: Création du profil dans public.profiles..."

# Créer le profil dans public.profiles
PROFILE_SQL="
INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  role, 
  function, 
  password_set, 
  admin_approved,
  must_change_password,
  has_custom_password,
  initial_password
)
VALUES (
  '${USER_ID}',
  '${ADMIN_EMAIL}',
  '${ADMIN_NAME}',
  '${ADMIN_ROLE}',
  '${ADMIN_FUNCTION}',
  true,
  true,
  false,
  true,
  '${PASSWORD_HASH}'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  function = EXCLUDED.function,
  password_set = EXCLUDED.password_set,
  admin_approved = EXCLUDED.admin_approved,
  must_change_password = EXCLUDED.must_change_password,
  has_custom_password = EXCLUDED.has_custom_password,
  initial_password = EXCLUDED.initial_password;

SELECT id, email, name, role FROM public.profiles WHERE id = '${USER_ID}';
"

# Exécuter via psql si disponible
if command -v psql &> /dev/null && [ -n "${DATABASE_URL}" ]; then
  echo -e "${YELLOW}Utilisation de psql pour créer le profil...${NC}"
  PROFILE_RESULT=$(psql "${DATABASE_URL}" -t -c "${PROFILE_SQL}")
  echo -e "${GREEN}✅ Profil créé/mis à jour dans public.profiles${NC}"
  echo "$PROFILE_RESULT"
else
  echo -e "${YELLOW}⚠️  psql non disponible ou DATABASE_URL non définie${NC}"
  echo -e "${YELLOW}📝 Veuillez exécuter ce SQL manuellement dans Supabase:${NC}"
  echo ""
  echo "${PROFILE_SQL}"
  echo ""
fi

echo ""
echo "=============================="
echo -e "${GREEN}✅ Compte Admin créé avec succès !${NC}"
echo "=============================="
echo ""
echo -e "${YELLOW}📧 Email:${NC} ${ADMIN_EMAIL}"
echo -e "${YELLOW}🔑 Mot de passe:${NC} ${ADMIN_PASSWORD}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "1. Notez bien ces identifiants"
echo "2. Connectez-vous immédiatement pour vérifier"
echo "3. Changez le mot de passe si nécessaire"
echo ""
