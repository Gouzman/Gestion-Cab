import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LoginScreen from '@/components/LoginScreen';
import SessionExpiryModal from '@/components/SessionExpiryModal';
import PdfServiceAlert from '@/components/PdfServiceAlert';
import { useAuth } from '@/contexts/InternalAuthContext';
import { initializeAppInfrastructure } from '@/lib/initializeApp';
import useAutoLogout from '@/hooks/useAutoLogout';
import { Loader2 } from 'lucide-react';

// Lazy loading des modules lourds
const TaskManager = lazy(() => import('@/components/TaskManager'));
const ClientManager = lazy(() => import('@/components/ClientManager'));
const CaseManager = lazy(() => import('@/components/CaseManager'));
const Calendar = lazy(() => import('@/components/Calendar'));
const Reports = lazy(() => import('@/components/Reports'));
const TeamManager = lazy(() => import('@/components/TeamManager'));
const DocumentManager = lazy(() => import('@/components/DocumentManager'));
const Settings = lazy(() => import('@/components/Settings'));
const BillingManager = lazy(() => import('@/components/BillingManager'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Chargement du module...</p>
    </div>
  </div>
);

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [infrastructureReady, setInfrastructureReady] = useState(false);
  const { user, loading, signOut, mustChangePassword } = useAuth();
  const { toast } = useToast();

  const autoLogoutMinutes = parseInt(localStorage.getItem('app_auto_logout_minutes') || '15');
  const { showWarning, remainingSeconds, extendSession, forceLogout } = useAutoLogout(
    user ? signOut : null,
    autoLogoutMinutes
  );

  // Initialisation de l’infrastructure
  useEffect(() => {
    const init = async () => {
      if (user && !loading && !infrastructureReady) {
        try {
          await initializeAppInfrastructure();
        } finally {
          setInfrastructureReady(true);
        }
      }
    };

    if (user && !loading) init();
    else if (!user) setInfrastructureReady(false);
  }, [user, loading, infrastructureReady]);

  const handleLogout = async () => {
    await signOut();
    setActiveView('dashboard');
  };

  const renderActiveView = () => {
    const content = (() => {
      switch (activeView) {
        case 'dashboard': return <Dashboard currentUser={user} setActiveView={setActiveView} />;
        case 'tasks': return <TaskManager currentUser={user} />;
        case 'clients': return <ClientManager currentUser={user} />;
        case 'cases': return <CaseManager currentUser={user} />;
        case 'calendar': return <Calendar currentUser={user} />;
        case 'team': return <TeamManager currentUser={user} />;
        case 'reports': return <Reports currentUser={user} />;
        case 'documents': return <DocumentManager currentUser={user} />;
        case 'billing': return <BillingManager currentUser={user} />;
        case 'settings': return <Settings currentUser={user} />;
        default: return <Dashboard currentUser={user} setActiveView={setActiveView} />;
      }
    })();

    return activeView === 'dashboard'
      ? content
      : <Suspense fallback={<LoadingFallback />}>{content}</Suspense>;
  };

  // États de chargement
  if (loading || (user && !infrastructureReady)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          {user && !infrastructureReady && (
            <p className="text-white/70 text-sm">Initialisation de l'infrastructure...</p>
          )}
        </div>
      </div>
    );
  }

  // Non connecté
  if (!user) return <LoginScreen />;

  // Première connexion → changer mot de passe
  if (mustChangePassword) {
    const FirstLoginScreen = lazy(() => import('@/components/FirstLoginScreen'));
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
      }>
        <FirstLoginScreen />
      </Suspense>
    );
  }

  // Interface principale
  return (
    <HelmetProvider>
      <Helmet>
        <title>LEGALSUITE - Gestion de Cabinet Juridique</title>
      </Helmet>

        <PdfServiceAlert />

        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 print:bg-white">
          <div className="flex">
            <Sidebar activeView={activeView} setActiveView={setActiveView} currentUser={user} onLogout={handleLogout} />
            <main className="flex-1 ml-64 print:ml-0">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 print:p-0"
              >
                {renderActiveView()}
              </motion.div>
            </main>
          </div>

          <Toaster />

          <SessionExpiryModal
            isOpen={showWarning && !!user}
            remainingSeconds={remainingSeconds}
            onExtend={extendSession}
            onLogout={forceLogout}
          />
        </div>
      </HelmetProvider>
  );
}

export default App;
