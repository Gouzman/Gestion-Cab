import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfileAndPermissions = useCallback(async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast({ variant: "destructive", title: "Erreur de profil", description: "Impossible de charger les informations de l'utilisateur." });
        return null;
      }

      if (!profileData) {
        // L'utilisateur existe dans Auth mais pas dans profiles
        console.warn("User exists in Auth but not in profiles table. UserId:", userId);
        toast({ 
          variant: "destructive", 
          title: "Profil incomplet", 
          description: "Votre compte existe mais votre profil n'a pas été créé. Contactez l'administrateur." 
        });
        return null;
      }

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permissions')
        .eq('user_id', userId)
        .maybeSingle();

      if (permissionsError) {
        console.error("Error fetching permissions:", permissionsError);
      }

      return { ...profileData, permissions: permissionsData?.permissions || null };
    } catch (error) {
      console.error("Network or other error fetching user profile:", error);
      toast({ variant: "destructive", title: "Erreur Réseau", description: "Impossible de se connecter à la base de données pour récupérer le profil." });
      return null;
    }
  }, [toast]);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    if (session?.user) {
      const profile = await fetchUserProfileAndPermissions(session.user.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchUserProfileAndPermissions]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        handleSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
        toast({ variant: "destructive", title: "Erreur de Session", description: "Impossible de vérifier la session utilisateur. Vérifiez votre connexion." });
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession, toast]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      // Déterminer le message d'erreur approprié
      let errorMessage = "Une erreur est survenue.";
      
      if (error.message.includes('User already registered')) {
        errorMessage = "Un utilisateur avec cet email existe déjà.";
      } else if (error.message.includes('invalid') || error.error_code === 'email_address_invalid') {
        errorMessage = "L'adresse email est invalide. Veuillez utiliser un email réel (ex: votrenom@domaine.com).";
      } else if (error.message.includes('password')) {
        errorMessage = "Le mot de passe ne respecte pas les exigences de sécurité.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "L'inscription a échoué",
        description: errorMessage,
      });
      
      return { data, error };
    }

    // CORRECTION: Créer aussi le profil dans la table profiles
    if (data?.user) {
      const profileData = {
        id: data.user.id,
        email: email,
        name: options?.data?.name || email.split('@')[0],
        role: options?.data?.role || 'user',
        function: options?.data?.function || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error("Erreur création profil:", profileError);
        // On ne bloque pas, car l'utilisateur Auth est déjà créé
      }
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let description = "Vérifiez votre e-mail et mot de passe.";
      let title = "La connexion a échoué";
      
      if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
        description = "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
      } else if (error.message.includes("Email not confirmed")) {
        description = "Votre e-mail n'a pas été confirmé. Veuillez vérifier votre boîte de réception.";
      } else if (error.message.includes("Failed to fetch")) {
        description = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
      } else if (error.message.includes("User not found")) {
        description = "Aucun compte n'existe avec cet email.";
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    } else {
      toast({
        title: "👋 Bienvenue !",
        description: "Vous êtes maintenant connecté.",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "La déconnexion a échoué",
        description: error.message || "Une erreur est survenue.",
      });
    }

    return { error };
  }, [toast]);

  const checkFirstLogin = useCallback(async (email) => {
    try {
      // Vérifier si l'utilisateur existe dans la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, password_set, admin_approved, role')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        console.error("checkFirstLogin: erreur profiles", profileError.message);
        return { 
          isFirstLogin: false, 
          error: { message: "Erreur lors de la vérification du profil." },
          technicalError: true
        };
      }

      if (!profileData) {
        // L'utilisateur n'existe pas en base
        return { 
          isFirstLogin: false, 
          error: { message: "Cet email n'existe pas dans le système." }, 
          userNotFound: true 
        };
      }

      // Vérifier si l'admin a approuvé (sauf pour les admins eux-mêmes)
      if (profileData.role !== 'admin' && !profileData.admin_approved) {
        return {
          isFirstLogin: false,
          error: { message: "Votre compte est en attente de validation par l'administrateur." },
          pendingApproval: true
        };
      }

      // Vérifier s'il y a une demande de reset en attente
      const { data: resetRequest } = await supabase
        .from('password_reset_requests')
        .select('status')
        .eq('email', email)
        .eq('status', 'approved')
        .maybeSingle();

      // Si demande de reset approuvée OU password_set = false → créer/recréer mot de passe
      const needsPasswordSetup = resetRequest || profileData.password_set === false;
      
      return { 
        isFirstLogin: needsPasswordSetup, 
        error: null,
        userId: profileData.id,
        isReset: !!resetRequest
      };

    } catch (error) {
      console.error("checkFirstLogin: erreur générale", error.message);
      return { 
        isFirstLogin: false, 
        error: { message: "Erreur technique lors de la vérification." },
        technicalError: true
      };
    }
  }, []);

  const setFirstPassword = useCallback(async (email, password, isReset = false) => {
    try {
      // Le compte Auth existe déjà (créé par TeamManager avec mot de passe temporaire)
      // On utilise une fonction RPC pour mettre à jour le mot de passe via l'API Admin
      
      console.log("Mise à jour du mot de passe pour:", email);
      
      // Appeler la fonction RPC qui met à jour le mot de passe
      const { data: updateResult, error: rpcError } = await supabase
        .rpc('update_user_password', {
          user_email: email,
          new_password: password
        });

      if (rpcError) {
        console.error("Erreur mise à jour mot de passe:", rpcError);
        return { error: rpcError };
      }

      if (!updateResult?.success) {
        console.error("Erreur RPC:", updateResult?.error);
        return { error: { message: updateResult?.error || "Erreur mise à jour" } };
      }

      // Maintenant se connecter avec le nouveau mot de passe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Erreur de connexion:", signInError);
        return { error: signInError };
      }

      // Mettre à jour password_set à true dans profiles
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ password_set: true })
        .eq('email', email);

      if (profileUpdateError) {
        console.debug("Mise à jour password_set:", profileUpdateError.message);
      }

      // Étape 4 : Si c'est un reset, marquer la demande comme traitée
      if (isReset) {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'completed' })
          .eq('email', email)
          .eq('status', 'approved');
      }

      toast({
        title: "✅ Mot de passe défini !",
        description: "Bienvenue dans votre espace de travail.",
      });

      return { error: null };

    } catch (error) {
      console.error("Erreur inattendue lors de la configuration du mot de passe:", error);
      return { error: { message: "Une erreur inattendue est survenue." } };
    }
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    try {
      // Vérifier que l'email existe dans profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileError || !profileData) {
        toast({
          variant: "destructive",
          title: "❌ Email introuvable",
          description: "Cet email n'existe pas dans le système.",
        });
        return { error: { message: "Email introuvable" } };
      }

      // Créer une demande de réinitialisation dans la table
      const { error: requestError } = await supabase
        .from('password_reset_requests')
        .insert([{
          user_id: profileData.id,
          email: profileData.email,
          status: 'pending'
        }]);

      if (requestError) {
        console.error("Erreur création demande de réinitialisation:", requestError);
        // On continue quand même pour informer l'utilisateur
      }

      toast({
        title: "✅ Demande envoyée",
        description: "Votre demande a été envoyée à l'administrateur pour validation.",
      });

      return { error: null };
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la demande de réinitialisation.",
      });
      return { error };
    }
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    checkFirstLogin,
    setFirstPassword,
    resetPassword,
  }), [user, session, loading, signUp, signIn, signOut, checkFirstLogin, setFirstPassword, resetPassword]);

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