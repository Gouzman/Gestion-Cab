import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Plus, X, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Composant pour gérer les avis juridiques annuels des clients conventionnés
 * Point 80 : Chemise à sangle annuelle pour consultations
 */
const AvisJuridiquesManager = ({ clientId, onClose }) => {
  const [avisAnnuels, setAvisAnnuels] = useState([]);
  const [consultations, setConsultations] = useState({});
  const [expandedYear, setExpandedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchAvisAnnuels();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, client_code, name, is_conventionne')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Erreur chargement client:', error);
    }
  };

  const fetchAvisAnnuels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('avis_juridiques_annuels')
        .select('*')
        .eq('client_id', clientId)
        .order('annee', { ascending: false });

      if (error) throw error;
      setAvisAnnuels(data || []);

      // Charger les consultations pour chaque année
      for (const avis of data || []) {
        await fetchConsultations(avis.id, avis.annee);
      }
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les avis juridiques'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async (avisId, annee) => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, code_dossier, title, objet_du_dossier, created_at')
        .eq('avis_annuel_id', avisId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(prev => ({ ...prev, [annee]: data || [] }));
    } catch (error) {
      console.error('Erreur chargement consultations:', error);
    }
  };

  const handleCreerAvisAnnuel = async (annee) => {
    try {
      const nomChemise = `Avis juridiques ${annee} - ${client?.name || 'Client'} (${client?.client_code || ''})`;

      const { error } = await supabase
        .from('avis_juridiques_annuels')
        .insert([{
          client_id: clientId,
          annee: annee,
          nom_chemise: nomChemise
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Chemise créée',
        description: `Chemise d'avis ${annee} créée avec succès`
      });

      fetchAvisAnnuels();
    } catch (error) {
      console.error('Erreur création avis annuel:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la chemise d\'avis'
      });
    }
  };

  const toggleYear = (annee) => {
    setExpandedYear(expandedYear === annee ? null : annee);
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

  if (!client?.is_conventionne) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <FileCheck className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Client non conventionné
            </h3>
            <p className="text-slate-400 mb-6">
              Cette fonctionnalité est réservée aux clients conventionnés.
            </p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const anneeActuelle = new Date().getFullYear();
  const anneesDisponibles = [anneeActuelle, anneeActuelle - 1, anneeActuelle - 2];
  const anneesExistantes = new Set(avisAnnuels.map(a => a.annee));

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
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-green-400" />
              Avis juridiques annuels
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {client?.name} ({client?.client_code})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Boutons création années */}
        <div className="mb-6 flex gap-2">
          {anneesDisponibles.map((annee) => (
            !anneesExistantes.has(annee) && (
              <Button
                key={annee}
                onClick={() => handleCreerAvisAnnuel(annee)}
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer chemise {annee}
              </Button>
            )
          ))}
        </div>

        {/* Liste des chemises annuelles */}
        <div className="space-y-4">
          {avisAnnuels.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Aucune chemise d'avis juridiques</p>
              <p className="text-sm mt-2">
                Créez une chemise pour l'année en cours
              </p>
            </div>
          )}

          {avisAnnuels.map((avis) => {
            const isExpanded = expandedYear === avis.annee;
            const consultationsAnnee = consultations[avis.annee] || [];

            return (
              <div
                key={avis.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
              >
                {/* En-tête chemise */}
                <button
                  type="button"
                  onClick={() => toggleYear(avis.annee)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-green-400" />
                    <div>
                      <h4 className="text-white font-semibold">{avis.nom_chemise}</h4>
                      <p className="text-sm text-slate-400">
                        {avis.nombre_consultations || 0} consultation(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                      {avis.annee}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Consultations */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700 p-4 bg-slate-900/30"
                    >
                      {consultationsAnnee.length > 0 ? (
                        <div className="space-y-2">
                          {consultationsAnnee.map((consultation) => (
                            <div
                              key={consultation.id}
                              className="flex items-start gap-3 bg-slate-800/50 rounded p-3"
                            >
                              <FileText className="w-4 h-4 text-slate-400 mt-1" />
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                  {consultation.code_dossier} - {consultation.title}
                                </p>
                                {consultation.objet_du_dossier && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {consultation.objet_du_dossier}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                          Aucune consultation pour cette année
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

AvisJuridiquesManager.propTypes = {
  clientId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AvisJuridiquesManager;
