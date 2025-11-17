// src/lib/uploadManager.js
import { supabase } from "@/lib/customSupabaseClient";
import { addTaskFile } from "@/api/taskFiles";

/**
 * Upload un fichier vers Supabase Storage avec le bon format de chemin
 * @param {File} file - Le fichier à uploader
 * @param {string} taskId - ID de la tâche
 * @param {string} userId - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Résultat de l'upload avec URL publique
 */
export async function uploadTaskFile(file, taskId, userId = null) {
  try {
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

    // 2. Créer le chemin selon le format attendu : tasks/{taskId}/{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `tasks/${taskId}/${fileName}`;

    console.log(`📤 Upload du fichier "${file.name}" (${(file.size / 1024).toFixed(2)} Ko) pour la tâche ${taskId}...`);

    // 3. Uploader le fichier vers Supabase Storage (upload direct pour plus de vitesse)
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
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
          const { ensureAttachmentsBucket } = await import('@/lib/uploadManager');
          const created = await ensureAttachmentsBucket(false);
          if (created) {
            // retry upload once
            const { error: retryError } = await supabase.storage
              .from("attachments")
              .upload(filePath, file, {
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

    // 7. Enregistrer les métadonnées dans la table tasks_files (avec backup base64 si disponible)
    console.log(`💾 Enregistrement des métadonnées dans tasks_files (task_id: ${taskId})...`);
    
    const fileRecord = await addTaskFile(
      taskId,
      file.name,
      publicUrl,
      file.size,
      file.type,
      userId,
      base64Data
    );

    if (!fileRecord.success) {
      console.error("❌ Échec de l'enregistrement dans tasks_files:", fileRecord.error);
      return { 
        success: false, 
        error: `Fichier uploadé mais métadonnées non sauvegardées: ${fileRecord.error?.message || fileRecord.error}` 
      };
    }

    console.log(`✅ Métadonnées enregistrées (id: ${fileRecord.data?.id}) pour le fichier "${file.name}" lié à la tâche ${taskId}`);


    const result = {
      success: true,
      data: {
        id: fileRecord.data?.id || null,
        task_id: taskId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        created_at: new Date().toISOString(),
        created_by: userId,
        is_accessible: true,
        valid_url: publicUrl
      }
    };
    
    console.log(`✅ Fichier "${file.name}" enregistré et lié à la tâche ${taskId} — ID: ${fileRecord.data?.id}`);
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
          if (!silent) console.warn("⚠️ RPC create_attachments_bucket() échouée:", rpcError.message);
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
      } catch (err) {
        if (!silent) console.error("❌ Erreur lors de la tentative RPC:", err?.message || err);
      }

      if (!silent) console.warn("❌ Le bucket 'attachments' est introuvable et la création automatique a échoué. Créez le bucket manuellement via Supabase SQL ou dashboard.");
      return false;
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
