/**
 * ============================================
 * Composant : PasswordResetManager (REFACTORISÉ)
 * ============================================
 * Interface admin pour gérer les demandes de réinitialisation
 * - Affiche toutes les demandes (pending, approved, rejected)
 * - Permet d'approuver ou rejeter les demandes
 * - Utilise les RPC functions du contexte InternalAuth
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Clock, AlertCircle, User, Mail, Award, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/InternalAuthContext';

const PasswordResetManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { toast } = useToast();
  const { approveResetRequest, rejectResetRequest } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    
    console.log('🔍 [PasswordResetManager] Chargement des demandes...');
    
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      console.log('📊 [PasswordResetManager] Résultat:', { data, error });

      if (error) {
        // Table n'existe pas
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('⚠️ [PasswordResetManager] Table password_reset_requests non disponible');
          toast({
            title: "⚠️ Configuration requise",
            description: "Le système de réinitialisation n'est pas encore configuré. Veuillez exécuter le script SQL.",
            duration: 10000,
          });
        } else {
          console.error('❌ [PasswordResetManager] Erreur chargement demandes:', error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: `Impossible de charger les demandes: ${error.message}`
          });
        }
        setRequests([]);
      } else {
        console.log('✅ [PasswordResetManager] Demandes chargées:', data?.length || 0);
        setRequests(data || []);
        
        // Notification si des demandes en attente
        const pendingCount = data?.filter(r => r.status === 'pending').length || 0;
        if (pendingCount > 0) {
          console.log('⚠️ [PasswordResetManager] Demandes en attente:', pendingCount);
          toast({
            title: "🔔 Nouvelles demandes",
            description: `${pendingCount} demande(s) de réinitialisation en attente`,
            duration: 8000,
          });
        }
      }
    } catch (error) {
      console.error('❌ [PasswordResetManager] Erreur:', error);
      toast({
        variant: "destructive",
        title: "Erreur réseau",
        description: "Impossible de se connecter à la base de données."
      });
      setRequests([]);
    }
    
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);

    const { error } = await approveResetRequest(requestId);

    setProcessingId(null);

    if (!error) {
      fetchRequests();
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);

    const { error } = await rejectResetRequest(requestId);

    setProcessingId(null);

    if (!error) {
      fetchRequests();
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'approved':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-400 mt-4">Chargement des demandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Demandes de Réinitialisation</h2>
          <p className="text-slate-400">Gérez les demandes de réinitialisation de mot de passe</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-semibold">{pendingRequests.length} en attente</span>
        </div>
      </div>

      {/* Demandes en attente */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Demandes en attente
          </h3>
          <AnimatePresence>
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Nom complet */}
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Nom complet</p>
                        <p className="text-lg font-semibold text-white">{request.user_name}</p>
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email</p>
                        <p className="text-white">{request.user_email}</p>
                      </div>
                    </div>
                    
                    {/* Titre/Fonction */}
                    {request.user_title && (
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Titre d'accréditation</p>
                          <p className="text-white">{request.user_title}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Date de demande */}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Date de demande</p>
                        <p className="text-slate-300 text-sm">
                          {new Date(request.requested_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Tentatives échouées */}
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tentatives échouées</p>
                        <p className="text-red-300 text-sm font-semibold">{request.failed_attempts}/3</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 lg:w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    >
                      {processingId === request.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approuver
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      variant="destructive"
                      className="flex-1 lg:w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Demandes traitées */}
      {reviewedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Historique</h3>
          {reviewedRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="text-white font-medium">{request.email}</p>
                    <p className="text-slate-400 text-sm">
                      {getStatusLabel(request.status)} le {new Date(request.reviewed_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Aucune demande</h3>
          <p className="text-slate-500">Il n'y a aucune demande de réinitialisation pour le moment.</p>
        </div>
      )}
    </div>
  );
};

export default PasswordResetManager;
