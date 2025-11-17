import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Save, Plus, Trash2, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePermissionsManager, defaultPermissionsByRole } from '@/lib/permissionsUtils';
import UserCreator from '@/components/UserCreator';

const modules = [
  { id: 'dashboard', label: 'Tableau de Bord', actions: [] },
  { id: 'tasks', label: 'Tâches', actions: ['create', 'edit', 'delete', 'reassign'] },
  { id: 'clients', label: 'Clients', actions: ['create', 'edit', 'delete'] },
  { id: 'cases', label: 'Dossiers', actions: ['create', 'edit', 'delete'] },
  { id: 'calendar', label: 'Agenda', actions: ['create', 'edit', 'delete'] },
  { id: 'documents', label: 'Documents', actions: ['upload', 'delete'] },
  { id: 'billing', label: 'Facturation', actions: ['create', 'edit', 'delete'] },
  { id: 'team', label: 'Collaborateurs', actions: ['create', 'edit', 'delete'] },
  { id: 'reports', label: 'Rapports', actions: [] },
  { id: 'settings', label: 'Paramètres', actions: [] },
];

const actionLabels = {
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  reassign: 'Réassigner',
  upload: 'Télécharger'
};

const PermissionManager = () => {
  const { users, loading, fetchUsers, getUserPermissions, saveUserPermissions } = usePermissionsManager();
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const loadPermissions = async () => {
      if (selectedUser) {
        const userPermissions = await getUserPermissions(selectedUser.id);
        setPermissions(userPermissions || defaultPermissionsByRole[selectedUser.role] || defaultPermissionsByRole.user);
      } else {
        setPermissions(null);
      }
    };

    loadPermissions();
  }, [selectedUser]);

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
  };

  const handlePermissionChange = (moduleId, type, action = null) => {
    setPermissions(prev => {
      const newPerms = structuredClone(prev);
      
      if (!newPerms[moduleId]) {
        newPerms[moduleId] = { visible: false, actions: {} };
      }

      if (type === 'visible') {
        newPerms[moduleId].visible = !newPerms[moduleId].visible;
        // Si on cache le module, désactiver toutes les actions
        if (!newPerms[moduleId].visible) {
          Object.keys(newPerms[moduleId].actions || {}).forEach(actionKey => {
            newPerms[moduleId].actions[actionKey] = false;
          });
        }
      } else if (type === 'action' && action) {
        if (!newPerms[moduleId].actions) {
          newPerms[moduleId].actions = {};
        }
        newPerms[moduleId].actions[action] = !newPerms[moduleId].actions[action];
      }

      return newPerms;
    });
  };

  const handleRoleChange = (newRole) => {
    setSelectedUser(prev => ({ ...prev, role: newRole }));
    // Appliquer les permissions par défaut du nouveau rôle
    const defaultPerms = defaultPermissionsByRole[newRole] || defaultPermissionsByRole.user;
    setPermissions(defaultPerms);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !permissions) return;

    const result = await saveUserPermissions(
      selectedUser.id, 
      permissions, 
      selectedUser.role, 
      selectedUser.function
    );

    if (result.success) {
      // Recharger les utilisateurs pour refléter les changements
      await fetchUsers();
      // Mettre à jour l'utilisateur sélectionné
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  };

  const getPermissionsSummary = (user) => {
    // Compter les modules visibles et les actions autorisées
    const userPermissions = defaultPermissionsByRole[user.role] || defaultPermissionsByRole.user;
    const visibleModules = Object.values(userPermissions).filter(p => p.visible).length;
    const totalActions = Object.values(userPermissions).reduce((count, perm) => {
      return count + Object.values(perm.actions || {}).filter(Boolean).length;
    }, 0);

    return { visibleModules, totalActions };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-slate-300">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Gestion des Permissions</h2>
        </div>
        <Button 
          onClick={() => setShowNewUserForm(!showNewUserForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Formulaire de création d'utilisateur */}
      {showNewUserForm && (
        <UserCreator 
          onClose={() => {
            setShowNewUserForm(false);
            fetchUsers(); // Recharger la liste après création
          }} 
        />
      )}

      {/* Liste des utilisateurs */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne de gauche : Liste des utilisateurs */}
        <div className="lg:col-span-1">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Utilisateurs ({users.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map(user => {
              const summary = getPermissionsSummary(user);
              const isSelected = selectedUser?.id === user.id;
              
              return (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-purple-600/30 border-purple-500 border' 
                      : 'bg-slate-700/30 hover:bg-slate-700/50'
                  }`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{user.name}</p>
                      <p className="text-sm text-slate-300 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin' || user.role === 'gerant' ? 'bg-red-500/20 text-red-300' :
                          user.role === 'avocat' ? 'bg-blue-500/20 text-blue-300' :
                          user.role === 'secretaire' ? 'bg-green-500/20 text-green-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {summary.visibleModules} modules • {summary.totalActions} actions
                      </p>
                    </div>
                    
                    {isSelected && (
                      <UserCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Colonne de droite : Configuration des permissions */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Informations utilisateur et rôle */}
              <div className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Configuration pour {selectedUser.name}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-role" className="text-slate-300 mb-1 block">
                      Rôle
                    </Label>
                    <select 
                      id="user-role"
                      value={selectedUser.role || ''}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="avocat">Avocat</option>
                      <option value="secretaire">Secrétaire</option>
                      <option value="gerant">Gérant</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="user-function" className="text-slate-300 mb-1 block">
                      Fonction
                    </Label>
                    <input
                      id="user-function"
                      type="text"
                      value={selectedUser.function || ''}
                      onChange={(e) => setSelectedUser(prev => ({ ...prev, function: e.target.value }))}
                      placeholder="Ex: Avocat principal, Assistant..."
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions par module */}
              {permissions && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Permissions par Module
                  </h3>
                  
                  {modules.map(module => (
                    <div key={module.id} className="p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-lg font-medium text-white flex items-center">
                          {permissions[module.id]?.visible ? (
                            <Eye className="w-4 h-4 mr-2 text-green-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 mr-2 text-red-400" />
                          )}
                          {module.label}
                        </Label>
                        
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`visible-${module.id}`} className="text-slate-300">
                            Module visible
                          </Label>
                          <Checkbox 
                            id={`visible-${module.id}`}
                            checked={permissions[module.id]?.visible || false}
                            onCheckedChange={() => handlePermissionChange(module.id, 'visible')}
                          />
                        </div>
                      </div>
                      
                      {module.actions.length > 0 && permissions[module.id]?.visible && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-600/50">
                          {module.actions.map(action => (
                            <div key={action} className="flex items-center gap-2">
                              <Checkbox 
                                id={`${module.id}-${action}`}
                                checked={permissions[module.id]?.actions?.[action] || false}
                                onCheckedChange={() => handlePermissionChange(module.id, 'action', action)}
                              />
                              <Label 
                                htmlFor={`${module.id}-${action}`} 
                                className="text-sm text-slate-300"
                              >
                                {actionLabels[action] || action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleSavePermissions} className="bg-purple-600 hover:bg-purple-700">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder les Permissions
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Aucun utilisateur sélectionné</h3>
              <p className="text-slate-400">
                Sélectionnez un utilisateur dans la liste pour configurer ses permissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;