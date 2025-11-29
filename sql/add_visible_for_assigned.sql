-- ============================================================
-- Ajout du champ visible_for_assigned pour la visibilité des documents
-- ============================================================
-- Ce champ permet de contrôler si un document transféré depuis 
-- le module Documents est visible par l'assigné de la tâche
-- ============================================================

-- Ajouter la colonne visible_for_assigned à tasks_files
ALTER TABLE public.tasks_files 
ADD COLUMN IF NOT EXISTS visible_for_assigned boolean DEFAULT true;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.tasks_files.visible_for_assigned IS 
'Détermine si le document est visible par l''assigné de la tâche. 
true = visible dans l''onglet Documents de la tâche
false = lié au dossier uniquement, non visible depuis la tâche
Par défaut true pour compatibilité avec les fichiers existants';

-- Ajouter un index pour améliorer les performances de requête
CREATE INDEX IF NOT EXISTS idx_tasks_files_visible_for_assigned 
ON public.tasks_files(visible_for_assigned) 
WHERE visible_for_assigned = true;

-- Mettre à jour la fonction get_task_documents pour inclure visible_for_assigned
CREATE OR REPLACE FUNCTION get_task_documents(p_task_id uuid)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_url text,
  file_size bigint,
  file_type text,
  document_category text,
  created_at timestamptz,
  created_by uuid,
  source text,
  is_inherited boolean,
  visible_for_assigned boolean
) AS $$
DECLARE
  v_case_id uuid;
BEGIN
  -- Récupérer le case_id de la tâche
  SELECT case_id INTO v_case_id
  FROM public.tasks
  WHERE id = p_task_id;
  
  RETURN QUERY
  SELECT DISTINCT ON (tf.file_url)
    tf.id,
    tf.file_name,
    tf.file_url,
    tf.file_size,
    tf.file_type,
    tf.document_category,
    tf.created_at,
    tf.created_by,
    CASE 
      WHEN tf.task_id = p_task_id THEN 'task'
      ELSE 'case'
    END as source,
    (tf.task_id IS NULL OR tf.task_id != p_task_id) as is_inherited,
    COALESCE(tf.visible_for_assigned, true) as visible_for_assigned
  FROM public.tasks_files tf
  WHERE (tf.task_id = p_task_id AND COALESCE(tf.visible_for_assigned, true) = true)
     OR (v_case_id IS NOT NULL 
         AND tf.case_id = v_case_id 
         AND tf.task_id IS NULL
         AND COALESCE(tf.visible_for_assigned, true) = true)
  ORDER BY tf.file_url, tf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Champ visible_for_assigned ajouté avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Modifications :';
  RAISE NOTICE '   • Colonne visible_for_assigned (boolean, default: true)';
  RAISE NOTICE '   • Index sur visible_for_assigned pour performance';
  RAISE NOTICE '   • Fonction get_task_documents() mise à jour';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Utilisation :';
  RAISE NOTICE '   • true : Document visible dans l''onglet Documents de la tâche';
  RAISE NOTICE '   • false : Document lié au dossier uniquement';
  RAISE NOTICE '   • Par défaut : true (compatibilité ascendante)';
  RAISE NOTICE '';
END $$;
