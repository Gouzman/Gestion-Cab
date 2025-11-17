import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClientsPrintPage = ({ clients, onClose }) => {
  const handlePrint = () => {
    globalThis.print();
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            Impression des Clients
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
              Liste des Clients
            </h1>
            <p className="text-gray-600 text-lg">
              Cabinet Juridique - {formatDate()}
            </p>
            <hr className="mt-4 border-gray-300" />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-6 print:mb-6">
            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                </div>
                <User className="w-6 h-6 text-blue-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Entreprises</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clients.filter(c => c.type === 'company').length}
                  </p>
                </div>
                <Building className="w-6 h-6 text-green-500 print:hidden" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Particuliers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clients.filter(c => c.type === 'individual').length}
                  </p>
                </div>
                <User className="w-6 h-6 text-purple-500 print:hidden" />
              </div>
            </div>
          </div>

          {/* Liste des clients */}
          <div className="space-y-4 print:space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
              Détail des Clients ({clients.length})
            </h3>

            {clients.map((client, index) => (
              <div
                key={client.id}
                className="bg-white border border-gray-200 rounded-lg p-4 print:border print:border-gray-400 print:rounded-none print:p-3 print:mb-2 print:break-inside-avoid"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                  {/* Nom et Type */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      {client.type === 'company' ? (
                        <Building className="w-4 h-4 text-blue-500 print:hidden" />
                      ) : (
                        <User className="w-4 h-4 text-purple-500 print:hidden" />
                      )}
                      <span className="text-xs text-gray-500 uppercase font-medium print:text-[10px]">
                        {client.type === 'company' ? 'Entreprise' : 'Particulier'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 print:text-sm print:font-bold">
                      {client.type === 'company' ? (
                        client.company
                      ) : (
                        `${client.first_name} ${client.last_name}`
                      )}
                    </h4>
                    {client.type === 'company' && client.first_name && (
                      <p className="text-sm text-gray-600 print:text-xs">
                        Contact: {client.first_name} {client.last_name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400 print:hidden" />
                      <span className="text-xs text-gray-500 uppercase font-medium print:text-[10px]">
                        Email
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 break-all print:text-xs">
                      {client.email || 'Non renseigné'}
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-400 print:hidden" />
                      <span className="text-xs text-gray-500 uppercase font-medium print:text-[10px]">
                        Téléphone
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 print:text-xs">
                      {client.phone || 'Non renseigné'}
                    </p>
                  </div>

                  {/* Adresse */}
                  <div className="print:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400 print:hidden" />
                      <span className="text-xs text-gray-500 uppercase font-medium print:text-[10px]">
                        Adresse
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 print:text-xs">
                      {client.address && (
                        <>
                          {client.address}
                          {client.city && <>, {client.city}</>}
                          {client.postal_code && <> {client.postal_code}</>}
                          {client.country && client.country !== 'France' && <>, {client.country}</>}
                        </>
                      ) || 'Non renseignée'}
                    </p>
                  </div>
                </div>

                {/* Notes (si présentes) */}
                {client.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100 print:mt-2 print:pt-2">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1 print:text-[10px]">
                      Notes
                    </p>
                    <p className="text-sm text-gray-600 print:text-xs">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pied de page pour l'impression */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              Document généré le {formatDate()} - Cabinet Juridique - Page {"{page}"} sur {"{pages}"}
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
            size: A4;
            margin: 1.5cm;
            @top-center {
              content: "Liste des Clients - Cabinet Juridique";
            }
            @bottom-center {
              content: counter(page) " / " counter(pages);
            }
          }
          
          body {
            font-size: 12px;
            line-height: 1.4;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          
          .print\\:text-xs {
            font-size: 10px;
          }
          
          .print\\:text-sm {
            font-size: 11px;
          }
          
          .print\\:text-lg {
            font-size: 14px;
          }
          
          .print\\:text-\\[10px\\] {
            font-size: 8px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ClientsPrintPage;