// src/lib/wordToPdfConverter.js
/**
 * Service de conversion de documents Word (.doc, .docx) en PDF
 * Utilise une API de conversion ou un service backend
 */

/**
 * Détecte si un fichier est un document Word
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean}
 */
export function isWordDocument(file) {
  if (!file || !file.name) return false;
  
  // Extraction robuste de l'extension
  const cleanedName = file.name.trim().replace(/[\)\]\}]+\s*$/g, '');
  const lastDotIndex = cleanedName.lastIndexOf('.');
  let extension = '';
  if (lastDotIndex > 0) {
    const rawExtension = cleanedName.substring(lastDotIndex + 1);
    extension = rawExtension.replace(/[^a-z0-9]/gi, '').toLowerCase();
  }
  
  const wordExtensions = ['doc', 'docx'];
  
  // Vérifier l'extension
  if (!wordExtensions.includes(extension)) return false;
  
  // Vérifier le MIME type
  const wordMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  return wordMimeTypes.includes(file.type) || wordExtensions.includes(extension);
}

/**
 * Convertit un fichier Word en PDF en utilisant LibreOffice via une API
 * @param {File} file - Le fichier Word à convertir
 * @returns {Promise<File>} - Le fichier PDF converti
 */
export async function convertWordToPdf(file) {
  try {
    console.log(`📄 Conversion de "${file.name}" en PDF...`);
    
    // Vérifier que c'est bien un document Word
    if (!isWordDocument(file)) {
      throw new Error('Le fichier n\'est pas un document Word');
    }

    // Option 1 : Utiliser une fonction Supabase Edge Function pour la conversion
    // Cette approche nécessite de déployer une Edge Function avec LibreOffice
    const convertedPdf = await convertViaSupabaseFunction(file);
    
    if (convertedPdf) {
      console.log(`✅ Conversion réussie: ${file.name} → ${convertedPdf.name}`);
      return convertedPdf;
    }
    
    // Option 2 : Fallback - Convertir côté client avec PDF-lib (pour les .docx simples)
    console.warn('⚠️ Conversion backend non disponible, tentative de conversion client...');
    const clientConverted = await convertClientSide(file);
    
    if (clientConverted) {
      console.log(`✅ Conversion client réussie: ${file.name} → ${clientConverted.name}`);
      return clientConverted;
    }
    
    throw new Error('Échec de la conversion Word vers PDF');
    
  } catch (error) {
    console.error('❌ Erreur lors de la conversion Word → PDF:', error);
    throw error;
  }
}

/**
 * Convertit un document Word en PDF via le service LibreOffice local
 * @param {File} file - Le fichier Word
 * @returns {Promise<File|null>}
 */
async function convertViaSupabaseFunction(file) {
  try {
    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Appeler le service de conversion LibreOffice local
    const response = await fetch('http://localhost:3001/convert-word-to-pdf', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Service de conversion LibreOffice non disponible:', response.statusText);
      console.warn('💡 Démarrez le service: cd server && npm install && npm start');
      return null;
    }
    
    const pdfBlob = await response.blob();
    
    // Vérifier que le blob est valide et plus grand que 100 bytes
    if (pdfBlob.size < 100) {
      console.warn('⚠️ PDF converti trop petit, probablement invalide');
      return null;
    }
    
    const pdfFileName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
    
    console.log(`✅ Word converti en PDF avec LibreOffice: ${file.size} bytes → ${pdfBlob.size} bytes`);
    
    return new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    
  } catch (error) {
    console.warn('⚠️ Impossible d\'utiliser le service de conversion LibreOffice:', error.message);
    console.warn('💡 Assurez-vous que le service est démarré: cd server && npm start');
    return null;
  }
}

/**
 * Tentative de conversion côté client (limitée)
 * Utilise mammoth.js pour extraire le texte et jsPDF pour créer un PDF basique
 * @param {File} file - Le fichier Word
 * @returns {Promise<File|null>}
 */
async function convertClientSide(file) {
  try {
    // Charger dynamiquement mammoth.js et jsPDF
    const [mammoth, { jsPDF }] = await Promise.all([
      loadMammoth(),
      loadJsPDF()
    ]);
    
    if (!mammoth || !jsPDF) {
      console.warn('⚠️ Bibliothèques de conversion non disponibles');
      return null;
    }
    
    // Lire le fichier Word
    const arrayBuffer = await file.arrayBuffer();
    
    // Extraire le texte avec mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Aucun texte extrait du document Word');
      return null;
    }
    
    // Créer un PDF avec jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Ajouter le texte au PDF (simple, sans mise en forme)
    const lines = pdf.splitTextToSize(text, 180);
    let y = 20;
    const lineHeight = 7;
    const pageHeight = 280;
    
    lines.forEach((line) => {
      if (y > pageHeight) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += lineHeight;
    });
    
    // Convertir en File
    const pdfBlob = pdf.output('blob');
    const pdfFileName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
    
    return new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    
  } catch (error) {
    console.warn('⚠️ Conversion côté client échouée:', error.message);
    return null;
  }
}

/**
 * Charge dynamiquement mammoth.js depuis un CDN
 * @returns {Promise<any>}
 */
async function loadMammoth() {
  try {
    if (window.mammoth) {
      return window.mammoth;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.async = true;
      script.onload = () => resolve(window.mammoth);
      script.onerror = () => reject(new Error('Échec du chargement de mammoth.js'));
      document.head.appendChild(script);
    });
  } catch (error) {
    console.warn('⚠️ Impossible de charger mammoth.js:', error.message);
    return null;
  }
}

/**
 * Charge dynamiquement jsPDF depuis un CDN
 * @returns {Promise<any>}
 */
async function loadJsPDF() {
  try {
    if (window.jspdf) {
      return window.jspdf;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => resolve(window.jspdf);
      script.onerror = () => reject(new Error('Échec du chargement de jsPDF'));
      document.head.appendChild(script);
    });
  } catch (error) {
    console.warn('⚠️ Impossible de charger jsPDF:', error.message);
    return null;
  }
}

/**
 * Obtient le nom du fichier PDF converti
 * @param {string} originalFileName - Nom du fichier Word original
 * @returns {string}
 */
export function getConvertedPdfName(originalFileName) {
  return originalFileName.replace(/\.(doc|docx)$/i, '.pdf');
}
