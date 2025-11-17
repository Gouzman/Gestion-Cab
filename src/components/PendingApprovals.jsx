import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import DeleteUserModal from '@/components/DeleteUserModal';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, function, role, created_at')
        .eq('admin_approved', false)
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs en attente:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les utilisateurs en attente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "✅ Utilisateur approuvé",
        description: `${userName} peut maintenant se connecter.`
      });

      fetchPendingUsers();
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'approuver cet utilisateur."
      });
    }
  };

  const handleReject = (userId, userName) => {
    // Trouver l'utilisateur
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;

    // Ouvrir le modal de suppression
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async (userId) => {
    try {
      // Utiliser la fonction RPC pour supprimer complètement l'utilisateur
      const { data: result, error: rpcError } = await supabase
        .rpc('delete_user_account', {
          user_id: userId
        });

      if (rpcError) throw rpcError;

      if (!result?.success) {
        throw new Error(result?.error || "Erreur lors de la suppression");
      }

      toast({
        title: "❌ Utilisateur rejeté",
        description: "L'utilisateur a été supprimé complètement."
      });

      fetchPendingUsers();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rejeter cet utilisateur."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return null; // Ne rien afficher si pas d'utilisateurs en attente
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 p-3 rounded-lg backdrop-blur-sm">
          <Clock className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Validations en attente
          </h3>
          <p className="text-sm text-slate-400">
            {pendingUsers.length} {pendingUsers.length > 1 ? 'utilisateurs' : 'utilisateur'} à approuver
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 border border-orange-500/30 rounded-lg p-4 backdrop-blur-sm hover:border-orange-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-full p-2.5 shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{user.name}</h4>
                  <p className="text-sm text-slate-300 truncate">{user.email}</p>
                  <p className="text-sm text-slate-400">{user.function}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Créé le {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                  onClick={() => handleApprove(user.id, user.name)}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approuver
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-lg"
                  onClick={() => handleReject(user.id, user.name)}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Rejeter
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
        onConfirmDelete={confirmDeleteUser}
      />
    </div>
  );
};

export default PendingApprovals;
