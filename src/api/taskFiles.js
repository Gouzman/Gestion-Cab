// src/api/taskFiles.js
import { supabase } from "@/lib/customSupabaseClient";
import { validateFileUrlsSafely } from "@/lib/fileUrlUtils";
import { validateUrlWithCors } from "@/lib/fetchWithCors";

/**
 * Valide qu'une URL de fichier est accessible
 * @param {string} url - URL à valider
 * @returns {Promise<boolean>} true si accessible
 */
async function validateFileUrl(url) {
  return validateUrlWithCors(url);
}

/**
 * Récupère les fichiers d'une tâche depuis tasks_files avec fallback sur attachments
 * @param {string} taskId - ID de la tâche
 * @param {string[]|string} attachmentsFallback - Fallback depuis task.attachments
 * @returns {Promise<Array>} Liste des fichiers normalisés avec URLs validées
 */
export async function getTaskFiles(taskId, attachmentsFallback) {
  try {
    // Tenter de récupérer depuis tasks_files
    const { data: taskFiles, error: filesError } = await supabase
      .from('tasks_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (filesError) {
      // Table manquante ou erreur - utiliser fallback silencieusement
      const fallbackFiles = toFilesFromAttachments(attachmentsFallback);
      return await validateFileUrlsSafely(fallbackFiles);
    }

    // Si des fichiers existent dans tasks_files, les valider
    if (taskFiles && taskFiles.length > 0) {
      const validatedFiles = await Promise.all(
        taskFiles.map(async (file) => {
          const isAccessible = await validateFileUrl(file.file_url);
          return {
            ...file,
            is_accessible: isAccessible,
            valid_url: isAccessible ? file.file_url : null,
            source: 'tasks_files'
          };
        })
      );
      return validatedFiles;
    }

    // Si aucun fichier dans tasks_files, utiliser le fallback
    const fallbackFiles = toFilesFromAttachments(attachmentsFallback);
    return await validateFileUrlsSafely(fallbackFiles);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    // En cas d'erreur, utiliser le fallback
    const fallbackFiles = toFilesFromAttachments(attachmentsFallback);
    return await validateFileUrlsSafely(fallbackFiles);
  }
}

/**
 * Convertit les attachments (format legacy) en format files normalisé
 * @param {string[]|string} attachments - Attachments depuis task.attachments
 * @returns {Array} Liste des fichiers normalisés
 */
function toFilesFromAttachments(attachments) {
  if (!attachments) return [];
  
  const arr = Array.isArray(attachments)
    ? attachments
    : safeJsonArray(attachments);

  return arr.map((url, i) => ({
    id: `att-${i}`,
    file_name: url.split("/").pop() || `fichier-${i + 1}`,
    file_url: url,
    file_size: null,
    file_type: null,
    created_at: null,
    source: 'attachments' // Marqueur pour identifier la source
  }));
}

/**
 * Parse sécurisé d'un JSON array depuis attachments
 * @param {string} value - Valeur à parser
 * @returns {Array} Array parsé ou fallback
 */
function safeJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // si ce n'est pas du JSON, c'est probablement une URL unique
    return value ? [value] : [];
  }
}

/**
 * Ajoute un fichier à la table tasks_files après upload
 * @param {string} taskId - ID de la tâche
 * @param {string} fileName - Nom du fichier
 * @param {string} fileUrl - URL du fichier
 * @param {number} fileSize - Taille du fichier
 * @param {string} fileType - Type MIME du fichier
 * @param {string} createdBy - ID de l'utilisateur
 * @param {string} fileData - Données du fichier en base64 pour backup local (optionnel, si ≤ 50Mo)
 * @returns {Promise<Object>} Résultat de l'insertion
 */
export async function addTaskFile(taskId, fileName, fileUrl, fileSize = null, fileType = null, createdBy = null, fileData = null) {
  try {
    // Ne jamais insérer si l'upload Storage n'a pas renvoyé d'URL publique
    if (!fileUrl || (typeof fileUrl === 'string' && fileUrl.trim() === '')) {
      return { success: false, error: { message: 'Aucune URL publique fournie — upload Storage non effectué' } };
    }

    // Normaliser file_size en nombre (octets) si possible
    let safeFileSize = null;
    if (typeof fileSize === 'number' && Number.isFinite(fileSize)) {
      safeFileSize = fileSize;
    } else if (typeof fileSize === 'string' && fileSize.trim() !== '') {
      const parsed = parseInt(fileSize, 10);
      safeFileSize = Number.isFinite(parsed) ? parsed : null;
    }

    const payload = {
      task_id: taskId,
      file_name: fileName,
      file_url: fileUrl,
      file_size: safeFileSize, // Toujours un nombre ou null
      file_type: fileType,
      created_by: createdBy
    };

    // Ajouter file_data uniquement si fourni (backup local base64 pour fichiers ≤ 50Mo)
    // Ne pas inclure le backup (file_data) par défaut — option laissée pour compatibilité
    if (fileData && typeof fileData === 'string' && fileData.length > 0) {
      payload.file_data = fileData;
      console.log(`💾 Backup local inclus`);
    }

    const { data, error } = await supabase
      .from("tasks_files")
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Detect table missing or permission errors and return structured error
      console.error(`❌ Erreur insertion tasks_files (code: ${error.code}):`, error.message);
      return { success: false, error };
    }

    console.log(`✅ Enregistrement tasks_files réussi (id: ${data.id})`);
    return { success: true, data };
  } catch (e) {
    console.error('❌ Exception lors de l\'insertion tasks_files:', e.message);
    return { success: false, error: e };
  }
}

/**
 * Supprime un fichier de la table tasks_files
 * @param {string} fileId - ID du fichier à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function deleteTaskFile(fileId) {
  console.warn('deleteTaskFile désactivé : table tasks_files non créée');
  return { 
    success: false, 
    error: { message: "Table tasks_files non créée dans Supabase" }
  };
}