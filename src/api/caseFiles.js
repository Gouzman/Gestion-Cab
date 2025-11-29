// src/api/caseFiles.js
import { supabase } from "@/lib/customSupabaseClient";

/**
 * Récupère tous les documents d'un dossier (incluant ceux des tâches liées)
 * @param {string} caseId - ID du dossier
 * @returns {Promise<Object>} Liste des fichiers avec métadonnées
 */
export async function getCaseDocuments(caseId) {
  try {
    if (!caseId) {
      return { success: false, error: 'caseId est requis', data: [] };
    }

    // Utiliser la fonction RPC Supabase pour récupérer tous les documents
    const { data, error } = await supabase
      .rpc('get_case_documents', { p_case_id: caseId });

    if (error) {
      // Fallback : requête manuelle si la fonction RPC n'existe pas encore
      console.warn('⚠️ Fonction get_case_documents non disponible, fallback sur requête manuelle');
      
      // Récupérer les documents directs du dossier
      const { data: caseFiles, error: caseError } = await supabase
        .from('tasks_files')
        .select('*')
        .eq('case_id', caseId)
        .is('task_id', null);

      // Récupérer les IDs des tâches liées au dossier
      const { data: caseTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('case_id', caseId);

      const taskIds = caseTasks?.map(t => t.id) || [];

      // Récupérer les documents des tâches liées
      let taskFiles = [];
      if (taskIds.length > 0) {
        const { data: tFiles } = await supabase
          .from('tasks_files')
          .select(`
            *,
            tasks!inner(id, title)
          `)
          .in('task_id', taskIds);
        
        taskFiles = tFiles || [];
      }

      // Fusionner et dédupliquer par file_url
      const allFiles = [...(caseFiles || []), ...taskFiles];
      const uniqueFiles = Array.from(
        new Map(allFiles.map(f => [f.file_url, {
          ...f,
          source: f.task_id ? 'task' : 'case',
          task_title: f.tasks?.title || null
        }])).values()
      );

      return { success: true, data: uniqueFiles };
    }

    // Ajouter les métadonnées de source
    const filesWithMeta = (data || []).map(file => ({
      ...file,
      is_from_task: file.source === 'task',
      is_from_case: file.source === 'case'
    }));

    console.log(`✅ ${filesWithMeta.length} document(s) récupéré(s) pour le dossier ${caseId}`);
    return { success: true, data: filesWithMeta };

  } catch (e) {
    console.error('❌ Erreur lors de la récupération des documents du dossier:', e);
    return { success: false, error: e.message, data: [] };
  }
}

/**
 * Récupère tous les documents d'une tâche (incluant ceux du dossier parent)
 * @param {string} taskId - ID de la tâche
 * @returns {Promise<Object>} Liste des fichiers avec métadonnées
 */
export async function getTaskDocumentsWithInherited(taskId) {
  try {
    if (!taskId) {
      return { success: false, error: 'taskId est requis', data: [] };
    }

    // Utiliser la fonction RPC Supabase
    const { data, error } = await supabase
      .rpc('get_task_documents', { p_task_id: taskId });

    if (error) {
      // Fallback : requête manuelle
      console.warn('⚠️ Fonction get_task_documents non disponible, fallback sur requête manuelle');
      
      // Récupérer les documents de la tâche
      const { data: taskFiles } = await supabase
        .from('tasks_files')
        .select('*')
        .eq('task_id', taskId);

      // Récupérer le case_id de la tâche
      const { data: taskData } = await supabase
        .from('tasks')
        .select('case_id')
        .eq('id', taskId)
        .single();

      // Récupérer les documents du dossier parent si existant
      let caseFiles = [];
      if (taskData?.case_id) {
        const { data: cFiles } = await supabase
          .from('tasks_files')
          .select('*')
          .eq('case_id', taskData.case_id)
          .is('task_id', null);
        
        caseFiles = (cFiles || []).map(f => ({
          ...f,
          is_inherited: true,
          source: 'case'
        }));
      }

      // Fusionner et dédupliquer
      const allFiles = [
        ...(taskFiles || []).map(f => ({ ...f, is_inherited: false, source: 'task' })),
        ...caseFiles
      ];

      const uniqueFiles = Array.from(
        new Map(allFiles.map(f => [f.file_url, f])).values()
      );

      return { success: true, data: uniqueFiles };
    }

    console.log(`✅ ${data.length} document(s) récupéré(s) pour la tâche ${taskId}`);
    return { success: true, data: data || [] };

  } catch (e) {
    console.error('❌ Erreur lors de la récupération des documents de la tâche:', e);
    return { success: false, error: e.message, data: [] };
  }
}

/**
 * Ajoute un document directement à un dossier (sans tâche)
 * @param {string} caseId - ID du dossier
 * @param {string} fileName - Nom du fichier
 * @param {string} fileUrl - URL du fichier
 * @param {number} fileSize - Taille du fichier
 * @param {string} fileType - Type MIME
 * @param {string} createdBy - ID utilisateur
 * @returns {Promise<Object>} Résultat de l'insertion
 */
export async function addCaseFile(caseId, fileName, fileUrl, fileSize = null, fileType = null, createdBy = null) {
  try {
    // Validation
    if (!caseId || !fileName || !fileUrl) {
      return { 
        success: false, 
        error: 'caseId, fileName et fileUrl sont requis' 
      };
    }

    // Vérifier que le dossier existe
    const { data: caseExists, error: caseCheckError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .single();

    if (caseCheckError || !caseExists) {
      return {
        success: false,
        error: `Le dossier ${caseId} n'existe pas`
      };
    }

    // Vérifier si le fichier n'existe pas déjà
    const { data: existing } = await supabase
      .from('tasks_files')
      .select('id')
      .eq('case_id', caseId)
      .eq('file_url', fileUrl)
      .is('task_id', null)
      .single();

    if (existing) {
      console.log(`ℹ️ Document déjà lié au dossier ${caseId}`);
      return { success: true, data: existing, isDuplicate: true };
    }

    // Insérer le document
    const payload = {
      case_id: caseId,
      task_id: null, // Document général du dossier
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      file_type: fileType,
      created_by: createdBy
    };

    const { data, error } = await supabase
      .from('tasks_files')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion document dossier:', error);
      return { success: false, error };
    }

    console.log(`✅ Document ajouté au dossier ${caseId}`);
    return { success: true, data };

  } catch (e) {
    console.error('❌ Exception lors de l\'ajout du document au dossier:', e);
    return { success: false, error: e.message };
  }
}
