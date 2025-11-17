import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, User, FileText, Printer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { numberToWords } from '@/lib/numberToWords';
import { hasPermission, isGerantOrAdmin } from '@/lib/permissionsUtils';
import { useCompanyInfo } from '@/lib/appSettings';
import { supabase } from '@/lib/customSupabaseClient';

const formatCurrency = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

const parseCurrency = (value) => {
  if (typeof value !== 'string') return 0;
  const number = Number(value.replace(/\s/g, '').replace(/[^0-9]/g, ""));
  return isNaN(number) ? 0 : number;
};

const InvoiceForm = ({ invoice, onSubmit, onCancel, onPrint, currentUser }) => {
  // Récupération des informations de l'entreprise
  const { companyInfo, loading: loadingCompany } = useCompanyInfo();
  
  // Vérification des permissions pour l'édition
  const isAdmin = isGerantOrAdmin(currentUser);
  const userPermissions = currentUser?.permissions || {};
  const canEditBilling = isAdmin || hasPermission(userPermissions, 'billing', 'edit') || 
                        currentUser?.function === 'Avocat' || currentUser?.role === 'avocat' ||
                        currentUser?.function === 'Secretaire' || currentUser?.role === 'secretaire';
  const canCreateBilling = isAdmin || hasPermission(userPermissions, 'billing', 'create');
  
  // État pour la liste des dossiers
  const [dossiersList, setDossiersList] = useState([]);
  const [loadingDossiers, setLoadingDossiers] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    caseId: '',
    caseTitle: '', // Titre du dossier pour l'affichage
    debours: {
      entrevue: 0,
      dossier: 0,
      plaidoirie: 0,
      huissier: 0,
      deplacement: 0,
    },
    honoraires: {
      forfait: 0,
      tauxHoraire: 0,
      base: 0,
      resultat: 0,
    },
    payment: {
      method: 'virement',
      provision: false,
      provisionAmount: 0,
    },
  });

  // Chargement des dossiers depuis Supabase
  useEffect(() => {
    const fetchDossiers = async () => {
      setLoadingDossiers(true);
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erreur lors du chargement des dossiers:', error);
        } else {
          setDossiersList(data || []);
        }
      } catch (err) {
        console.error('Erreur réseau:', err);
      } finally {
        setLoadingDossiers(false);
      }
    };

    fetchDossiers();
  }, []);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    }
  }, [invoice]);

  const handleInputChange = (section, name, value) => {
    const parsedValue = parseCurrency(value);
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [name]: parsedValue }
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value, type } = e.target;
    const isProvisionRadio = name === 'provision';

    setFormData(prev => {
        let newPaymentState = { ...prev.payment };

        if (isProvisionRadio) {
            newPaymentState.provision = value === 'true';
        } else if (name === 'provisionAmount') {
            newPaymentState[name] = parseCurrency(value);
        } else {
            newPaymentState[name] = value;
        }
        
        return { ...prev, payment: newPaymentState };
    });
  };

  const { totalDebours, totalHonoraires, totalHT, tva, totalTTC, resteAPayer } = useMemo(() => {
    const totalDebours = Object.values(formData.debours).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const totalHonoraires = Object.values(formData.honoraires).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const totalHT = totalDebours + totalHonoraires;
    const tva = totalHT * 0.18;
    const totalTTC = totalHT + tva;
    const resteAPayer = formData.payment.provision ? totalTTC - (Number(formData.payment.provisionAmount) || 0) : totalTTC;
    return { totalDebours, totalHonoraires, totalHT, tva, totalTTC, resteAPayer };
  }, [formData.debours, formData.honoraires, formData.payment.provision, formData.payment.provisionAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ajouter le totalTTC calculé au formData avant de soumettre
    const dataToSubmit = {
      ...formData,
      totalTTC: Number.isNaN(totalTTC) ? 0 : totalTTC
    };
    onSubmit(dataToSubmit);
  };

  const renderCurrencyInput = (label, name, value, onChange) => (
    <div className="flex items-center justify-between">
      <label className="text-slate-300 flex items-center print:text-black">
        <input type="checkbox" className="mr-3 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 print:hidden" />
        {label}
      </label>
      <div className="relative w-48">
        <input
          type="text"
          name={name}
          value={formatCurrency(value)}
          onChange={onChange}
          disabled={!canEditBilling}
          className={`w-full pl-3 pr-14 py-2 border rounded-lg text-right placeholder-slate-400 focus:outline-none print:bg-white print:text-black print:border-gray-300 ${
            canEditBilling 
              ? 'bg-slate-700/50 border-slate-600 text-white focus:ring-2 focus:ring-indigo-500' 
              : 'bg-slate-600/50 border-slate-500 text-slate-300 cursor-not-allowed'
          }`}
          placeholder="0"
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm print:text-gray-500">F CFA</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto print:bg-white print:border-none print:shadow-none print:max-h-full print:overflow-visible"
      >
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-2xl font-bold text-white">
            Honoraires et Conditions d'Intervention
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!canEditBilling && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg print:hidden">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 font-medium">Accès en lecture seule</p>
              <p className="text-yellow-200/80 text-sm">
                Vous pouvez consulter cette facture mais ne pouvez pas modifier les montants. 
                Contactez un administrateur pour effectuer des modifications.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* En-tête avec informations de l'entreprise */}
          <div className="border-b border-slate-700 pb-6 mb-6 print:border-gray-300">
            <div className="flex items-start justify-between gap-6">
              {/* Logo de l'entreprise (si disponible) */}
              {companyInfo?.logo_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={companyInfo.logo_url} 
                    alt={companyInfo.name || 'Logo'} 
                    className="h-20 w-auto object-contain"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
              
              {/* Informations de l'entreprise */}
              <div className="flex-grow text-right">
                <h1 className="text-2xl font-bold text-white mb-2 print:text-black">
                  {companyInfo?.name || '—'}
                </h1>
                {companyInfo?.slogan && (
                  <p className="text-slate-400 text-sm italic mb-3 print:text-gray-600">
                    {companyInfo.slogan}
                  </p>
                )}
                <div className="space-y-1 text-sm text-slate-300 print:text-gray-700">
                  {companyInfo?.address && (
                    <p>{companyInfo.address}</p>
                  )}
                  {companyInfo?.phone && (
                    <p>Tél : {companyInfo.phone}</p>
                  )}
                  {companyInfo?.email && (
                    <p>Email : {companyInfo.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 print:text-black"><User className="w-4 h-4 inline mr-2" />Client</label>
              <input 
                type="text" 
                name="clientName" 
                value={formData.clientName} 
                onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
                disabled={!canEditBilling}
                className={`w-full px-4 py-3 border rounded-lg print:bg-white print:text-black print:border-gray-300 ${
                  canEditBilling 
                    ? 'bg-slate-700/50 border-slate-600 text-white' 
                    : 'bg-slate-600/50 border-slate-500 text-slate-300 cursor-not-allowed'
                }`}
                placeholder="Nom du client" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 print:text-black"><FileText className="w-4 h-4 inline mr-2" />Dossier</label>
              <select
                name="caseId" 
                value={formData.caseId} 
                onChange={(e) => {
                  const selectedDossier = dossiersList.find(d => d.id === e.target.value);
                  setFormData({
                    ...formData, 
                    caseId: e.target.value,
                    caseTitle: selectedDossier?.title || ''
                  });
                }} 
                disabled={!canEditBilling || loadingDossiers}
                className={`w-full px-4 py-3 border rounded-lg print:bg-white print:text-black print:border-gray-300 ${
                  canEditBilling 
                    ? 'bg-slate-700/50 border-slate-600 text-white' 
                    : 'bg-slate-600/50 border-slate-500 text-slate-300 cursor-not-allowed'
                }`}
              >
                <option value="" disabled>
                  {loadingDossiers ? 'Chargement...' : dossiersList.length === 0 ? 'Aucun dossier disponible' : 'Sélectionner un dossier'}
                </option>
                {dossiersList.map(dossier => (
                  <option key={dossier.id} value={dossier.id}>
                    {dossier.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 p-4 border border-slate-700 rounded-lg print:border-gray-300">
            <h3 className="text-lg font-semibold text-indigo-400 print:text-indigo-600">Débours</h3>
            {renderCurrencyInput("Frais d'entrevue", "entrevue", formData.debours.entrevue, (e) => handleInputChange('debours', 'entrevue', e.target.value))}
            {renderCurrencyInput("Frais de dossier", "dossier", formData.debours.dossier, (e) => handleInputChange('debours', 'dossier', e.target.value))}
            {renderCurrencyInput("Frais de timbre de plaidoirie", "plaidoirie", formData.debours.plaidoirie, (e) => handleInputChange('debours', 'plaidoirie', e.target.value))}
            {renderCurrencyInput("Frais d'actes d'Huissier", "huissier", formData.debours.huissier, (e) => handleInputChange('debours', 'huissier', e.target.value))}
            {renderCurrencyInput("Frais de déplacement, de séjour et de vacation", "deplacement", formData.debours.deplacement, (e) => handleInputChange('debours', 'deplacement', e.target.value))}
          </div>

          <div className="space-y-4 p-4 border border-slate-700 rounded-lg print:border-gray-300">
            <h3 className="text-lg font-semibold text-purple-400 print:text-purple-600">Honoraires</h3>
            {renderCurrencyInput("Forfait", "forfait", formData.honoraires.forfait, (e) => handleInputChange('honoraires', 'forfait', e.target.value))}
            {renderCurrencyInput("Taux horaire", "tauxHoraire", formData.honoraires.tauxHoraire, (e) => handleInputChange('honoraires', 'tauxHoraire', e.target.value))}
            {renderCurrencyInput("Honoraires de base", "base", formData.honoraires.base, (e) => handleInputChange('honoraires', 'base', e.target.value))}
            {renderCurrencyInput("Honoraires de résultat", "resultat", formData.honoraires.resultat, (e) => handleInputChange('honoraires', 'resultat', e.target.value))}
          </div>

          <div className="space-y-2 p-4 bg-slate-900/50 border border-slate-700 rounded-lg print:bg-gray-100 print:border-gray-300">
            <h3 className="text-lg font-semibold text-white mb-4 print:text-black">Total</h3>
            <div className="flex justify-between text-slate-300 print:text-black"><p>Montant HT dû</p><p>{formatCurrency(totalHT)} F CFA</p></div>
            <div className="flex justify-between text-slate-300 print:text-black"><p>Montant TVA (18%)</p><p>{formatCurrency(tva)} F CFA</p></div>
            <div className="border-t border-slate-600 my-2 print:border-gray-300"></div>
            <div className="flex justify-between text-white font-bold text-lg print:text-black"><p>Total TTC</p><p>{formatCurrency(totalTTC)} F CFA</p></div>
            <p className="text-sm text-slate-400 italic capitalize print:text-gray-600">{numberToWords(totalTTC)} francs CFA</p>
          </div>

          <div className="space-y-4 p-4 border border-slate-700 rounded-lg print:border-gray-300">
            <h3 className="text-lg font-semibold text-green-400 print:text-green-600">Paiement</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 print:text-black">Mode de paiement envisagé</label>
              <div className="flex flex-wrap gap-4">
                {['Virement', 'Chèque', 'Carte bancaire', 'Espèces', 'Autre'].map(method => (
                  <label key={method} className={`flex items-center print:text-black ${canEditBilling ? 'text-slate-300' : 'text-slate-400'}`}>
                    <input 
                      type="radio" 
                      name="method" 
                      value={method.toLowerCase().replace(' ', '')} 
                      checked={formData.payment.method === method.toLowerCase().replace(' ', '')} 
                      onChange={handlePaymentChange} 
                      disabled={!canEditBilling}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 print:hidden disabled:opacity-50" 
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-slate-300 mb-2 print:text-black">Dépôt de provision / Avance sur frais demandé(e)</div>
              <div className="flex items-center gap-4">
                <label className={`flex items-center print:text-black ${canEditBilling ? 'text-slate-300' : 'text-slate-400'}`}>
                  <input 
                    type="radio" 
                    name="provision" 
                    value="true" 
                    checked={formData.payment.provision === true} 
                    onChange={handlePaymentChange} 
                    disabled={!canEditBilling}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 print:hidden disabled:opacity-50" 
                  />
                  Oui
                </label>
                <label className={`flex items-center print:text-black ${canEditBilling ? 'text-slate-300' : 'text-slate-400'}`}>
                  <input 
                    type="radio" 
                    name="provision" 
                    value="false" 
                    checked={formData.payment.provision === false} 
                    onChange={handlePaymentChange} 
                    disabled={!canEditBilling}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 print:hidden disabled:opacity-50" 
                  />
                  Non
                </label>
                {formData.payment.provision && (
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      name="provisionAmount" 
                      value={formatCurrency(formData.payment.provisionAmount)} 
                      onChange={handlePaymentChange} 
                      disabled={!canEditBilling}
                      className={`w-full pl-3 pr-14 py-2 border rounded-lg text-right print:bg-white print:text-black print:border-gray-300 ${
                        canEditBilling 
                          ? 'bg-slate-700/50 border-slate-600 text-white' 
                          : 'bg-slate-600/50 border-slate-500 text-slate-300 cursor-not-allowed'
                      }`}
                      placeholder="Montant" 
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm print:text-gray-500">F CFA</span>
                  </div>
                )}
              </div>
            </div>
            {formData.payment.provision && (
              <div className="mt-4 pt-4 border-t border-slate-700 print:border-gray-300">
                <div className="flex justify-between text-green-400 font-bold text-lg print:text-green-600">
                  <p>Reste à payer</p>
                  <p>{formatCurrency(resteAPayer)} F CFA</p>
                </div>
                <p className="text-sm text-slate-400 italic capitalize print:text-gray-600">{numberToWords(resteAPayer)} francs CFA</p>
              </div>
            )}
          </div>

          {/* Section signature numérique */}
          <div className="mt-8 pt-6 border-t border-slate-700 print:border-gray-300">
            <div className="flex justify-end">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-400 mb-4 print:text-gray-600">
                  Signature
                </p>
                {companyInfo?.signature_url ? (
                  <img 
                    src={companyInfo.signature_url} 
                    alt="Signature" 
                    className="h-16 w-auto object-contain mx-auto mb-2"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-xs text-slate-500 italic print:text-gray-500">
                      Signature non fournie
                    </p>
                  </div>
                )}
                <div className="border-t border-slate-600 w-48 mx-auto mt-2 print:border-gray-400"></div>
                <p className="text-xs text-slate-400 mt-2 print:text-gray-600">
                  {companyInfo?.name || 'Cabinet'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 print:hidden">
            {canEditBilling ? (
              <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                {invoice ? 'Mettre à jour' : 'Créer la Facture'}
              </Button>
            ) : (
              <Button 
                type="button" 
                disabled 
                className="flex-1 bg-slate-600 text-slate-400 cursor-not-allowed"
              >
                Modification non autorisée
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
              Annuler
            </Button>
            <Button type="button" variant="outline" onClick={onPrint} className="border-blue-500 text-blue-400 hover:bg-blue-500/20">
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default InvoiceForm;