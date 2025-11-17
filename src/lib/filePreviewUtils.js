
// src/lib/filePreviewUtils.js
// Utilities for previewing and downloading files saved in tasks_files.
// This module prefers using the public URL stored in `file.file_url`.
// It MUST NOT invalidate or replace `file.file_url` and MUST NOT revoke
// blob URLs automatically (requirements from the task).

import { supabase } from "@/lib/customSupabaseClient";

// Crée un lien de téléchargement depuis un Blob sans révoquer automatiquement
function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'file';
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
 */
export async function previewFile(file) {
  try {
    if (!file) {
      alert('Fichier invalide.');
      return;
    }

    // 1) Si file_url est déjà une URL publique complète → ouvrir directement
    if (file.file_url && typeof file.file_url === 'string' && file.file_url.startsWith('http')) {
      window.open(file.file_url, '_blank', 'noopener,noreferrer');
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
        window.open(publicUrl, '_blank', 'noopener,noreferrer');
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
    if (file && file.file_url && typeof file.file_url === 'string' && file.file_url.startsWith('http')) {
      const { downloadFileWithCors } = await import('@/lib/fetchWithCors');
      const blob = await downloadFileWithCors(file.file_url);
      triggerDownload(blob, (file && file.file_name) || 'file');
      return;
    }

    // Si pas d'URL publique mais backup local, tenter de télécharger depuis le backup
    if (file && file.file_data) {
      if (typeof file.file_data === 'string') {
        const mime = file.file_type || 'application/octet-stream';
        const dataUri = file.file_data.startsWith('data:') ? file.file_data : `data:${mime};base64,${file.file_data}`;
        const res = await fetch(dataUri);
        const blob = await res.blob();
        triggerDownload(blob, (file && file.file_name) || 'file');
        return;
      }

      if (file.file_data instanceof Uint8Array || file.file_data instanceof ArrayBuffer) {
        const blob = file.file_data instanceof Uint8Array ? new Blob([file.file_data], { type: file.file_type || 'application/octet-stream' }) : new Blob([new Uint8Array(file.file_data)], { type: file.file_type || 'application/octet-stream' });
        triggerDownload(blob, (file && file.file_name) || 'file');
        return;
      }
    }

    alert(`Le fichier "${(file && file.file_name) || 'inconnu'}" n'est pas téléchargeable.`);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    alert(`Impossible de télécharger le fichier "${(file && file.file_name) || 'inconnu'}".`);
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

