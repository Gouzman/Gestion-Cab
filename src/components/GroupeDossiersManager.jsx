import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, Plus, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Composant pour gérer les groupes de dossiers liés (chemises à sangle virtuelles)
 * Point 79 : Affaires non contentieuses regroupées
 */
const GroupeDossiersManager = ({ caseId, onClose }) => {
  const [groupes, setGroupes] = useState([]);
  const [dossiersDisponibles, setDossiersDisponibles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedGroupes, setExpandedGroupes] = useState({});
  const [formData, setFormData] = useState({
    groupe_name: '',
    description: ''
  });

  useEffect(() => {
    fetchGroupes();
    fetchDossiersDisponibles();
  }, []);

  const fetchGroupes = async () => {
    try {
      setLoading(true);
      
      // Récupérer les groupes
      const { data: groupesData, error: groupesError } = await supabase
        .from('cases')
        .select('id, code_dossier, title, groupe_name, description, created_at')
        .eq('is_groupe', true)
        .order('created_at', { ascending: false });

      if (groupesError) throw groupesError;

      // Pour chaque groupe, récupérer ses dossiers enfants
      const groupesAvecEnfants = await Promise.all(
        (groupesData || []).map(async (groupe) => {
          const { data: enfants, error: enfantsError } = await supabase
            .from('cases')
            .select('id, code_dossier, title, case_type, type_de_diligence')
            .eq('parent_case_id', groupe.id)
            .order('created_at', { ascending: true });

          if (enfantsError) {
            console.error('Erreur chargement enfants:', enfantsError);
            return { ...groupe, enfants: [] };
          }

          return { ...groupe, enfants: enfants || [] };
        })
      );

      setGroupes(groupesAvecEnfants);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les groupes de dossiers'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDossiersDisponibles = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, code_dossier, title')
        .is('parent_case_id', null)
        .eq('is_groupe', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDossiersDisponibles(data || []);
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    }
  };

  const handleCreateGroupe = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('cases')
        .insert([{
          title: `Groupe : ${formData.groupe_name}`,
          groupe_name: formData.groupe_name,
          description: formData.description,
          is_groupe: true,
          status: 'en-cours',
          type_de_diligence: 'Conseil'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Groupe créé',
        description: 'Le groupe de dossiers a été créé avec succès'
      });

      setFormData({ groupe_name: '', description: '' });
      setShowForm(false);
      fetchGroupes();
    } catch (error) {
      console.error('Erreur création groupe:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le groupe'
      });
    }
  };

  const handleLierDossier = async (dossierId, groupeId) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ parent_case_id: groupeId })
        .eq('id', dossierId);

      if (error) throw error;

      toast({
        title: '✅ Dossier lié',
        description: 'Le dossier a été ajouté au groupe'
      });

      fetchGroupes();
      fetchDossiersDisponibles();
    } catch (error) {
      console.error('Erreur liaison dossier:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de lier le dossier'
      });
    }
  };

  const handleDelierDossier = async (dossierId) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ parent_case_id: null })
        .eq('id', dossierId);

      if (error) throw error;

      toast({
        title: '✅ Dossier délié',
        description: 'Le dossier a été retiré du groupe'
      });

      fetchGroupes();
      fetchDossiersDisponibles();
    } catch (error) {
      console.error('Erreur déliaison:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de délier le dossier'
      });
    }
  };

  const toggleGroupe = (groupeId) => {
    setExpandedGroupes(prev => ({
      ...prev,
      [groupeId]: !prev[groupeId]
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 text-white">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-400" />
            Chemises de dossiers
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle chemise
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Formulaire création groupe */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateGroupe}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4">
                Créer une chemise de dossiers
              </h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="groupe-name" className="block text-sm font-medium text-slate-300 mb-2">
                    Nom de la chemise *
                  </label>
                  <input
                    id="groupe-name"
                    type="text"
                    value={formData.groupe_name}
                    onChange={(e) => setFormData({ ...formData, groupe_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    placeholder="Ex: Audit fiscal 2025 - Société ABC"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="groupe-description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="groupe-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    rows={3}
                    placeholder="Détails sur ce regroupement..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Créer la chemise</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Liste des groupes */}
        <div className="space-y-4">
          {groupes.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aucune chemise de dossiers</p>
              <p className="text-sm mt-2">
                Créez une chemise pour regrouper des dossiers liés
              </p>
            </div>
          )}

          {groupes.map((groupe) => {
            const isExpanded = expandedGroupes[groupe.id];
            const nombreDossiers = groupe.enfants?.length || 0;
            
            return (
            <div
              key={groupe.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors w-full text-left"
                onClick={() => toggleGroupe(groupe.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <FolderOpen className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Folder className="w-5 h-5 text-amber-400" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{groupe.groupe_name}</h4>
                    <p className="text-sm text-slate-400">
                      {groupe.code_dossier} • {nombreDossiers} dossier{nombreDossiers > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </button>

              {/* Contenu déroulant */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-700"
                  >
                    <div className="p-4 bg-slate-900/30">
                      {/* Description */}
                      {groupe.description && (
                        <div className="mb-3 p-2 bg-slate-700/20 rounded text-sm text-slate-400 italic">
                          {groupe.description}
                        </div>
                      )}

                      {/* Dossiers liés */}
                      <div className="space-y-2">
                {groupe.enfants && groupe.enfants.length > 0 ? (
                  groupe.enfants.map((dossier) => (
                    <div
                      key={dossier.id}
                      className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-2 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <div className="flex-1">
                          <div className="text-sm text-slate-200 font-medium">
                            {dossier.code_dossier || 'Sans code'} - {dossier.title}
                          </div>
                          {(dossier.case_type || dossier.type_de_diligence) && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {dossier.type_de_diligence && (
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded mr-2">
                                  {dossier.type_de_diligence}
                                </span>
                              )}
                              {dossier.case_type}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelierDossier(dossier.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Retirer du groupe"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                        ) : (
                          <p className="text-sm text-slate-500 italic text-center py-4">Aucun dossier dans cette chemise</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
        </div>

        {/* Dossiers disponibles pour liaison */}
        {dossiersDisponibles.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              Dossiers disponibles pour regroupement
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dossiersDisponibles.map((dossier) => (
                <div
                  key={dossier.id}
                  className="flex items-center justify-between bg-slate-700/20 rounded px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {dossier.code_dossier} - {dossier.title}
                    </span>
                  </div>
                  {groupes.length > 0 && (
                    <select
                      onChange={(e) => handleLierDossier(dossier.id, e.target.value)}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                    >
                      <option value="">Ajouter à une chemise...</option>
                      {groupes.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.groupe_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

GroupeDossiersManager.propTypes = {
  caseId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default GroupeDossiersManager;
