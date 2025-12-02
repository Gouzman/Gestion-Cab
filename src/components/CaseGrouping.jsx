import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Link2, Unlink, Plus, X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const CaseGrouping = ({ cases = [], onGroupCreated, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedPrincipal, setSelectedPrincipal] = useState('');
  const [selectedCases, setSelectedCases] = useState([]);

  // Filtrer les dossiers non groupés
  const availableCases = cases.filter(c => !c.groupe_nom && !c.dossier_groupe_id);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le nom du groupe est obligatoire.'
      });
      return;
    }

    if (!selectedPrincipal) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Sélectionnez le dossier principal.'
      });
      return;
    }

    if (selectedCases.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Sélectionnez au moins un dossier à regrouper avec le principal.'
      });
      return;
    }

    try {
      // Appel de la fonction RPC pour créer le groupe
      const { error } = await supabase.rpc('create_dossier_groupe', {
        p_groupe_nom: groupName.trim(),
        p_dossier_principal_id: selectedPrincipal,
        p_dossiers_lies_ids: selectedCases
      });

      if (error) throw error;

      if (onGroupCreated) onGroupCreated();

    } catch (error) {
      console.error('Erreur création groupe:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer le groupe de dossiers.'
      });
    }
  };

  const toggleCaseSelection = (caseIdToToggle) => {
    setSelectedCases(prev => 
      prev.includes(caseIdToToggle)
        ? prev.filter(id => id !== caseIdToToggle)
        : [...prev, caseIdToToggle]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Créer un groupe de dossiers
              </h2>
              <p className="text-slate-400 text-sm">
                Regroupez plusieurs dossiers dans une chemise à sangle
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Créer un nouveau groupe */}
        <div className="space-y-6">
          {availableCases.length < 2 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-amber-400">
                  Nombre insuffisant de dossiers
                </p>
                <p className="text-slate-400 mt-1">
                  Vous devez avoir au moins 2 dossiers non groupés pour créer un groupe.
                </p>
              </div>
            </div>
          )}

          {availableCases.length >= 2 && (
            <>
              {/* Nom du groupe */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom du groupe (chemise à sangle) *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Affaire Martin - Ensemble"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Dossier principal */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dossier principal *
                </label>
                <select
                  value={selectedPrincipal}
                  onChange={(e) => {
                    setSelectedPrincipal(e.target.value);
                    // Retirer du tableau de sélection si présent
                    setSelectedCases(prev => prev.filter(id => id !== e.target.value));
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choisir le dossier principal...</option>
                  {availableCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code_dossier ? `${c.code_dossier} - ${c.title}` : c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-medium text-blue-400 mb-1">
                    À propos des groupes de dossiers
                  </p>
                  <ul className="space-y-1 text-slate-400 text-xs">
                    <li>• Le dossier principal sera le dossier de référence</li>
                    <li>• Sélectionnez les autres dossiers à regrouper avec celui-ci</li>
                    <li>• Les dossiers déjà groupés ne sont pas disponibles</li>
                  </ul>
                </div>
              </div>

              {/* Sélection des dossiers à lier */}
              {selectedPrincipal && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Dossiers à regrouper ({selectedCases.length} sélectionné(s))
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableCases
                      .filter(c => c.id !== selectedPrincipal)
                      .map(c => (
                        <label
                          key={c.id}
                          className={`block bg-slate-700/50 border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedCases.includes(c.id)
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedCases.includes(c.id)}
                              onChange={() => toggleCaseSelection(c.id)}
                              className="w-4 h-4 text-amber-500 bg-slate-700 border-slate-600 rounded focus:ring-amber-500"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {c.code_dossier && `${c.code_dossier} - `}{c.title}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4 border-t border-slate-700">
                <Button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || !selectedPrincipal || selectedCases.length === 0}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Créer le groupe
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CaseGrouping;
