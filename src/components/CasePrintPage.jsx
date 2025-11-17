import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, FileText, Scale, Clock, CheckCircle, Archive, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CasePrintPage = ({ cases, onClose }) => {
  const handlePrint = () => {
    globalThis.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseignée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'en-cours': 'En cours',
      'juge-acheve': 'Jugé/Achevé',
      'cloture': 'Clôturé',
      'archive': 'Archivé'
    };
    return statusLabels[status] || status;
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'en-cours': Scale,
      'juge-acheve': CheckCircle,
      'cloture': Clock,
      'archive': Archive
    };
    const Icon = statusIcons[status] || FileText;
    return <Icon className="w-4 h-4 print:hidden" />;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'en-cours': 'text-blue-600',
      'juge-acheve': 'text-green-600',
      'cloture': 'text-orange-600',
      'archive': 'text-gray-600'
    };
    return statusColors[status] || 'text-gray-600';
  };

  const statusCounts = {
    total: cases.length,
    'en-cours': cases.filter(c => c.status === 'en-cours').length,
    'juge-acheve': cases.filter(c => c.status === 'juge-acheve').length,
    'cloture': cases.filter(c => c.status === 'cloture').length,
    'archive': cases.filter(c => c.status === 'archive').length
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:bg-white print:block print:relative print:p-0 print:m-0"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border border-gray-300 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:border-0 print:rounded-0 print:shadow-none print:overflow-visible"
      >
        {/* Header - Caché à l'impression */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">
            Impression des Dossiers
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Contenu de l'impression */}
        <div className="p-6 print:p-0 print:m-0">
          {/* En-tête du document imprimé */}
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Liste des Dossiers Juridiques
            </h1>
            <p className="text-gray-600 text-lg">
              Cabinet Juridique - {getCurrentDate()}
            </p>
            <hr className="mt-4 border-gray-300" />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 print:grid-cols-5 print:gap-4 print:mb-6">
            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Dossiers</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                </div>
                <FileText className="w-6 h-6 text-indigo-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts['en-cours']}</p>
                </div>
                <Scale className="w-6 h-6 text-blue-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Jugé/Achevé</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts['juge-acheve']}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Clôturé</p>
                  <p className="text-2xl font-bold text-orange-600">{statusCounts.cloture}</p>
                </div>
                <Clock className="w-6 h-6 text-orange-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Archivé</p>
                  <p className="text-2xl font-bold text-gray-600">{statusCounts.archive}</p>
                </div>
                <Archive className="w-6 h-6 text-gray-500 print:hidden" />
              </div>
            </div>
          </div>

          {/* Liste des dossiers */}
          <div className="space-y-3 print:space-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
              Détail des Dossiers ({cases.length})
            </h3>

            {/* En-têtes de tableau pour impression */}
            <div className="hidden print:grid print:grid-cols-5 print:gap-2 print:p-2 print:bg-gray-100 print:border print:border-gray-400 print:font-bold print:text-xs">
              <div>ID / Titre</div>
              <div>Client</div>
              <div>Date de création</div>
              <div>Statut</div>
              <div>Description</div>
            </div>

            {cases.map((caseItem, index) => (
              <div
                key={caseItem.id}
                className="bg-white border border-gray-200 rounded-lg p-4 print:border print:border-gray-400 print:rounded-none print:p-2 print:mb-1 print:break-inside-avoid print:grid print:grid-cols-5 print:gap-2 print:text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 print:contents">
                  {/* ID et Titre */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1 print:hidden">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Dossier
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono print:text-[10px]">
                        ID: {caseItem.id}
                      </p>
                      <h4 className="font-semibold text-gray-900 print:text-xs print:font-bold">
                        {caseItem.title || 'Sans titre'}
                      </h4>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1 print:hidden">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Client
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 print:text-xs">
                      {caseItem.client_name || 'Non assigné'}
                    </p>
                  </div>

                  {/* Date de création */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1 print:hidden">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Date de création
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 print:text-xs">
                      {formatDate(caseItem.created_at)}
                    </p>
                  </div>

                  {/* Statut */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1 print:hidden">
                      {getStatusIcon(caseItem.status)}
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Statut
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium print:text-xs ${getStatusColor(caseItem.status)}`}>
                        {getStatusLabel(caseItem.status)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1 print:hidden">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Description
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 print:text-xs print:line-clamp-1">
                      {caseItem.description || 'Aucune description'}
                    </p>
                  </div>
                </div>

                {/* Informations supplémentaires pour écran */}
                {(caseItem.priority || caseItem.deadline) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 print:hidden">
                    <div className="flex gap-4 text-xs text-gray-500">
                      {caseItem.priority && (
                        <span>Priorité: {caseItem.priority}</span>
                      )}
                      {caseItem.deadline && (
                        <span>Échéance: {formatDate(caseItem.deadline)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message si aucun dossier */}
          {cases.length === 0 && (
            <div className="text-center py-8 print:py-4">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3 print:hidden" />
              <h3 className="text-lg font-medium text-gray-500 mb-2 print:text-sm">
                Aucun dossier à imprimer
              </h3>
              <p className="text-gray-400 print:text-xs">
                La liste des dossiers est vide.
              </p>
            </div>
          )}

          {/* Pied de page pour l'impression */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              Document généré le {getCurrentDate()} - Cabinet Juridique - Page {"{page}"} sur {"{pages}"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Styles CSS pour l'impression */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 1.5cm;
            @top-center {
              content: "Liste des Dossiers - Cabinet Juridique";
            }
            @bottom-center {
              content: counter(page) " / " counter(pages);
            }
          }
          
          body {
            font-size: 11px;
            line-height: 1.3;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          
          .print\\:line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .print\\:text-xs {
            font-size: 9px;
          }
          
          .print\\:text-sm {
            font-size: 10px;
          }
          
          .print\\:text-lg {
            font-size: 13px;
          }
          
          .print\\:text-\\[10px\\] {
            font-size: 8px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default CasePrintPage;