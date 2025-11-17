import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Users, Eye, EyeOff, Shield, Key, User, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminUserHistory = () => {
  const { user } = useAuth();
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // Vérification des droits : Seuls les Admins peuvent accéder
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUserHistory();
    }
  }, [isAdmin]);

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      // Récupérer les données des utilisateurs depuis Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Erreur Auth: ${authError.message}`);
      }

      // Récupérer les données utilisateurs de notre table profiles
      const { data: customUsers, error: customError } = await supabase
        .from('profiles')
        .select('id, email, name, role, function, created_at, updated_at');

      if (customError) {
        throw new Error(`Erreur données: ${customError.message}`);
      }

      // Combiner les données
      const combinedHistory = customUsers.map(customUser => {
        const authUser = authUsers.users.find(au => au.email === customUser.email);
        
        return {
          id: customUser.id,
          email: customUser.email,
          name: customUser.name || 'Nom non défini',
          role: customUser.role || 'user',
          function: customUser.function || 'Non définie',
          created_at: customUser.created_at,
          updated_at: customUser.updated_at,
          isFirstLogin: false, // Colonne n'existe pas encore
          // Données d'authentification
          auth_id: authUser?.id || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          password_updated_at: authUser?.user_metadata?.password_updated_at || null,
          // Masquer le mot de passe pour le gérant
          password_hash: (() => {
            if (customUser.role === 'gerant' || customUser.function === 'Gerant') {
              return '*** MASQUÉ POUR SÉCURITÉ ***';
            }
            return authUser?.encrypted_password ? 'Mot de passe hashé (bcrypt)' : 'Non défini';
          })(),
          is_password_hashed: Boolean(authUser?.encrypted_password)
        };
      });

      setUserHistory(combinedHistory);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de charger l'historique des comptes: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'gerant': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'avocat': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'secretaire': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Accès Restreint</h1>
        <p className="text-slate-400 mb-2">Seuls les Administrateurs peuvent accéder à l'historique des comptes.</p>
        <p className="text-slate-500 text-sm">
          Votre rôle actuel : {user?.role || 'Non défini'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-slate-300">Chargement de l'historique...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Historique des Comptes</h2>
            <p className="text-slate-400 text-sm">
              Liste complète de tous les utilisateurs et leurs informations de sécurité
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowPasswords(!showPasswords)}
            variant="outline"
            size="sm"
            className="border-slate-600"
          >
            {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPasswords ? 'Masquer mots de passe' : 'Voir mots de passe'}
          </Button>
          
          <Button
            onClick={fetchUserHistory}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <History className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-white">{userHistory.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-slate-400">Administrateurs</p>
              <p className="text-2xl font-bold text-white">
                {userHistory.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <Key className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">Première Connexion</p>
              <p className="text-2xl font-bold text-white">
                0
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Mots de passe hashés</p>
              <p className="text-2xl font-bold text-white">
                {userHistory.filter(u => u.is_password_hashed).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="space-y-4">
        {userHistory.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-slate-400">
              L'historique des comptes est vide.
            </p>
          </div>
        ) : (
          userHistory.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations utilisateur */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-purple-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                        <p className="text-slate-300 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fonction:</span>
                      <span className="text-slate-300">{user.function}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compte créé:</span>
                      <span className="text-slate-300">{formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dernière modification:</span>
                      <span className="text-slate-300">{formatDate(user.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Informations de sécurité */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-5 h-5 text-amber-400" />
                    <h4 className="font-medium text-white">Informations de Sécurité</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dernière connexion:</span>
                      <span className="text-slate-300">{formatDate(user.last_sign_in_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email confirmé:</span>
                      <span className={user.email_confirmed_at ? "text-green-300" : "text-red-300"}>
                        {user.email_confirmed_at ? formatDate(user.email_confirmed_at) : 'Non confirmé'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">MDP mis à jour:</span>
                      <span className="text-slate-300">{formatDate(user.password_updated_at)}</span>
                    </div>
                  </div>

                  {/* Section mot de passe */}
                  <div className="pt-3 border-t border-slate-600/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-slate-400 text-sm">Mot de passe:</span>
                    </div>
                    
                    {showPasswords ? (
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-slate-300 text-sm font-mono break-all">
                          {user.password_hash}
                        </p>
                        {user.is_password_hashed && (
                          <p className="text-amber-400 text-xs mt-1">
                            ⚠️ Mot de passe crypté - Ne peut pas être déchiffré
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-slate-500 text-sm">
                          ••••••••••••••••
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Cliquez sur "Voir mots de passe" pour afficher
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note de sécurité pour le gérant */}
              {(user.role === 'gerant' || user.function === 'Gerant') && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-sm font-medium">
                      Sécurité renforcée : Les informations sensibles du gérant sont masquées
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUserHistory;