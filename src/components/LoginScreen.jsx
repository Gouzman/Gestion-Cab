import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCompanyInfo } from '@/lib/appSettings';
import SetPasswordScreen from '@/components/SetPasswordScreen';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [currentStep, setCurrentStep] = useState('email'); // 'email', 'password', 'setPassword'
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { toast } = useToast();
  const { signIn, checkFirstLogin, resetPassword } = useAuth();
  const { companyInfo } = useCompanyInfo();

  const handleEmailNext = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const { isFirstLogin, error, userNotFound, pendingApproval, technicalError, isReset: resetRequested } = await checkFirstLogin(email);
      
      if (userNotFound) {
        // L'utilisateur n'existe pas dans la base
        toast({
          variant: "destructive",
          title: "❌ Email introuvable",
          description: "Cet email n'existe pas dans le système.",
        });
        setLoading(false);
        return;
      }

      if (pendingApproval) {
        // Compte en attente de validation admin
        toast({
          title: "⏳ Validation en attente",
          description: "Votre compte est en attente de validation par l'administrateur.",
          duration: 5000,
        });
        setLoading(false);
        return;
      }
      
      if (technicalError) {
        // Erreur technique : on affiche l'erreur et on arrête
        toast({
          variant: "destructive",
          title: "❌ Erreur technique",
          description: error?.message || "Impossible de vérifier votre compte. Réessayez plus tard.",
        });
        setLoading(false);
        return;
      }
      
      if (isFirstLogin) {
        // Première connexion OU reset approuvé : redirection vers création de mot de passe
        console.log(resetRequested ? "Reset approuvé pour:" : "Première connexion détectée pour:", email);
        setIsReset(!!resetRequested);
        setShowSetPassword(true);
      } else {
        // Connexion normale : l'utilisateur a déjà un mot de passe
        setCurrentStep('password');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setShowSetPassword(false);
    setIsReset(false);
    setPassword('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    
    setLoading(true);
    await resetPassword(resetEmail);
    setLoading(false);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  // Si on doit afficher la page de définition de mot de passe
  if (showSetPassword) {
    return <SetPasswordScreen email={email} onBack={handleBackToEmail} isReset={isReset} />;
  }

  // Si on doit afficher le formulaire de mot de passe oublié
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
        >
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
          <h1 className="text-3xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-slate-400 text-center mt-2">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre.email@exemple.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !resetEmail}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
              }}
              className="w-full text-center text-slate-400 hover:text-white transition-colors text-sm"
            >
              Retour à la connexion
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
      >
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
          <p className="text-slate-400">
            {currentStep === 'email' ? 'Saisissez votre adresse email' : 'Connectez-vous à votre espace'}
          </p>
        </div>

        {currentStep === 'email' ? (
          <form onSubmit={handleEmailNext} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre.email@exemple.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {loading ? 'Vérification...' : 'Continuer'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email-display" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="email-display"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-slate-600/50 border border-slate-600 rounded-lg text-slate-300 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Modifier
                </button>
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Connexion
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
                className="text-sm text-slate-400 hover:text-blue-400 transition-colors underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
export default LoginScreen;