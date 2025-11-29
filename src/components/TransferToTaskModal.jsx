import React, { useState, useEffect } from 'react';
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
      if (!document.caseId) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Ce document n\'est pas lié à un dossier.'
        });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('case_id', document.caseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur chargement tâches:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les tâches du dossier.'
        });
      } else {
        setTasks(data || []);
      }
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
      // Vérifier si le document n'est pas déjà lié à cette tâche
      const { data: existingLink } = await supabase
        .from('tasks_files')
        .select('id')
        .eq('file_url', document.url)
        .eq('task_id', selectedTaskId)
        .single();

      if (existingLink) {
        toast({
          title: 'Déjà lié',
          description: 'Ce document est déjà lié à cette tâche.'
        });
        setLoading(false);
        return;
      }

      // Créer le lien entre le document et la tâche
      const { error: insertError } = await supabase
        .from('tasks_files')
        .insert({
          task_id: selectedTaskId,
          case_id: document.caseId,
          file_name: document.name,
          file_url: document.url,
          file_size: document.fileSize,
          file_type: document.fileType,
          document_category: document.category,
          visible_for_assigned: visibleForAssigned,
          created_by: document.createdBy
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: '✅ Document transféré',
        description: `Le document a été transféré vers la tâche${visibleForAssigned ? ' et est visible pour l\'assigné' : ''}.`
      });

      onTransferred();
      onCancel();
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de transférer le document.'
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
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
            {tasks.length === 0 && (
              <p className="text-sm text-slate-500 mt-2">
                Aucune tâche disponible dans ce dossier.
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

export default TransferToTaskModal;
