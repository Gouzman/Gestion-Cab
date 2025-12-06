/**
 * ============================================
 * Composant : ForgotPasswordScreen (REFACTORISÉ)
 * ============================================
 * Écran de récupération de mot de passe via phrase secrète
 * - 3 tentatives maximum pour répondre
 * - Après 3 échecs → demande de réinitialisation admin
 * - Workflow : identifiant → question secrète → 3 tentatives → demande admin
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, User, HelpCircle, Lock, AlertTriangle, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/InternalAuthContext';
import { useCompanyInfo } from '@/lib/appSettings';

const ForgotPasswordScreen = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: Identifiant, 2: Réponse (3 tentatives), 3: Nouveau mot de passe, 4: Demande envoyée
  const [identifier, setIdentifier] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  
  const { toast } = useToast();
  const { getSecretQuestion, verifySecretAnswer, resetPasswordWithSecretPhrase, createResetRequest } = useAuth();
  const { companyInfo } = useCompanyInfo();

  const MAX_ATTEMPTS = 3;

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

    const { error, question, userEmail: email } = await getSecretQuestion(identifier.trim());

    setLoading(false);

    if (error) {
      return; // Le toast est déjà affiché par getSecretQuestion
    }

    setSecretQuestion(question);
    setUserEmail(email);
    setStep(2);
  };

  // Étape 2 : Vérifier la réponse secrète (3 tentatives max)
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    
    if (!secretAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Réponse requise",
        description: "Veuillez saisir votre réponse",
      });
      return;
    }

    setLoading(true);

    const { success, error } = await verifySecretAnswer(identifier.trim(), secretAnswer.trim());

    setLoading(false);

    if (success) {
      // ✅ Réponse correcte : Passer à l'étape de définition du nouveau mot de passe
      toast({
        title: "✅ Réponse correcte !",
        description: "Vous pouvez maintenant définir un nouveau mot de passe.",
        duration: 5000,
      });

      setStep(3); // Passer à l'étape de saisie du nouveau mot de passe
      return;
    }

    // ❌ Réponse incorrecte
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSecretAnswer('');

    if (newAttempts >= MAX_ATTEMPTS) {
      // Maximum de tentatives atteint
      toast({
        variant: "destructive",
        title: "❌ Tentatives épuisées",
        description: "Vous avez épuisé vos 3 tentatives. Vous pouvez demander une réinitialisation à un administrateur.",
        duration: 8000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Réponse incorrecte",
        description: `Il vous reste ${MAX_ATTEMPTS - newAttempts} tentative(s)`,
        duration: 5000,
      });
    }
  };

  // Étape 3 : Définir le nouveau mot de passe (après réponse correcte)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
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
      identifier.trim(),
      secretAnswer.trim(),
      newPassword
    );

    setLoading(false);

    if (!error) {
      // Succès : retour à la page de connexion
      setTimeout(() => {
        onBack();
      }, 2000);
    }
  };

  // Envoyer une demande de réinitialisation après 3 échecs
  const handleRequestReset = async () => {
    setLoading(true);

    console.log('📤 [ForgotPassword] Envoi demande de réinitialisation pour:', identifier.trim());
    
    const { error, alreadyPending, requestId } = await createResetRequest(identifier.trim());

    console.log('📥 [ForgotPassword] Résultat création demande:', { error, alreadyPending, requestId });

    setLoading(false);

    if (!error) {
      setRequestSent(true);
      setStep(4); // Étape 4 : demande envoyée
    }
  };

  const handleBackToIdentifier = () => {
    setStep(1);
    setSecretQuestion('');
    setSecretAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setAttempts(0);
    setUserEmail('');
    setRequestSent(false);
  };

  const handleBackToLogin = () => {
    onBack();
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

        {/* Étape 2 : Question secrète + 3 tentatives */}
        {step === 2 && (
          <form onSubmit={handleVerifyAnswer} className="space-y-6">
            {/* Affichage de la question secrète */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-200 mb-1">Votre question secrète :</p>
                  <p className="text-white">{secretQuestion}</p>
                </div>
              </div>
            </div>

            {/* Compteur de tentatives */}
            <AnimatePresence>
              {attempts > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-200">
                        Tentative {attempts}/{MAX_ATTEMPTS}
                      </p>
                      <p className="text-xs text-red-300 mt-1">
                        {MAX_ATTEMPTS - attempts === 0 
                          ? "Tentatives épuisées. Demandez une réinitialisation."
                          : `Il vous reste ${MAX_ATTEMPTS - attempts} tentative(s)`
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Réponse secrète */}
            {attempts < MAX_ATTEMPTS && (
              <div>
                <label htmlFor="secret-answer" className="block text-sm font-medium text-slate-300 mb-2">
                  Réponse secrète
                </label>
                <input
                  id="secret-answer"
                  type="text"
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  required={attempts < MAX_ATTEMPTS}
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  placeholder="Votre réponse (non sensible à la casse)"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleBackToIdentifier}
                disabled={loading}
                className="flex-1 h-12 bg-slate-600 hover:bg-slate-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              
              {attempts < MAX_ATTEMPTS ? (
                <Button
                  type="submit"
                  disabled={loading || !secretAnswer.trim()}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Vérification...' : 'Vérifier'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleRequestReset}
                  disabled={loading}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Envoi...' : 'Demander réinitialisation'}
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Étape 3 : Nouveau mot de passe (après réponse correcte) */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-200">Réponse correcte !</p>
                  <p className="text-xs text-green-300 mt-1">Vous pouvez maintenant définir un nouveau mot de passe</p>
                </div>
              </div>
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
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Minimum 12 caractères"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Utilisez au moins 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux
              </p>
            </div>

            {/* Confirmation du mot de passe */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
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
                <ArrowLeft className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser'}
              </Button>
            </div>
          </form>
        )}

        {/* Étape 4 : Demande envoyée (après 3 échecs) */}
        {step === 4 && (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </motion.div>

            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white">Demande envoyée ✅</h2>
              <p className="text-slate-300">
                Votre demande de réinitialisation a été transmise aux administrateurs.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-200">
                  <strong>Email :</strong> {userEmail}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Un administrateur examinera votre demande. 
                  Vous pourrez définir un nouveau mot de passe après approbation.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
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
