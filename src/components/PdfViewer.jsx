import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Composant de prévisualisation PDF utilisant PDF.js (via CDN)
 * Affiche un PDF dans une modal avec contrôles de navigation et zoom
 */
const PdfViewer = ({ fileUrl, fileName, onClose, onDownload }) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    // Charger PDF.js depuis le CDN si pas déjà chargé
    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        return window.pdfjsLib;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
          if (window.pdfjsLib) {
            // Configuration du worker PDF.js
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js not loaded'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script);
      });
    };

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pdfjsLib = await loadPdfJs();

        // Charger le document PDF depuis l'URL signée
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
          // Désactiver le range request pour éviter les problèmes CORS
          disableRange: true,
          disableStream: true,
        });

        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement du PDF:', err);
        setError('Impossible de charger le document PDF. Veuillez réessayer.');
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      loadPdf();
    }

    // Cleanup
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [fileUrl]);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || isCancelled) return;

      try {
        // Annuler le rendu précédent s'il existe et attendre qu'il soit annulé
        if (renderTaskRef.current) {
          try {
            await renderTaskRef.current.cancel();
          } catch (e) {
            // Ignorer les erreurs d'annulation
          }
          renderTaskRef.current = null;
        }

        // Vérifier à nouveau après l'annulation
        if (isCancelled || !canvasRef.current) return;

        const page = await pdfDoc.getPage(currentPage);
        
        // Vérifier encore une fois avant de continuer
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Nettoyer le canvas avant le nouveau rendu
        context.clearRect(0, 0, canvas.width, canvas.height);

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Vérifier une dernière fois avant de démarrer le rendu
        if (isCancelled) return;

        // Sauvegarder la tâche de rendu
        renderTaskRef.current = page.render(renderContext);
        
        await renderTaskRef.current.promise;
        
        // Ne nettoyer que si le rendu n'a pas été annulé
        if (!isCancelled) {
          renderTaskRef.current = null;
        }
      } catch (err) {
        // Ignorer les erreurs d'annulation
        if (err.name === 'RenderingCancelledException' || isCancelled) {
          return;
        }
        console.error('Erreur lors du rendu de la page:', err);
        if (!isCancelled) {
          setError('Erreur lors de l\'affichage de la page.');
        }
      }
    };

    renderPage();

    // Cleanup : annuler le rendu si le composant est démonté ou si les dépendances changent
    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignorer les erreurs d'annulation
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrevPage();
    } else if (e.key === 'ArrowRight') {
      handleNextPage();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentPage, totalPages]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white truncate max-w-md">
              {fileName || 'Document PDF'}
            </h3>
            {!isLoading && !error && (
              <span className="text-sm text-slate-400">
                Page {currentPage} / {totalPages}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            title="Fermer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'outils */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 w-8 p-0"
              title="Page précédente (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 w-8 p-0"
              title="Page suivante (→)"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5 || isLoading}
              className="h-8 w-8 p-0"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3 || isLoading}
              className="h-8 w-8 p-0"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex items-center gap-2"
              title="Télécharger le fichier"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
          )}
        </div>

        {/* Zone de contenu */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-800 flex items-start justify-center p-6"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p>Chargement du document...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
                <p className="text-center mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <canvas
              ref={canvasRef}
              className="shadow-2xl border border-slate-700 bg-white"
            />
          )}
        </div>

        {/* Pied de page avec instructions */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            Utilisez les flèches ← → pour naviguer • Esc pour fermer • Molette pour zoomer
          </p>
        </div>
      </div>
    </div>
  );
};

PdfViewer.propTypes = {
  fileUrl: PropTypes.string.isRequired,
  fileName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
};

export default PdfViewer;
