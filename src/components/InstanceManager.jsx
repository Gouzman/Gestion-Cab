import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const INSTANCE_TYPES = [
  { value: 'Tribunal', label: 'Tribunal (Première Instance)', icon: Scale },
  { value: 'Appel', label: 'Appel', icon: Scale },
  { value: 'Cassation', label: 'Cassation', icon: Scale }
];

const INSTANCE_STATUTS = [
  { value: 'en_cours', label: 'En cours', color: 'blue' },
  { value: 'gagne', label: 'Gagné', color: 'green' },
  { value: 'perdu', label: 'Perdu', color: 'red' },
  { value: 'desistement', label: 'Désistement', color: 'gray' },
  { value: 'transaction', label: 'Transaction', color: 'yellow' }
];

const InstanceManager = ({ caseId, onClose }) => {
  const [instances, setInstances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const modalRef = React.useRef(null);
  const [formData, setFormData] = useState({
    instance_type: 'Tribunal',
    juridiction_competente: '',
    etat_du_dossier: 'En cours',
    numero_rg: '',
    date_introduction: '',
    date_jugement: '',
    statut: 'en_cours'
  });

  useEffect(() => {
    if (caseId) {
      fetchInstances();
    }
  }, [caseId]);

  // Scroll vers le haut à l'ouverture du modal et quand le formulaire s'ouvre
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (showForm && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [showForm]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dossier_instance')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Erreur chargement instances:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les instances'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Préparer le payload en ne gardant que les champs qui existent
      const payload = {
        case_id: caseId,
        instance_type: formData.instance_type,
        juridiction_competente: formData.juridiction_competente || '',
        etat_du_dossier: formData.etat_du_dossier || 'En cours',
        date_ouverture: formData.date_introduction || new Date().toISOString().split('T')[0],
        numero_rg: formData.numero_rg || null,
        date_introduction: formData.date_introduction || null,
        date_jugement: formData.date_jugement || null,
        statut: formData.statut
      };    if (editingInstance) {
      const { error } = await supabase
        .from('dossier_instance')
        .update(payload)
        .eq('id', editingInstance.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de modifier l\'instance'
        });
      } else {
        toast({
          title: '✅ Instance modifiée',
          description: 'L\'instance a été mise à jour avec succès'
        });
        resetForm();
        fetchInstances();
      }
    } else {
      const { error } = await supabase
        .from('dossier_instance')
        .insert([payload]);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de créer l\'instance'
        });
      } else {
        toast({
          title: '✅ Instance créée',
          description: 'L\'instance a été ajoutée avec succès'
        });
        resetForm();
        fetchInstances();
      }
    }
  };

  const handleEdit = (instance) => {
    setEditingInstance(instance);
    setFormData({
      instance_type: instance.instance_type,
      juridiction_competente: instance.juridiction_competente || '',
      etat_du_dossier: instance.etat_du_dossier || 'En cours',
      numero_rg: instance.numero_rg || '',
      date_introduction: instance.date_introduction || instance.date_ouverture || '',
      date_jugement: instance.date_jugement || '',
      statut: instance.statut
    });
    setShowForm(true);
  };

  const handleDelete = async (instanceId) => {
    if (!confirm('Supprimer cette instance ?')) return;

    const { error } = await supabase
      .from('dossier_instance')
      .delete()
      .eq('id', instanceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'instance'
      });
    } else {
      toast({
        title: '✅ Instance supprimée',
        description: 'L\'instance a été supprimée'
      });
      fetchInstances();
    }
  };

  const resetForm = () => {
    setFormData({
      instance_type: 'Tribunal',
      juridiction_competente: '',
      etat_du_dossier: 'En cours',
      numero_rg: '',
      date_introduction: '',
      date_jugement: '',
      statut: 'en_cours'
    });
    setEditingInstance(null);
    setShowForm(false);
  };

  const getStatutBadge = (statut) => {
    const statutObj = INSTANCE_STATUTS.find(s => s.value === statut);
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[statutObj?.color] || colors.blue}`}>
        {statutObj?.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-6 text-white">
          Chargement des instances...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center translate-y-[-200px] p- z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="instance-modal-content bg-slate-800 border border-slate-700 rounded-xl p-4 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* En-tête */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Instances Juridiques ({instances.length})
          </h3>
          <div className="flex gap-2">
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Instance
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

      {/* Formulaire - TOUJOURS en haut quand ouvert */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-700/30 border border-slate-600 rounded-xl p-3"
          >
            <h4 className="text-base font-semibold text-white mb-2">
              {editingInstance ? 'Modifier l\'instance' : 'Nouvelle instance'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Type d'instance */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Type d'instance *
                  </label>
                  <select
                    value={formData.instance_type}
                    onChange={(e) => setFormData({ ...formData, instance_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                    required
                  >
                    {INSTANCE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Juridiction compétente */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Juridiction compétente *
                  </label>
                  <input
                    type="text"
                    value={formData.juridiction_competente}
                    onChange={(e) => setFormData({ ...formData, juridiction_competente: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Ex: TGI Paris"
                    required
                  />
                </div>

                {/* Numéro RG */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    N° RG
                  </label>
                  <input
                    type="text"
                    value={formData.numero_rg}
                    onChange={(e) => setFormData({ ...formData, numero_rg: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Ex: 21/12345"
                  />
                </div>

                {/* Date introduction */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date d'introduction
                  </label>
                  <input
                    type="date"
                    value={formData.date_introduction}
                    onChange={(e) => setFormData({ ...formData, date_introduction: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>

                {/* Date jugement */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date de jugement
                  </label>
                  <input
                    type="date"
                    value={formData.date_jugement}
                    onChange={(e) => setFormData({ ...formData, date_jugement: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>

                {/* État du dossier */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    État du dossier *
                  </label>
                  <input
                    type="text"
                    value={formData.etat_du_dossier}
                    onChange={(e) => setFormData({ ...formData, etat_du_dossier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Ex: En cours d'instruction"
                    required
                  />
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                    required
                  >
                    {INSTANCE_STATUTS.map(statut => (
                      <option key={statut.value} value={statut.value}>{statut.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-2 pt-2 mt-2 border-t border-slate-600">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-2">
                  {editingInstance ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-slate-600 py-2">
                  Annuler
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des instances - Cachée si formulaire ouvert */}
      {!showForm && (
        <div className="space-y-3">
          {instances.map((instance) => {
          const typeObj = INSTANCE_TYPES.find(t => t.value === instance.instance_type);
          return (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-2 rounded-lg">
                    <Scale className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{typeObj?.label}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatutBadge(instance.statut)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {instance.juridiction_competente && (
                  <div>
                    <span className="text-slate-400">Juridiction:</span>
                    <p className="text-white">{instance.juridiction_competente}</p>
                  </div>
                )}
                {instance.numero_rg && (
                  <div>
                    <span className="text-slate-400">N° RG:</span>
                    <p className="text-white">{instance.numero_rg}</p>
                  </div>
                )}
                {instance.date_introduction && (
                  <div>
                    <span className="text-slate-400">Introduction:</span>
                    <p className="text-white">{new Date(instance.date_introduction).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {instance.date_jugement && (
                  <div>
                    <span className="text-slate-400">Jugement:</span>
                    <p className="text-white">{new Date(instance.date_jugement).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(instance)}
                >
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(instance.id)}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          );
          })}

          {instances.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune instance enregistrée</p>
            </div>
          )}
        </div>
      )}
      </motion.div>
    </motion.div>
  );
};

export default InstanceManager;
