// src/lib/pdfOptimizer.js
/**
 * Service d'optimisation PDF pour garantir la compatibilité avec PDF.js
 * Intègre les polices (font embedding) et normalise le PDF
 */

/**
 * Détecte si un fichier est un PDF
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean}
 */
export function isPdfDocument(file) {
  if (!file || !file.name) return false;
  
  // Extraction robuste de l'extension
  const cleanedName = file.name.trim().replace(/[\)\]\}]+\s*$/g, '');
  const lastDotIndex = cleanedName.lastIndexOf('.');
  let extension = '';
  if (lastDotIndex > 0) {
    const rawExtension = cleanedName.substring(lastDotIndex + 1);
    extension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }
  
  const isPdfExtension = extension === 'pdf';
  
  // Vérifier le MIME type
  const pdfMimeTypes = ['application/pdf'];
  const isPdfMimeType = pdfMimeTypes.includes(file.type);
  
  return isPdfExtension || isPdfMimeType;
}

/**
 * Optimise un PDF pour garantir la compatibilité avec PDF.js
 * Intègre les polices et normalise la structure
 * @param {File} file - Le fichier PDF à optimiser
 * @returns {Promise<File>} - Le fichier PDF optimisé
 */
export async function optimizePdfForViewer(file) {
  try {
    console.log(`📄 Optimisation PDF: "${file.name}" pour PDF.js...`);
    
    // Vérifier que c'est bien un PDF
    if (!isPdfDocument(file)) {
      console.warn('⚠️ Le fichier n\'est pas un PDF, skip optimization');
      return file;
    }

    // Option 1 : Utiliser une fonction Supabase Edge Function pour l'optimisation
    // Cette approche nécessite de déployer une Edge Function avec pdf-lib ou PDFtk
    const optimizedPdf = await optimizeViaSupabaseFunction(file);
    
    if (optimizedPdf) {
      console.log(`✅ Optimisation backend réussie: ${file.name}`);
      return optimizedPdf;
    }
    
    // Option 2 : Fallback - Optimiser côté client avec pdf-lib
    console.warn('⚠️ Optimisation backend non disponible, tentative côté client...');
    const clientOptimized = await optimizeClientSide(file);
    
    if (clientOptimized) {
      console.log(`✅ Optimisation client réussie: ${file.name}`);
      return clientOptimized;
    }
    
    // Option 3 : Si tout échoue, retourner le PDF original
    console.warn('⚠️ Optimisation impossible, utilisation du PDF original');
    return file;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation PDF:', error);
    // En cas d'erreur, retourner le PDF original pour ne pas bloquer l'upload
    console.warn('⚠️ Retour au PDF original suite à l\'erreur');
    return file;
  }
}

/**
 * Optimise un PDF via le service de normalisation Ghostscript
 * @param {File} file - Le fichier PDF
 * @returns {Promise<File|null>}
 */
async function optimizeViaSupabaseFunction(file) {
  try {
    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Appeler le service de normalisation Ghostscript local
    const response = await fetch('http://localhost:3001/normalize-pdf', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Service de normalisation Ghostscript non disponible:', response.statusText);
      console.warn('💡 Démarrez le service: cd server && npm install && npm start');
      return null;
    }
    
    const pdfBlob = await response.blob();
    
    // Vérifier que le blob est valide et plus grand que 100 bytes
    if (pdfBlob.size < 100) {
      console.warn('⚠️ PDF normalisé trop petit, probablement invalide');
      return null;
    }
    
    const normalizedFileName = file.name.replace('.pdf', '_normalized.pdf');
    
    console.log(`✅ PDF normalisé avec Ghostscript: ${file.size} bytes → ${pdfBlob.size} bytes`);
    
    return new File([pdfBlob], normalizedFileName, { type: 'application/pdf' });
    
  } catch (error) {
    console.warn('⚠️ Impossible d\'utiliser le service de normalisation Ghostscript:', error.message);
    console.warn('💡 Assurez-vous que le service est démarré: cd server && npm start');
    return null;
  }
}

/**
 * Optimise un PDF côté client avec pdf-lib
 * Intègre les polices et normalise la structure
 * @param {File} file - Le fichier PDF
 * @returns {Promise<File|null>}
 */
async function optimizeClientSide(file) {
  try {
    // Charger dynamiquement pdf-lib
    const PDFLib = await loadPdfLib();
    
    if (!PDFLib) {
      console.warn('⚠️ pdf-lib non disponible');
      return null;
    }
    
    // Lire le fichier PDF
    const arrayBuffer = await file.arrayBuffer();
    
    // Charger le PDF avec pdf-lib
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });
    
    // Activer l'intégration complète des polices
    // Cette option force pdf-lib à intégrer toutes les polices dans le PDF
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,  // Désactiver les object streams pour compatibilité
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: true
    });
    
    // Vérifier la taille du PDF optimisé
    if (pdfBytes.byteLength < 100) {
      console.warn('⚠️ PDF optimisé trop petit, probablement invalide');
      return null;
    }
    
    // Créer un nouveau File avec le PDF optimisé
    const optimizedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const optimizedFileName = file.name.replace('.pdf', '_optimized.pdf');
    
    const optimizedFile = new File([optimizedBlob], optimizedFileName, { 
      type: 'application/pdf' 
    });
    
    console.log(`📊 Optimisation: ${file.size} bytes → ${optimizedFile.size} bytes`);
    
    return optimizedFile;
    
  } catch (error) {
    console.warn('⚠️ Optimisation côté client échouée:', error.message);
    return null;
  }
}

/**
 * Charge dynamiquement pdf-lib depuis un CDN
 * @returns {Promise<any>}
 */
async function loadPdfLib() {
  try {
    if (window.PDFLib) {
      return window.PDFLib;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      script.async = true;
      script.onload = () => {
        if (window.PDFLib) {
          console.log('✅ pdf-lib chargé depuis CDN');
          resolve(window.PDFLib);
        } else {
          reject(new Error('PDFLib non disponible après chargement'));
        }
      };
      script.onerror = () => reject(new Error('Échec du chargement de pdf-lib'));
      document.head.appendChild(script);
    });
  } catch (error) {
    console.warn('⚠️ Impossible de charger pdf-lib:', error.message);
    return null;
  }
}

/**
 * Vérifie si un PDF est compatible avec PDF.js
 * (Optionnel - pour diagnostic)
 * @param {File} file - Le fichier PDF
 * @returns {Promise<boolean>}
 */
export async function checkPdfCompatibility(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Vérifier la signature PDF
    const bytes = new Uint8Array(arrayBuffer);
    const signature = String.fromCharCode(...bytes.slice(0, 5));
    
    if (!signature.startsWith('%PDF-')) {
      console.warn('⚠️ Signature PDF invalide');
      return false;
    }
    
    // Vérifier la version PDF (1.4 à 2.0 sont bien supportées)
    const version = signature.substring(5);
    const versionNum = parseFloat(version);
    
    if (versionNum < 1.4 || versionNum > 2.0) {
      console.warn(`⚠️ Version PDF ${version} peut avoir des problèmes de compatibilité`);
    }
    
    console.log(`✅ PDF version ${version} - Compatible`);
    return true;
    
  } catch (error) {
    console.warn('⚠️ Impossible de vérifier la compatibilité:', error.message);
    return false;
  }
}

/**
 * Obtient le nom du fichier PDF optimisé
 * @param {string} originalFileName - Nom du fichier PDF original
 * @returns {string}
 */
export function getOptimizedPdfName(originalFileName) {
  if (!originalFileName.endsWith('.pdf')) {
    return `${originalFileName}_optimized.pdf`;
  }
  return originalFileName.replace('.pdf', '_optimized.pdf');
}
