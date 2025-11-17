import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Shield, Check, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const PasswordResetManager = ({ currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement demandes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les demandes de réinitialisation."
      });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId, userEmail) => {
    try {
      // 1. Marquer la demande comme approuvée
      const { error: updateError } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 2. Réinitialiser password_set à false pour forcer la création d'un nouveau mot de passe
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ password_set: false })
        .eq('email', userEmail);

      if (profileError) throw profileError;

      toast({
        title: "✅ Demande approuvée",
        description: `L'utilisateur ${userEmail} pourra définir un nouveau mot de passe lors de sa prochaine connexion.`
      });

      fetchRequests();
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'approuver la demande."
      });
    }
  };

  const handleReject = async (requestId) => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "❌ Demande rejetée",
        description: "La demande a été rejetée."
      });

      fetchRequests();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rejeter la demande."
      });
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
          {pendingRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h4 className="text-lg font-semibold text-white">{request.email}</h4>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Demandé le {new Date(request.requested_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(request.id, request.email)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
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

PasswordResetManager.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  })
};

export default PasswordResetManager;
