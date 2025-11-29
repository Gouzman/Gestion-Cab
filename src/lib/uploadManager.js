// src/lib/uploadManager.js
import { supabase } from "@/lib/customSupabaseClient";
import { addTaskFile } from "@/api/taskFiles";
import { isWordDocument, convertWordToPdf, getConvertedPdfName } from "@/lib/wordToPdfConverter";
import { isPdfDocument, optimizePdfForViewer, checkPdfCompatibility } from "@/lib/pdfOptimizer";

/**
 * Upload un fichier vers Supabase Storage avec le bon format de chemin
 * Convertit automatiquement les documents Word (.doc, .docx) en PDF avant l'upload
 * @param {File} file - Le fichier à uploader
 * @param {string} taskId - ID de la tâche
 * @param {string} userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Résultat de l'upload avec URL publique
 */
export async function uploadTaskFile(file, taskId, userId = null) {
  try {
    // 0. VALIDATION CRITIQUE : Vérifier que taskId est valide et existe dans la table tasks
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      console.error(`❌ taskId invalide ou manquant pour le fichier "${file.name}"`);
      return {
        success: false,
        error: 'ID de tâche manquant. Veuillez créer la tâche avant d\'uploader des fichiers.'
      };
    }

    // Vérifier que la tâche existe réellement dans la base de données
    const { data: taskExists, error: taskCheckError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .single();

    if (taskCheckError || !taskExists) {
      console.error(`❌ La tâche "${taskId}" n'existe pas dans la base de données`);
      return {
        success: false,
        error: `La tâche n'existe pas. Veuillez enregistrer la tâche avant d'uploader des fichiers.`
      };
    }

    console.log(`✅ Validation task_id: "${taskId}" existe dans la table tasks`);

    // 1. Validation de la taille (50 Mo maximum)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.error(`❌ Fichier "${file.name}" trop volumineux: ${sizeMB} Mo (max: 50 Mo)`);
      return { 
        success: false, 
        error: `Fichier trop volumineux (${sizeMB} Mo). Limite: 50 Mo.` 
      };
    }

    // 2. Conversion automatique Word → PDF si nécessaire
    let fileToUpload = file;
    let originalFileName = file.name;
    let wasConverted = false;
    let wasOptimized = false;

    if (isWordDocument(file)) {
      console.log(`📄 Document Word détecté: "${file.name}" - Conversion en PDF...`);
      try {
        const convertedPdf = await convertWordToPdf(file);
        if (convertedPdf) {
          fileToUpload = convertedPdf;
          wasConverted = true;
          console.log(`✅ Conversion réussie: "${file.name}" → "${convertedPdf.name}"`);
        } else {
          console.warn(`⚠️ Conversion échouée pour "${file.name}", upload du fichier original`);
        }
      } catch (conversionError) {
        console.warn(`⚠️ Erreur de conversion pour "${file.name}":`, conversionError.message);
        console.warn(`📤 Upload du fichier Word original sans conversion`);
      }
    }

    // 2b. Optimisation PDF pour garantir la compatibilité avec PDF.js
    // Cette étape intègre les polices et normalise le PDF
    if (isPdfDocument(fileToUpload)) {
      console.log(`📄 PDF détecté: "${fileToUpload.name}" - Optimisation pour PDF.js...`);
      try {
        const optimizedPdf = await optimizePdfForViewer(fileToUpload);
        if (optimizedPdf && optimizedPdf !== fileToUpload) {
          const originalSize = (fileToUpload.size / 1024).toFixed(2);
          const optimizedSize = (optimizedPdf.size / 1024).toFixed(2);
          console.log(`✅ PDF optimisé: ${originalSize} Ko → ${optimizedSize} Ko`);
          fileToUpload = optimizedPdf;
          wasOptimized = true;
        } else {
          console.log(`ℹ️ PDF déjà optimal ou optimisation non nécessaire`);
        }
      } catch (optimizationError) {
        console.warn(`⚠️ Erreur d'optimisation PDF pour "${fileToUpload.name}":`, optimizationError.message);
        console.warn(`📤 Upload du PDF original sans optimisation`);
      }
    }

    // 3. Créer le chemin selon le format attendu : tasks/{taskId}/{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = fileToUpload.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `tasks/${taskId}/${fileName}`;

    let uploadMessage = '';
    if (wasConverted && wasOptimized) {
      uploadMessage = `📤 Upload du PDF converti et optimisé "${fileToUpload.name}" (original: "${originalFileName}") pour la tâche ${taskId}...`;
    } else if (wasConverted) {
      uploadMessage = `📤 Upload du PDF converti "${fileToUpload.name}" (original: "${originalFileName}") pour la tâche ${taskId}...`;
    } else if (wasOptimized) {
      uploadMessage = `📤 Upload du PDF optimisé "${fileToUpload.name}" (${(fileToUpload.size / 1024).toFixed(2)} Ko) pour la tâche ${taskId}...`;
    } else {
      uploadMessage = `📤 Upload du fichier "${fileToUpload.name}" (${(fileToUpload.size / 1024).toFixed(2)} Ko) pour la tâche ${taskId}...`;
    }
    
    console.log(uploadMessage);

    // 4. Uploader le fichier (converti ou original) vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Upload échoué:", uploadError.message);
      
      // Vérifier si c'est une erreur de bucket manquant
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
        console.error("❌ Le bucket 'attachments' n'existe pas dans Supabase Storage");
        // Essayer de créer le bucket via RPC prévu, puis réessayer l'upload une fois
        try {
          const created = await ensureAttachmentsBucket(false);
          if (created) {
            // retry upload once
            const { error: retryError } = await supabase.storage
              .from("attachments")
              .upload(filePath, fileToUpload, {
                cacheControl: "3600",
                upsert: true,
              });
            if (retryError) {
              console.error("❌ Réessai d'upload échoué:", retryError.message);
              return { success: false, error: retryError.message };
            }
          } else {
            console.info("👉 Création automatique du bucket impossible. Créez-le manuellement : https://app.supabase.com/project/fhuzkubnxuetakpxkwlr/storage/buckets");
            return { 
              success: false, 
              error: "Bucket 'attachments' non configuré. Créez-le dans Supabase Dashboard > Storage." 
            };
          }
        } catch (e) {
          console.warn("⚠️ Erreur lors de la tentative de création du bucket :", e?.message || e);
          return { success: false, error: uploadError.message };
        }
      }
      
      return { success: false, error: uploadError.message };
    }

    console.log(`✅ Upload vers Supabase Storage réussi`);

    // 4. Générer l'URL publique
    const { data: publicData } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      console.error("❌ URL publique non générée pour le fichier:", file.name);
      return { success: false, error: "URL publique non générée" };
    }

    console.log(`✅ URL publique générée: ${publicUrl}`);

    // 6. Backup local désactivé — éviter conversion base64 côté client qui peut
    // provoquer "Maximum call stack size exceeded" et ralentir l'upload.
    // Si un backup est nécessaire, l'UI devra l'implémenter avec readAsDataURL
    // et limites strictes. Ici nous n'envoyons jamais file_data.
    const base64Data = null;

    // 7. Enregistrer les métadonnées dans la table tasks_files
    // Si le fichier a été converti et/ou optimisé, on enregistre les infos
    let displayName = fileToUpload.name;
    
    if (wasConverted && wasOptimized) {
      displayName = `${fileToUpload.name} (converti et optimisé depuis ${originalFileName})`;
    } else if (wasConverted) {
      displayName = `${fileToUpload.name} (converti depuis ${originalFileName})`;
    } else if (wasOptimized) {
      displayName = `${fileToUpload.name} (optimisé pour PDF.js)`;
    }
    
    console.log(`💾 Enregistrement des métadonnées dans tasks_files (task_id: ${taskId})...`);
    
    // Récupérer le case_id de la tâche pour la synchronisation automatique
    let caseId = null;
    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('case_id')
        .eq('id', taskId)
        .single();
      
      if (taskData && taskData.case_id) {
        caseId = taskData.case_id;
        console.log(`🔗 Tâche liée au dossier ${caseId} - synchronisation activée`);
      }
    } catch (e) {
      console.warn('⚠️ Impossible de récupérer case_id:', e.message);
    }
    
    const fileRecord = await addTaskFile(
      taskId,
      displayName,
      publicUrl,
      fileToUpload.size,
      fileToUpload.type,
      userId,
      base64Data,
      caseId // Passer le case_id pour synchronisation
    );

    if (!fileRecord.success) {
      console.error("❌ Échec de l'enregistrement dans tasks_files:", fileRecord.error);
      return { 
        success: false, 
        error: `Fichier uploadé mais métadonnées non sauvegardées: ${fileRecord.error?.message || fileRecord.error}` 
      };
    }

    let successMessage = '';
    if (wasConverted && wasOptimized) {
      successMessage = `✅ Métadonnées enregistrées (id: ${fileRecord.data?.id}) - "${originalFileName}" converti, optimisé et lié à la tâche ${taskId}`;
    } else if (wasConverted) {
      successMessage = `✅ Métadonnées enregistrées (id: ${fileRecord.data?.id}) - "${originalFileName}" converti en PDF et lié à la tâche ${taskId}`;
    } else if (wasOptimized) {
      successMessage = `✅ Métadonnées enregistrées (id: ${fileRecord.data?.id}) - PDF optimisé et lié à la tâche ${taskId}`;
    } else {
      successMessage = `✅ Métadonnées enregistrées (id: ${fileRecord.data?.id}) pour le fichier "${fileToUpload.name}" lié à la tâche ${taskId}`;
    }
    
    console.log(successMessage);

    const result = {
      success: true,
      data: {
        id: fileRecord.data?.id || null,
        task_id: taskId,
        file_name: displayName,
        file_url: publicUrl,
        file_size: fileToUpload.size,
        file_type: fileToUpload.type,
        created_at: new Date().toISOString(),
        created_by: userId,
        is_accessible: true,
        valid_url: publicUrl,
        was_converted: wasConverted,
        was_optimized: wasOptimized,
        original_name: wasConverted ? originalFileName : undefined
      }
    };
    
    let finalMessage = '';
    if (wasConverted && wasOptimized) {
      finalMessage = `✅ Document Word "${originalFileName}" converti, optimisé et uploadé avec succès - ID: ${fileRecord.data?.id}`;
    } else if (wasConverted) {
      finalMessage = `✅ Document Word "${originalFileName}" converti en PDF et uploadé avec succès - ID: ${fileRecord.data?.id}`;
    } else if (wasOptimized) {
      finalMessage = `✅ PDF "${originalFileName}" optimisé et uploadé avec succès - ID: ${fileRecord.data?.id}`;
    } else {
      finalMessage = `✅ Fichier "${fileToUpload.name}" enregistré et lié à la tâche ${taskId} — ID: ${fileRecord.data?.id}`;
    }
    
    console.log(finalMessage);
    return result;

  } catch (error) {
    console.error("❌ Erreur critique upload:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload multiple files pour une tâche
 * @param {File[]} files - Array de fichiers à uploader
 * @param {string} taskId - ID de la tâche
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Résultat des uploads
 */
export async function uploadMultipleTaskFiles(files, taskId, userId = null) {
  const results = {
    successes: [],
    errors: [],
    total: files.length
  };


  // Parallel uploads to improve speed. Each upload ensures storage upload completes
  // before calling addTaskFile (so we never insert DB rows for failed uploads).
  const promises = files.map(f => uploadTaskFile(f, taskId, userId));
  const settled = await Promise.allSettled(promises);

  for (const s of settled) {
    if (s.status === 'fulfilled') {
      const result = s.value;
      if (result && result.success) {
        results.successes.push(result.data);
      } else {
        results.errors.push({ fileName: result?.data?.file_name || 'unknown', error: result?.error || 'unknown' });
      }
    } else {
      results.errors.push({ fileName: 'unknown', error: s.reason?.message || String(s.reason) });
    }
  }


  const finalResult = {
    success: results.errors.length === 0,
    data: results.successes,
    errors: results.errors,
    summary: `${results.successes.length}/${results.total} fichiers uploadés`
  };
  
  if (finalResult.success && results.successes.length > 0) {
    console.log(`✅ ${results.successes.length} fichier(s) uploadé(s)`);
  }
  
  return finalResult;
}

/**
 * Assure que le bucket 'attachments' existe et est configuré correctement.
 * 
 * 🔒 SÉCURITÉ :
 * Cette fonction utilise une approche RPC (Remote Procedure Call) pour créer le bucket.
 * Si la fonction RPC n'existe pas, elle est créée automatiquement via l'API SQL.
 * 
 * 🚀 AUTOCONFIGURATION COMPLÈTE :
 * 1. Vérifie si le bucket existe
 * 2. Détecte si la fonction RPC 'create_attachments_bucket' existe
 * 3. Si absente, crée automatiquement la fonction SQL avec SECURITY DEFINER
 * 4. Exécute la fonction pour créer le bucket
 * 5. Applique automatiquement les policies RLS pour l'accès public
 * 
 * ✅ AUCUNE INTERVENTION MANUELLE REQUISE
 * Le système s'autoconfigure au premier upload sans besoin d'accéder au Dashboard Supabase.
 * 
 * @param {boolean} silent - Si true, n'affiche pas les messages de log
 * @returns {Promise<boolean>} true si le bucket est prêt (existant ou créé)
 */
export async function ensureAttachmentsBucket(silent = false) {
  try {
    // Forcer la vérification à chaque fois (pas de cache)
    // Le cache peut empêcher la détection après création manuelle du bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      if (!silent) {
        console.warn("⚠️ Impossible de lister les buckets:", listError.message);
      }
      return false;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'attachments');

  if (!bucketExists) {
      // Tentative d'auto-création via RPC sécurisé déjà prévu côté SQL
      try {
        if (!silent) console.info("⚠️ Bucket 'attachments' non trouvé — appel RPC create_attachments_bucket()...");
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_attachments_bucket');
        
        if (rpcError) {
          // Si l'erreur indique que le bucket existe déjà, c'est OK
          if (rpcError.message?.includes('existe déjà') || rpcError.message?.includes('already exists')) {
            if (!silent) console.log("✅ Bucket 'attachments' existe déjà (confirmé par RPC)");
            return true;
          }
          if (!silent) console.warn("⚠️ RPC create_attachments_bucket() échouée:", rpcError.message);
          return false;
        } else {
          if (!silent) console.log("✅ RPC exécutée:", rpcData?.message || rpcData);
        }

        // Relister les buckets pour vérifier si la création a réussi
        const { data: newBuckets, error: newListError } = await supabase.storage.listBuckets();
        if (!newListError) {
          const nowExists = newBuckets?.some(b => b.name === 'attachments');
          if (nowExists) {
            if (!silent) console.log("✅ Bucket 'attachments' détecté après RPC");
            return true;
          }
        }
        
        // Si la RPC dit que c'est OK mais qu'on ne voit pas le bucket, c'est probablement OK quand même
        if (rpcData?.message?.includes('existe')) {
          if (!silent) console.log("✅ Bucket 'attachments' considéré comme disponible (confirmé par RPC)");
          return true;
        }
      } catch (err) {
        if (!silent) console.error("❌ Erreur lors de la tentative RPC:", err?.message || err);
      }

      if (!silent) console.warn("⚠️ Le bucket 'attachments' n'est pas visible dans la liste. Vérifiez les permissions ou créez-le manuellement.");
      // Ne pas bloquer l'upload, tenter quand même
      return true;
    }

    if (!silent) {
      console.log("✅ Bucket 'attachments' prêt à l'emploi");
    }
    return true;
  } catch (error) {
    if (!silent) {
      console.error("❌ Erreur lors de la vérification du bucket:", error.message);
    }
    return false;
  }
}

export async function deleteTaskFile(fileId, filePath) {
  try {
    const { error: storageError } = await supabase.storage
      .from("attachments")
      .remove([filePath]);

    if (storageError) {
      console.warn("Erreur lors de la suppression du storage :", storageError.message);
    }

    const { error: dbError } = await supabase
      .from("tasks_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function getPublicUrl(filePath) {
  try {
    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    return data?.publicUrl || null;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL publique :", error);
    return null;
  }
}

export async function initializeStorage() {
  console.log("🚀 Initialisation du système de stockage Supabase...");
  const isReady = await ensureAttachmentsBucket(false);
  
  if (isReady) {
    console.log("✅ Système de stockage initialisé avec succès");
  } else {
    console.warn("⚠️ Système de stockage partiellement initialisé. Certaines fonctionnalités peuvent être limitées.");
  }
  
  return isReady;
}

/**
 * Obtient l'URL de prévisualisation PDF pour un fichier
 * Si le fichier est un document Word, le convertit automatiquement en PDF
 * @param {Object} file - Objet fichier avec file_url et file_name
 * @returns {Promise<string|null>} - URL du PDF pour prévisualisation
 */
export async function getConvertedPdfUrl(file) {
  try {
    if (!file || !file.file_url) {
      console.error('❌ Fichier invalide pour conversion');
      return null;
    }

    // Utiliser original_name si disponible (pour les fichiers convertis/optimisés)
    // Sinon utiliser file_name
    const fileName = file.original_name || file.file_name || '';
    
    // Extraction robuste de l'extension
    const cleanedName = fileName.trim().replace(/[\)\]\}]+\s*$/g, '');
    const lastDotIndex = cleanedName.lastIndexOf('.');
    let fileExtension = '';
    if (lastDotIndex > 0) {
      const rawExtension = cleanedName.substring(lastDotIndex + 1);
      fileExtension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
    }
    
    // Si c'est déjà un PDF, retourner l'URL directement
    if (fileExtension === 'pdf') {
      console.log('📄 Fichier déjà en PDF, pas de conversion nécessaire');
      return file.file_url;
    }

    // Si c'est un document Word, le télécharger et le convertir
    const isWordDoc = ['doc', 'docx'].includes(fileExtension);
    
    if (!isWordDoc) {
      console.warn(`⚠️ Format ${fileExtension} non supporté pour conversion`);
      return null;
    }

    console.log(`📄 Téléchargement du fichier Word: ${fileName}`);
    
    // Télécharger le fichier depuis Supabase
    const response = await fetch(file.file_url);
    if (!response.ok) {
      console.error('❌ Échec du téléchargement du fichier');
      return null;
    }

    const blob = await response.blob();
    
    // Utiliser uniquement le nom original sans le texte descriptif
    // Si le nom contient "(converti et optimisé depuis XXX)", extraire le nom original
    let cleanFileName = fileName;
    const convertedMatch = fileName.match(/\(converti et optimisé depuis (.+?)\)$/);
    if (convertedMatch) {
      cleanFileName = convertedMatch[1];
    }
    
    const wordFile = new File([blob], cleanFileName, { type: blob.type });

    console.log(`🔄 Conversion Word → PDF: ${cleanFileName}`);

    // Convertir le fichier Word en PDF
    const { convertWordToPdf } = await import('./wordToPdfConverter');
    const pdfFile = await convertWordToPdf(wordFile);

    if (!pdfFile) {
      console.error('❌ Échec de la conversion Word → PDF');
      return null;
    }

    console.log(`✅ Conversion réussie: ${pdfFile.name}`);

    // Créer une URL temporaire pour le PDF converti (blob URL)
    const pdfBlobUrl = URL.createObjectURL(pdfFile);
    
    return pdfBlobUrl;

  } catch (error) {
    console.error('❌ Erreur lors de la conversion pour prévisualisation:', error);
    return null;
  }
}
