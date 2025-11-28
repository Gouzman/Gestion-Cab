import React, { useState, useEffect } from 'react';
    import { Helmet, HelmetProvider } from 'react-helmet-async';
    import { motion } from 'framer-motion';
    import { Toaster } from '@/components/ui/toaster';
    import { useToast } from '@/components/ui/use-toast';
    import Sidebar from '@/components/Sidebar';
    import Dashboard from '@/components/Dashboard';
    import TaskManager from '@/components/TaskManager';
    import ClientManager from '@/components/ClientManager';
    import CaseManager from '@/components/CaseManager';
    import Calendar from '@/components/Calendar';
    import Reports from '@/components/Reports';
    import TeamManager from '@/components/TeamManager';
    import LoginScreen from '@/components/LoginScreen';
    import DocumentManager from '@/components/DocumentManager';
    import Settings from '@/components/Settings';
    import BillingManager from '@/components/BillingManager';
    import SessionExpiryModal from '@/components/SessionExpiryModal';
    import PdfServiceAlert from '@/components/PdfServiceAlert';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { initializeAppInfrastructure } from '@/lib/initializeApp';
    import useAutoLogout from '@/hooks/useAutoLogout';
    import { Loader2 } from 'lucide-react';

    function App() {
      const [activeView, setActiveView] = useState('dashboard');
      const [infrastructureReady, setInfrastructureReady] = useState(false);
      const { user, loading, signOut } = useAuth();
      const { toast } = useToast();
      
      // Récupérer le délai configuré
      const autoLogoutMinutes = parseInt(localStorage.getItem('app_auto_logout_minutes') || '15');
      
      // Système d'auto-logout (actif uniquement quand l'utilisateur est connecté)
      const { showWarning, remainingSeconds, extendSession, forceLogout } = useAutoLogout(
        user ? signOut : null,
        autoLogoutMinutes
      );

      // Initialiser l'infrastructure au premier chargement avec un utilisateur connecté
      useEffect(() => {
        const initializeInfrastructure = async () => {
          if (user && !loading && !infrastructureReady) {
            try {
              await initializeAppInfrastructure();
              setInfrastructureReady(true);
            } catch {
              setInfrastructureReady(true);
              // Erreurs complètement silencieuses
            }
          }
        };

        if (user && !loading) {
          initializeInfrastructure();
        } else if (!user) {
          setInfrastructureReady(false);
        }
      }, [user, loading, infrastructureReady]);

      const handleLogout = async () => {
        await signOut();
        setActiveView('dashboard');
      };

      const renderActiveView = () => {
        switch (activeView) {
          case 'dashboard':
            return <Dashboard currentUser={user} setActiveView={setActiveView} />;
          case 'tasks':
            return <TaskManager currentUser={user} />;
          case 'clients':
            return <ClientManager currentUser={user} />;
          case 'cases':
            return <CaseManager currentUser={user} />;
          case 'calendar':
            return <Calendar currentUser={user} />;
          case 'team':
            return <TeamManager currentUser={user} />;
          case 'reports':
            return <Reports currentUser={user} />;
          case 'documents':
            return <DocumentManager currentUser={user} />;
          case 'billing':
            return <BillingManager currentUser={user} />;
          case 'settings':
            return <Settings currentUser={user} />;
          default:
            return <Dashboard currentUser={user} setActiveView={setActiveView} />;
        }
      };

      if (loading || (user && !infrastructureReady)) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
              {user && !infrastructureReady && (
                <p className="text-white/70 text-sm">
                  Initialisation de l'infrastructure...
                </p>
              )}
            </div>
          </div>
        );
      }

      if (!user) {
        return <LoginScreen />;
      }

      return (
        <HelmetProvider>
          <Helmet>
            <title>LEGALSUITE - Gestion de Cabinet Juridique</title>
            <meta name="description" content="LEGALSUITE - Solution complète de gestion pour cabinets d'avocats. Gérez vos dossiers, clients, tâches, facturation et collaborateurs efficacement." />
          </Helmet>
          
          {/* Alerte pour le service de normalisation PDF */}
          <PdfServiceAlert />
          
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 print:bg-white">
            <div className="flex">
              <Sidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                currentUser={user}
                onLogout={handleLogout}
              />
              
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
            
            {/* Modal de déconnexion automatique */}
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