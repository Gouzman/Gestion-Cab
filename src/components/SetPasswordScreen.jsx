import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Scale, Lock, Key, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SetPasswordScreen = ({ email, onBack, isReset = false }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setFirstPassword } = useAuth();

  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "❌ Mot de passe trop court",
        description: "Votre mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "❌ Mots de passe différents",
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await setFirstPassword(email, password, isReset);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: error.message || "Impossible de définir le mot de passe.",
        });
      } else {
        toast({
          title: "✅ Mot de passe défini !",
          description: "Connexion en cours...",
        });
        // Le contexte d'auth va gérer automatiquement la redirection
      }
    } catch (error) {
      console.error("Erreur lors de la définition du mot de passe:", error);
      toast({
        variant: "destructive",
        title: "❌ Erreur inattendue",
        description: "Une erreur est survenue lors de la définition du mot de passe.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg mb-4">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isReset ? "Créer un nouveau mot de passe" : "Première connexion"}
          </h1>
          <p className="text-slate-400 text-center">
            {isReset 
              ? "Définissez votre nouveau mot de passe" 
              : "Définissez votre mot de passe pour accéder à votre espace"
            }
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          <div>
            <label htmlFor="email-readonly" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="email-readonly"
                type="email"
                value={email}
                readOnly
                className="w-full pl-12 pr-4 py-3 bg-slate-600/50 border border-slate-600 rounded-lg text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Minimum 8 caractères"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Confirmez votre mot de passe"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 h-12 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Retour
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 text-lg bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              {loading ? "En cours..." : "Valider"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

SetPasswordScreen.propTypes = {
  email: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  isReset: PropTypes.bool
};

export default SetPasswordScreen;