import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Scale, CheckCircle, Archive, FolderOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import CaseForm from '@/components/CaseForm';
import CaseListItem from '@/components/CaseListItem';
import GroupeDossiersManager from '@/components/GroupeDossiersManager';

import ConfirmationModal from '@/components/ConfirmationModal';
import { supabase } from '@/lib/customSupabaseClient';
import { getCaseColumns, getCaseInsertColumns } from '@/config/features';

const CaseManager = ({ currentUser }) => {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [showGroupesManager, setShowGroupesManager] = useState(false);

  const isGerantOrAssocie = currentUser && (currentUser.function === 'Gerant' || currentUser.function === 'Associe Emerite');
  const isAdmin = isGerantOrAssocie || (currentUser.role && currentUser.role.toLowerCase() === 'admin');

  useEffect(() => {
    fetchCases();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('id, name, type, first_name, last_name, company');
    if (error) {
      console.error("Erreur lors du chargement des clients :", error.message);
    } else {
      setClients(data || []);
    }
  };

  const fetchCases = async () => {
    const { data, error } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les dossiers." });
    } else if (isAdmin) {
      setCases(data);
    } else {
      const visibleCases = data.filter(c => 
        (c.created_by && c.created_by === currentUser.id) || 
        (c.visible_to?.includes(currentUser.id))
      );
      setCases(visibleCases);
    }
  };

  const handleAddCase = async (caseData) => {
    // Liste des colonnes valides - s'adapte automatiquement selon l'état de la migration
    const validColumns = getCaseInsertColumns();
    
    // Filtrer le payload pour ne garder que les colonnes valides
    const payload = {};
    validColumns.forEach(col => {
      if (caseData[col] !== undefined) {
        payload[col] = caseData[col];
      }
    });
    
    // Ajouter le créateur
    payload.created_by = currentUser?.id;
    
    // Corriger les champs numériques NaN et nettoyer les dates vides
    for (const key in payload) {
      if (typeof payload[key] === "number" && Number.isNaN(payload[key])) {
        payload[key] = 0;
      }
      // Supprimer les chaînes vides pour les champs de type date
      if (key === 'next_hearing' && (payload[key] === '' || payload[key] === null || payload[key] === undefined)) {
        delete payload[key];
      }
    }
    
    // Log pour debug
    console.log("Payload envoyé à Supabase :", payload);
    
    const { data, error } = await supabase.from('cases').insert([payload]).select();
    if (error) {
      console.error("Erreur Supabase :", error.message);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter le dossier. Vérifiez les champs et réessayez." });
    } else {
      setCases([data[0], ...cases]);
      setShowForm(false);
      toast({ title: "✅ Dossier créé", description: `Le dossier ${data[0].id} a été créé avec succès.` });
    }
  };

  const handleEditCase = async (caseData) => {
    // Liste des colonnes valides - s'adapte automatiquement selon l'état de la migration
    const validColumns = getCaseColumns();
    
    // Filtrer le payload pour ne garder que les colonnes valides
    const payload = {};
    validColumns.forEach(col => {
      if (caseData[col] !== undefined) {
        payload[col] = caseData[col];
      }
    });
    
    // Corriger les champs numériques NaN
    for (const key in payload) {
      if (typeof payload[key] === "number" && Number.isNaN(payload[key])) {
        payload[key] = 0;
      }
      // Supprimer les chaînes vides pour les champs de type date
      if (key === 'next_hearing' && (payload[key] === '' || payload[key] === null || payload[key] === undefined)) {
        delete payload[key];
      }
    }
    
    // Log pour debug
    console.log("Payload de modification envoyé à Supabase :", payload);
    
    const { data, error } = await supabase.from('cases').update(payload).eq('id', editingCase.id).select();
    if (error) {
      console.error("Erreur Supabase :", error.message);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le dossier. Vérifiez les champs et réessayez." });
    } else {
      setCases(cases.map(c => c.id === editingCase.id ? data[0] : c));
      setEditingCase(null);
      setShowForm(false);
      toast({ title: "✅ Dossier modifié", description: "Le dossier a été mis à jour avec succès." });
    }
  };

  const handleDeleteCase = async (caseId) => {
    const { error } = await supabase.from('cases').delete().eq('id', caseId);
    if (error) {
      toast({ variant: "destructive", title: "Erreur de suppression", description: error.message });
    } else {
      setCases(cases.filter(c => c.id !== caseId));
      toast({ title: "🗑️ Dossier supprimé", description: "Le dossier a été supprimé avec succès." });
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: cases.length,
    'en-cours': cases.filter(c => c.status === 'en-cours').length,
    'juge-acheve': cases.filter(c => c.status === 'juge-acheve').length,
    'cloture': cases.filter(c => c.status === 'cloture').length,
    'archive': cases.filter(c => c.status === 'archive').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion des Dossiers</h1>
          <p className="text-slate-400">Suivez et gérez vos affaires juridiques</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setShowGroupesManager(true)}
            variant="outline"
            className="border-amber-600/50 text-amber-300 hover:bg-amber-500/20"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Chemises de dossiers
          </Button>
          <Button
            onClick={() => {
              setEditingCase(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Dossier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { key: 'all', label: 'Total', icon: FileText },
          { key: 'en-cours', label: 'En cours', icon: Scale },
          { key: 'juge-acheve', label: 'Jugé/Achevé', icon: CheckCircle },
          { key: 'cloture', label: 'Clôturé', icon: Clock },
          { key: 'archive', label: 'Archivé', icon: Archive }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{statusCounts[stat.key] || 0}</p>
                </div>
                <Icon className="w-6 h-6 text-slate-400" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un dossier par ID, titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en-cours">En cours</option>
              <option value="juge-acheve">Jugé/achevé</option>
              <option value="cloture">Clôturé</option>
              <option value="archive">Archivé - En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gestionnaire de Groupes de Dossiers */}
      {showGroupesManager && (
        <GroupeDossiersManager
          onClose={() => {
            setShowGroupesManager(false);
            fetchCases(); // Rafraîchir la liste après modifications
          }}
        />
      )}

      {/* Case List */}
      <div className="space-y-4">
        {filteredCases.map((caseItem, index) => (
          <CaseListItem
            key={caseItem.id}
            case={caseItem}
            clients={clients}
            index={index}
            onEdit={(caseItem) => {
              setEditingCase(caseItem);
              setShowForm(true);
            }}
            onDelete={(caseId) => {
              const caseToDelete = cases.find(c => c.id === caseId);
              setConfirmDialog({
                open: true,
                title: 'Supprimer le dossier',
                message: `Voulez-vous vraiment supprimer le dossier "${caseToDelete?.title}" ?\n\nCette action est irréversible.`,
                onConfirm: () => {
                  handleDeleteCase(caseId);
                  setConfirmDialog({ ...confirmDialog, open: false });
                }
              });
            }}
          />
        ))}
      </div>

      {filteredCases.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucun dossier trouvé</h3>
          <p className="text-slate-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier dossier'
            }
          </p>
        </motion.div>
      )}

      {showForm && (
        <CaseForm
          case={editingCase}
          onSubmit={editingCase ? handleEditCase : handleAddCase}
          onCancel={() => {
            setShowForm(false);
            setEditingCase(null);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Modal de confirmation globale */}
      <ConfirmationModal
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
};

CaseManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    function: PropTypes.string,
  })
};

export default CaseManager;