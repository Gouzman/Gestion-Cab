// Fonctions utilitaires pour la gestion des scanners

/**
 * Détecte les scanners disponibles sur le système
 * @returns {Promise<{hasHardwareScanner: boolean, scannerDevices: Array}>}
 */
export const detectScanners = async () => {
  const result = {
    hasHardwareScanner: false,
    scannerDevices: [],
    supportedMethods: []
  };

  try {
    // 1. Vérifier les périphériques de capture vidéo (scanners avec interface caméra)
    if ('ImageCapture' in globalThis && navigator.mediaDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const scannerDevices = devices.filter(device => 
        device.kind === 'videoinput' && (
          device.label.toLowerCase().includes('scanner') ||
          device.label.toLowerCase().includes('document') ||
          device.label.toLowerCase().includes('scan') ||
          device.label.toLowerCase().includes('canon') ||
          device.label.toLowerCase().includes('epson') ||
          device.label.toLowerCase().includes('hp')
        )
      );
      
      if (scannerDevices.length > 0) {
        result.hasHardwareScanner = true;
        result.scannerDevices = scannerDevices;
        result.supportedMethods.push('media-devices');
      }
    }

    // 2. Vérifier le support Web Serial (scanners USB avancés)
    if ('serial' in navigator) {
      result.supportedMethods.push('web-serial');
    }

    // 3. Vérifier le support Web USB (scanners USB modernes)
    if ('usb' in navigator) {
      result.supportedMethods.push('web-usb');
    }

    // 4. Vérifier le support WebHID (scanners avec interface HID)
    if ('hid' in navigator) {
      result.supportedMethods.push('web-hid');
    }

  } catch (error) {
    console.warn('Erreur lors de la détection des scanners:', error);
  }

  return result;
};

/**
 * Lance l'interface de numérisation avec le scanner détecté
 * @param {MediaDeviceInfo} scannerDevice - Périphérique de scanner
 * @param {Function} onScanComplete - Callback appelé avec le fichier scanné
 * @returns {Promise<void>}
 */
export const startHardwareScan = async (scannerDevice, onScanComplete) => {
  try {
    // Configurer le stream avec les paramètres optimaux pour la numérisation
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: scannerDevice.deviceId,
        width: { ideal: 1200, min: 800 },
        height: { ideal: 1600, min: 600 },
        facingMode: 'environment'
      }
    });

    // Créer l'interface de capture
    const scannerInterface = createScannerInterface(stream, onScanComplete);
    document.body.appendChild(scannerInterface);

  } catch (error) {
    console.error('Erreur d\'accès au scanner:', error);
    throw new Error('Impossible d\'accéder au scanner hardware');
  }
};

/**
 * Crée l'interface utilisateur pour le scanner
 * @param {MediaStream} stream - Stream du scanner
 * @param {Function} onComplete - Callback de complétion
 * @returns {HTMLElement} Interface DOM
 */
const createScannerInterface = (stream, onComplete) => {
  // Conteneur principal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Titre
  const title = document.createElement('h2');
  title.textContent = '🖨️ Scanner de Documents';
  title.style.cssText = `
    color: white; font-size: 24px; margin-bottom: 20px;
    text-align: center; font-weight: 600;
  `;

  // Vidéo preview
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  video.style.cssText = `
    max-width: 80%; max-height: 60%; border: 3px solid #3b82f6;
    border-radius: 12px; background: #000; margin-bottom: 20px;
  `;

  // Overlay de guidage
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    border: 2px dashed rgba(59, 130, 246, 0.8); width: 300px; height: 400px;
    pointer-events: none; border-radius: 8px;
  `;

  // Instructions
  const instructions = document.createElement('p');
  instructions.textContent = 'Placez le document dans le cadre bleu et cliquez sur "Capturer"';
  instructions.style.cssText = `
    color: #e5e7eb; font-size: 16px; text-align: center; margin-bottom: 20px;
    max-width: 400px; line-height: 1.5;
  `;

  // Conteneur des boutons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `display: flex; gap: 15px; align-items: center;`;

  // Bouton de capture
  const captureBtn = document.createElement('button');
  captureBtn.innerHTML = '📸 Capturer le Document';
  captureBtn.style.cssText = `
    padding: 15px 30px; font-size: 18px; font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
    color: white; border: none; border-radius: 10px;
    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  `;

  // Bouton d'annulation
  const cancelBtn = document.createElement('button');
  cancelBtn.innerHTML = '❌ Annuler';
  cancelBtn.style.cssText = `
    padding: 12px 25px; font-size: 16px; font-weight: 500;
    background: #6b7280; color: white; border: none; border-radius: 8px;
    cursor: pointer; transition: all 0.2s;
  `;

  // Effets hover
  captureBtn.onmouseover = () => {
    captureBtn.style.transform = 'translateY(-2px)';
    captureBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
  };
  captureBtn.onmouseout = () => {
    captureBtn.style.transform = 'translateY(0)';
    captureBtn.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
  };

  cancelBtn.onmouseover = () => cancelBtn.style.background = '#4b5563';
  cancelBtn.onmouseout = () => cancelBtn.style.background = '#6b7280';

  // Logique de capture
  captureBtn.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1200;
    canvas.height = video.videoHeight || 1600;
    const ctx = canvas.getContext('2d');
    
    // Dessiner l'image avec optimisations pour documents
    ctx.filter = 'contrast(1.2) brightness(1.1)'; // Améliorer la lisibilité
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir en fichier haute qualité
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = Date.now();
        const fileName = `document_scan_${timestamp}.png`;
        const file = new File([blob], fileName, { 
          type: 'image/png',
          lastModified: timestamp 
        });
        
        // Nettoyer et appeler le callback
        cleanup();
        onComplete(file);
      }
    }, 'image/png', 0.95); // Qualité élevée pour documents
  };

  // Logique d'annulation
  const cleanup = () => {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    if (modal.parentNode) {
      modal.remove();
    }
  };

  cancelBtn.onclick = cleanup;

  // Échapper pour annuler
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // Assemblage de l'interface
  const videoContainer = document.createElement('div');
  videoContainer.style.position = 'relative';
  videoContainer.appendChild(video);
  videoContainer.appendChild(overlay);

  buttonContainer.appendChild(captureBtn);
  buttonContainer.appendChild(cancelBtn);

  modal.appendChild(title);
  modal.appendChild(videoContainer);
  modal.appendChild(instructions);
  modal.appendChild(buttonContainer);

  return modal;
};

/**
 * Interface fallback pour sélection de fichiers scannés
 * @param {Function} onFilesSelected - Callback avec les fichiers sélectionnés
 */
export const openScanFileSelector = (onFilesSelected) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf,.tiff,.tif'; // Formats courants de scanner
  input.multiple = true; // Permettre plusieurs pages
  
  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  input.click();
};

/**
 * Obtient les instructions spécifiques à l'OS pour l'utilisation du scanner
 * @returns {string} Instructions formatées
 */
export const getScannerInstructions = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) {
    return `💡 Instructions Windows:
• Utilisez "Télécopie et numérisation Windows"
• Ou le logiciel fourni avec votre scanner (Canon, Epson, HP, etc.)
• Puis sélectionnez les fichiers générés`;
  } 
  
  if (userAgent.includes('Mac')) {
    return `💡 Instructions Mac:
• Utilisez "Capture d'image" (dans Applications)
• Ou le logiciel fourni avec votre scanner
• Puis sélectionnez les fichiers générés`;
  }
  
  return `💡 Instructions:
• Utilisez le logiciel fourni avec votre scanner
• Ou une application de numérisation système
• Puis sélectionnez les fichiers générés`;
};

export default {
  detectScanners,
  startHardwareScan,
  openScanFileSelector,
  getScannerInstructions
};