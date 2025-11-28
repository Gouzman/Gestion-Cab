
// src/lib/filePreviewUtils.js
// Utilities for previewing and downloading files saved in tasks_files.
// This module prefers using the public URL stored in `file.file_url`.
// It MUST NOT invalidate or replace `file.file_url` and MUST NOT revoke
// blob URLs automatically (requirements from the task).

import { supabase } from "@/lib/customSupabaseClient";

/**
 * Génère une URL Google Viewer pour les fichiers qui ne peuvent pas être
 * prévisualisés directement (ex: DOCX, XLSX, PPTX)
 */
function createGoogleViewerUrl(fileUrl) {
  const encodedUrl = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
}

/**
 * Détecte si un fichier nécessite Google Viewer pour la prévisualisation
 */
function needsGoogleViewer(fileName, fileType) {
  if (!fileName) return false;
  
  // Extraction robuste de l'extension
  const cleanedName = fileName.trim().replace(/[\)\]\}]+\s*$/g, '');
  const lastDotIndex = cleanedName.lastIndexOf('.');
  let extension = '';
  if (lastDotIndex > 0) {
    const rawExtension = cleanedName.substring(lastDotIndex + 1);
    extension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }
  
  const officeFormats = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  return officeFormats.includes(extension);
}

/**
 * Nettoie un nom de fichier lors du téléchargement pour garantir l'ouverture correcte.
 * Supprime les parenthèses fermantes en fin, et retire toutes les extensions parasites
 * avant la vraie extension.
 * 
 * Cette fonction est appliquée UNIQUEMENT au nom du fichier téléchargé.
 * Le fichier conserve son nom original dans le stockage Supabase.
 * 
 * @param {string} fileName - Le nom original du fichier
 * @returns {string} - Le nom nettoyé pour le téléchargement
 * 
 * Exemples de transformations :
 * - "1763030167069_BIBLE_CHAMPIONS_LEAGUE.pdf.docx)" → "1763030167069_BIBLE_CHAMPIONS_LEAGUE.docx"
 * - "test.pdf.docx)" → "test.docx"
 * - "rapport(final).pdf.docx" → "rapport(final).docx"
 * - "preuve(02).xlsx)" → "preuve(02).xlsx"
 * - "Facture (Client X).pdf" → "Facture (Client X).pdf" (pas de parasites)
 */
function cleanFileNameForDownload(fileName) {
  if (!fileName) return 'file';
  
  // Étape 1: Retirer la parenthèse fermante finale si présente
  let cleaned = fileName.trim();
  if (cleaned.endsWith(')')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  
  // Étape 2: Extraire la vraie extension (après le dernier point)
  const lastDotIndex = cleaned.lastIndexOf('.');
  
  // Si pas d'extension, retourner le nom nettoyé
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return cleaned;
  }
  
  const trueExtension = cleaned.substring(lastDotIndex + 1).toLowerCase();
  let baseName = cleaned.substring(0, lastDotIndex);
  
  // Étape 3: Supprimer toutes les extensions parasites connues du nom de base
  // Liste des extensions courantes à supprimer si elles apparaissent avant la vraie extension
  const parasiteExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
                              'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'zip', 
                              'rar', 'csv', 'json', 'xml', 'html', 'htm'];
  
  // Retirer récursivement les extensions parasites à la fin du nom de base
  let previousBaseName = '';
  while (baseName !== previousBaseName) {
    previousBaseName = baseName;
    
    // Vérifier si le nom de base se termine par .extension_parasite
    for (const ext of parasiteExtensions) {
      const pattern = new RegExp(`\\.${ext}$`, 'i');
      if (pattern.test(baseName)) {
        baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        break;
      }
    }
  }
  
  // Si le nom de base est vide après nettoyage, utiliser un nom par défaut
  if (!baseName || baseName.trim() === '') {
    return `file.${trueExtension}`;
  }
  
  // Étape 4: Reconstruire le nom propre
  return `${baseName}.${trueExtension}`;
}

/**
 * Normalise un nom de fichier pour éviter des fichiers corrompus à l'ouverture.
 * Windows et Office ne supportent pas les parenthèses générées par Supabase lors
 * de conflits de noms (ex: "document(1).docx").
 * 
 * @param {string} fileName - Le nom original du fichier
 * @returns {string} - Le nom normalisé et sécurisé
 * 
 * Exemples de transformations :
 * - "texte(1).docx" → "texte_1.docx"
 * - "facture final(03).pdf" → "facture_final_03.pdf"
 * - "dossier client (def).xlsx" → "dossier_client_def.xlsx"
 * - "rapport  multiple  espaces.pdf" → "rapport_multiple_espaces.pdf"
 */
function sanitizeFileName(fileName) {
  if (!fileName) return 'file';
  
  const originalName = fileName;
  
  // Extraire l'extension (la préserver intacte)
  const lastDotIndex = fileName.lastIndexOf('.');
  let name = fileName;
  let extension = '';
  
  if (lastDotIndex > 0) {
    name = fileName.substring(0, lastDotIndex);
    extension = fileName.substring(lastDotIndex);
  }
  
  // Étape 1 : Remplacer les parenthèses par des underscores
  // "document(1)" → "document_1"
  name = name.replace(/\(/g, '_').replace(/\)/g, '_');
  
  // Étape 2 : Remplacer les espaces multiples par un seul espace
  // "facture  final   (2024)" → "facture final _2024"
  name = name.replace(/\s+/g, ' ');
  
  // Étape 3 : Remplacer les espaces par des underscores
  // "facture final" → "facture_final"
  name = name.replace(/\s/g, '_');
  
  // Étape 4 : Remplacer les autres caractères spéciaux problématiques par des underscores
  // Conserver uniquement: lettres, chiffres, tirets, underscores, points
  // Compatible Windows, macOS, Linux
  name = name.replace(/[^a-zA-Z0-9\-_.àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g, '_');
  
  // Étape 5 : Éliminer les underscores multiples consécutifs
  // "document__1___copie" → "document_1_copie"
  name = name.replace(/_+/g, '_');
  
  // Étape 6 : Retirer les underscores en début et fin
  // "_document_" → "document"
  name = name.replace(/^_+|_+$/g, '');
  
  // Si le nom est vide après nettoyage, utiliser un nom par défaut
  if (!name) name = 'file';
  
  const sanitizedName = name + extension;
  
  // Log de la transformation pour debugging
  if (originalName !== sanitizedName) {
    console.log(`📁 Normalisation du nom de fichier : "${originalName}" → "${sanitizedName}"`);
  }
  
  return sanitizedName;
}

/**
 * Crée un lien de téléchargement depuis un Blob sans révoquer automatiquement.
 * Applique un nettoyage automatique du nom de fichier lors du téléchargement
 * pour supprimer tout texte après l'extension.
 * 
 * @param {Blob} blob - Le blob à télécharger
 * @param {string} fileName - Le nom original du fichier
 */
function triggerDownload(blob, fileName) {
  // VALIDATION DU BLOB
  // ==================
  // Vérifier que le blob n'est pas vide avant de déclencher le téléchargement
  if (!blob || blob.size === 0) {
    console.error('❌ Erreur: Blob vide ou invalide détecté');
    console.error('   Nom du fichier:', fileName);
    console.error('   Taille du blob:', blob ? blob.size : 'null');
    alert(`Impossible de télécharger "${fileName}": le fichier est vide ou corrompu.`);
    return;
  }
  
  // NETTOYAGE AUTOMATIQUE DU NOM DE FICHIER POUR LE TÉLÉCHARGEMENT
  // =============================================================
  // Supprime tout texte situé après l'extension (parenthèses, espaces, etc.)
  // pour garantir que le fichier téléchargé s'ouvre correctement.
  //
  // Exemples :
  // - "facture (version finale).pdf" → "facture.pdf"
  // - "contrat maison (05).docx" → "contrat.docx"
  // - "plan audience (v3).xlsx" → "plan.xlsx"
  //
  // Cette transformation s'applique UNIQUEMENT au moment du téléchargement.
  // Le fichier conserve son nom original dans le stockage Supabase.
  const cleanedFileName = cleanFileNameForDownload(fileName);
  
  // Log pour traçabilité
  if (fileName !== cleanedFileName) {
    console.log(`📥 Nettoyage du nom de téléchargement : "${fileName}" → "${cleanedFileName}"`);
  }
  console.log(`⬇️ Téléchargement du fichier : "${cleanedFileName}" (${(blob.size / 1024).toFixed(2)} KB)`);
  console.log(`   Type MIME: ${blob.type || 'non spécifié'}`);
  
  // Créer l'URL object à partir du blob ORIGINAL (non modifié)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanedFileName; // Utilise le nom nettoyé dans Content-Disposition
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // IMPORTANT: Ne pas révoquer automatiquement l'URL (conserver l'URL publique
  // ou le blob URL si besoin). La révocation doit être faite explicitement si
  // un flow spécifique l'exige.
}

/**
 * Prévisualise un fichier lié à une tâche.
 * Règles importantes :
 * - Ne jamais modifier `file.file_url`.
 * - Si `file.file_url` est déjà une URL publique (http...), l'ouvrir.
 * - Si `file.file_url` est un chemin interne, générer une URL publique via
 *   `supabase.storage.from(bucket).getPublicUrl(path)` (sans écrire dans `file`).
 * - Si le fichier a un backup local (`file.file_data`), ouvrir une data:URI
 *   ou un object URL sans le révoquer automatiquement.
 * - Utiliser Google Viewer comme fallback pour les fichiers Office.
 */
export async function previewFile(file) {
  try {
    if (!file) {
      alert('Fichier invalide.');
      return;
    }

    // 1) Si file_url est déjà une URL publique complète → vérifier si Google Viewer nécessaire
    if (file.file_url && typeof file.file_url === 'string' && file.file_url.startsWith('http')) {
      // Vérifier si le fichier nécessite Google Viewer
      if (needsGoogleViewer(file.file_name, file.file_type)) {
        const viewerUrl = createGoogleViewerUrl(file.file_url);
        window.open(viewerUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(file.file_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 2) Si file_url existe mais n'est pas une URL complète, tenter de générer
    //    l'URL publique via Supabase (sans modifier l'objet file)
    if (file.file_url && typeof file.file_url === 'string') {
      let bucket = 'attachments';
      if (file.source === 'scan' || (file.file_name && file.file_name.includes('scan_'))) {
        bucket = 'task-scans';
      }

      let path = file.file_url;
      if (path.startsWith('/')) path = path.substring(1);
      if (path.startsWith(`${bucket}/`)) path = path.substring(`${bucket}/`.length);

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (publicUrl) {
        // Utiliser Google Viewer si nécessaire
        if (needsGoogleViewer(file.file_name, file.file_type)) {
          const viewerUrl = createGoogleViewerUrl(publicUrl);
          window.open(viewerUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.open(publicUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      // si génération impossible, on tombe sur le backup ci-dessous
    }

    // 3) Si backup local disponible → ouvrir via data:URI ou object URL
    if (file.file_data) {
      // Si c'est déjà une data URI
      if (typeof file.file_data === 'string' && file.file_data.startsWith('data:')) {
        window.open(file.file_data, '_blank', 'noopener,noreferrer');
        return;
      }

      // Si c'est une base64 string sans préfixe
      if (typeof file.file_data === 'string') {
        const mime = file.file_type || 'application/octet-stream';
        const dataUri = `data:${mime};base64,${file.file_data}`;
        window.open(dataUri, '_blank', 'noopener,noreferrer');
        return;
      }

      // Si c'est un ArrayBuffer / Uint8Array
      if (file.file_data instanceof Uint8Array || file.file_data instanceof ArrayBuffer) {
        const blob = file.file_data instanceof Uint8Array ? new Blob([file.file_data], { type: file.file_type || 'application/octet-stream' }) : new Blob([new Uint8Array(file.file_data)], { type: file.file_type || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        // NE PAS révoquer l'URL ici (conformément aux exigences)
        return;
      }
    }

    alert(`Le fichier "${file.file_name || 'inconnu'}" n'est pas disponible pour prévisualisation.`);

  } catch (error) {
    console.error('Erreur lors de l\'aperçu du fichier :', error);
    alert(`Impossible d'afficher le fichier "${file.file_name || 'inconnu'}".`);
  }
}

export async function downloadFile(file) {
  try {
    console.log('🔽 Début du téléchargement:', {
      fileName: file?.file_name,
      fileUrl: file?.file_url ? file.file_url.substring(0, 50) + '...' : 'N/A',
      hasFileData: !!file?.file_data,
      fileType: file?.file_type
    });

    // 1) Si file_url est une URL publique complète, télécharger via fetch
    if (file && file.file_url && typeof file.file_url === 'string' && file.file_url.startsWith('http')) {
      console.log('📡 Téléchargement depuis URL publique...');
      const { downloadFileWithCors } = await import('@/lib/fetchWithCors');
      const blob = await downloadFileWithCors(file.file_url);
      
      console.log('✅ Blob reçu:', {
        size: blob.size,
        type: blob.type,
        isValid: blob.size > 0
      });
      
      if (blob.size === 0) {
        console.error('❌ Le blob téléchargé est vide');
        alert(`Le fichier "${file.file_name}" est vide ou corrompu.`);
        return;
      }
      
      triggerDownload(blob, (file && file.file_name) || 'file');
      return;
    }

    // 2) Si pas d'URL publique mais backup local, tenter de télécharger depuis le backup
    if (file && file.file_data) {
      console.log('💾 Téléchargement depuis backup local...');
      
      if (typeof file.file_data === 'string') {
        const mime = file.file_type || 'application/octet-stream';
        const dataUri = file.file_data.startsWith('data:') ? file.file_data : `data:${mime};base64,${file.file_data}`;
        const res = await fetch(dataUri);
        const blob = await res.blob();
        
        console.log('✅ Blob créé depuis data URI:', {
          size: blob.size,
          type: blob.type
        });
        
        triggerDownload(blob, (file && file.file_name) || 'file');
        return;
      }

      if (file.file_data instanceof Uint8Array || file.file_data instanceof ArrayBuffer) {
        const arrayData = file.file_data instanceof Uint8Array ? file.file_data : new Uint8Array(file.file_data);
        const blob = new Blob([arrayData], { type: file.file_type || 'application/octet-stream' });
        
        console.log('✅ Blob créé depuis ArrayBuffer:', {
          size: blob.size,
          type: blob.type
        });
        
        triggerDownload(blob, (file && file.file_name) || 'file');
        return;
      }
    }

    console.error('❌ Aucune source de données disponible pour le téléchargement');
    alert(`Le fichier "${(file && file.file_name) || 'inconnu'}" n'est pas téléchargeable.`);
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    console.error('   Détails du fichier:', {
      fileName: file?.file_name,
      fileUrl: file?.file_url,
      hasFileData: !!file?.file_data
    });
    alert(`Impossible de télécharger le fichier "${(file && file.file_name) || 'inconnu'}". Erreur: ${error.message}`);
  }
}

export function hasLocalBackup(file) {
  return !!(file && file.file_data && (
    (typeof file.file_data === 'string' && file.file_data.length > 0) ||
    (Array.isArray(file.file_data) && file.file_data.length > 0) ||
    (file.file_data instanceof Uint8Array && file.file_data.length > 0)
  ));
}

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return 'Inconnue';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

