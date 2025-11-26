import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Plus, Search, Receipt, Printer, Edit, Trash2, Filter, AlertTriangle, MoreVertical, TrendingUp, TrendingDown, DollarSign, Clock, Calendar, Download, FileText } from 'lucide-react';
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
        invoice_type: invoice.invoice_type || 'definitive',
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
        invoice_type: invoiceData.invoice_type || 'definitive',
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
        invoice_type: invoiceData.invoice_type || 'definitive',
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

  // Calcul des statistiques pour les cartes
  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    const pending = invoices.filter(inv => inv.status === 'non réglée' || inv.status === 'réglée partiellement');
    const pendingAmount = pending.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    
    const now = new Date();
    const overdue = invoices.filter(inv => {
      if (inv.status === 'réglée totalement') return false;
      // Considérer en retard si date > 30 jours
      const invoiceDate = new Date(inv.date);
      const daysDiff = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
      return daysDiff > 30;
    });
    const overdueAmount = overdue.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    
    const thisMonth = invoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonth.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    
    return {
      total,
      pendingAmount,
      overdueAmount,
      thisMonthAmount,
      totalChange: 18, // Exemple
      pendingChange: 5,
      overdueChange: -12,
      thisMonthChange: 22
    };
  }, [invoices]);

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
      {/* En-tête */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Facturation & Comptabilité</h1>
          <p className="text-slate-400">Gérez les factures et les rapports financiers</p>
          {!canCreateBilling && hasBasicBillingAccess && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Accès en lecture seule - Contactez un administrateur pour créer des factures
              </span>
            </div>
          )}
        </div>
        
        {canCreateBilling && (
          <Button
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Facture
          </Button>
        )}
      </div>

      {/* 4 Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        {/* Revenu Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">Revenu Total</p>
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.total)} F CFA</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">+{stats.totalChange}%</span>
          </div>
        </motion.div>

        {/* Factures en attente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">Factures en attente</p>
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.pendingAmount)} F CFA</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">+{stats.pendingChange}%</span>
          </div>
        </motion.div>

        {/* En retard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">En retard</p>
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.overdueAmount)} F CFA</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">{stats.overdueChange}%</span>
          </div>
        </motion.div>

        {/* Ce mois-ci */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">Ce mois-ci</p>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.thisMonthAmount)} F CFA</p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">+{stats.thisMonthChange}%</span>
          </div>
        </motion.div>
      </div>

      {/* Section Factures Récentes */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl print:hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Factures Récentes</h2>
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Export en cours",
                description: "Les factures sont en cours d'exportation..."
              });
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Tableau des factures */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  ID Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dossier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.slice(0, 10).map((invoice, index) => {
                  // Calculer l'échéance (30 jours après la date de facture)
                  const dueDate = new Date(invoice.date);
                  dueDate.setDate(dueDate.getDate() + 30);
                  const dueDateStr = dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  
                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-700/30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {invoice.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {invoice.caseTitle || invoice.caseId || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {formatCurrency(invoice.totalTTC)} F CFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(invoice.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {dueDateStr}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'réglée totalement' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                            : invoice.status === 'réglée partiellement' || invoice.status === 'non réglée'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {invoice.status === 'réglée totalement' ? 'Payée' : invoice.status === 'non réglée' ? 'En attente' : 'En retard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintInvoice(invoice)}
                          className="hover:bg-slate-600"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">Aucune facture trouvée</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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