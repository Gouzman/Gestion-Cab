/**
 * ============================================
 * Composant : FirstLoginScreen
 * ============================================
 * Écran de première connexion où l'utilisateur doit :
 * 1. Définir son mot de passe personnel
 * 2. Configurer sa phrase secrète (question/réponse)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Lock, Key, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/InternalAuthContext';
import { useCompanyInfo } from '@/lib/appSettings';

const FirstLoginScreen = () => {
  const { user, setPersonalCredentials, signOut } = useAuth();
  const [step, setStep] = useState(1); // 1: Mot de passe, 2: Phrase secrète
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { companyInfo } = useCompanyInfo();

  // Validation du mot de passe
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 12) {
      errors.push("Minimum 12 caractères");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Au moins 1 majuscule");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Au moins 1 minuscule");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Au moins 1 chiffre");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Au moins 1 caractère spécial");
    }
    return errors;
  };

  const passwordErrors = validatePassword(newPassword);
  const isPasswordValid = passwordErrors.length === 0 && newPassword === confirmPassword;

  // Étape 1 : Définir le mot de passe
  const handlePasswordNext = (e) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        variant: "destructive",
        title: "❌ Mot de passe invalide",
        description: passwordErrors.length > 0 
          ? passwordErrors.join(", ") 
          : "Les mots de passe ne correspondent pas",
      });
      return;
    }

    setStep(2);
  };

  // Étape 2 : Définir la phrase secrète et finaliser
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    if (!secretQuestion.trim() || !secretAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "❌ Phrase secrète incomplète",
        description: "Veuillez remplir la question et la réponse",
      });
      return;
    }

    if (secretAnswer.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "❌ Réponse trop courte",
        description: "La réponse doit contenir au moins 3 caractères",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await setPersonalCredentials(
        user.email,
        newPassword,
        secretQuestion.trim(),
        secretAnswer.trim()
      );

      if (error) {
        setLoading(false);
        return;
      }

      // La connexion automatique est gérée dans setPersonalCredentials
      // L'utilisateur sera redirigé vers le dashboard par App.jsx

    } catch (error) {
      console.error("Erreur handleFinalSubmit:", error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur inattendue s'est produite",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-lg bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {companyInfo?.logo_url ? (
            <div className="mb-4 bg-white/10 p-3 rounded-lg">
              <img src={companyInfo.logo_url} alt="Logo" className="h-16 object-contain rounded-lg" />
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg mb-4">
              <Scale className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Première connexion</h1>
          <p className="text-slate-400 text-center mt-2">
            {step === 1 
              ? "Définissez votre mot de passe personnel" 
              : "Configurez votre phrase secrète de récupération"
            }
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-green-400' : 'text-slate-500'}`}>
            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-xs">1</div>}
            <span className="text-sm font-medium">Mot de passe</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-600"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-xs">2</div>
            <span className="text-sm font-medium">Phrase secrète</span>
          </div>
        </div>

        {/* Étape 1 : Mot de passe */}
        {step === 1 && (
          <form onSubmit={handlePasswordNext} className="space-y-6">
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Créez un mot de passe sécurisé"
                />
              </div>
              
              {/* Indicateurs de validation */}
              {newPassword && (
                <div className="mt-3 space-y-1">
                  {['Minimum 12 caractères', 'Au moins 1 majuscule', 'Au moins 1 minuscule', 'Au moins 1 chiffre', 'Au moins 1 caractère spécial'].map((requirement, index) => {
                    const isValid = passwordErrors.indexOf(requirement) === -1;
                    return (
                      <div key={index} className={`flex items-center gap-2 text-xs ${isValid ? 'text-green-400' : 'text-slate-500'}`}>
                        {isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{requirement}</span>
                      </div>
                    );
                  })}
                </div>
              )}
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
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-xs text-red-400">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={signOut}
                className="flex-1 h-12 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isPasswordValid}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </Button>
            </div>
          </form>
        )}

        {/* Étape 2 : Phrase secrète */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Pourquoi une phrase secrète ?</p>
                  <p className="text-blue-300">
                    Elle vous permettra de réinitialiser votre mot de passe si vous l'oubliez, sans avoir besoin d'un email.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="secret-question" className="block text-sm font-medium text-slate-300 mb-2">
                Question secrète
              </label>
              <input
                id="secret-question"
                type="text"
                value={secretQuestion}
                onChange={(e) => setSecretQuestion(e.target.value)}
                required
                maxLength={200}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Quel est le nom de votre premier animal ?"
              />
              <p className="mt-1 text-xs text-slate-500">Choisissez une question dont vous vous souviendrez</p>
            </div>

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
                maxLength={100}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre réponse (minimum 3 caractères)"
              />
              <p className="mt-1 text-xs text-slate-500">La réponse n'est pas sensible à la casse</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 h-12 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={loading || !secretQuestion.trim() || !secretAnswer.trim()}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'En cours...' : 'Valider'}
              </Button>
            </div>
          </form>
        )}

        {/* Note de sécurité */}
        <div className="mt-6 text-center text-xs text-slate-600">
          🔒 Vos informations sont chiffrées et sécurisées
        </div>
      </motion.div>
    </div>
  );
};

export default FirstLoginScreen;
