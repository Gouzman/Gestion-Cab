```javascript
// 🖨️ FONCTION HANDLESAN AMÉLIORÉE - COPIER-COLLER DANS TASKFORM.JSX
// Remplacez la fonction handleScan existante par celle-ci

const handleScan = async () => {
  try {
    // Détecter si un scanner hardware est connecté
    if (navigator.mediaDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const scannerDevice = devices.find(device => 
        device.kind === 'videoinput' && (
          device.label.toLowerCase().includes('scanner') ||
          device.label.toLowerCase().includes('document') ||
          device.label.toLowerCase().includes('canon') ||
          device.label.toLowerCase().includes('epson') ||
          device.label.toLowerCase().includes('hp') ||
          device.label.toLowerCase().includes('brother')
        )
      );
      
      if (scannerDevice) {
        // Utiliser le scanner hardware
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              deviceId: scannerDevice.deviceId,
              width: { ideal: 1200 },
              height: { ideal: 1600 }
            }
          });
          
          // Interface de capture améliorée
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
          `;
          
          const title = document.createElement('h2');
          title.textContent = '🖨️ Scanner de Documents';
          title.style.cssText = 'color: white; margin-bottom: 20px; font-size: 24px;';
          
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.style.cssText = `
            max-width: 80%; max-height: 60%; border: 3px solid #3b82f6;
            border-radius: 12px; margin-bottom: 20px;
          `;
          
          const instructions = document.createElement('p');
          instructions.textContent = 'Placez le document devant le scanner et cliquez sur "Capturer"';
          instructions.style.cssText = 'color: #e5e7eb; margin-bottom: 20px; text-align: center;';
          
          const captureBtn = document.createElement('button');
          captureBtn.innerHTML = '📸 Capturer le Document';
          captureBtn.style.cssText = `
            padding: 15px 30px; font-size: 18px; margin: 0 10px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white; border: none; border-radius: 10px; cursor: pointer;
          `;
          
          const cancelBtn = document.createElement('button');
          cancelBtn.innerHTML = '❌ Annuler';
          cancelBtn.style.cssText = `
            padding: 12px 25px; font-size: 16px; margin: 0 10px;
            background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer;
          `;
          
          const buttonContainer = document.createElement('div');
          buttonContainer.appendChild(captureBtn);
          buttonContainer.appendChild(cancelBtn);
          
          modal.appendChild(title);
          modal.appendChild(video);
          modal.appendChild(instructions);
          modal.appendChild(buttonContainer);
          document.body.appendChild(modal);
          
          captureBtn.onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1200;
            canvas.height = video.videoHeight || 1600;
            const ctx = canvas.getContext('2d');
            
            // Optimisations pour documents
            ctx.filter = 'contrast(1.2) brightness(1.1)';
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              const file = new File([blob], `document_scan_${Date.now()}.png`, { 
                type: 'image/png' 
              });
              
              setFormData(prev => ({
                ...prev,
                scannedFiles: [...prev.scannedFiles, file]
              }));
              
              toast({
                title: "📄 Document scanné",
                description: `${file.name} capturé avec succès depuis le scanner.`,
              });
              
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(modal);
            }, 'image/png', 0.95);
          };
          
          const cleanup = () => {
            stream.getTracks().forEach(track => track.stop());
            if (modal.parentNode) document.body.removeChild(modal);
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
          
          return;
        } catch (err) {
          console.log('Erreur d\'accès au scanner:', err);
        }
      }
    }
    
    // Fallback : Interface de sélection de fichier
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.tiff,.tif';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      let addedFiles = 0;
      files.forEach(file => {
        const supportedFormats = [
          'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff',
          'application/pdf'
        ];
        
        const isSupportedExt = ['.tiff', '.tif'].some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (supportedFormats.includes(file.type) || isSupportedExt) {
          setFormData(prev => ({
            ...prev,
            scannedFiles: [...prev.scannedFiles, file]
          }));
          addedFiles++;
        }
      });
      
      if (addedFiles > 0) {
        toast({
          title: "🖨️ Document(s) scanné(s)",
          description: `${addedFiles} fichier(s) ajouté(s). ${addedFiles > 1 ? 'Ils seront' : 'Il sera'} uploadé(s) lors de la sauvegarde.`,
        });
      }
    };
    
    // Instructions selon l'OS
    const isWindows = navigator.userAgent.includes('Windows');
    const isMac = navigator.userAgent.includes('Mac');
    
    let instructions = "💡 Pour utiliser un scanner:\n";
    if (isWindows) {
      instructions += "• Windows: Utilisez 'Télécopie et numérisation Windows'\n• Ou le logiciel du fabricant";
    } else if (isMac) {
      instructions += "• Mac: Utilisez 'Capture d'image' dans Applications\n• Ou le logiciel du fabricant";
    } else {
      instructions += "• Utilisez le logiciel fourni avec votre scanner";
    }
    
    console.log(instructions);
    
    toast({
      title: "🖨️ Interface Scanner",
      description: "Sélectionnez des documents depuis votre scanner ou des fichiers scannés.",
    });
    
    input.click();
    
  } catch (error) {
    console.error('Erreur scanner:', error);
    toast({
      variant: "destructive",
      title: "❌ Erreur Scanner",
      description: "Impossible d'accéder au scanner. Vérifiez les permissions du navigateur."
    });
  }
};
```

## 📋 Instructions de Mise à Jour

### Étape 1: Ouvrir TaskForm.jsx
Localisez le fichier `/src/components/TaskForm.jsx`

### Étape 2: Trouver la fonction handleScan
Cherchez la fonction qui commence par `const handleScan = async () => {`

### Étape 3: Remplacer complètement
Supprimez l'ancienne fonction `handleScan` et remplacez-la par le code ci-dessus

### Étape 4: Tester
1. Connectez un scanner USB (Canon, Epson, HP, Brother)
2. Ouvrez "Nouvelle Tâche" 
3. Cliquez sur le bouton "Scanner" 🖨️
4. L'interface de capture devrait s'ouvrir si un scanner est détecté

### ✅ Fonctionnalités Ajoutées
- **Détection automatique** des scanners connectés
- **Interface de capture** professionnelle avec prévisualisation
- **Optimisation document** (contraste, luminosité)  
- **Support multi-formats** (JPEG, PNG, TIFF, PDF)
- **Instructions contextuelles** selon l'OS
- **Gestion d'erreurs** robuste