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
        <div className="p-8 print:p-6">
          {/* En-tête du document */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">CABINET D'AVOCATS</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">RAPPORT DE FACTURATION</h2>
            <div className="text-sm text-gray-600">
              <p>Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="font-semibold text-gray-700">Total Factures</div>
              <div className="text-2xl font-bold text-gray-900">{totalInvoices}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="font-semibold text-gray-700">Montant Total</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)} F CFA</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="font-semibold text-gray-700">Montant Encaissé</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)} F CFA</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="font-semibold text-gray-700">Reste à Encaisser</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(totalAmount - totalPaid)} F CFA</div>
            </div>
          </div>

          {/* Répartition par statut */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Répartition par Statut</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
                <span>Réglées totalement</span>
                <span className="font-bold text-green-700">{paidFully}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border">
                <span>Réglées partiellement</span>
                <span className="font-bold text-yellow-700">{paidPartially}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded border">
                <span>Non réglées</span>
                <span className="font-bold text-red-700">{unpaid}</span>
              </div>
            </div>
          </div>

          {/* Tableau des factures */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">N° Facture</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Client</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-800">Montant TTC</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-800">Provision Versée</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Statut</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">Mode Paiement</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {invoice.clientName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-700">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-900">
                      {formatCurrency(invoice.totalTTC)} F CFA
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-gray-700">
                      {invoice.payment?.provision ? 
                        `${formatCurrency(invoice.payment.provisionAmount || 0)} F CFA` : 
                        'Aucune'
                      }
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span 
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: getStatusBadge(invoice.status) }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-700 capitalize">
                      {invoice.payment?.method || 'Non défini'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Résumé en bas */}
          <div className="mt-8 pt-6 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Résumé Financier</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chiffre d'affaires facturé :</span>
                    <span className="font-medium">{formatCurrency(totalAmount)} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant encaissé :</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalPaid)} F CFA</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-semibold">Reste à encaisser :</span>
                    <span className="font-bold text-red-600">{formatCurrency(totalAmount - totalPaid)} F CFA</span>
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
                <h4 className="font-semibold text-gray-800 mb-3">Informations</h4>
                <div className="space-y-2 text-gray-600">
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

      {/* Styles d'impression intégrés */}
      <style>
        {`
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            
            body {
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