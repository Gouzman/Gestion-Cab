// Hook personnalisé pour la gestion des permissions
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

// Permissions par défaut pour chaque rôle
export const defaultPermissionsByRole = {
  admin: {
    dashboard: { visible: true, actions: {} },
    tasks: { visible: true, actions: { create: true, edit: true, delete: true, reassign: true } },
    clients: { visible: true, actions: { create: true, edit: true, delete: true } },
    cases: { visible: true, actions: { create: true, edit: true, delete: true } },
    calendar: { visible: true, actions: { create: true, edit: true, delete: true } },
    documents: { visible: true, actions: { upload: true, delete: true } },
    billing: { visible: true, actions: { create: true, edit: true, delete: true } },
    team: { visible: true, actions: { create: true, edit: true, delete: true } },
    reports: { visible: true, actions: {} },
    settings: { visible: true, actions: {} }
  },
  gerant: {
    dashboard: { visible: true, actions: {} },
    tasks: { visible: true, actions: { create: true, edit: true, delete: true, reassign: true } },
    clients: { visible: true, actions: { create: true, edit: true, delete: true } },
    cases: { visible: true, actions: { create: true, edit: true, delete: true } },
    calendar: { visible: true, actions: { create: true, edit: true, delete: true } },
    documents: { visible: true, actions: { upload: true, delete: true } },
    billing: { visible: true, actions: { create: true, edit: true, delete: true } },
    team: { visible: true, actions: { create: true, edit: true, delete: true } },
    reports: { visible: true, actions: {} },
    settings: { visible: true, actions: {} }
  },
  avocat: {
    dashboard: { visible: true, actions: {} },
    tasks: { visible: true, actions: { create: true, edit: true, delete: false, reassign: false } },
    clients: { visible: true, actions: { create: true, edit: true, delete: false } },
    cases: { visible: true, actions: { create: true, edit: true, delete: false } },
    calendar: { visible: true, actions: { create: true, edit: true, delete: false } },
    documents: { visible: true, actions: { upload: true, delete: false } },
    billing: { visible: true, actions: { create: true, edit: true, delete: false } },
    team: { visible: false, actions: { create: false, edit: false, delete: false } },
    reports: { visible: true, actions: {} },
    settings: { visible: false, actions: {} }
  },
  secretaire: {
    dashboard: { visible: true, actions: {} },
    tasks: { visible: true, actions: { create: true, edit: false, delete: false, reassign: false } },
    clients: { visible: true, actions: { create: true, edit: true, delete: false } },
    cases: { visible: true, actions: { create: false, edit: true, delete: false } },
    calendar: { visible: true, actions: { create: true, edit: true, delete: false } },
    documents: { visible: true, actions: { upload: true, delete: false } },
    billing: { visible: true, actions: { create: true, edit: true, delete: false } },
    team: { visible: false, actions: { create: false, edit: false, delete: false } },
    reports: { visible: true, actions: {} },
    settings: { visible: false, actions: {} }
  },
  user: {
    dashboard: { visible: true, actions: {} },
    tasks: { visible: true, actions: { create: false, edit: false, delete: false, reassign: false } },
    clients: { visible: false, actions: { create: false, edit: false, delete: false } },
    cases: { visible: false, actions: { create: false, edit: false, delete: false } },
    calendar: { visible: true, actions: { create: false, edit: false, delete: false } },
    documents: { visible: false, actions: { upload: false, delete: false } },
    billing: { visible: false, actions: { create: false, edit: false, delete: false } },
    team: { visible: false, actions: { create: false, edit: false, delete: false } },
    reports: { visible: false, actions: {} },
    settings: { visible: false, actions: {} }
  }
};

export const usePermissionsManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, "function", created_at')
        .order('name');

      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les utilisateurs."
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue."
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les permissions d'un utilisateur
  const getUserPermissions = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permissions')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement des permissions:', error);
        return null;
      }

      return data?.permissions || null;
    } catch (error) {
      console.error('Erreur inattendue lors du chargement des permissions:', error);
      return null;
    }
  };

  // Sauvegarder les permissions d'un utilisateur
  const saveUserPermissions = async (userId, permissions, userRole = null, userFunction = null) => {
    try {
      // Sauvegarder les permissions
      const { error: permError } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          permissions: permissions
        }, {
          onConflict: 'user_id'
        });

      if (permError) {
        throw permError;
      }

      // Mettre à jour le rôle et la fonction si fournis
      if (userRole || userFunction) {
        const updateData = {};
        if (userRole) updateData.role = userRole;
        if (userFunction) updateData['function'] = userFunction;

        const { error: userError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (userError) {
          throw userError;
        }
      }

      toast({
        title: "✅ Permissions sauvegardées",
        description: "Les permissions ont été mises à jour avec succès."
      });

      // Recharger les utilisateurs pour refléter les changements
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: `Impossible de sauvegarder: ${error.message}`
      });
      return { success: false, error };
    }
  };

  // Appliquer les permissions par défaut selon le rôle
  const applyDefaultPermissions = (role) => {
    return defaultPermissionsByRole[role] || defaultPermissionsByRole.user;
  };

  // Créer un nouvel utilisateur avec permissions par défaut
  const createUser = async (userData) => {
    try {
      // 1. Générer un UUID et le mot de passe initial
      const userId = crypto.randomUUID();
      const initialPassword = `${userData.name.split(' ')[0]}2024!`;
      
      // 2. Créer directement via RPC (qui gère le hachage et l'insertion)
      // Cette approche évite les limites de rate-limit de Supabase Auth
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_collaborator_with_initial_password',
        {
          user_id: userId,
          user_email: userData.email,
          user_name: userData.name,
          user_role: userData.role || 'user',
          user_function: userData.function || null,
          initial_password: initialPassword
        }
      );

      if (rpcError) {
        console.error('Erreur RPC:', rpcError);
        throw new Error(`Erreur RPC: ${rpcError.message || JSON.stringify(rpcError)}`);
      }

      if (!rpcResult?.success) {
        throw new Error(rpcResult?.error || 'Échec de la création via RPC');
      }

      // 3. Récupérer l'utilisateur créé
      const { data: newUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, name, role, "function", created_at')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erreur fetch:', fetchError);
        throw new Error(`Impossible de récupérer l'utilisateur: ${fetchError.message}`);
      }

      // 4. Appliquer les permissions par défaut
      const defaultPermissions = applyDefaultPermissions(userData.role || 'user');
      const permResult = await saveUserPermissions(userId, defaultPermissions);
      
      if (!permResult.success) {
        console.warn('Permissions non appliquées, mais utilisateur créé');
      }

      // Ne pas afficher de toast ici, UserCreator.jsx s'occupe de l'affichage
      return { success: true, user: newUser, initialPassword };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: error.message || 'Impossible de créer l\'utilisateur'
      });
      return { success: false, error };
    }
  };

  return {
    users,
    loading,
    fetchUsers,
    getUserPermissions,
    saveUserPermissions,
    createUser,
    applyDefaultPermissions
  };
};

// Fonction utilitaire pour vérifier si un utilisateur a une permission spécifique
export const hasPermission = (userPermissions, module, action = null) => {
  if (!userPermissions || !userPermissions[module]) {
    return false;
  }

  const modulePerms = userPermissions[module];
  
  if (!modulePerms.visible) {
    return false;
  }

  if (action && modulePerms.actions) {
    return modulePerms.actions[action] === true;
  }

  return true;
};

// Fonction pour vérifier si un utilisateur est gérant/admin
export const isGerantOrAdmin = (user) => {
  return user && (
    user.function === 'Gerant' || 
    user.function === 'Associe Emerite' || 
    user.role === 'admin' || 
    user.role === 'gerant'
  );
};