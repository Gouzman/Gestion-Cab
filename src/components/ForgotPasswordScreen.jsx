/**
 * ============================================
 * Composant : ForgotPasswordScreen
 * ============================================
 * Écran de récupération de mot de passe via phrase secrète
 * - Pas d'envoi d'email
 * - Workflow : identifiant → question secrète → réponse → nouveau mot de passe
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Scale, User, HelpCircle, Lock, Key, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/InternalAuthContext';
import { useCompanyInfo } from '@/lib/appSettings';

const ForgotPasswordScreen = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Identifiant, 2: Réponse, 3: Nouveau mot de passe
  const [identifier, setIdentifier] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { getSecretQuestion, resetPasswordWithSecretPhrase } = useAuth();
  const { companyInfo } = useCompanyInfo();

  // Étape 1 : Récupérer la question secrète
  const handleGetQuestion = async (e) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast({
        variant: "destructive",
        title: "Champ requis",
        description: "Veuillez saisir votre identifiant",
      });
      return;
    }

    setLoading(true);

    const { error, question } = await getSecretQuestion(identifier.trim());

    setLoading(false);

    if (error) {
      return; // Le toast est déjà affiché par getSecretQuestion
    }

    setSecretQuestion(question);
    setStep(2);
  };

  // Étape 2 : Vérifier la réponse et définir le nouveau mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!secretAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Réponse requise",
        description: "Veuillez saisir votre réponse",
      });
      return;
    }

    if (newPassword.length < 12) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 12 caractères",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    setLoading(true);

    const { error } = await resetPasswordWithSecretPhrase(
      identifier,
      secretAnswer.trim(),
      newPassword
    );

    setLoading(false);

    if (error) {
      return; // Le toast est déjà affiché
    }

    // Succès : retour à la page de connexion
    toast({
      title: "✅ Mot de passe réinitialisé",
      description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe",
    });

    setTimeout(() => {
      onBack();
    }, 1500);
  };

  const handleBackToIdentifier = () => {
    setStep(1);
    setSecretQuestion('');
    setSecretAnswer('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg mb-4">
              <Scale className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-slate-400 text-center mt-2">
            {step === 1 
              ? "Saisissez votre identifiant pour commencer" 
              : "Répondez à votre question secrète"
            }
          </p>
        </div>

        {/* Étape 1 : Identifiant */}
        {step === 1 && (
          <form onSubmit={handleGetQuestion} className="space-y-6">
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Email ou matricule"
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
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Vérification...' : 'Continuer'}
              </Button>
            </div>
          </form>
        )}

        {/* Étape 2 : Question secrète + Nouveau mot de passe */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Affichage de la question secrète */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-200 mb-1">Votre question secrète :</p>
                  <p className="text-white">{secretQuestion}</p>
                </div>
              </div>
            </div>

            {/* Réponse secrète */}
            <div>
              <label htmlFor="secret-answer" className="block text-sm font-medium text-slate-300 mb-2">
                Réponse secrète
              </label>
              <input
                id="secret-answer"
                type="text"
                value={secretAnswer}
                onChange={(e) => setSecretAnswer(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Votre réponse"
              />
              <p className="mt-1 text-xs text-slate-500">La réponse n'est pas sensible à la casse</p>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Minimum 12 caractères"
                />
              </div>
            </div>

            {/* Confirmation du mot de passe */}
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
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirmez votre mot de passe"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-xs text-red-400">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleBackToIdentifier}
                disabled={loading}
                className="flex-1 h-12 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={loading || !secretAnswer.trim() || !newPassword || newPassword !== confirmPassword}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'En cours...' : 'Réinitialiser'}
              </Button>
            </div>
          </form>
        )}

        {/* Note de sécurité */}
        <div className="mt-6 text-center text-xs text-slate-600">
          🔒 Récupération sécurisée sans email
        </div>
      </motion.div>
    </div>
  );
};

ForgotPasswordScreen.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default ForgotPasswordScreen;
