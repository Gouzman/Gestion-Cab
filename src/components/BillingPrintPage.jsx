import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCurrency = (value) => {
  if (Number.isNaN(value) || value === null) return '0';
  return new Intl.NumberFormat('fr-FR').format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non définie';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

const getStatusBadge = (status) => {
  const statusColors = {
    'réglée totalement': '#22c55e',
    'réglée partiellement': '#f59e0b', 
    'non réglée': '#ef4444',
  };
  
  return statusColors[status] || '#6b7280';
};

const BillingPrintPage = ({ invoices, onClose }) => {
  const handlePrint = () => {
    globalThis.print();
  };

  // Calculs statistiques
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.totalTTC || 0), 0);
  const paidFully = invoices.filter(invoice => invoice.status === 'réglée totalement').length;
  const paidPartially = invoices.filter(invoice => invoice.status === 'réglée partiellement').length;
  const unpaid = invoices.filter(invoice => invoice.status === 'non réglée').length;
  
  const totalPaid = invoices.reduce((sum, invoice) => {
    if (invoice.payment?.provision && invoice.payment?.provisionAmount) {
      return sum + invoice.payment.provisionAmount;
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:relative print:inset-auto print:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* En-tête non imprimable */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Aperçu d'impression - Facturation</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              Imprimer
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>

        {/* Contenu imprimable */}
        <div className="p-8 print:p-[10mm]">
          {/* En-tête du document - éviter coupure */}
          <div className="text-center mb-4 print:mb-3 border-b-2 border-gray-300 pb-3 print:pb-2 print:break-inside-avoid">
            <h1 className="text-xl print:text-lg font-bold text-gray-900 mb-1">CABINET D'AVOCATS</h1>
            <h2 className="text-lg print:text-base font-semibold text-gray-700 mb-2 print:mb-1">RAPPORT DE FACTURATION</h2>
            <div className="text-sm print:text-xs text-gray-600">
              <p>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>

          {/* Statistiques - éviter coupure */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 mb-4 print:mb-3 text-sm print:text-xs print:break-inside-avoid">
            <div className="bg-gray-50 p-3 print:p-2 rounded-lg border">
              <div className="font-semibold text-gray-700">Total Factures</div>
              <div className="text-xl print:text-lg font-bold text-gray-900">{totalInvoices}</div>
            </div>
            <div className="bg-gray-50 p-3 print:p-2 rounded-lg border">
              <div className="font-semibold text-gray-700">Montant Total</div>
              <div className="text-base print:text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(totalAmount)} F CFA</div>
            </div>
            <div className="bg-gray-50 p-3 print:p-2 rounded-lg border">
              <div className="font-semibold text-gray-700">Montant Encaissé</div>
              <div className="text-base print:text-sm font-bold text-green-600 whitespace-nowrap">{formatCurrency(totalPaid)} F CFA</div>
            </div>
            <div className="bg-gray-50 p-3 print:p-2 rounded-lg border">
              <div className="font-semibold text-gray-700">Reste à Encaisser</div>
              <div className="text-base print:text-sm font-bold text-red-600 whitespace-nowrap">{formatCurrency(totalAmount - totalPaid)} F CFA</div>
            </div>
          </div>

          {/* Répartition par statut - éviter coupure */}
          <div className="mb-3 print:mb-2 print:break-inside-avoid">
            <h3 className="font-semibold text-gray-800 mb-2 print:mb-1 text-sm print:text-xs">Répartition par Statut</h3>
            <div className="grid grid-cols-3 gap-3 print:gap-2 text-sm print:text-xs">
              <div className="flex items-center justify-between p-2 print:p-1 bg-green-50 rounded border">
                <span>Réglées totalement</span>
                <span className="font-bold text-green-700">{paidFully}</span>
              </div>
              <div className="flex items-center justify-between p-2 print:p-1 bg-yellow-50 rounded border">
                <span>Réglées partiellement</span>
                <span className="font-bold text-yellow-700">{paidPartially}</span>
              </div>
              <div className="flex items-center justify-between p-2 print:p-1 bg-red-50 rounded border">
                <span>Non réglées</span>
                <span className="font-bold text-red-700">{unpaid}</span>
              </div>
            </div>
          </div>

          {/* Tableau des factures - optimisé pour A4 */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-gray-300 text-sm print:text-[7pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-left font-semibold text-gray-800">N° Facture</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-left font-semibold text-gray-800">Client</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-left font-semibold text-gray-800">Date</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-right font-semibold text-gray-800">Montant TTC</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-right font-semibold text-gray-800">Provision</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-center font-semibold text-gray-800">Statut</th>
                  <th className="border border-gray-300 px-2 print:px-1 py-2 print:py-1 text-center font-semibold text-gray-800">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} print:break-inside-avoid`}>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-gray-700 max-w-[120px] truncate" title={invoice.clientName}>
                      {invoice.clientName}
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-gray-700 whitespace-nowrap">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(invoice.totalTTC)}
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-right text-gray-700 whitespace-nowrap">
                      {invoice.payment?.provision ? 
                        formatCurrency(invoice.payment.provisionAmount || 0) : 
                        '-'
                      }
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-center">
                      <span 
                        className="inline-block px-1 py-0.5 rounded text-[10px] print:text-[7pt] font-medium text-white"
                        style={{ backgroundColor: getStatusBadge(invoice.status) }}
                      >
                        {invoice.status === 'réglée totalement' ? 'Réglée' : invoice.status === 'réglée partiellement' ? 'Partielle' : 'Non réglée'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-2 print:px-1 py-1 text-center text-gray-700 capitalize text-xs print:text-[7pt]">
                      {invoice.payment?.method || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Résumé en bas - éviter coupure */}
          <div className="mt-4 print:mt-3 pt-3 print:pt-2 border-t-2 border-gray-300 print:break-inside-avoid">
            <div className="grid grid-cols-2 gap-4 print:gap-3 text-sm print:text-xs">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 print:mb-1">Résumé Financier</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chiffre d'affaires facturé :</span>
                    <span className="font-medium whitespace-nowrap">{formatCurrency(totalAmount)} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant encaissé :</span>
                    <span className="font-medium text-green-600 whitespace-nowrap">{formatCurrency(totalPaid)} F CFA</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600 font-semibold">Reste à encaisser :</span>
                    <span className="font-bold text-red-600 whitespace-nowrap">{formatCurrency(totalAmount - totalPaid)} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux d'encaissement :</span>
                    <span className="font-medium">
                      {totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 print:mb-1">Informations</h4>
                <div className="space-y-0.5 text-gray-600">
                  <p>• Rapport généré automatiquement</p>
                  <p>• Données au {new Date().toLocaleDateString('fr-FR')}</p>
                  <p>• Total de {totalInvoices} facture(s) incluse(s)</p>
                  <p>• Montants exprimés en Francs CFA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-500 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
          <p>Page 1/1 - Rapport de facturation généré le {new Date().toLocaleDateString('fr-FR')} - Cabinet d'Avocats</p>
        </div>
      </div>

      {/* Styles d'impression optimisés pour A4 */}
      <style>
        {`
          @media print {
            @page {
              margin: 8mm 10mm;
              size: A4 portrait;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              font-size: 8pt;
              line-height: 1.2;
            }
            
            * {
              box-sizing: border-box;
            }
            
            /* Empêcher les coupures */
            .print\\:break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Optimiser espaces */
            .print\\:p-\\[10mm\\] {
              padding: 10mm !important;
            }
            
            .print\\:p-2 {
              padding: 0.3rem !important;
            }
            
            .print\\:p-1 {
              padding: 0.2rem !important;
            }
            
            .print\\:px-1 {
              padding-left: 0.2rem !important;
              padding-right: 0.2rem !important;
            }
            
            .print\\:py-1 {
              padding-top: 0.2rem !important;
              padding-bottom: 0.2rem !important;
            }
            
            .print\\:pb-2 {
              padding-bottom: 0.3rem !important;
            }
            
            .print\\:mb-3 {
              margin-bottom: 0.5rem !important;
            }
            
            .print\\:mb-2 {
              margin-bottom: 0.3rem !important;
            }
            
            .print\\:mb-1 {
              margin-bottom: 0.2rem !important;
            }
            
            .print\\:mt-3 {
              margin-top: 0.5rem !important;
            }
            
            .print\\:mt-2 {
              margin-top: 0.3rem !important;
            }
            
            .print\\:pt-2 {
              padding-top: 0.3rem !important;
            }
            
            .print\\:gap-2 {
              gap: 0.3rem !important;
            }
            
            .print\\:gap-3 {
              gap: 0.5rem !important;
            }
            
            .print\\:text-lg {
              font-size: 10pt !important;
            }
            
            .print\\:text-base {
              font-size: 8pt !important;
            }
            
            .print\\:text-sm {
              font-size: 7pt !important;
            }
            
            .print\\:text-xs {
              font-size: 6.5pt !important;
            }
            
            .print\\:text-\\[7pt\\] {
              font-size: 7pt !important;
            }
            
            .print\\:overflow-visible {
              overflow: visible !important;
            }
            
            /* Optimiser tableaux */
            table {
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            thead {
              display: table-header-group;
            }
            
            /* Conserver couleurs */
            .bg-gray-50,
            .bg-gray-100,
            .bg-green-50,
            .bg-yellow-50,
            .bg-red-50 {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BillingPrintPage;