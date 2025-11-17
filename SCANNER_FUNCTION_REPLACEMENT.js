// Fonction handleScan améliorée pour TaskForm.jsx
// Remplacez la fonction handleScan existante par cette version

const handleScan = async () => {
  try {
    // Importer les utilitaires de scanner
    const { detectScanners, startHardwareScan, openScanFileSelector, getScannerInstructions } = await import('@/lib/scannerUtils');
    
    // Détecter les scanners disponibles
    const scannerInfo = await detectScanners();
    
    // Si un scanner hardware est détecté, l'utiliser
    if (scannerInfo.hasHardwareScanner && scannerInfo.scannerDevices.length > 0) {
      toast({
        title: "🖨️ Scanner détecté",
        description: "Lancement de l'interface de numérisation...",
      });
      
      const scannerDevice = scannerInfo.scannerDevices[0]; // Utiliser le premier scanner trouvé
      
      await startHardwareScan(scannerDevice, (scannedFile) => {
        // Ajouter le fichier scanné à la liste
        setFormData(prev => ({
          ...prev,
          scannedFiles: [...prev.scannedFiles, scannedFile]
        }));
        
        toast({
          title: "📄 Document scanné",
          description: `${scannedFile.name} capturé avec succès depuis le scanner hardware.`,
        });
      });
      
      return;
    }
    
    // Si pas de scanner hardware, essayer les API avancées
    if (scannerInfo.supportedMethods.includes('web-serial')) {
      try {
        await navigator.serial.requestPort();
        toast({
          title: "🔌 Scanner USB détecté",
          description: "Scanner connecté ! Utilisez le logiciel du fabricant puis sélectionnez le fichier généré.",
        });
      } catch (error_) {
        // Utilisateur a annulé la sélection du port série
        console.log('Port série non sélectionné:', error_.message);
      }
    }
    
    // Fallback : Interface de sélection de fichiers avec instructions
    const instructions = getScannerInstructions();
    console.log(instructions); // Afficher dans la console pour les développeurs
    
    toast({
      title: "🖨️ Interface Scanner",
      description: "Sélectionnez des documents depuis votre scanner ou des fichiers scannés.",
    });
    
    openScanFileSelector((files) => {
      let addedFiles = 0;
      let invalidFiles = 0;
      
      for (const file of files) {
        // Vérifier les formats supportés
        const supportedFormats = [
          'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff',
          'application/pdf'
        ];
        
        const isSupportedExtension = ['.tiff', '.tif'].some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (supportedFormats.includes(file.type) || isSupportedExtension) {
          setFormData(prev => ({
            ...prev,
            scannedFiles: [...prev.scannedFiles, file]
          }));
          addedFiles++;
        } else {
          invalidFiles++;
        }
      }
      
      // Messages de feedback
      if (addedFiles > 0) {
        toast({
          title: "🖨️ Document(s) scanné(s)",
          description: `${addedFiles} fichier(s) ajouté(s) depuis le scanner. ${addedFiles > 1 ? 'Ils seront' : 'Il sera'} uploadé(s) lors de la sauvegarde.`,
        });
      }
      
      if (invalidFiles > 0) {
        toast({
          variant: "destructive",
          title: "❌ Formats ignorés",
          description: `${invalidFiles} fichier(s) ignoré(s) - formats non supportés pour les scans.`
        });
      }
    });
    
  } catch (error) {
    console.error('Erreur scanner:', error);
    toast({
      variant: "destructive",
      title: "❌ Erreur Scanner", 
      description: "Impossible d'accéder au scanner. Vérifiez les permissions du navigateur."
    });
  }
};