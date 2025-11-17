// src/lib/fileUrlUtils.js
import { supabase } from "@/lib/customSupabaseClient";

/**
 * Assure qu'une URL de fichier est valide et accessible
 * @param {string} filePath - Chemin du fichier (peut être une URL complète ou un chemin relatif)
 * @param {string} bucketName - Nom du bucket Supabase (par défaut "attachments")
 * @returns {Promise<string|null>} URL publique valide ou null si impossible
 */
export async function ensureValidFileUrl(filePath, bucketName = "attachments") {
  if (!filePath) return null;

  // Cas 1 : déjà une URL complète - la retourner directement
  if (filePath.startsWith("http")) {
    return filePath;
  }

  // Cas 2 : chemin interne Supabase → on régénère le lien public
  try {
    // Vérifier d'abord si le bucket existe (silencieux)
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError || !buckets) {
      // Erreur de récupération des buckets - retourner null silencieusement
      return null;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Bucket n'existe pas - retourner null silencieusement
      return null;
    }

    // Nettoyer le chemin (enlever les préfixes inutiles)
    let cleanPath = filePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith(`${bucketName}/`)) {
      cleanPath = cleanPath.substring(`${bucketName}/`.length);
    }

    // Générer l'URL publique
    const { data } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(cleanPath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (e) {
    console.error("Erreur lors de la génération de l'URL :", e);
  }

  return null;
}

/**
 * Valide et corrige une liste de fichiers avec leurs URLs
 * @param {Array} files - Liste des fichiers à valider
 * @param {string} bucketName - Nom du bucket à utiliser
 * @returns {Promise<Array>} Liste des fichiers avec URLs validées
 */
export async function validateFileUrls(files = [], bucketName = "attachments") {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const validatedFiles = await Promise.all(
    files.map(async (file) => {
      // Déterminer le bon bucket selon le type de fichier
      let targetBucket = bucketName;
      
      // Si c'est un scan (fichier scanné), utiliser le bucket task-scans
      if (file.file_name?.includes('scan_') || file.source === 'scan') {
        targetBucket = 'task-scans';
      }

      const validUrl = await ensureValidFileUrl(file.file_url, targetBucket);
      
      return {
        ...file,
        valid_url: validUrl,
        is_accessible: validUrl !== null
      };
    })
  );

  return validatedFiles;
}

/**
 * Version sécurisée de validateFileUrls qui ne génère pas d'erreurs de console
 * @param {Array} files - Liste des fichiers à valider
 * @param {string} bucketName - Nom du bucket à utiliser
 * @returns {Promise<Array>} Liste des fichiers avec URLs validées
 */
export async function validateFileUrlsSafely(files = [], bucketName = "attachments") {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const validatedFiles = await Promise.all(
    files.map(async (file) => {
      try {
        // Si c'est déjà une URL complète, la marquer comme accessible
        if (file.file_url && file.file_url.startsWith('http')) {
          return {
            ...file,
            valid_url: file.file_url,
            is_accessible: true
          };
        }

        // Sinon, marquer comme non accessible sans essayer de générer l'URL
        // (pour éviter les erreurs de bucket manquant)
        return {
          ...file,
          valid_url: null,
          is_accessible: false
        };
      } catch (error) {
        // En cas d'erreur, marquer comme non accessible
        return {
          ...file,
          valid_url: null,
          is_accessible: false
        };
      }
    })
  );

  return validatedFiles;
}

/**
 * Corrige le chemin d'un fichier selon son contexte
 * @param {Object} file - Objet fichier
 * @param {string} taskId - ID de la tâche (optionnel)
 * @returns {string} Chemin corrigé
 */
export function correctFilePath(file, taskId = null) {
  if (!file.file_url) return null;
  
  // Si c'est déjà une URL complète, la retourner
  if (file.file_url.startsWith('http')) {
    return file.file_url;
  }

  // Si le chemin commence déjà par "tasks/" ou contient l'ID de tâche, c'est bon
  if (file.file_url.startsWith('tasks/') || (taskId && file.file_url.includes(taskId))) {
    return file.file_url;
  }

  // Sinon, construire le chemin avec la structure attendue
  if (taskId && file.file_name) {
    // Format: userId/taskId/fileName (on ne peut pas deviner userId facilement)
    // Donc on essaie de reconstituer depuis file_url s'il contient des informations
    const fileName = file.file_name;
    
    // Si file_url contient déjà un userID (format uuid-like)
    const pathParts = file.file_url.split('/');
    if (pathParts.length > 1 && pathParts[0].length === 36) {
      // Semble être userId/taskId/filename ou userId/filename
      return file.file_url;
    }
    
    // Dernière tentative : garder le chemin tel quel
    return file.file_url;
  }

  return file.file_url;
}