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
        <div className="p-8 print:p-6 bg-white">
          
          {/* En-tête avec bande colorée */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-20 rounded-t-lg print:rounded-none flex items-center px-8">
              <div className="text-white">
                <h1 className="text-2xl font-bold">{companyInfo?.name || 'CABINET D\'AVOCATS'}</h1>
                <p className="text-purple-100">{companyInfo?.slogan || 'Excellence Juridique & Conseil'}</p>
              </div>
            </div>
            
            {/* Informations du cabinet */}
            <div className="bg-gray-50 p-6 rounded-b-lg print:rounded-none border-l-4 border-purple-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

          {/* Informations facture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-purple-600 pb-2">FACTURE</h3>
              <div className="space-y-2 text-sm">
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
                  <span className="text-gray-900">{invoice.caseTitle || invoice.caseId || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-purple-600 pb-2">CLIENT</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-gray-900 text-lg">{invoice.clientName}</p>
                <p className="text-gray-600 text-sm mt-2">Adresse client</p>
                <p className="text-gray-600 text-sm">Code postal, Ville</p>
              </div>
            </div>
          </div>

          {/* Détail des prestations */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-purple-600 pb-2">DÉTAIL DES PRESTATIONS</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">Description</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">Montant (F CFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Honoraires */}
                  {invoice.honoraires && Object.entries(invoice.honoraires).map(([key, value]) => (
                    value > 0 && (
                      <tr key={key}>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">
                          Honoraires - {key === 'forfait' ? 'Forfait' : key === 'tauxHoraire' ? 'Taux horaire' : key === 'base' ? 'Base' : 'Résultat'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    )
                  ))}
                  
                  {/* Débours */}
                  {invoice.debours && Object.entries(invoice.debours).map(([key, value]) => (
                    value > 0 && (
                      <tr key={key}>
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">
                          Débours - {key === 'entrevue' ? 'Entrevue' : key === 'dossier' ? 'Dossier' : key === 'plaidoirie' ? 'Plaidoirie' : key === 'huissier' ? 'Huissier' : 'Déplacement'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm">
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-purple-600">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">SOUS-TOTAL:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(sousTotal)} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">TVA (18%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(tva)} F CFA</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-800">TOTAL DÛ:</span>
                      <span className="font-bold text-xl text-purple-600">{formatCurrency(totalTTC)} F CFA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de paiement */}
          {invoice.payment && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-purple-600 pb-2">INFORMATIONS DE PAIEMENT</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Mode de paiement:</span>
                    <span className="ml-2 text-gray-900 capitalize">{invoice.payment.method || 'Non défini'}</span>
                  </div>
                  {invoice.payment.provision && (
                    <div>
                      <span className="font-medium text-gray-600">Provision versée:</span>
                      <span className="ml-2 text-gray-900">{formatCurrency(invoice.payment.provisionAmount || 0)} F CFA</span>
                    </div>
                  )}
                </div>
                {invoice.payment.provisionAmount < totalTTC && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-yellow-800 font-medium">
                      Solde restant dû: {formatCurrency(totalTTC - (invoice.payment.provisionAmount || 0))} F CFA
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditions et remerciements */}
          <div className="border-t-2 border-gray-300 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-gray-800 mb-3">CONDITIONS DE PAIEMENT</h4>
                <div className="text-gray-600 space-y-1">
                  <p>• Paiement sous 30 jours à réception</p>
                  <p>• Virements acceptés sur compte bancaire</p>
                  <p>• Retard de paiement: pénalités de 3% par mois</p>
                  <p>• TVA non applicable - Article 293 B du CGI</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-3">COORDONNÉES BANCAIRES</h4>
                <div className="text-gray-600 space-y-1">
                  <p><strong>Banque:</strong> Crédit Agricole Paris</p>
                  <p><strong>IBAN:</strong> FR76 1234 5678 9012 3456 789</p>
                  <p><strong>BIC:</strong> AGRIFRPP</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600">
              <p className="text-gray-700 italic">
                "Nous vous remercions de votre confiance et restons à votre disposition pour tout renseignement complémentaire."
              </p>
              <p className="text-purple-600 font-semibold mt-2">
                {companyInfo?.name || 'Cabinet d\'Avocats'} - {companyInfo?.slogan || 'Excellence Juridique'}
              </p>
            </div>
          </div>

          {/* Signature */}
          <div className="flex justify-end mt-8">
            <div className="text-center">
              <p className="text-gray-600 mb-8">Fait à Paris, le {formatDate(new Date().toISOString())}</p>
              <div className="border-t border-gray-400 w-48 mx-auto pt-2">
                <p className="text-gray-700 font-medium">Signature et cachet</p>
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

      {/* Styles d'impression */}
      <style>
        {`
          @media print {
            @page {
              margin: 1.5cm;
              size: A4 portrait;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
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
            
            .print\\:p-6 {
              padding: 1.5rem !important;
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
          }
        `}
      </style>
    </div>
  );
};

export default InvoicePrintView;