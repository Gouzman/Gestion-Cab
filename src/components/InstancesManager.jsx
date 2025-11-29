import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Scale, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Composant pour gérer les instances juridiques d'un dossier
 * Permet d'ajouter, modifier et supprimer des procédures (Tribunal, Appel, Cassation)
 */
const InstancesManager = ({ caseId, currentUser }) => {
  const [instances, setInstances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [formData, setFormData] = useState({
    instance_type: 'Tribunal',
    juridiction_competente: '',
    etat_du_dossier: '',
    date_ouverture: '',
    date_cloture: '',
    numero_rg: '',
    observations: ''
  });

  useEffect(() => {
    if (caseId) {
      fetchInstances();
    }
  }, [caseId]);

  const fetchInstances = async () => {
    const { data, error } = await supabase
      .from('dossier_instance')
      .select('*')
      .eq('case_id', caseId)
      .order('date_ouverture', { ascending: false });

    if (error) {
      console.error('Erreur chargement instances:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les instances.'
      });
    } else {
      setInstances(data || []);
    }
  };

  const resetForm = () => {
    setFormData({
      instance_type: 'Tribunal',
      juridiction_competente: '',
      etat_du_dossier: '',
      date_ouverture: '',
      date_cloture: '',
      numero_rg: '',
      observations: ''
    });
    setEditingInstance(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.juridiction_competente || !formData.etat_du_dossier || !formData.date_ouverture) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }

    const payload = {
      case_id: caseId,
      instance_type: formData.instance_type,
      juridiction_competente: formData.juridiction_competente,
      etat_du_dossier: formData.etat_du_dossier,
      date_ouverture: formData.date_ouverture,
      date_cloture: formData.date_cloture || null,
      numero_rg: formData.numero_rg || null,
      observations: formData.observations || null,
      created_by: currentUser?.id
    };

    if (editingInstance) {
      // Modification
      const { error } = await supabase
        .from('dossier_instance')
        .update(payload)
        .eq('id', editingInstance.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de modifier l\'instance.'
        });
      } else {
        toast({
          title: '✅ Instance modifiée',
          description: 'L\'instance a été mise à jour avec succès.'
        });
        fetchInstances();
        resetForm();
      }
    } else {
      // Création
      const { error } = await supabase
        .from('dossier_instance')
        .insert([payload]);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de créer l\'instance.'
        });
      } else {
        toast({
          title: '✅ Instance créée',
          description: 'L\'instance a été ajoutée avec succès.'
        });
        fetchInstances();
        resetForm();
      }
    }
  };

  const handleEdit = (instance) => {
    setFormData({
      instance_type: instance.instance_type,
      juridiction_competente: instance.juridiction_competente,
      etat_du_dossier: instance.etat_du_dossier,
      date_ouverture: instance.date_ouverture,
      date_cloture: instance.date_cloture || '',
      numero_rg: instance.numero_rg || '',
      observations: instance.observations || ''
    });
    setEditingInstance(instance);
    setShowForm(true);
  };

  const handleDelete = async (instanceId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette instance ?')) return;

    const { error } = await supabase
      .from('dossier_instance')
      .delete()
      .eq('id', instanceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'instance.'
      });
    } else {
      toast({
        title: '🗑️ Instance supprimée',
        description: 'L\'instance a été supprimée avec succès.'
      });
      fetchInstances();
    }
  };

  const getInstanceIcon = (type) => {
    switch (type) {
      case 'Tribunal':
        return <Scale className="w-5 h-5 text-blue-400" />;
      case 'Appel':
        return <Scale className="w-5 h-5 text-amber-400" />;
      case 'Cassation':
        return <Scale className="w-5 h-5 text-red-400" />;
      default:
        return <Scale className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-400" />
          Instances et Procédures
        </h3>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter une instance
          </Button>
        )}
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type d'instance */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type d'instance *
                  </label>
                  <select
                    name="instance_type"
                    value={formData.instance_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Tribunal">Tribunal</option>
                    <option value="Appel">Appel</option>
                    <option value="Cassation">Cassation</option>
                  </select>
                </div>

                {/* Juridiction compétente */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Juridiction compétente *
                  </label>
                  <input
                    type="text"
                    name="juridiction_competente"
                    value={formData.juridiction_competente}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Tribunal de Grande Instance d'Abidjan"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* État du dossier */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    État du dossier *
                  </label>
                  <input
                    type="text"
                    name="etat_du_dossier"
                    value={formData.etat_du_dossier}
                    onChange={handleChange}
                    required
                    placeholder="Ex: En cours d'instruction"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Numéro RG */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Numéro RG
                  </label>
                  <input
                    type="text"
                    name="numero_rg"
                    value={formData.numero_rg}
                    onChange={handleChange}
                    placeholder="Ex: RG 2025/001"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date d'ouverture */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date d'ouverture *
                  </label>
                  <input
                    type="date"
                    name="date_ouverture"
                    value={formData.date_ouverture}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date de clôture */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de clôture
                  </label>
                  <input
                    type="date"
                    name="date_cloture"
                    value={formData.date_cloture}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observations
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notes et observations..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingInstance ? 'Mettre à jour' : 'Ajouter'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des instances */}
      <div className="space-y-3">
        {instances.length === 0 && !showForm && (
          <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Aucune instance enregistrée</p>
            <p className="text-sm text-slate-500">Cliquez sur "Ajouter une instance" pour commencer</p>
          </div>
        )}

        {instances.map((instance, index) => (
          <motion.div
            key={instance.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getInstanceIcon(instance.instance_type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {instance.instance_type}
                    </h4>
                    {instance.numero_rg && (
                      <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full">
                        {instance.numero_rg}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Juridiction :</span>
                      <span>{instance.juridiction_competente}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">État :</span>
                      <span>{instance.etat_du_dossier}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Ouverture :</span>
                      <span>{formatDate(instance.date_ouverture)}</span>
                      {instance.date_cloture && (
                        <>
                          <span className="mx-2">→</span>
                          <span className="font-medium">Clôture :</span>
                          <span>{formatDate(instance.date_cloture)}</span>
                        </>
                      )}
                    </div>

                    {instance.observations && (
                      <div className="mt-2 p-2 bg-slate-700/30 rounded text-slate-400 italic">
                        {instance.observations}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(instance)}
                  className="text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(instance.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InstancesManager;
