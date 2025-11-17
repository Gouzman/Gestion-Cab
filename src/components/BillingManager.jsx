import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Plus, Search, Receipt, Printer, Edit, Trash2, Filter, AlertTriangle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import InvoiceForm from '@/components/InvoiceForm';
import BillingPrintPage from '@/components/BillingPrintPage';
import InvoicePrintView from '@/components/InvoicePrintView';
import { hasPermission, isGerantOrAdmin } from '@/lib/permissionsUtils';
import { supabase } from '@/lib/customSupabaseClient';

const formatCurrency = (value) => {
  if (Number.isNaN(value) || value === null) return '0';
  return new Intl.NumberFormat('fr-FR').format(value);
};

const getInvoiceStatus = (invoice) => {
  const totalTTC = invoice.totalTTC || 0;
  const provisionAmount = invoice.payment?.provisionAmount || 0;

  if (!invoice.payment?.provision || provisionAmount <= 0) {
    return 'non réglée';
  }
  if (provisionAmount >= totalTTC) {
    return 'réglée totalement';
  }
  return 'réglée partiellement';
};

const BillingManager = ({ currentUser }) => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPrintPage, setShowPrintPage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  // Vérification des permissions de facturation
  const isAdmin = isGerantOrAdmin(currentUser);
  const userPermissions = currentUser?.permissions || {};
  const canCreateBilling = isAdmin || hasPermission(userPermissions, 'billing', 'create');
  const canEditBilling = isAdmin || hasPermission(userPermissions, 'billing', 'edit');
  const canDeleteBilling = isAdmin || hasPermission(userPermissions, 'billing', 'delete');
  const hasBasicBillingAccess = isAdmin || hasPermission(userPermissions, 'billing') || 
                               currentUser?.function === 'Avocat' || currentUser?.role === 'avocat';

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fermer le menu en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.relative')) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des factures:', error);
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: "Impossible de charger les factures.",
        });
        return;
      }

      // Transformer les données de la base (snake_case) en camelCase pour le frontend
      const transformedInvoices = (data || []).map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        caseId: invoice.case_id,
        caseTitle: invoice.case_title,
        totalTTC: invoice.total_ttc,
        date: invoice.invoice_date,
        debours: invoice.debours || {},
        honoraires: invoice.honoraires || {},
        payment: invoice.payment || {},
        status: invoice.status || getInvoiceStatus(invoice)
      }));

      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur s'est produite lors du chargement des factures.",
      });
    }
  };

  const handleAddInvoice = async (invoiceData) => {
    try {
      // Générer le numéro de facture
      const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      
      // Calculer le statut automatiquement
      const status = getInvoiceStatus(invoiceData);

      // Préparer les données pour la base (snake_case)
      const payload = {
        invoice_number: invoiceNumber,
        client_name: invoiceData.clientName,
        case_id: invoiceData.caseId,
        case_title: invoiceData.caseTitle,
        total_ttc: Number(invoiceData.totalTTC) || 0,
        invoice_date: new Date().toISOString().split('T')[0],
        debours: invoiceData.debours || {},
        honoraires: invoiceData.honoraires || {},
        payment: invoiceData.payment || {},
        status: status,
        created_by: currentUser?.id
      };

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert([payload])
        .select();

      if (error) {
        console.error('Erreur lors de la création de la facture:', error);
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: "Impossible de créer la facture.",
        });
        return;
      }

      // Recharger les factures depuis la base
      await fetchInvoices();
      setShowForm(false);
      
      toast({
        title: "✅ Facture créée",
        description: `La facture ${invoiceNumber} a été créée avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur s'est produite lors de la création de la facture.",
      });
    }
  };

  const handleEditInvoice = async (invoiceData) => {
    try {
      // Calculer le statut automatiquement
      const status = getInvoiceStatus(invoiceData);

      // Préparer les données pour la base (snake_case)
      const payload = {
        client_name: invoiceData.clientName,
        case_id: invoiceData.caseId,
        case_title: invoiceData.caseTitle,
        total_ttc: Number(invoiceData.totalTTC) || 0,
        invoice_date: invoiceData.date,
        debours: invoiceData.debours || {},
        honoraires: invoiceData.honoraires || {},
        payment: invoiceData.payment || {},
        status: status
      };

      // Mettre à jour dans Supabase
      const { data, error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', invoiceData.id)
        .select();

      if (error) {
        console.error('Erreur lors de la modification de la facture:', error);
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: "Impossible de modifier la facture.",
        });
        return;
      }

      // Recharger les factures depuis la base
      await fetchInvoices();
      setEditingInvoice(null);
      setShowForm(false);
      
      toast({
        title: "✅ Facture modifiée",
        description: `La facture ${invoiceData.invoiceNumber} a été mise à jour.`,
      });
    } catch (error) {
      console.error('Erreur lors de la modification de la facture:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur s'est produite lors de la modification de la facture.",
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        console.error('Erreur lors de la suppression de la facture:', error);
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: "Impossible de supprimer la facture.",
        });
        return;
      }

      // Recharger les factures depuis la base
      await fetchInvoices();
      
      toast({
        title: "✅ Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur s'est produite lors de la suppression de la facture.",
      });
    }
  };

  const handlePrint = () => {
    toast({
      title: "Impression en cours...",
      description: "Préparation de la facture pour l'impression.",
    });
    globalThis.print();
  };

  const handlePrintInvoice = (invoice) => {
    setPrintingInvoice(invoice);
    toast({
      title: "📄 Ouverture de l'aperçu",
      description: `Préparation de la facture ${invoice.invoiceNumber} pour l'impression.`,
    });
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const searchMatch = invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
      })
      .filter(invoice => {
        if (statusFilter === 'all') return true;
        return invoice.status === statusFilter;
      });
  }, [invoices, searchTerm, statusFilter]);

  const statusColors = {
    'réglée totalement': 'bg-green-500',
    'réglée partiellement': 'bg-yellow-500',
    'non réglée': 'bg-red-500',
  };

  const filterOptions = [
    { id: 'all', label: 'Toutes' },
    { id: 'non réglée', label: 'Non réglées' },
    { id: 'réglée partiellement', label: 'Partiellement réglées' },
    { id: 'réglée totalement', label: 'Totalement réglées' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion de la Facturation</h1>
            <p className="text-slate-400">Créez et suivez vos factures et honoraires.</p>
            {!canCreateBilling && hasBasicBillingAccess && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-300">
                  Accès en lecture seule - Contactez un administrateur pour créer des factures
                </span>
              </div>
            )}
          </div>
          
          {/* Menu déroulant */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            
            {showMenu && (
              <motion.div
                key="billing-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowPrintPage(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-3" />
                    Imprimer
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {canCreateBilling && (
          <Button
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Facture
          </Button>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 print:hidden space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une facture par client ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-medium text-slate-300 mr-2">Filtrer par statut:</p>
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStatusFilter(option.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                statusFilter === option.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(invoice => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 flex items-center justify-between print:hidden"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-700 rounded-lg">
                  <Receipt className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{invoice.invoiceNumber} - {invoice.clientName}</p>
                  <p className="text-sm text-slate-400">
                    Total: {formatCurrency(invoice.totalTTC)} F CFA | Date: {invoice.date}
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[invoice.status]}`}>
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span className="capitalize">{invoice.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handlePrintInvoice(invoice)}
                  className="hover:bg-slate-600"
                >
                  <Printer className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                </Button>
                {canEditBilling ? (
                  <Button variant="ghost" size="icon" onClick={() => { setEditingInvoice(invoice); setShowForm(true); }}>
                    <Edit className="w-4 h-4 text-slate-400" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      toast({
                        variant: "destructive",
                        title: "Accès restreint",
                        description: "Vous n'avez pas l'autorisation de modifier les factures."
                      });
                    }}
                    className="opacity-50"
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                  </Button>
                )}
                {canDeleteBilling ? (
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (window.confirm(`Voulez-vous vraiment supprimer la facture n°${invoice.invoice_number} ?\n\nCette action est irréversible.`)) {
                      handleDeleteInvoice(invoice.id);
                    }
                  }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      toast({
                        variant: "destructive",
                        title: "Accès restreint",
                        description: "Vous n'avez pas l'autorisation de supprimer les factures."
                      });
                    }}
                    className="opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-slate-600" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            key="no-invoices-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 print:hidden"
          >
            <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucune facture trouvée</h3>
            <p className="text-slate-500">Ajustez vos filtres ou créez une nouvelle facture.</p>
          </motion.div>
        )}
      </div>

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSubmit={editingInvoice ? handleEditInvoice : handleAddInvoice}
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          onPrint={handlePrint}
          currentUser={currentUser}
        />
      )}

      {showPrintPage && (
        <BillingPrintPage
          invoices={filteredInvoices}
          onClose={() => setShowPrintPage(false)}
        />
      )}

      {printingInvoice && (
        <InvoicePrintView
          invoice={printingInvoice}
          onClose={() => setPrintingInvoice(null)}
        />
      )}
    </div>
  );
};

BillingManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    function: PropTypes.string,
    permissions: PropTypes.object,
  })
};

export default BillingManager;