import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, UserX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const DeleteUserModal = ({ isOpen, onClose, user, onConfirmDelete }) => {
  const [tasks, setTasks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserTasks();
      fetchCollaborators();
    }
  }, [isOpen, user]);

  const fetchUserTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('assigned_to_id', user.id);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .neq('id', user.id)
        .eq('admin_approved', true);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Erreur chargement collaborateurs:', error);
    }
  };

  const handleDelete = async () => {
    if (tasks.length > 0 && !selectedCollaborator) {
      return; // Ne pas supprimer si des tâches existent et aucun collaborateur n'est sélectionné
    }

    setDeleting(true);
    try {
      // Réattribuer les tâches si nécessaire
      if (tasks.length > 0 && selectedCollaborator) {
        // Récupérer le nom du nouveau collaborateur
        const newCollaborator = collaborators.find(c => c.id === selectedCollaborator);
        
        const { error: reassignError } = await supabase
          .from('tasks')
          .update({ 
            assigned_to_id: selectedCollaborator,
            assigned_to_name: newCollaborator?.name || ''
          })
          .eq('assigned_to_id', user.id);

        if (reassignError) throw reassignError;
      }

      // Supprimer l'utilisateur
      await onConfirmDelete(user.id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border-b border-red-500/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Supprimer {user?.name}
                  </h3>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <>
                {/* Avertissement */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <UserX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">
                        Cette action est <span className="font-semibold text-red-400">irréversible</span>.
                        Le compte utilisateur sera supprimé définitivement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tâches existantes */}
                {tasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <p className="text-sm text-slate-200 mb-3">
                        <span className="font-semibold text-orange-400">{tasks.length}</span> tâche(s) 
                        {tasks.length > 1 ? ' sont assignées' : ' est assignée'} à cet utilisateur :
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-400 max-h-32 overflow-y-auto">
                        {tasks.map((task) => (
                          <li key={task.id} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                            <span className="truncate">{task.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sélection du collaborateur */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        Réattribuer les tâches à :
                      </label>
                      <select
                        value={selectedCollaborator}
                        onChange={(e) => setSelectedCollaborator(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Sélectionner un collaborateur --</option>
                        {collaborators.map((collab) => (
                          <option key={collab.id} value={collab.id}>
                            {collab.name} ({collab.email})
                          </option>
                        ))}
                      </select>
                      {!selectedCollaborator && (
                        <p className="text-xs text-red-400">
                          ⚠️ Vous devez sélectionner un collaborateur pour réattribuer les tâches
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400">
                      Aucune tâche assignée à cet utilisateur.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={deleting}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting || (tasks.length > 0 && !selectedCollaborator)}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

DeleteUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onConfirmDelete: PropTypes.func.isRequired
};

export default DeleteUserModal;
