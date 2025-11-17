import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAccountCreator = ({ onAccountCreated }) => {
  const [status, setStatus] = useState('creating'); // 'creating', 'success', 'exists', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const createAdminUser = async () => {
      try {
        // Données de l'administrateur par défaut
        const adminData = {
          email: 'admin@gestion-cabinet.com',
          name: 'Administrateur',
          role: 'admin'
        };

        // Vérifier si l'administrateur existe déjà
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', adminData.email)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification:', checkError);
          setStatus('error');
          setMessage('Erreur de connexion à la base de données.');
          return;
        }

        if (existingUser) {
          setStatus('exists');
          setMessage('Le compte administrateur existe déjà.');
          return;
        }

        // Créer l'utilisateur administrateur dans la table profiles
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([adminData]);

        if (insertError) {
          console.error('Erreur lors de la création:', insertError);
          setStatus('error');
          setMessage('Erreur lors de la création du compte administrateur.');
          return;
        }

        // Créer également quelques utilisateurs de test pour démonstration
        const testUsers = [
          {
            email: 'avocat1@cabinet.com',
            name: 'Marie Dupont',
            role: 'avocat'
          },
          {
            email: 'secretaire@cabinet.com',
            name: 'Pierre Martin',
            role: 'secretaire'
          }
        ];

        // Insérer les utilisateurs de test
        for (const user of testUsers) {
          const { error: testUserError } = await supabase
            .from('profiles')
            .insert([user]);
          
          if (testUserError && !testUserError.message.includes('duplicate key')) {
            console.error('Erreur lors de la création utilisateur test:', testUserError);
          }
        }

        setStatus('success');
        setMessage('Comptes créés avec succès !');

      } catch (error) {
        console.error('Erreur inattendue:', error);
        setStatus('error');
        setMessage('Une erreur inattendue est survenue.');
      }
    };

    createAdminUser();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'creating':
        return (
          <>
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-white">Initialisation de la base de données...</h2>
            <p className="text-slate-300">Création des comptes utilisateurs.</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-white">Base de données initialisée !</h2>
            <p className="text-slate-300 mt-2">{message}</p>
            <div className="text-left bg-slate-800 p-4 rounded-lg mt-4 w-full max-w-md">
              <h3 className="text-white font-bold mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Comptes créés :
              </h3>
              <div className="space-y-2">
                <div className="border-b border-slate-600 pb-2">
                  <p className="text-green-400 font-semibold">👑 Administrateur</p>
                  <p className="text-slate-200 text-sm">Email: admin@gestion-cabinet.com</p>
                  <p className="text-slate-200 text-sm">Statut: Prêt à se connecter</p>
                </div>
                <div className="border-b border-slate-600 pb-2">
                  <p className="text-blue-400 font-semibold">⚖️ Avocat</p>
                  <p className="text-slate-200 text-sm">Email: avocat1@cabinet.com</p>
                  <p className="text-yellow-400 text-sm">Statut: Première connexion requise</p>
                </div>
                <div>
                  <p className="text-purple-400 font-semibold">📋 Secrétaire</p>
                  <p className="text-slate-200 text-sm">Email: secretaire@cabinet.com</p>
                  <p className="text-yellow-400 text-sm">Statut: Première connexion requise</p>
                </div>
              </div>
            </div>
          </>
        );
      case 'exists':
        return (
          <>
            <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
            <h2 className="text-2xl font-bold text-white">Base déjà initialisée</h2>
            <p className="text-slate-300 mt-2">{message}</p>
            <div className="text-left bg-slate-800 p-4 rounded-lg mt-4 w-full max-w-sm">
              <p className="text-slate-200"><span className="font-bold">Compte admin :</span></p>
              <p className="text-slate-300 text-sm">admin@gestion-cabinet.com</p>
            </div>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white">Erreur d'initialisation</h2>
            <p className="text-slate-300 mt-2">{message}</p>
            <p className="text-slate-400 text-sm mt-2">
              Vérifiez que la table 'users' existe dans votre base Supabase.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        {renderContent()}
        {(status === 'success' || status === 'exists' || status === 'error') && (
          <button
            onClick={onAccountCreated}
            className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aller à la page de connexion
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default AdminAccountCreator;