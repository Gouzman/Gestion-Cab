-- ============================================================
-- Synchronisation Bidirectionnelle : Documents <> Tâches <> Dossiers
-- ============================================================
-- Ce script établit une synchronisation automatique des documents entre
-- les tâches et leurs dossiers parents via un trigger Supabase
-- ============================================================

-- 1️⃣ Fonction : Synchroniser document de tâche vers dossier
CREATE OR REPLACE FUNCTION sync_task_file_to_case()
RETURNS TRIGGER AS $$
DECLARE
  v_case_id uuid;
BEGIN
  -- Récupérer le case_id de la tâche si elle existe
  IF NEW.task_id IS NOT NULL THEN
    SELECT case_id INTO v_case_id
    FROM public.tasks
    WHERE id = NEW.task_id;
    
    -- Si la tâche est liée à un dossier et que case_id n'est pas déjà rempli
    IF v_case_id IS NOT NULL AND NEW.case_id IS NULL THEN
      -- Mettre à jour le case_id du document pour établir le lien
      UPDATE public.tasks_files
      SET case_id = v_case_id
      WHERE id = NEW.id;
      
      RAISE NOTICE '✅ Document "%" lié au dossier % via la tâche', NEW.file_name, v_case_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ Trigger : Après insertion d'un document de tâche
DROP TRIGGER IF EXISTS trigger_sync_task_file_to_case ON public.tasks_files;
CREATE TRIGGER trigger_sync_task_file_to_case
AFTER INSERT ON public.tasks_files
FOR EACH ROW
WHEN (NEW.task_id IS NOT NULL)
EXECUTE FUNCTION sync_task_file_to_case();

-- 3️⃣ Fonction : Nettoyer les références au dossier lors de suppression
CREATE OR REPLACE FUNCTION cleanup_case_file_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_case_id uuid;
BEGIN
  -- Récupérer le case_id de la tâche
  IF OLD.task_id IS NOT NULL THEN
    SELECT case_id INTO v_case_id
    FROM public.tasks_files
    WHERE id = OLD.id;
    
    -- Supprimer la référence du dossier si elle existe
    IF v_case_id IS NOT NULL THEN
      DELETE FROM public.tasks_files
      WHERE file_url = OLD.file_url
      AND case_id = v_case_id
      AND task_id IS NULL;
      
      RAISE NOTICE '🗑️ Référence du document "%" supprimée du dossier %', OLD.file_name, v_case_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ Trigger : Avant suppression d'un document de tâche
DROP TRIGGER IF EXISTS trigger_cleanup_case_file ON public.tasks_files;
CREATE TRIGGER trigger_cleanup_case_file
BEFORE DELETE ON public.tasks_files
FOR EACH ROW
WHEN (OLD.task_id IS NOT NULL)
EXECUTE FUNCTION cleanup_case_file_reference();

-- 5️⃣ Fonction : Récupérer tous les documents d'un dossier (tâches + dossier)
CREATE OR REPLACE FUNCTION get_case_documents(p_case_id uuid)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_url text,
  file_size bigint,
  file_type text,
  created_at timestamptz,
  created_by uuid,
  source text,
  task_id uuid,
  task_title text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (tf.file_url)
    tf.id,
    tf.file_name,
    tf.file_url,
    tf.file_size,
    tf.file_type,
    tf.created_at,
    tf.created_by,
    CASE 
      WHEN tf.task_id IS NOT NULL THEN 'task'
      ELSE 'case'
    END as source,
    tf.task_id,
    t.title as task_title
  FROM public.tasks_files tf
  LEFT JOIN public.tasks t ON tf.task_id = t.id
  WHERE tf.case_id = p_case_id
     OR tf.task_id IN (SELECT id FROM public.tasks WHERE case_id = p_case_id)
  ORDER BY tf.file_url, tf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6️⃣ Fonction : Récupérer tous les documents d'une tâche (tâche + dossier parent)
CREATE OR REPLACE FUNCTION get_task_documents(p_task_id uuid)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_url text,
  file_size bigint,
  file_type text,
  created_at timestamptz,
  created_by uuid,
  source text,
  is_inherited boolean
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
    tf.created_at,
    tf.created_by,
    CASE 
      WHEN tf.task_id = p_task_id THEN 'task'
      ELSE 'case'
    END as source,
    (tf.task_id IS NULL OR tf.task_id != p_task_id) as is_inherited
  FROM public.tasks_files tf
  WHERE tf.task_id = p_task_id
     OR (v_case_id IS NOT NULL AND tf.case_id = v_case_id AND tf.task_id IS NULL)
  ORDER BY tf.file_url, tf.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ Vérification et test
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Synchronisation bidirectionnelle activée !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Triggers créés :';
  RAISE NOTICE '   • trigger_sync_task_file_to_case : Synchronise documents tâche → dossier';
  RAISE NOTICE '   • trigger_cleanup_case_file : Nettoie références lors de suppression';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Fonctions disponibles :';
  RAISE NOTICE '   • get_case_documents(case_id) : Tous les documents d''un dossier';
  RAISE NOTICE '   • get_task_documents(task_id) : Tous les documents d''une tâche';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Comportement :';
  RAISE NOTICE '   1. Document uploadé dans une tâche → automatiquement visible dans le dossier';
  RAISE NOTICE '   2. Document uploadé dans un dossier → visible dans toutes les tâches du dossier';
  RAISE NOTICE '   3. Suppression d''un document de tâche → supprime aussi la référence du dossier';
  RAISE NOTICE '   4. Pas de duplication physique des fichiers (seulement des références)';
  RAISE NOTICE '';
END $$;
