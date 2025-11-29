import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanyInfo } from '@/lib/appSettings';

const formatCurrency = (value) => {
  if (Number.isNaN(value) || value === null) return '0';
  return new Intl.NumberFormat('fr-FR').format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non définie';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

const InvoicePrintView = ({ invoice, onClose }) => {
  const { companyInfo } = useCompanyInfo();
  
  const handlePrint = () => {
    globalThis.print();
  };

  if (!invoice) return null;

  // Calculs des totaux
  const deboursTotaux = Object.values(invoice.debours || {}).reduce((sum, val) => sum + (val || 0), 0);
  const honorairesTotaux = Object.values(invoice.honoraires || {}).reduce((sum, val) => sum + (val || 0), 0);
  const sousTotal = deboursTotaux + honorairesTotaux;
  const tva = sousTotal * 0.18; // 18% TVA (ajustable selon la législation)
  const totalTTC = invoice.totalTTC || (sousTotal + tva);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:relative print:inset-auto print:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:overflow-visible">
        
        {/* En-tête non imprimable */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Aperçu d'impression - {invoice.invoiceNumber}</h2>
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

        {/* Contenu de la facture */}
        <div className="p-8 print:p-[12mm] bg-white">
          
          {/* En-tête avec bande colorée - éviter coupure */}
          <div className="mb-4 print:mb-3 print:break-inside-avoid">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-16 print:h-14 rounded-t-lg print:rounded-none flex items-center px-6 print:px-4">
              <div className="text-white">
                <h1 className="text-xl print:text-lg font-bold">{companyInfo?.name || 'CABINET D\'AVOCATS'}</h1>
                <p className="text-sm print:text-xs text-purple-100">{companyInfo?.slogan || 'Excellence Juridique & Conseil'}</p>
              </div>
            </div>
            
            {/* Informations du cabinet */}
            <div className="bg-gray-50 p-4 print:p-3 rounded-b-lg print:rounded-none border-l-4 border-purple-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
                <div>
                  <p className="font-semibold text-gray-800">Adresse du Cabinet</p>
                  <p className="text-gray-600">{companyInfo?.address || '123 Avenue des Avocats'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Contact</p>
                  <p className="text-gray-600">Tél: {companyInfo?.phone || '+33 1 23 45 67 89'}</p>
                  <p className="text-gray-600">Email: {companyInfo?.email || 'contact@cabinet-avocats.fr'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations facture - éviter coupure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 mb-4 print:mb-3 print:break-inside-avoid">
            <div>
              <h3 className="text-base print:text-sm font-bold text-gray-800 mb-2 print:mb-1 border-b-2 border-purple-600 pb-1">FACTURE</h3>
              <div className="space-y-1 text-sm print:text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Numéro:</span>
                  <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Date:</span>
                  <span className="text-gray-900">{formatDate(invoice.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Dossier:</span>
                  <span className="text-gray-900 truncate ml-2" title={invoice.caseTitle || invoice.caseId || 'N/A'}>
                    {invoice.caseTitle || invoice.caseId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base print:text-sm font-bold text-gray-800 mb-2 print:mb-1 border-b-2 border-purple-600 pb-1">CLIENT</h3>
              <div className="bg-gray-50 p-3 print:p-2 rounded-lg">
                <p className="font-bold text-gray-900 text-base print:text-sm">{invoice.clientName}</p>
                <p className="text-gray-600 text-xs mt-1">Adresse client</p>
                <p className="text-gray-600 text-xs">Code postal, Ville</p>
              </div>
            </div>
          </div>

          {/* Détail des prestations - éviter coupure du tableau */}
          <div className="mb-4 print:mb-3 print:break-inside-avoid">
            <h3 className="text-base print:text-sm font-bold text-gray-800 mb-2 print:mb-1 border-b-2 border-purple-600 pb-1">DÉTAIL DES PRESTATIONS</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm print:text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-left font-semibold text-gray-800">Description</th>
                    <th className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-right font-semibold text-gray-800 w-32 print:w-28">Montant (F CFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Honoraires */}
                  {invoice.honoraires && Object.entries(invoice.honoraires).map(([key, value]) => (
                    value > 0 && (
                      <tr key={key} className="print:break-inside-avoid">
                        <td className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-gray-700">
                          Honoraires - {key === 'forfait' ? 'Forfait' : key === 'tauxHoraire' ? 'Taux horaire' : key === 'base' ? 'Base' : 'Résultat'}
                        </td>
                        <td className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-right font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    )
                  ))}
                  
                  {/* Débours */}
                  {invoice.debours && Object.entries(invoice.debours).map(([key, value]) => (
                    value > 0 && (
                      <tr key={key} className="print:break-inside-avoid">
                        <td className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-gray-700">
                          Débours - {key === 'entrevue' ? 'Entrevue' : key === 'dossier' ? 'Dossier' : key === 'plaidoirie' ? 'Plaidoirie' : key === 'huissier' ? 'Huissier' : 'Déplacement'}
                        </td>
                        <td className="border border-gray-300 px-3 print:px-2 py-2 print:py-1 text-right font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux - éviter coupure */}
          <div className="flex justify-end mb-4 print:mb-3 print:break-inside-avoid">
            <div className="w-full max-w-sm">
              <div className="bg-gray-50 p-4 print:p-3 rounded-lg border-2 border-purple-600">
                <div className="space-y-2 print:space-y-1 text-sm print:text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">SOUS-TOTAL:</span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(sousTotal)} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">TVA (18%):</span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(tva)} F CFA</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 print:pt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base print:text-sm text-gray-800">TOTAL DÛ:</span>
                      <span className="font-bold text-lg print:text-base text-purple-600 whitespace-nowrap">{formatCurrency(totalTTC)} F CFA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de paiement - éviter coupure */}
          {invoice.payment && (
            <div className="mb-4 print:mb-3 print:break-inside-avoid">
              <h3 className="text-base print:text-sm font-bold text-gray-800 mb-2 print:mb-1 border-b-2 border-purple-600 pb-1">INFORMATIONS DE PAIEMENT</h3>
              <div className="bg-blue-50 p-3 print:p-2 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Mode de paiement:</span>
                    <span className="ml-2 text-gray-900 capitalize">{invoice.payment.method || 'Non défini'}</span>
                  </div>
                  {invoice.payment.provision && (
                    <div>
                      <span className="font-medium text-gray-600">Provision versée:</span>
                      <span className="ml-2 text-gray-900 whitespace-nowrap">{formatCurrency(invoice.payment.provisionAmount || 0)} F CFA</span>
                    </div>
                  )}
                </div>
                {invoice.payment.provisionAmount < totalTTC && (
                  <div className="mt-2 print:mt-1 p-2 print:p-1 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-yellow-800 font-medium text-sm print:text-xs">
                      Solde restant dû: {formatCurrency(totalTTC - (invoice.payment.provisionAmount || 0))} F CFA
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditions et remerciements - peut être sur page 2 si nécessaire */}
          <div className="border-t-2 border-gray-300 pt-4 print:pt-3 print:break-before-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3 text-sm print:text-xs print:break-inside-avoid">
              <div>
                <h4 className="font-bold text-gray-800 mb-2 print:mb-1">CONDITIONS DE PAIEMENT</h4>
                <div className="text-gray-600 space-y-0.5">
                  <p>• Paiement sous 30 jours à réception</p>
                  <p>• Virements acceptés sur compte bancaire</p>
                  <p>• Retard de paiement: pénalités de 3% par mois</p>
                  <p>• TVA non applicable - Article 293 B du CGI</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2 print:mb-1">COORDONNÉES BANCAIRES</h4>
                <div className="text-gray-600 space-y-0.5">
                  <p><strong>Banque:</strong> Crédit Agricole Paris</p>
                  <p><strong>IBAN:</strong> FR76 1234 5678 9012 3456 789</p>
                  <p><strong>BIC:</strong> AGRIFRPP</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 print:mt-3 text-center p-3 print:p-2 bg-purple-50 rounded-lg border-l-4 border-purple-600 print:break-inside-avoid">
              <p className="text-gray-700 text-sm print:text-xs italic">
                "Nous vous remercions de votre confiance et restons à votre disposition pour tout renseignement complémentaire."
              </p>
              <p className="text-purple-600 font-semibold text-sm print:text-xs mt-1">
                {companyInfo?.name || 'Cabinet d\'Avocats'} - {companyInfo?.slogan || 'Excellence Juridique'}
              </p>
            </div>
          </div>

          {/* Signature - éviter coupure */}
          <div className="flex justify-end mt-6 print:mt-4 print:break-inside-avoid">
            <div className="text-center">
              <p className="text-gray-600 text-sm print:text-xs mb-6 print:mb-4">Fait à Paris, le {formatDate(new Date().toISOString())}</p>
              <div className="border-t border-gray-400 w-40 print:w-32 mx-auto pt-2 print:pt-1">
                <p className="text-gray-700 text-sm print:text-xs font-medium">Signature et cachet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-500 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
          <p>
            {companyInfo?.name || 'Cabinet d\'Avocats'} - {companyInfo?.address || '123 Avenue des Avocats, 75001 Paris'} - Tél: {companyInfo?.phone || '+33 1 23 45 67 89'}
          </p>
        </div>
      </div>

      {/* Styles d'impression optimisés pour A4 */}
      <style>
        {`
          @media print {
            @page {
              margin: 10mm 12mm;
              size: A4 portrait;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              font-size: 9pt;
              line-height: 1.3;
            }
            
            * {
              box-sizing: border-box;
            }
            
            /* Classes utilitaires print */
            .print\\:hidden {
              display: none !important;
            }
            
            .print\\:bg-white {
              background: white !important;
            }
            
            .print\\:relative {
              position: relative !important;
            }
            
            .print\\:inset-auto {
              inset: auto !important;
            }
            
            .print\\:p-0 {
              padding: 0 !important;
            }
            
            .print\\:p-\\[12mm\\] {
              padding: 12mm !important;
            }
            
            .print\\:p-3 {
              padding: 0.5rem !important;
            }
            
            .print\\:p-2 {
              padding: 0.35rem !important;
            }
            
            .print\\:p-1 {
              padding: 0.2rem !important;
            }
            
            .print\\:px-4 {
              padding-left: 0.75rem !important;
              padding-right: 0.75rem !important;
            }
            
            .print\\:px-2 {
              padding-left: 0.35rem !important;
              padding-right: 0.35rem !important;
            }
            
            .print\\:py-1 {
              padding-top: 0.2rem !important;
              padding-bottom: 0.2rem !important;
            }
            
            .print\\:pt-3 {
              padding-top: 0.5rem !important;
            }
            
            .print\\:pt-1 {
              padding-top: 0.2rem !important;
            }
            
            .print\\:mb-3 {
              margin-bottom: 0.5rem !important;
            }
            
            .print\\:mb-1 {
              margin-bottom: 0.2rem !important;
            }
            
            .print\\:mt-3 {
              margin-top: 0.5rem !important;
            }
            
            .print\\:mt-4 {
              margin-top: 0.75rem !important;
            }
            
            .print\\:mt-1 {
              margin-top: 0.2rem !important;
            }
            
            .print\\:gap-4 {
              gap: 0.75rem !important;
            }
            
            .print\\:gap-3 {
              gap: 0.5rem !important;
            }
            
            .print\\:gap-2 {
              gap: 0.35rem !important;
            }
            
            .print\\:space-y-1 > * + * {
              margin-top: 0.2rem !important;
            }
            
            .print\\:h-14 {
              height: 3.5rem !important;
            }
            
            .print\\:w-28 {
              width: 7rem !important;
            }
            
            .print\\:w-32 {
              width: 8rem !important;
            }
            
            .print\\:text-lg {
              font-size: 10pt !important;
            }
            
            .print\\:text-sm {
              font-size: 8pt !important;
            }
            
            .print\\:text-xs {
              font-size: 7pt !important;
            }
            
            .print\\:text-base {
              font-size: 9pt !important;
            }
            
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            
            .print\\:rounded-none {
              border-radius: 0 !important;
            }
            
            .print\\:max-w-none {
              max-width: none !important;
            }
            
            .print\\:max-h-none {
              max-height: none !important;
            }
            
            .print\\:overflow-visible {
              overflow: visible !important;
            }
            
            .print\\:fixed {
              position: fixed !important;
            }
            
            .print\\:bottom-0 {
              bottom: 0 !important;
            }
            
            .print\\:left-0 {
              left: 0 !important;
            }
            
            .print\\:right-0 {
              right: 0 !important;
            }
            
            /* Empêcher les coupures de page */
            .print\\:break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            .print\\:break-before-auto {
              page-break-before: auto !important;
              break-before: auto !important;
            }
            
            /* Optimisations spécifiques */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
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
            
            tfoot {
              display: table-footer-group;
            }
            
            /* Assurer la visibilité des couleurs */
            .bg-gradient-to-r,
            .bg-gray-50,
            .bg-blue-50,
            .bg-purple-50,
            .bg-yellow-100 {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            /* Optimiser les marges pour éviter débordements */
            .overflow-x-auto {
              overflow: visible !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InvoicePrintView;