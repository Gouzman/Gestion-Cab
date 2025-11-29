/**
 * ============================================
 * Composant : LoginScreen (REFACTORISÉ)
 * ============================================
 * Écran de connexion avec identifiant + mot de passe
 * - Pas de choix de mot de passe lors de la connexion
 * - Redirection vers FirstLoginScreen si must_change_password
 * - Redirection vers ForgotPasswordScreen si mot de passe oublié
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, User, Lock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/InternalAuthContext';
import { useCompanyInfo } from '@/lib/appSettings';
import FirstLoginScreen from '@/components/FirstLoginScreen';
import ForgotPasswordScreen from '@/components/ForgotPasswordScreen';

const LoginScreen = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFirstLogin, setShowFirstLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { toast } = useToast();
  const { signIn } = useAuth();
  const { companyInfo } = useCompanyInfo();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    console.log('🔵 [LOGIN SCREEN] handleLogin déclenché');
    console.log('🔵 [LOGIN SCREEN] Identifiant:', identifier);
    console.log('🔵 [LOGIN SCREEN] Password length:', password?.length);
    
    if (!identifier || !password) {
      console.log('🔴 [LOGIN SCREEN] Champs manquants');
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
      });
      return;
    }
    
    setLoading(true);
    console.log('🔵 [LOGIN SCREEN] Appel signIn...');
    
    try {
      const { error, mustChangePassword } = await signIn(identifier, password);
      
      console.log('🟢 [LOGIN SCREEN] Retour signIn - error:', error);
      console.log('🟢 [LOGIN SCREEN] Retour signIn - mustChangePassword:', mustChangePassword);
      
      if (!error && mustChangePassword) {
        console.log('⚠️ [LOGIN SCREEN] Redirection vers FirstLoginScreen');
        // Redirection vers FirstLoginScreen
        setShowFirstLogin(true);
        setLoading(false);
        return;
      }
      
      if (!error) {
        console.log('✅ [LOGIN SCREEN] Connexion réussie, attente redirection Dashboard');
      }
      
      // Si pas d'erreur et pas de changement requis, la connexion réussit
      // App.jsx gère la redirection vers le dashboard
      
    } catch (error) {
      console.error("🔴 [LOGIN SCREEN] ERREUR CATCH:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      });
    } finally {
      console.log('🔵 [LOGIN SCREEN] setLoading(false)');
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowFirstLogin(false);
    setShowForgotPassword(false);
    setPassword('');
  };

  // Afficher FirstLoginScreen si nécessaire
  if (showFirstLogin) {
    return <FirstLoginScreen identifier={identifier} onBack={handleBackToLogin} />;
  }

  // Afficher ForgotPasswordScreen si nécessaire
  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={handleBackToLogin} />;
  }

  // Formulaire de connexion principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {companyInfo?.logo_url ? (
            <div className="mb-4 bg-white/10 p-3 rounded-lg">
              <img src={companyInfo.logo_url} alt="Logo" className="h-16 object-contain rounded-lg" />
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mb-4">
              <Scale className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">{companyInfo?.name || 'LEGALSUITE'}</h1>
          <p className="text-slate-400">Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-2">
              Identifiant
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email ou matricule"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion en cours...' : 'Connexion'}
          </Button>

          {/* Lien mot de passe oublié */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Mot de passe oublié ?
            </button>
          </div>
        </form>

        {/* Note de sécurité */}
        <div className="mt-6 text-center text-xs text-slate-600">
          🔒 Connexion sécurisée
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;