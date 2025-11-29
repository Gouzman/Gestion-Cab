/**
 * =====================================================
 * CONTEXT D'AUTHENTIFICATION INTERNE (100% sans Supabase Auth)
 * =====================================================
 * Système d'auth basé sur :
 * - Vérification de mot de passe hashé en base
 * - Sessions internes avec tokens
 * - Pas de dépendance à supabase.auth.*
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

const SESSION_TOKEN_KEY = 'internal_session_token';

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // ============================================
  // Récupérer les permissions utilisateur
  // ============================================
  const fetchUserPermissions = useCallback(async (userId) => {
    try {
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permissions')
        .eq('user_id', userId)
        .maybeSingle();

      if (permissionsError) {
        console.error("Error fetching permissions:", permissionsError);
      }

      return permissionsData?.permissions || null;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return null;
    }
  }, []);

  // ============================================
  // Vérifier une session stockée en localStorage
  // ============================================
  const verifyStoredSession = useCallback(async () => {
    console.log('🔵 [VERIFY SESSION] Vérification de la session stockée');
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    console.log('🔵 [VERIFY SESSION] Token trouvé:', storedToken ? 'OUI' : 'NON');
    
    if (!storedToken) {
      console.log('⚪ [VERIFY SESSION] Pas de token, pas de session');
      setLoading(false);
      return;
    }

    try {
      console.log('🔵 [VERIFY SESSION] Appel RPC verify_internal_session...');
      const { data, error } = await supabase.rpc('verify_internal_session', {
        session_token_param: storedToken
      });

      console.log('🟢 [VERIFY SESSION] Réponse:', data);
      console.log('🟢 [VERIFY SESSION] Error:', error);

      if (error || !data?.success) {
        console.log('🔴 [VERIFY SESSION] Session invalide, nettoyage...');
        // Session invalide, nettoyer
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      console.log('✅ [VERIFY SESSION] Session valide');

      // Session valide
      const userData = data.user;
      const permissions = await fetchUserPermissions(userData.id);

      setUser({ ...userData, permissions });
      setSession({ token: storedToken });
      setMustChangePassword(userData.must_change_password);
      setLoading(false);

    } catch (error) {
      console.error("Error verifying session:", error);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setLoading(false);
    }
  }, [fetchUserPermissions]);

  // ============================================
  // Vérifier la session au démarrage
  // ============================================
  useEffect(() => {
    verifyStoredSession();
  }, [verifyStoredSession]);

  // ============================================
  // CONNEXION INTERNE (sans supabase.auth)
  // ============================================
  const signIn = useCallback(async (identifier, password) => {
    console.log('🔵 [SIGN IN] Début de la connexion');
    console.log('🔵 [SIGN IN] Identifiant:', identifier);
    console.log('🔵 [SIGN IN] Appel RPC internal_login...');
    
    try {
      const { data, error } = await supabase.rpc('internal_login', {
        user_identifier: identifier,
        user_password: password,
        user_agent_text: navigator.userAgent,
        ip_addr: null
      });

      console.log('🟢 [SIGN IN] Réponse RPC reçue');
      console.log('🟢 [SIGN IN] Data:', data);
      console.log('🟢 [SIGN IN] Error:', error);

      if (error || !data?.success) {
        console.log('🔴 [SIGN IN] Échec de connexion');
        console.log('🔴 [SIGN IN] Error object:', error);
        console.log('🔴 [SIGN IN] Data error:', data?.error);
        console.log('🔴 [SIGN IN] Data message:', data?.message);
        
        const errorMessages = {
          'invalid_credentials': "Identifiant ou mot de passe incorrect",
          'pending_approval': "Votre compte est en attente de validation",
          'technical_error': data?.message || "Erreur technique"
        };

        toast({
          variant: "destructive",
          title: "Connexion impossible",
          description: errorMessages[data?.error] || data?.message || "Erreur de connexion"
        });

        return { error: data?.error || error, mustChangePassword: false };
      }

      console.log('✅ [SIGN IN] Connexion réussie');
      console.log('✅ [SIGN IN] User data:', data.user);

      // Connexion réussie
      const { session_token, user: userData } = data;

      console.log('✅ [SIGN IN] Session token:', session_token);
      console.log('✅ [SIGN IN] Must change password:', userData.must_change_password);

      // Sauvegarder le token de session
      localStorage.setItem(SESSION_TOKEN_KEY, session_token);
      console.log('✅ [SIGN IN] Token sauvegardé dans localStorage');

      // Récupérer les permissions
      console.log('🔵 [SIGN IN] Récupération des permissions...');
      const permissions = await fetchUserPermissions(userData.id);
      console.log('✅ [SIGN IN] Permissions:', permissions);

      // Mettre à jour l'état
      setUser({ ...userData, permissions });
      setSession({ token: session_token });
      setMustChangePassword(userData.must_change_password);
      
      console.log('✅ [SIGN IN] État mis à jour');

      // Toast de succès
      if (userData.must_change_password) {
        toast({
          title: "⚠️ Changement de mot de passe requis",
          description: "Vous devez définir votre mot de passe personnel lors de cette première connexion.",
          duration: 6000,
        });
      } else {
        toast({
          title: "👋 Bienvenue !",
          description: `Bonjour ${userData.name || userData.email}`,
        });
      }

      return { 
        error: null, 
        mustChangePassword: userData.must_change_password,
        userId: userData.id 
      };

    } catch (error) {
      console.error("🔴 [SIGN IN] ERREUR CATCH:", error);
      console.error("🔴 [SIGN IN] Error stack:", error.stack);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      });
      return { error, mustChangePassword: false };
    }
  }, [toast, fetchUserPermissions]);

  // ============================================
  // DÉCONNEXION INTERNE
  // ============================================
  const signOut = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

      if (storedToken) {
        await supabase.rpc('internal_logout', {
          session_token_param: storedToken
        });
      }

      // Nettoyer l'état local
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setMustChangePassword(false);

      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });

      return { error: null };

    } catch (error) {
      console.error("Erreur signOut:", error);
      
      // Nettoyer quand même l'état local
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);

      return { error };
    }
  }, [toast]);

  // ============================================
  // DÉFINIR LES IDENTIFIANTS PERSONNELS (première connexion)
  // ============================================
  const setPersonalCredentials = useCallback(async (identifier, newPassword, secretQuestion, secretAnswer) => {
    try {
      const { data, error } = await supabase.rpc('internal_set_personal_credentials', {
        user_email: identifier,
        new_password: newPassword,
        secret_question: secretQuestion,
        secret_answer: secretAnswer
      });

      if (error || !data?.success) {
        const errorMessages = {
          'password_reused': "Ce mot de passe a déjà été utilisé. Veuillez en choisir un nouveau.",
          'user_not_found': "Utilisateur introuvable"
        };

        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorMessages[data?.error] || data?.message || "Impossible de définir les identifiants",
        });

        return { error: data?.error || error };
      }

      // Reconnexion automatique avec le nouveau mot de passe
      const { error: signInError } = await signIn(identifier, newPassword);

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Identifiants définis mais connexion échouée. Veuillez vous reconnecter.",
        });
        return { error: signInError };
      }

      toast({
        title: "✅ Identifiants définis !",
        description: "Bienvenue dans votre espace de travail.",
      });

      return { error: null };

    } catch (error) {
      console.error("Erreur setPersonalCredentials:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
      });
      return { error };
    }
  }, [toast, signIn]);

  // ============================================
  // RÉCUPÉRER LA QUESTION SECRÈTE
  // ============================================
  const getSecretQuestion = useCallback(async (identifier) => {
    try {
      const { data, error } = await supabase.rpc('get_secret_question', {
        user_identifier: identifier
      });

      if (error || !data?.success) {
        const errorMessages = {
          'user_not_found': "Aucun utilisateur trouvé avec cet identifiant",
          'no_secret_phrase': "Aucune phrase secrète n'a été configurée pour ce compte"
        };

        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorMessages[data?.error] || "Impossible de récupérer la question secrète",
        });

        return { error: data?.error || error, question: null };
      }

      return { error: null, question: data.question, userId: data.user_id };

    } catch (error) {
      console.error("Erreur getSecretQuestion:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
      });
      return { error, question: null };
    }
  }, [toast]);

  // ============================================
  // RÉINITIALISER LE MOT DE PASSE AVEC PHRASE SECRÈTE
  // ============================================
  const resetPasswordWithSecretPhrase = useCallback(async (identifier, secretAnswer, newPassword) => {
    try {
      const { data, error } = await supabase.rpc('verify_secret_answer_and_reset', {
        user_identifier: identifier,
        secret_answer: secretAnswer,
        new_password: newPassword
      });

      if (error || !data?.success) {
        const errorMessages = {
          'user_not_found': "Utilisateur introuvable",
          'no_secret_phrase': "Aucune phrase secrète n'a été configurée",
          'wrong_answer': "La réponse est incorrecte",
          'password_reused': "Ce mot de passe a déjà été utilisé"
        };

        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorMessages[data?.error] || data?.message || "Impossible de réinitialiser le mot de passe",
        });

        return { error: data?.error || error };
      }

      toast({
        title: "✅ Mot de passe réinitialisé !",
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      });

      return { error: null };

    } catch (error) {
      console.error("Erreur resetPasswordWithSecretPhrase:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
      });
      return { error };
    }
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    mustChangePassword,
    signIn,
    signOut,
    setPersonalCredentials,
    getSecretQuestion,
    resetPasswordWithSecretPhrase,
  }), [
    user, 
    session, 
    loading, 
    mustChangePassword,
    signIn, 
    signOut, 
    setPersonalCredentials,
    getSecretQuestion,
    resetPasswordWithSecretPhrase
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
