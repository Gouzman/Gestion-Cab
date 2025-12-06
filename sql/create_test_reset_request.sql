-- =====================================================
-- CRÉATION RAPIDE D'UNE DEMANDE DE TEST
-- =====================================================
-- Exécutez ce script pour créer immédiatement une demande
-- de test dans la table password_reset_requests
-- =====================================================

-- Nettoyer les anciennes demandes de test (optionnel)
-- DELETE FROM public.password_reset_requests;

-- Créer une demande de test avec le premier utilisateur non-admin
INSERT INTO public.password_reset_requests (
  user_id,
  user_email,
  user_name,
  user_title,
  status,
  failed_attempts,
  requested_at
)
SELECT 
  p.id,
  p.email,
  p.name,
  COALESCE(p.function, 'Non définie'),
  'pending'::TEXT,
  3,
  NOW()
FROM public.profiles p
WHERE p.role != 'admin'  -- Éviter les admins
  AND p.email IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Vérifier que la demande a été créée
SELECT 
  id,
  user_email,
  user_name,
  user_title,
  status,
  failed_attempts,
  requested_at,
  'Demande créée avec succès !' as message
FROM public.password_reset_requests
WHERE status = 'pending'
ORDER BY requested_at DESC
LIMIT 1;
