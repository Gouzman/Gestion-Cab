// src/components/PdfServiceAlert.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

/**
 * Composant d'alerte pour informer l'utilisateur si le service de normalisation PDF
 * n'est pas démarré. Affiche un bandeau discret en haut de la page.
 */
const PdfServiceAlert = () => {
  const [isServiceRunning, setIsServiceRunning] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'alerte a déjà été fermée dans cette session
    const dismissed = sessionStorage.getItem('pdf-service-alert-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsChecking(false);
      return;
    }

    checkPdfService();
    
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkPdfService, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkPdfService = async () => {
    try {
      const pdfServiceUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'https://www.ges-cab.com/pdf';
      
      // En production, on considère le service comme disponible par défaut
      // pour éviter les erreurs 500 lors de la connexion des nouveaux utilisateurs
      if (import.meta.env.PROD) {
        setIsServiceRunning(true);
        setIsChecking(false);
        return;
      }
      
      const response = await fetch(`${pdfServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsServiceRunning(data.status === 'ok' || data.status === 'partial');
      } else {
        // Ne pas afficher d'alerte en cas d'erreur serveur
        setIsServiceRunning(true);
      }
    } catch (error) {
      // Considérer le service comme disponible en cas d'erreur réseau
      // pour éviter les faux positifs
      setIsServiceRunning(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pdf-service-alert-dismissed', 'true');
  };

  // Ne rien afficher si :
  // - On est en train de vérifier
  // - Le service fonctionne
  // - L'alerte a été fermée
  if (isChecking || isServiceRunning || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm border-b border-amber-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-900 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Service de normalisation PDF non démarré
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Les PDF uploadés ne seront pas optimisés pour l'affichage. 
              Des erreurs "TT undefined" peuvent apparaître lors de la visualisation.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button
                onClick={() => {
                  // Ouvrir la documentation dans un nouvel onglet
                  window.open('/QUICK_START_PDF.md', '_blank');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:text-amber-950 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir la documentation
              </button>
              
              <code className="text-xs bg-amber-600/30 text-amber-950 px-2 py-1 rounded font-mono">
                ./start-with-pdf-service.sh
              </code>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-900 hover:text-amber-950 hover:bg-amber-600/30 rounded transition-colors flex-shrink-0"
            title="Masquer pour cette session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfServiceAlert;
