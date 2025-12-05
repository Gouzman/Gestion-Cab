import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { X, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const TransferToTaskModal = ({ document, onCancel, onTransferred }) => {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [visibleForAssigned, setVisibleForAssigned] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      // Charger les tâches en fonction du contexte
      let query = supabase
        .from('tasks')
        .select('id, title, status, case_id')
        .order('created_at', { ascending: false });

      // Si le document a un case_id, filtrer sur ce dossier
      // Sinon, charger toutes les tâches disponibles
      if (document.caseId) {
        query = query.eq('case_id', document.caseId);
      }
      
      const { data: tasksData, error: tasksError } = await query;
      
      if (tasksError) {
        console.error('Erreur chargement tâches:', tasksError);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les tâches.'
        });
        return;
      }

      // Récupérer les titres des dossiers séparément
      const caseIds = [...new Set(tasksData.filter(t => t.case_id).map(t => t.case_id))];
      let casesMap = {};
      
      if (caseIds.length > 0) {
        const { data: casesData } = await supabase
          .from('cases')
          .select('id, title')
          .in('id', caseIds);
        
        if (casesData) {
          casesMap = casesData.reduce((acc, c) => {
            acc[c.id] = c.title;
            return acc;
          }, {});
        }
      }

      // Enrichir les tâches avec les titres de dossiers
      const enrichedTasks = tasksData.map(task => ({
        ...task,
        caseTitle: task.case_id ? casesMap[task.case_id] : null
      }));

      console.log('📋 Tâches chargées pour transfert:', enrichedTasks);
      setTasks(enrichedTasks || []);
    };
    fetchTasks();
  }, [document.caseId]);

  const handleTransfer = async () => {
    if (!selectedTaskId) {
      toast({
        variant: 'destructive',
        title: 'Tâche requise',
        description: 'Veuillez sélectionner une tâche.'
      });
      return;
    }

    setLoading(true);

    try {
      // Récupérer le case_id de la tâche sélectionnée
      const selectedTask = tasks.find(t => t.id === selectedTaskId);
      const targetCaseId = selectedTask?.case_id || document.caseId;

      // Vérifier si le document n'est pas déjà lié à cette tâche
      const { data: existingLinks, error: checkError } = await supabase
        .from('tasks_files')
        .select('id')
        .eq('file_url', document.url)
        .eq('task_id', selectedTaskId);

      if (checkError) {
        console.error('Erreur vérification lien existant:', checkError);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }

      if (existingLinks && existingLinks.length > 0) {
        toast({
          title: 'Déjà lié',
          description: 'Ce document est déjà lié à cette tâche.'
        });
        setLoading(false);
        return;
      }

      // Créer le lien entre le document et la tâche
      const payload = {
        task_id: selectedTaskId,
        case_id: targetCaseId, // Utiliser le case_id de la tâche
        file_name: document.name,
        file_url: document.url,
        file_size: document.fileSize || null,
        file_type: document.fileType || null,
        document_category: document.category || null,
        created_by: document.createdBy || null
      };

      // Ajouter visible_for_assigned seulement si la colonne existe
      // (pour compatibilité avec bases qui n'ont pas encore la migration)
      try {
        // Tester si la colonne existe en faisant une requête de test
        const { error: testError } = await supabase
          .from('tasks_files')
          .select('visible_for_assigned')
          .limit(1);
        
        if (!testError) {
          // La colonne existe, on peut l'ajouter au payload
          payload.visible_for_assigned = visibleForAssigned;
        } else {
          console.warn('⚠️ Colonne visible_for_assigned non disponible, insertion sans ce champ');
        }
      } catch (e) {
        console.warn('⚠️ Impossible de vérifier la colonne visible_for_assigned');
      }

      console.log('📤 Transfert du document:', payload);

      const { data: insertedData, error: insertError } = await supabase
        .from('tasks_files')
        .insert(payload)
        .select('*')
        .single();

      if (insertError) {
        console.error('Erreur insertion:', insertError);
        throw new Error(`Erreur d'insertion: ${insertError.message}`);
      }

      console.log('✅ Document transféré avec succès:', insertedData);

      toast({
        title: '✅ Document transféré',
        description: `Le document a été transféré vers la tâche${visibleForAssigned ? ' et est visible pour l\'assigné' : ''}.`
      });

      onTransferred();
      onCancel();
    } catch (error) {
      console.error('❌ Erreur lors du transfert:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de transfert',
        description: error.message || 'Impossible de transférer le document.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Transférer vers une tâche</h2>
              <p className="text-sm text-slate-400">{document.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Sélection de la tâche */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tâche de destination *
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Sélectionner une tâche...</option>
              {tasks.map(task => {
                const caseTitle = task.caseTitle || 'Sans dossier';
                return (
                  <option key={task.id} value={task.id}>
                    {task.title} - {caseTitle} ({task.status})
                  </option>
                );
              })}
            </select>
            {tasks.length === 0 && (
              <p className="text-sm text-slate-500 mt-2">
                {document.caseId 
                  ? 'Aucune tâche disponible dans ce dossier.'
                  : 'Aucune tâche disponible. Créez d\'abord des tâches.'}
              </p>
            )}
          </div>

          {/* Case à cocher : Visible pour l'assigné */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={visibleForAssigned}
                  onChange={(e) => setVisibleForAssigned(e.target.checked)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-5 h-5 border-2 border-slate-500 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                  {visibleForAssigned && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Visible par l'assigné de la tâche</div>
                <div className="text-sm text-slate-400 mt-1">
                  Si cochée, le document apparaîtra dans l'onglet Documents de la tâche pour l'utilisateur assigné.
                  Sinon, le document reste lié uniquement au dossier.
                </div>
              </div>
            </label>
          </div>

          {/* Informations du document */}
          <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-600/30">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Informations du document</h3>
            <div className="space-y-2 text-sm">
              {document.caseTitle && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dossier :</span>
                  <span className="text-white font-medium">{document.caseTitle}</span>
                </div>
              )}
              {document.category && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Catégorie :</span>
                  <span className="text-blue-400">{document.category}</span>
                </div>
              )}
              {document.fileSize && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Taille :</span>
                  <span className="text-slate-300">
                    {(document.fileSize / (1024 * 1024)).toFixed(2)} Mo
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="text-slate-300 hover:text-white"
          >
            Annuler
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedTaskId}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {loading ? 'Transfert...' : 'Transférer le document'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

TransferToTaskModal.propTypes = {
  document: PropTypes.shape({
    caseId: PropTypes.string,
    url: PropTypes.string,
    name: PropTypes.string,
    fileSize: PropTypes.number,
    fileType: PropTypes.string,
    category: PropTypes.string,
    createdBy: PropTypes.string,
    caseTitle: PropTypes.string
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onTransferred: PropTypes.func.isRequired
};

export default TransferToTaskModal;
